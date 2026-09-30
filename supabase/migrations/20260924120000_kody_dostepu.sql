-- ============================================================================
--  Kody dostępu, wygasanie po trzech miesiącach, zdjęcie psa, koniec Stripe.
--  Obsługa: INSTRUKCJA-KURSY.md, sekcja 12.
--
--  SKĄD ZMIANA
--
--  Na stronie nie ma już płatności. Trener rozlicza się gotówką albo barterem
--  (ktoś szyje koszulki, ktoś buduje przeszkodę na plac) i daje w zamian kod.
--  Do planu szczeniaka można więc wejść na dwa sposoby:
--    - zgłosić psa bez kodu i poczekać, aż trener zatwierdzi go w /trener,
--    - wpisać kod — wtedy dostęp otwiera się od razu.
--
--  DLACZEGO KODY JEDNORAZOWE, A NIE JEDEN WSPÓLNY
--
--  Dotychczasowy kod programu (`program_access_codes`) był jeden dla
--  wszystkich — kto go usłyszał, ten wchodził, i nie dało się go odebrać
--  jednej osobie bez zmiany wszystkim. Teraz każdy kod:
--    - działa RAZ i otwiera dostęp jednemu psu,
--    - może być przypisany do adresu e-mail — wtedy działa wyłącznie na koncie
--      z tym adresem (potwierdzonym). Przechwycony kod jest bezużyteczny bez
--      dostępu do skrzynki. Bez adresu kod przypina się do konta, które użyje
--      go pierwsze,
--    - da się unieważnić, dopóki nie został użyty.
--
--  Zgadywanie kodów: 8 znaków z 32-znakowego alfabetu to ~10^12 kombinacji.
--  Przy kilkudziesięciu wydanych kodach trafienie wymagałoby dziesiątek
--  miliardów prób, więc osobny licznik nieudanych prób nie jest potrzebny.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Wygasanie dostępu
--
-- Dostęp do planu trwa `programs.access_months` miesięcy (domyślnie 3) od
-- chwili zatwierdzenia. Po tej dacie kursant nie widzi już kart i nie może
-- niczego odhaczać, ale NIC nie jest usuwane: odhaczenia, notatki i rozmowa
-- zostają, a trener widzi je bez ograniczeń.
--
-- `expires_at = NULL` znaczy „bez limitu" — trener może tak ustawić ręcznie.
-- ---------------------------------------------------------------------------
alter table public.programs
  add column access_months int not null default 3 check (access_months between 1 and 60);

alter table public.participants add column expires_at timestamptz;

-- Kto był zatwierdzony przed tą zmianą, dostaje trzy miesiące od zatwierdzenia.
update public.participants
set expires_at = coalesce(approved_at, now()) + interval '3 months'
where status in ('approved', 'finished') and expires_at is null;

create function public.program_access_until(p_program_id uuid)
returns timestamptz language sql stable security definer set search_path = public as $$
  select now() + make_interval(months => access_months) from programs where id = p_program_id;
$$;

-- Każde przejście do „approved" (zatwierdzenie przez trenera, kod,
-- przywrócenie po zakończeniu) liczy termin od nowa. Trigger, a nie kod
-- w aplikacji, bo zatwierdza się z trzech miejsc i żadne nie może zapomnieć.
create function public.participants_set_expiry()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.status = 'approved' and (tg_op = 'INSERT' or old.status is distinct from 'approved') then
    new.approved_at := coalesce(new.approved_at, now());
    new.expires_at := public.program_access_until(new.program_id);
  end if;
  return new;
end; $$;

create trigger participants_expiry
  before insert or update of status on public.participants
  for each row execute function public.participants_set_expiry();

-- Czy dostęp zgłoszenia jeszcze trwa (sam termin, bez statusu).
create function public.access_open(p_expires_at timestamptz)
returns boolean language sql stable set search_path = '' as $$
  select p_expires_at is null or p_expires_at > now();
$$;

-- Zmienia się tylko warunek terminu — reszta jak w 20260923120000.
create or replace function public.participant_active(p_participant_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from participants
    where id = p_participant_id and user_id = auth.uid() and status = 'approved'
      and public.access_open(expires_at)
  );
$$;

