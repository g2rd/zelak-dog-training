-- Kurs „Fundament” nie jest ograniczony do szczeniąt w wieku 4–6 miesięcy.
-- Wcześniejsze migracje są już wgrane, więc zmiana ich treści nie dotknęłaby
-- bazy — stąd osobna aktualizacja.
update public.programs
set subtitle = 'Kurs dla szczeniąt i młodych psów'
where slug = 'fundament';
