-- ============================================================================
--  Kurs zdjęty ze sprzedaży musi zostać widoczny dla tych, którzy go kupili.
--
--  BŁĄD, KTÓRY TO NAPRAWIA
--
--  Polityka „published courses" pozwalała odczytać wiersz z `courses` wyłącznie
--  gdy `is_published = true`. Wyglądało to niewinnie, bo dotyczyło katalogu.
--  W praktyce odcinało płacących klientów: zapytanie o dostępy dociąga kurs
--  przez relację (`enrollments -> courses`), a RLS stosuje się także do relacji
--  dociąganych. Po zdjęciu kursu ze sprzedaży enrollment wracał więc z pustym
--  kursem i znikał z panelu, a strona kursu pokazywała „nie znaleziono".
--
--  DLACZEGO TO WAŻNE, A NIE TEORETYCZNE
--
--  Zdjęcie kursu ze sprzedaży przy zachowaniu dostępu dla kupujących to nie
--  wyjątek, tylko normalny stan w co najmniej trzech sytuacjach:
--    - zawieszenie działalności gospodarczej (nowa sprzedaż jest wtedy
--      niedozwolona, ale zobowiązania sprzed zawieszenia trzeba wykonać),
--    - wycofanie starej edycji kursu przy wprowadzaniu nowej,
--    - wstrzymanie sprzedaży na czas poprawiania materiałów.
--
--  W każdej z nich odcięcie ludzi od opłaconego kursu byłoby niewykonaniem
--  umowy.
-- ============================================================================

-- Czy użytkownik KIEDYKOLWIEK kupił ten kurs.
--
-- Świadomie bez sprawdzania `expires_at`, w odróżnieniu od `has_access()`.
-- Komuś, komu wygasł pakiet Basic, strona kursu ma się nadal otworzyć — po to,
-- żeby zobaczył komunikat o wygaśnięciu i mógł przedłużyć. Dostępu do płatnych
-- treści ta funkcja nie daje: zadania chroni `day_unlocked()`, które datę
-- wygaśnięcia sprawdza.
create function public.has_enrollment(p_course_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from enrollments
    where user_id = auth.uid()
      and course_id = p_course_id
  );
$$;

drop policy "published courses" on public.courses;

create policy "published or purchased courses" on public.courses for select
  using (is_published or public.has_enrollment(id));