create or replace function public.can_read_program(p_program_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_trainer() or exists (
    select 1 from participants
    where program_id = p_program_id
      and user_id = auth.uid()
      and status in ('approved', 'finished')
      and public.access_open(expires_at)
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. Kody dostępu
-- ---------------------------------------------------------------------------
create table public.access_codes (
  id uuid primary key default gen_random_uuid(),
  -- Zapisywany bez myślnika i wielkimi literami; na ekranie ABCD-EFGH.
  code text unique not null check (code ~ '^[A-Z0-9]{8}$'),
  program_id uuid not null references public.programs(id) on delete cascade,
  email text check (email is null or email = lower(trim(email))),
  note text check (note is null or length(note) <= 200),   -- „barter: koszulki"
  created_at timestamptz not null default now(),
  redeemed_at timestamptz,
  redeemed_by uuid references auth.users(id) on delete set null,
  participant_id uuid references public.participants(id) on delete set null,
  revoked_at timestamptz
);

create index on public.access_codes (created_at desc);

-- Tylko trener czyta. Zapisu nie ma nikt — kody powstają, są unieważniane
-- i wykorzystywane wyłącznie przez funkcje niżej.
alter table public.access_codes enable row level security;
create policy "trainer reads codes" on public.access_codes for select
  using (public.is_trainer());

-- Alfabet bez znaków, które łatwo pomylić przy przepisywaniu: 0/O, 1/I.
-- 32 znaki dzielą 256 bez reszty, więc `bajt % 32` nie faworyzuje żadnego.
create function public.create_access_code(p_program_id uuid, p_email text default null, p_note text default null)
returns public.access_codes
language plpgsql security definer set search_path = public, extensions as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_email text := nullif(lower(trim(p_email)), '');
  v_code text;
  v_bytes bytea;
  v_row access_codes;
begin
  if not public.is_trainer() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email' using errcode = '22023';
  end if;

  loop
    v_bytes := gen_random_bytes(8);
    v_code := '';
    for i in 0..7 loop
      v_code := v_code || substr(alphabet, 1 + get_byte(v_bytes, i) % 32, 1);
    end loop;
    begin
      insert into access_codes (code, program_id, email, note)
      values (v_code, p_program_id, v_email, nullif(trim(p_note), ''))
      returning * into v_row;
      return v_row;
    exception when unique_violation then
      -- Kolizja jest praktycznie niemożliwa, ale pętla kosztuje trzy linijki.
    end;
  end loop;
end; $$;

create function public.revoke_access_code(p_code_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_trainer() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update access_codes set revoked_at = now()
  where id = p_code_id and redeemed_at is null and revoked_at is null;
end; $$;

-- Wykorzystanie kodu: otwiera dostęp wybranemu psu zalogowanego.
--
-- Kod nie przepada, jeśli pies ma już aktywny dostęp (`already_active`) —
-- kursant, który wpisze go drugi raz przez pomyłkę, nie traci kodu.
-- Kod użyty po wygaśnięciu dostępu przedłuża go o kolejny okres.
create function public.redeem_access_code(p_code text, p_dog_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_code access_codes;
  v_email text;
  v_row participants;
  v_slug text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if not exists (select 1 from dogs where id = p_dog_id and user_id = auth.uid()) then
    raise exception 'dog_not_found' using errcode = 'P0002';
  end if;

  select * into v_code from access_codes
  where code = upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'))
  for update;
  if not found or v_code.revoked_at is not null then
    raise exception 'invalid_code' using errcode = 'P0001';
  end if;
  if v_code.redeemed_at is not null then
    raise exception 'code_used' using errcode = 'P0001';
  end if;

  if v_code.email is not null then
    select lower(email) into v_email from auth.users
    where id = auth.uid() and email_confirmed_at is not null;
    if v_email is distinct from v_code.email then
      raise exception 'code_email_mismatch' using errcode = 'P0001';
    end if;
  end if;

  select * into v_row from participants
  where program_id = v_code.program_id and dog_id = p_dog_id
  for update;

  if not found then
    insert into participants (user_id, dog_id, program_id, status)
    values (auth.uid(), p_dog_id, v_code.program_id, 'approved')
    returning * into v_row;
  elsif v_row.status = 'approved' and public.access_open(v_row.expires_at) then
    raise exception 'already_active' using errcode = 'P0001';
  elsif v_row.status = 'approved' then
    -- Zatwierdzony, ale termin minął: trigger nie zadziała (status się nie
    -- zmienia), więc termin liczymy tu.
    update participants
    set expires_at = public.program_access_until(program_id)
    where id = v_row.id
    returning * into v_row;
  else
    update participants
    set status = 'approved', approved_at = now(), finished_at = null
    where id = v_row.id
    returning * into v_row;
  end if;

  update access_codes
  set redeemed_at = now(), redeemed_by = auth.uid(), participant_id = v_row.id
  where id = v_code.id;

  select slug into v_slug from programs where id = v_row.program_id;

  return jsonb_build_object(
    'participant_id', v_row.id,
    'dog_id', v_row.dog_id,
    'program_slug', v_slug,
    'expires_at', v_row.expires_at
  );
end; $$;

-- Zgłoszenie bez kodu zostaje, ale kod ma już własną funkcję. Stara wersja
-- z parametrem `p_code` sprawdzała wspólny kod programu, który znika niżej.
drop function public.apply_to_program(text, uuid, text);

create function public.apply_to_program(p_program_slug text, p_dog_id uuid)
returns public.participants
language plpgsql security definer set search_path = public as $$
declare
  v_program programs;
  v_row participants;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_program from programs where slug = p_program_slug and is_published;
  if not found then
    raise exception 'program_not_found' using errcode = 'P0002';
  end if;

  if not exists (select 1 from dogs where id = p_dog_id and user_id = auth.uid()) then
    raise exception 'dog_not_found' using errcode = 'P0002';
  end if;

  select * into v_row from participants where program_id = v_program.id and dog_id = p_dog_id;

  if not found then
    insert into participants (user_id, dog_id, program_id)
    values (auth.uid(), p_dog_id, v_program.id)
    returning * into v_row;
  elsif v_row.status = 'rejected' then
    update participants set status = 'pending', applied_at = now()
    where id = v_row.id
    returning * into v_row;
  end if;

  return v_row;
end; $$;

drop table public.program_access_codes;

-- ---------------------------------------------------------------------------
-- 3. Zdjęcie psa — żeby trener odróżniał psy na liście.
--
-- Prywatny magazyn `psy`, pliki w katalogu właściciela: <user_id>/<plik>.
-- Warunek na kolumnie nie pozwala wskazać pliku z cudzego katalogu.
-- Przeglądarka zmniejsza zdjęcie przed wysłaniem (~800 px), limit 2 MB
-- to tylko bezpiecznik.
-- ---------------------------------------------------------------------------
alter table public.dogs
  add column photo_path text check (photo_path is null or photo_path like user_id::text || '/%');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('psy', 'psy', false, 2097152, array['image/jpeg', 'image/webp', 'image/png'])
on conflict (id) do nothing;

create policy "psy: wlasne zdjecia" on storage.objects for all
  using (bucket_id = 'psy' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'psy' and (storage.foldername(name))[1] = auth.uid()::text);

-- Trener widzi zdjęcia tylko tych osób, które zgłosiły psa — ta sama granica
-- co przy profilach i psach.
create policy "psy: trener widzi zgloszonych" on storage.objects for select
  using (
    bucket_id = 'psy'
    and public.is_trainer()
    and exists (select 1 from public.participants p where p.user_id::text = (storage.foldername(name))[1])
  );

-- ---------------------------------------------------------------------------
-- 4. Panel trenera: termin dostępu i zdjęcie. Zmiana typu wyniku wymaga
--    usunięcia funkcji — treść poza dwiema kolumnami bez zmian.
-- ---------------------------------------------------------------------------
drop function public.trainer_overview();

create function public.trainer_overview()
returns table (
  participant_id uuid,
  program_id uuid,
  program_title text,
  sessions_total int,
  status public.participant_status,
  current_session int,
  applied_at timestamptz,
  expires_at timestamptz,
  dog_name text,
  dog_breed text,
  dog_birth_date date,
  dog_photo_path text,
  owner_name text,
  owner_email text,
  homework_done int,
  homework_total int,
  last_activity timestamptz,
  unread int
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_trainer() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select
    p.id,
    p.program_id,
    pr.title,
    (select count(*)::int from program_sessions s where s.program_id = p.program_id),
    p.status,
    p.current_session,
    p.applied_at,
    p.expires_at,
    d.name,
    d.breed,
    d.birth_date,
    d.photo_path,
    pf.full_name,
    pf.email,
    (select count(*)::int
       from item_log l
       join session_items i on i.id = l.item_id
       join program_sessions s on s.id = i.session_id
      where l.participant_id = p.id and i.kind = 'homework' and s.number = p.current_session),
    (select count(*)::int * 7
       from session_items i
       join program_sessions s on s.id = i.session_id
      where s.program_id = p.program_id and i.kind = 'homework' and s.number = p.current_session),
    greatest(
      p.approved_at,
      (select max(l.done_at) from item_log l where l.participant_id = p.id),
      (select max(n.updated_at) from participant_notes n where n.participant_id = p.id),
      (select max(m.created_at) from messages m where m.participant_id = p.id and m.author_id = p.user_id)
    ),
    (select count(*)::int from messages m
      where m.participant_id = p.id and m.author_id = p.user_id and m.read_at is null)
  from participants p
  join programs pr on pr.id = p.program_id
  join dogs d on d.id = p.dog_id
  left join profiles pf on pf.id = p.user_id;
end; $$;

-- ---------------------------------------------------------------------------
-- 5. Koniec Stripe. Cennik i identyfikator sesji płatności nie mają już
--    zastosowania. Dostęp do kursu online (gdy kursy dostaną treść) nadaje
--    się wpisem w `enrollments` w Table Editor.
-- ---------------------------------------------------------------------------
drop table public.products;
alter table public.enrollments drop column stripe_session_id;
