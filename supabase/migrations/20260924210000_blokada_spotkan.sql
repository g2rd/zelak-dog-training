-- ============================================================================
--  Blokada spotkań: 6–10 otwierają się po zaliczeniu 1–5.
--  Obsługa: INSTRUKCJA-KURSY.md, sekcja 12.4.
--
--  ZASADA
--
--  Pierwsze `programs.free_sessions` spotkań (domyślnie 5) widać zawsze.
--  Reszta otwiera się, gdy kursant ZALICZY każde z nich: wszystkie kratki
--  zadań domowych (ćwiczenie × dni 1–7) i cała lista „przed spotkaniem
--  sprawdź”. Lista „zabierz na spotkanie” się nie liczy — to lista
--  pakowania, nie zadanie. `free_sessions = NULL` wyłącza blokadę.
--
--  Trener może odblokować kursanta ręcznie (`participants.unlocked_all`) —
--  np. gdy po spotkaniu 5 przestawił go dalej, a kursant nie odhaczył
--  wszystkiego. Bez tego kursant stanąłby przed zamkniętą bieżącą kartą.
--
--  BLOKADĘ EGZEKWUJE BAZA
--
--  Zamknięta karta nie wychodzi z bazy: polityka na `program_sessions`
--  i `session_items` sprawdza `can_read_session()`, a ta — blokadę. Ekran
--  pokazuje kłódki na podstawie `program_outline()` (same numery i tytuły).
--
--  Blokada liczy się na UŻYTKOWNIKA, nie na psa: karty są wspólne dla
--  wszystkich psów w planie, więc kto zaliczył 1–5 z jednym psem, widzi
--  treść dalszych kart. Ekran pokazuje kłódki według postępów wybranego psa.
-- ============================================================================

alter table public.programs
  add column free_sessions int default 5 check (free_sessions is null or free_sessions >= 1);

alter table public.participants
  add column unlocked_all boolean not null default false;

-- Czy zgłoszenie zaliczyło spotkania 1..p_upto: nie brakuje żadnej kratki
-- zadania domowego (dni 1–7) ani żadnej pozycji „sprawdź”.
create function public.participant_passed(p_participant_id uuid, p_upto int)
returns boolean language sql stable security definer set search_path = public as $$
  select not exists (
    select 1
    from participants p
    join program_sessions s on s.program_id = p.program_id and s.number <= p_upto
    join session_items i on i.session_id = s.id and i.kind in ('homework', 'check')
    cross join lateral (
      select d from generate_series(1, 7) d where i.kind = 'homework'
      union all
      select 0 where i.kind = 'check'
    ) days(d)
    where p.id = p_participant_id
      and not exists (
        select 1 from item_log l
        where l.participant_id = p.id and l.item_id = i.id and l.day = days.d
      )
  );
$$;

-- Czy zalogowany kursant widzi to spotkanie (trener widzi wszystko —
-- sprawdza to `can_read_session`).
create function public.session_open_for_user(p_session_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from program_sessions s
    join programs pr on pr.id = s.program_id
    where s.id = p_session_id
      and (
        pr.free_sessions is null
        or s.number <= pr.free_sessions
        or exists (
          select 1 from participants p
          where p.program_id = s.program_id
            and p.user_id = auth.uid()
            and p.status in ('approved', 'finished')
            and public.access_open(p.expires_at)
            and (p.unlocked_all or public.participant_passed(p.id, pr.free_sessions))
        )
      )
  );
$$;

-- Dotąd: każdy, kto czyta program, czyta każde spotkanie. Teraz także
-- warunek blokady.
create or replace function public.can_read_session(p_session_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from program_sessions s
    where s.id = p_session_id
      and public.can_read_program(s.program_id)
      and (public.is_trainer() or public.session_open_for_user(s.id))
  );
$$;

drop policy "sessions for members" on public.program_sessions;
create policy "sessions for members" on public.program_sessions for select
  using (public.can_read_session(id));

-- Odhaczenie i notatka tylko w otwartej karcie — bez tego dałoby się
-- zapisać postęp w zamkniętej, znając identyfikator zadania.
drop policy "insert own log" on public.item_log;
create policy "insert own log" on public.item_log for insert
  with check (
    public.participant_active(participant_id)
    and public.item_fits_participant(item_id, participant_id, day)
    and public.can_read_session((select session_id from public.session_items where id = item_id))
  );

drop policy "insert own notes" on public.participant_notes;
create policy "insert own notes" on public.participant_notes for insert
  with check (
    public.participant_active(participant_id)
    and public.session_fits_participant(session_id, participant_id)
    and public.can_read_session(session_id)
  );

-- Spis spotkań do paska z kłódkami: numer, tytuł i czy otwarte. Dostaje go
-- każdy, kto czyta program — tytuły nie są tajemnicą, treść kart tak.
create function public.program_outline(p_program_id uuid)
returns table (id uuid, number int, title text, open boolean)
language sql stable security definer set search_path = public as $$
  select s.id, s.number, s.title,
         public.is_trainer() or public.session_open_for_user(s.id)
  from program_sessions s
  where s.program_id = p_program_id
    and public.can_read_program(p_program_id)
  order by s.number;
$$;
