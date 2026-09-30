-- ============================================================================
--  Program stacjonarny „Fundament": karta postępów kursanta i panel trenera.
--  Plan: PLAN-KARTA-POSTEPOW.md.
--
--  DLACZEGO OSOBNE TABELE, A NIE `courses` / `course_days` / `tasks`
--
--  Kurs online to kurs → dzień → zadanie, jedno odhaczenie na zadanie.
--  Karta spotkania to co innego: ćwiczenie domowe odhacza się SIEDEM razy,
--  raz na każdy dzień tygodnia między spotkaniami. Wciśnięcie tego w stary
--  model wymagałoby siedmiu sztucznych „zadań" na ćwiczenie. Dwa modele obok
--  siebie, każdy uczciwie opisuje to, czym jest.
--
--  NAJWAŻNIEJSZA ZMIANA W ZASADACH DOSTĘPU
--
--  Do tej pory każda polityka w bazie brzmiała „tylko własne". Tu po raz
--  pierwszy ktoś (trener) czyta dane innych osób. Uprawnienie trenera jest
--  więc wąskie:
--    - trenerem jest wiersz w `trainers`, do której NIKT nie ma prawa zapisu
--      z aplikacji — dopisuje się go ręcznie w panelu Supabase,
--    - trener widzi profil i psa wyłącznie tych osób, które zgłosiły się do
--      programu; nie widzi zakupów, nie widzi nikogo spoza programu.
--
--  Świadomie NIE jest to kolumna `profiles.is_trainer`, jak proponował plan.
--  Polityka „own profile" pozwala użytkownikowi edytować własny wiersz
--  w `profiles` — kolumna uprawnień w tym wierszu dawałaby każdemu możliwość
--  nadania sobie roli trenera jednym zapytaniem z konsoli przeglądarki.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Typy
-- ---------------------------------------------------------------------------

-- pending   — zgłoszenie czeka na trenera
-- approved  — kursant ma dostęp do kart i odhacza zadania
-- finished  — kurs zakończony; karty, odhaczenia i notatki zostają do wglądu
--             na zawsze, ale nie da się już niczego zmieniać
-- rejected  — trener odrzucił zgłoszenie (np. pomyłka, dubel, ktoś obcy)
create type public.participant_status as enum ('pending', 'approved', 'finished', 'rejected');

-- Trzy listy z karty spotkania różnią się tylko sposobem odhaczania:
-- homework — siatka ćwiczenie × dni 1–7,
-- check    — „Przed spotkaniem N+1 sprawdź", jedno odhaczenie,
-- gear     — „Zabierz na spotkanie N+1", lista pakowania, jedno odhaczenie.
create type public.session_item_kind as enum ('homework', 'check', 'gear');

-- ---------------------------------------------------------------------------
-- Tabele
-- ---------------------------------------------------------------------------

-- Kto jest trenerem. Brak polityk zapisu = zapis tylko z panelu Supabase.
create table public.trainers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,                -- „Kurs dla szczeniąt i młodych psów"
  description text,
  is_published boolean not null default false,
  created_at timestamptz default now()
);

-- Kod dostępu wydawany na pierwszym spotkaniu. Osobna tabela, bo `programs`
-- czyta każdy zalogowany — kod w tamtej tabeli byłby jawny dla wszystkich.
-- Brak wiersza = do programu wchodzi się wyłącznie przez zatwierdzenie.
create table public.program_access_codes (
  program_id uuid primary key references public.programs(id) on delete cascade,
  code text not null check (length(trim(code)) >= 4)
);

