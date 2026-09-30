-- Test polityk RLS programu stacjonarnego. Uruchom:
--   npx supabase db query --linked -f supabase/tests/rls_program.sql
-- Tworzy trzy konta testowe (kursant, obcy, trener) WEWNĄTRZ transakcji,
-- sprawdza, kto co widzi, i kończy się celowym wyjątkiem RAPORT, który
-- wycofuje wszystko — w bazie nie zostaje żaden ślad. Wynik czytaj z treści
-- błędu: każda linia ma być true / 0 / oczekiwaną wartością.

do $$
declare
  a uuid := '00000000-0000-0000-0000-00000000000a';
  b uuid := '00000000-0000-0000-0000-00000000000b';
  t uuid := '00000000-0000-0000-0000-00000000000c';
  da uuid;
  db uuid;
  pid uuid;
  hw uuid;
  gear uuid;
  n int;
  st text;
  failed boolean;
  r text[] := '{}';
begin
  insert into auth.users (id, email, aud, role, email_confirmed_at) values (a, 'kursant@test.invalid', 'authenticated', 'authenticated', now()), (b, 'obcy@test.invalid', 'authenticated', 'authenticated', now()), (t, 'trener@test.invalid', 'authenticated', 'authenticated', now());
  insert into public.dogs (user_id, name) values (a, 'Burek') returning id into da;
  insert into public.dogs (user_id, name) values (b, 'Rex') returning id into db;
  insert into public.trainers (user_id) values (t);
  -- AAAA: przypisany do kursanta, BBBB: bez adresu, CCCC: przypisany do kogoś innego.
  insert into public.access_codes (code, program_id, email) select c, id, e from public.programs, (values ('TESTAAAA', 'kursant@test.invalid'), ('TESTBBBB', null), ('TESTCCCC', 'ktos@test.invalid')) v(c, e) where slug = 'fundament';
  select i.id into hw from public.session_items i join public.program_sessions s on s.id = i.session_id where s.number = 1 and i.kind = 'homework' order by position limit 1;
  select i.id into gear from public.session_items i join public.program_sessions s on s.id = i.session_id where s.number = 1 and i.kind = 'gear' order by position limit 1;

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select status::text, id into st, pid from public.apply_to_program('fundament', da);
  r := r || ('A1 zgloszenie bez kodu: ' || st);
  select count(*) into n from public.program_sessions;
  r := r || ('A2 oczekujacy widzi spotkan: ' || n);
  failed := false; begin insert into public.participants (user_id, dog_id, program_id, status) select a, da, id, 'approved' from public.programs where slug = 'fundament'; exception when others then failed := true; end;
  r := r || ('A3 bezposredni insert zablokowany: ' || failed);
  failed := false; begin perform public.redeem_access_code('zly-kod', da); exception when others then failed := true; end;
  r := r || ('A4 zly kod odrzucony: ' || failed);
  update public.participants set status = 'approved' where id = pid;
  get diagnostics n = row_count;
  r := r || ('A5 kursant sam sie zatwierdza, wierszy: ' || n);
  failed := false; begin perform public.redeem_access_code('TESTCCCC', da); exception when others then failed := true; end;
  r := r || ('A4b kod na cudzy e-mail odrzucony: ' || failed);
  perform public.redeem_access_code(' test-aaaa ', da);
  select status::text into st from public.participants where id = pid;
  r := r || ('A6 dobry kod: ' || st);
  select (expires_at between now() + interval '89 days' and now() + interval '93 days')::text into st from public.participants where id = pid;
  r := r || ('A6b termin za 3 miesiace: ' || st);
  failed := false; begin perform public.redeem_access_code('TESTAAAA', da); exception when others then failed := true; end;
  r := r || ('A6c drugie uzycie kodu zablokowane: ' || failed);
  failed := false; begin perform public.redeem_access_code('TESTBBBB', da); exception when others then failed := true; end;
  r := r || ('A6d kod przy aktywnym dostepie odrzucony: ' || failed);
  select count(*) into n from public.program_sessions;
  r := r || ('A7 zatwierdzony widzi spotkan: ' || n);
  insert into public.item_log (participant_id, item_id, day) values (pid, hw, 3);
  r := r || 'A8 odhaczenie dnia 3: ok'::text;
  failed := false; begin insert into public.item_log (participant_id, item_id, day) values (pid, gear, 3); exception when others then failed := true; end;
  r := r || ('A9 dzien na liscie pakowania zablokowany: ' || failed);
  failed := false; begin insert into public.item_log (participant_id, item_id, day) values (pid, hw, 0); exception when others then failed := true; end;
  r := r || ('A10 zadanie domowe bez dnia zablokowane: ' || failed);
  insert into public.messages (participant_id, body) values (pid, 'Pytanie od kursanta');
  insert into public.participant_notes (participant_id, session_id, body) select pid, session_id, 'notatka' from public.session_items where id = hw;
  r := r || 'A11 wiadomosc i notatka: ok'::text;
  -- Blokada: przed zaliczeniem 1–5 karty 6–10 nie wychodzą z bazy.
  failed := false; begin insert into public.item_log (participant_id, item_id, day) select pid, i.id, 1 from public.session_items i join public.program_sessions s on s.id = i.session_id where s.number = 6 and i.kind = 'homework' limit 1; get diagnostics n = row_count; if n = 0 then failed := true; end if; exception when others then failed := true; end;
  r := r || ('G1 odhaczenie w zamknietej karcie zablokowane: ' || failed);
  select count(*) into n from public.program_outline((select id from public.programs where slug = 'fundament')) where not open;
  r := r || ('G2 zamknietych w spisie: ' || n);
  insert into public.item_log (participant_id, item_id, day)
    select pid, i.id, d from public.session_items i join public.program_sessions s on s.id = i.session_id
    cross join lateral (select g from generate_series(1, 7) g where i.kind = 'homework' union all select 0 where i.kind = 'check') x(d)
    where s.number <= 5 and i.kind in ('homework', 'check') on conflict do nothing;
  select count(*) into n from public.program_sessions;
  r := r || ('G3 po zaliczeniu 1-5 widzi spotkan: ' || n);
  select count(*) into n from public.profiles;
  r := r || ('A12 kursant widzi profili: ' || n);
  failed := false; begin insert into public.trainers (user_id) values (a); exception when others then failed := true; end;
  r := r || ('A13 samodzielne zostanie trenerem zablokowane: ' || failed);
  select count(*) into n from public.access_codes;
  r := r || ('A14 kursant widzi kodow: ' || n);
  failed := false; begin perform public.create_access_code((select id from public.programs where slug = 'fundament')); exception when others then failed := true; end;
  r := r || ('A15 kursant nie tworzy kodow: ' || failed);
  failed := false; begin perform * from public.trainer_accounts_without_access(); exception when others then failed := true; end;
  r := r || ('A16 kursant nie widzi listy kont: ' || failed);

  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into n from public.participants;
  r := r || ('B1 obcy widzi zgloszen: ' || n);
  select count(*) into n from public.item_log;
  r := r || ('B2 obcy widzi odhaczen: ' || n);
  select count(*) into n from public.messages;
  r := r || ('B3 obcy widzi wiadomosci: ' || n);
  select count(*) into n from public.participant_notes;
  r := r || ('B4 obcy widzi notatek: ' || n);
  select count(*) into n from public.dogs;
  r := r || ('B5 obcy widzi psow: ' || n);
  select count(*) into n from public.program_sessions;
  r := r || ('B6 obcy widzi spotkan: ' || n);
  failed := false; begin insert into public.item_log (participant_id, item_id, day) values (pid, hw, 5); exception when others then failed := true; end;
  r := r || ('B7 odhaczenie w cudzym zgloszeniu zablokowane: ' || failed);
  failed := false; begin insert into public.messages (participant_id, body) values (pid, 'wtracam sie'); exception when others then failed := true; end;
  r := r || ('B8 wiadomosc w cudzym watku zablokowana: ' || failed);
  failed := false; begin perform public.apply_to_program('fundament', da); exception when others then failed := true; end;
  r := r || ('B9 zgloszenie cudzego psa zablokowane: ' || failed);
  failed := false; begin perform * from public.trainer_overview(); exception when others then failed := true; end;
  r := r || ('B10 panel trenera zablokowany: ' || failed);
  failed := false; begin perform public.redeem_access_code('TESTBBBB', da); exception when others then failed := true; end;
  r := r || ('B12 kod na cudzego psa zablokowany: ' || failed);
  failed := false; begin insert into public.messages (participant_id, body, author_id) values (pid, 'podszywam sie', a); exception when others then failed := true; end;
  r := r || ('B11 podszycie pod autora zablokowane: ' || failed);

  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', t, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select homework_done || '/' || homework_total || ' nieprzeczytane=' || unread || ' pies=' || dog_name into st from public.trainer_overview() where participant_id = pid;
  r := r || ('T1 przeglad: ' || st);
  select count(*) into n from public.profiles where id = b;
  r := r || ('T2 trener widzi profil osoby spoza programu: ' || n);
  select count(*) into n from public.dogs where id = db;
  r := r || ('T3 trener widzi psa spoza programu: ' || n);
  select count(*) into n from public.profiles where id = a;
  r := r || ('T4 trener widzi profil kursanta: ' || n);
  update public.participants set current_session = 2 where id = pid;
  get diagnostics n = row_count;
  r := r || ('T5 trener przestawia spotkanie, wierszy: ' || n);
  perform public.mark_thread_read(pid);
  select count(*) into n from public.messages where read_at is not null;
  r := r || ('T6 przeczytane po otwarciu watku: ' || n);
  failed := false; begin insert into public.item_log (participant_id, item_id, day) values (pid, hw, 4); exception when others then failed := true; end;
  r := r || ('T7 trener nie odhacza za kursanta: ' || failed);
  insert into public.messages (participant_id, body) values (pid, 'Odpowiedz trenera');
  r := r || 'T8 odpowiedz trenera: ok'::text;
  select count(*) into n from public.enrollments;
  r := r || ('T9 trener widzi zakupow: ' || n);
  select length(code)::text into st from public.create_access_code((select id from public.programs where slug = 'fundament'), ' Nowy@Test.invalid ');
  r := r || ('T10 trener tworzy kod, dlugosc: ' || st);
  select count(*) into n from public.access_codes where email = 'nowy@test.invalid';
  r := r || ('T11 adres zapisany malymi literami: ' || n);
  select count(*) into n from public.trainer_accounts_without_access() where user_id = b;
  r := r || ('T12 obcy (bez zgloszenia) na liscie kont: ' || n);
  select count(*) into n from public.trainer_accounts_without_access() where user_id in (a, t);
  r := r || ('T13 kursant i trener poza lista kont: ' || n);
  update public.participants set expires_at = now() - interval '1 day' where id = pid;

  -- Dostęp wygasł: kursant traci karty, ale nic nie znika.
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into n from public.program_sessions;
  r := r || ('E1 po wygasnieciu widzi spotkan: ' || n);
  failed := false; begin insert into public.item_log (participant_id, item_id, day) values (pid, hw, 6); exception when others then failed := true; end;
  r := r || ('E2 po wygasnieciu odhaczenie zablokowane: ' || failed);
  select count(*) into n from public.item_log where participant_id = pid;
  r := r || ('E3 odhaczenia zachowane: ' || n);
  perform public.redeem_access_code('TESTBBBB', da);
  select count(*) into n from public.program_sessions;
  r := r || ('E4 nowy kod przedluza, widzi spotkan: ' || n);

  reset role;
  raise exception E'RAPORT\n%', array_to_string(r, E'\n');
end $$;
