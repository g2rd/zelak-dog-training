-- ============================================================================
--  Powiadomienia e-mail dla trenera.
--  Obsługa: INSTRUKCJA-KURSY.md, sekcja 12.8.
--
--  Pięć zdarzeń, każde to osobny mail na kontakt@zelak.pl:
--    new_account   — ktoś założył konto,
--    new_dog       — ktoś dodał psa,
--    application   — ktoś zgłosił psa i czeka na dostęp,
--    code_redeemed — ktoś wpisał kod,
--    message       — kursant napisał wiadomość.
--
--  JAK TO DZIAŁA
--
--  Wyzwalacz wysyła do Edge Function `notify-trainer` samo zdarzenie
--  i identyfikator wiersza. Funkcja sama doczytuje dane (imię, psa, zdjęcie)
--  i wysyła maila przez Resend. Dzięki temu treść maila zmienia się w jednym
--  miejscu, a baza nie składa HTML-a.
--
--  `pg_net` wysyła żądanie ASYNCHRONICZNIE, po zatwierdzeniu transakcji.
--  Rejestracja, dodanie psa czy zgłoszenie nigdy nie czekają na maila i nie
--  padają, gdy Resend nie odpowiada — w najgorszym razie mail nie wyjdzie.
--  Z tego samego powodu cała funkcja `notify_trainer` połyka własne błędy:
--  powiadomienie nie może zablokować rejestracji.
--
--  SEKRETY
--
--  Adres funkcji i wspólny sekret leżą w Supabase Vault, nie w repozytorium:
--    notify_trainer_url    — https://<ref>.supabase.co/functions/v1/notify-trainer
--    notify_trainer_secret — losowy ciąg; ten sam jest w sekretach funkcji
--                            jako NOTIFY_SECRET
--  Brak któregoś = powiadomienia wyłączone, reszta działa normalnie.
-- ============================================================================

create extension if not exists pg_net;

create function public.notify_trainer(p_event text, p_id uuid)
returns void
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_url text;
  v_secret text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'notify_trainer_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'notify_trainer_secret';
  if v_url is null or v_secret is null then
    return;
  end if;

  perform net.http_post(
    url := v_url,
    body := jsonb_build_object('event', p_event, 'id', p_id),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-notify-secret', v_secret),
    timeout_milliseconds := 5000
  );
exception when others then
  raise warning 'notify_trainer(%): %', p_event, sqlerrm;
end; $$;

-- Nikt z aplikacji nie może wywołać wysyłki ręcznie.
revoke execute on function public.notify_trainer(text, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Wyzwalacze
-- ---------------------------------------------------------------------------

-- Nowe konto: profil powstaje w chwili rejestracji (handle_new_user),
-- jeszcze przed potwierdzeniem adresu e-mail.
create function public.on_profile_notify()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_trainer('new_account', new.id);
  return new;
end; $$;

create trigger profiles_notify after insert on public.profiles
  for each row execute function public.on_profile_notify();

create function public.on_dog_notify()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_trainer('new_dog', new.id);
  return new;
end; $$;

create trigger dogs_notify after insert on public.dogs
  for each row execute function public.on_dog_notify();

-- Zgłoszenie czekające na trenera: nowe albo ponowne po odrzuceniu.
-- Wejście kodem daje od razu „approved”, więc tu nie trafia — ma własny mail.
create function public.on_participant_notify()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'pending' and (tg_op = 'INSERT' or old.status is distinct from 'pending') then
    perform public.notify_trainer('application', new.id);
  end if;
  return new;
end; $$;

create trigger participants_notify after insert or update of status on public.participants
  for each row execute function public.on_participant_notify();

create function public.on_code_notify()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.redeemed_at is not null and old.redeemed_at is null then
    perform public.notify_trainer('code_redeemed', new.id);
  end if;
  return new;
end; $$;

create trigger access_codes_notify after update of redeemed_at on public.access_codes
  for each row execute function public.on_code_notify();

-- Tylko wiadomości OD kursanta — własne odpowiedzi trenera nie wracają mailem.
create function public.on_message_notify()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from participants p where p.id = new.participant_id and p.user_id = new.author_id) then
    perform public.notify_trainer('message', new.id);
  end if;
  return new;
end; $$;

create trigger messages_notify after insert on public.messages
  for each row execute function public.on_message_notify();