create table public.program_sessions (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  number int not null check (number between 1 and 100),
  title text not null,
  promise text,                 -- zdanie pod tytułem karty
  agenda text[] not null default '{}',   -- „Dziś na zajęciach", punkt po punkcie
  theory text,                  -- „Omawiamy"
  tip text,                     -- „Wskazówka"
  outro text,                   -- zakończenie ostatniej karty („Gratulacje!")
  pdf_path text,                -- ścieżka w magazynie `karty`, np. fundament/spotkanie_01.pdf
  unique (program_id, number)
);

create table public.session_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.program_sessions(id) on delete cascade,
  kind public.session_item_kind not null,
  position int not null default 0,
  label text not null,
  frequency text                -- tylko zadania domowe: „10 razy dziennie"
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dog_id uuid not null references public.dogs(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  status public.participant_status not null default 'pending',
  -- Na którym spotkaniu kursant jest. Przestawia trener po każdych zajęciach:
  -- spotkania są na żywo, więc tylko on wie, że się odbyły.
  current_session int not null default 1 check (current_session >= 1),
  applied_at timestamptz not null default now(),
  approved_at timestamptz,
  finished_at timestamptz,
  unique (program_id, dog_id)
);

-- Odhaczenia. `day` 1–7 dla zadań domowych, 0 dla list jednorazowych.
-- Zero zamiast NULL, bo NULL w kluczu głównym nie przejdzie, a w zwykłym
-- UNIQUE dwa NULL-e nie są sobie równe — dałoby się odhaczyć to samo dwa razy.
create table public.item_log (
  participant_id uuid not null references public.participants(id) on delete cascade,
  item_id uuid not null references public.session_items(id) on delete cascade,
  day smallint not null default 0 check (day between 0 and 7),
  done_at timestamptz not null default now(),
  primary key (participant_id, item_id, day)
);

create table public.participant_notes (
  participant_id uuid not null references public.participants(id) on delete cascade,
  session_id uuid not null references public.program_sessions(id) on delete cascade,
  body text not null default '' check (length(body) <= 10000),
  updated_at timestamptz not null default now(),
  primary key (participant_id, session_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  session_id uuid references public.program_sessions(id) on delete set null,
  author_id uuid references auth.users(id) on delete set null default auth.uid(),
  body text not null check (length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index on public.program_sessions (program_id, number);
create index on public.session_items (session_id, kind, position);
create index on public.participants (user_id);
create index on public.participants (program_id, status);
create index on public.item_log (participant_id);
create index on public.messages (participant_id, created_at);

-- ---------------------------------------------------------------------------
-- Funkcje dostępu (security definer — czytają tabele z pominięciem RLS,
-- więc same muszą sprawdzać `auth.uid()`; żadna nie przyjmuje identyfikatora
-- użytkownika z zewnątrz)
-- ---------------------------------------------------------------------------

create function public.is_trainer()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from trainers where user_id = auth.uid());
$$;

-- Czy to zgłoszenie należy do zalogowanego (dowolny status).
create function public.owns_participant(p_participant_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from participants where id = p_participant_id and user_id = auth.uid()
  );
$$;

-- Czy zalogowany może ZMIENIAĆ dane tego zgłoszenia: własne i zatwierdzone.
-- Zakończony kurs jest tylko do odczytu, oczekujący jeszcze nic nie widzi.
create function public.participant_active(p_participant_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from participants
    where id = p_participant_id and user_id = auth.uid() and status = 'approved'
  );
$$;

-- Czy zalogowany widzi treść kart programu: trener albo kursant
-- zatwierdzony lub po kursie.
create function public.can_read_program(p_program_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_trainer() or exists (
    select 1 from participants
    where program_id = p_program_id
      and user_id = auth.uid()
      and status in ('approved', 'finished')
  );
$$;

create function public.can_read_session(p_session_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from program_sessions
    where id = p_session_id and public.can_read_program(program_id)
  );
$$;

-- Czy element karty należy do programu tego zgłoszenia i czy `day` pasuje
-- do rodzaju elementu. Bez tego dałoby się zapisać odhaczenie z cudzego
-- programu albo „dzień 5" na liście pakowania.
create function public.item_fits_participant(p_item_id uuid, p_participant_id uuid, p_day smallint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from session_items i
    join program_sessions s on s.id = i.session_id
    join participants p on p.program_id = s.program_id
    where i.id = p_item_id
      and p.id = p_participant_id
      and case when i.kind = 'homework' then p_day between 1 and 7 else p_day = 0 end
  );
$$;

create function public.session_fits_participant(p_session_id uuid, p_participant_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from program_sessions s
    join participants p on p.program_id = s.program_id
    where s.id = p_session_id and p.id = p_participant_id
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.trainers             enable row level security;
alter table public.programs             enable row level security;
alter table public.program_access_codes enable row level security;
alter table public.program_sessions     enable row level security;
alter table public.session_items        enable row level security;
alter table public.participants         enable row level security;
alter table public.item_log             enable row level security;
alter table public.participant_notes    enable row level security;
alter table public.messages             enable row level security;

-- trainers: bez polityk. Rolę sprawdza się funkcją `is_trainer()`.

-- Program: katalog widzą wszyscy, nieopublikowany — trener i uczestnicy
-- (ta sama zasada co przy kursach online: zdjęcie programu z katalogu
-- nie może odciąć ludzi, którzy już w nim są).
create policy "published or joined programs" on public.programs for select
  using (
    is_published
    or public.is_trainer()
    -- `programs.id`, nie samo `id` — w podzapytaniu gołe `id` wskazałoby
    -- na `participants.id` i warunek nigdy nie byłby spełniony.
    or exists (select 1 from participants p where p.program_id = programs.id and p.user_id = auth.uid())
  );

create policy "trainer reads access codes" on public.program_access_codes for select
  using (public.is_trainer());

create policy "sessions for members" on public.program_sessions for select
  using (public.can_read_program(program_id));

create policy "items for members" on public.session_items for select
  using (public.can_read_session(session_id));

-- Zgłoszenia: kursant widzi swoje, trener wszystkie. Zapis zgłoszenia tylko
-- przez funkcję `apply_to_program` niżej — bez polityki INSERT kursant nie
-- może sam wpisać sobie statusu „approved".
create policy "own or trainer participants" on public.participants for select
  using (user_id = auth.uid() or public.is_trainer());
create policy "trainer updates participants" on public.participants for update
  using (public.is_trainer()) with check (public.is_trainer());

-- Odhaczenia: kursant zapisuje własne, trener tylko czyta.
create policy "read log" on public.item_log for select
  using (public.owns_participant(participant_id) or public.is_trainer());
create policy "insert own log" on public.item_log for insert
  with check (
    public.participant_active(participant_id)
    and public.item_fits_participant(item_id, participant_id, day)
  );
create policy "delete own log" on public.item_log for delete
  using (public.participant_active(participant_id));

-- Notatki: jak odhaczenia.
create policy "read notes" on public.participant_notes for select
  using (public.owns_participant(participant_id) or public.is_trainer());
create policy "insert own notes" on public.participant_notes for insert
  with check (
    public.participant_active(participant_id)
    and public.session_fits_participant(session_id, participant_id)
  );
create policy "update own notes" on public.participant_notes for update
  using (public.participant_active(participant_id))
  with check (
    public.participant_active(participant_id)
    and public.session_fits_participant(session_id, participant_id)
  );

-- Wiadomości: wątek kursant ↔ trener. Kursant pisze we własnym, aktywnym
-- zgłoszeniu; trener w każdym. Autor zawsze = zalogowany. Oznaczanie jako
-- przeczytane przez `mark_thread_read`, więc bez polityki UPDATE — nikt nie
-- przepisze treści wysłanej wiadomości.
create policy "read thread" on public.messages for select
  using (public.owns_participant(participant_id) or public.is_trainer());
create policy "write thread" on public.messages for insert
  with check (
    author_id = auth.uid()
    and (public.participant_active(participant_id) or public.is_trainer())
    and (session_id is null or public.session_fits_participant(session_id, participant_id))
  );

-- Trener widzi profil i psa WYŁĄCZNIE osób, które zgłosiły się do programu.
-- Polityki SELECT sumują się z istniejącymi „own profile" / „own dogs".
create policy "trainer reads applicant profiles" on public.profiles for select
  using (
    public.is_trainer()
    and exists (select 1 from participants p where p.user_id = profiles.id)
  );
create policy "trainer reads applicant dogs" on public.dogs for select
  using (
    public.is_trainer()
    and exists (select 1 from participants p where p.dog_id = dogs.id)
  );

-- ---------------------------------------------------------------------------
-- Operacje
-- ---------------------------------------------------------------------------

-- Zgłoszenie psa do programu. Z poprawnym kodem ze spotkania kursant wchodzi
-- od razu; bez kodu czeka na zatwierdzenie trenera.
--
-- Ponowne zgłoszenie po odrzuceniu wraca do „pending". Zgłoszenie już
-- oczekujące, zatwierdzone lub zakończone zostaje bez zmian — z jednym
-- wyjątkiem: oczekujący, który dopisze poprawny kod, zostaje zatwierdzony.
create function public.apply_to_program(p_program_slug text, p_dog_id uuid, p_code text default null)
returns public.participants
language plpgsql security definer set search_path = public as $$
declare
  v_program programs;
  v_code text;
  v_code_ok boolean := false;
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

  if nullif(trim(p_code), '') is not null then
    select code into v_code from program_access_codes where program_id = v_program.id;
    v_code_ok := v_code is not null and upper(trim(p_code)) = upper(trim(v_code));
    if not v_code_ok then
      raise exception 'invalid_code' using errcode = 'P0001';
    end if;
  end if;

  select * into v_row from participants where program_id = v_program.id and dog_id = p_dog_id;

  if not found then
    insert into participants (user_id, dog_id, program_id, status, approved_at)
    values (
      auth.uid(), p_dog_id, v_program.id,
      case when v_code_ok then 'approved'::participant_status else 'pending' end,
      case when v_code_ok then now() end
    )
    returning * into v_row;
  elsif v_row.status in ('pending', 'rejected') then
    update participants set
      status = case when v_code_ok then 'approved'::participant_status else 'pending' end,
      approved_at = case when v_code_ok then now() end,
      applied_at = case when v_row.status = 'rejected' then now() else applied_at end
    where id = v_row.id
    returning * into v_row;
  end if;

  return v_row;
end; $$;

-- Oznacza jako przeczytane wiadomości od DRUGIEJ strony wątku.
create function public.mark_thread_read(p_participant_id uuid)
returns void language sql security definer set search_path = public as $$
  update messages set read_at = now()
  where participant_id = p_participant_id
    and read_at is null
    and author_id is distinct from auth.uid()
    and (public.owns_participant(p_participant_id) or public.is_trainer());
$$;

-- Lista kursantów dla panelu trenera, z wyliczonymi wskaźnikami.
--
-- `last_activity` to najpóźniejsze z: odhaczenia, zapisu notatki, wiadomości
-- od kursanta, zatwierdzenia. Najcenniejszą informacją nie jest to, kto
-- ćwiczy, tylko kto przestał — panel sortuje po tym polu rosnąco.
create function public.trainer_overview()
returns table (
  participant_id uuid,
  program_id uuid,
  program_title text,
  sessions_total int,
  status public.participant_status,
  current_session int,
  applied_at timestamptz,
  dog_name text,
  dog_breed text,
  dog_birth_date date,
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
    d.name,
    d.breed,
    d.birth_date,
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
-- Karty w PDF — prywatny magazyn, link podpisywany na czas (jak filmy).
-- Pierwszy katalog ścieżki to slug programu: fundament/spotkanie_01.pdf.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('karty', 'karty', false)
on conflict (id) do nothing;

create policy "karty dla uczestnikow" on storage.objects for select
  using (
    bucket_id = 'karty'
    and exists (
      select 1 from public.programs pr
      where pr.slug = (storage.foldername(name))[1]
        and public.can_read_program(pr.id)
    )
  );

-- ---------------------------------------------------------------------------
-- Etap 1 planu: kursy online schodzą z katalogu na czas programu
-- stacjonarnego. Nic nie jest usuwane — płatności, filmy i webhook zostają.
-- Powrót: `is_published = true` w Table Editor. Kto kurs kupił, nadal go
-- widzi (polityka „published or purchased courses").
-- ---------------------------------------------------------------------------
update public.courses set is_published = false;
