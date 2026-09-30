-- ============================================================================
--  Pełny dostęp do wszystkich lekcji od razu po zakupie.
--
--  DLACZEGO ZMIANA
--
--  Pierwotnie kurs otwierał się dzień po dniu: lekcja N udostępniana N-1 dni
--  po zakupie. Przy kursie sześćdziesięciodniowym miało to sens jako element
--  metody — pies potrzebuje powtórzeń, nie maratonu.
--
--  W praktyce to jednak karze kursanta za wiedzę. Ktoś, kto opanował już
--  materiał trzech pierwszych lekcji i kupił kurs dla czwartej, musiał czekać
--  cztery dni na treść, za którą zapłacił. Tempo pracy z psem zostaje
--  rekomendacją w treści kursu, a nie blokadą w systemie.
--
--  CO ZOSTAJE BEZ ZMIAN
--
--  Data wygaśnięcia. Pakiet Basic nadal wygasa po roku i po tej dacie
--  `day_unlocked` przestaje przepuszczać cokolwiek. Bez zmian zostaje też
--  darmowa próbka: dzień oznaczony `is_free_preview` widzi każdy.
-- ============================================================================

create or replace function public.day_unlocked(p_day_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from course_days d
    join enrollments e on e.course_id = d.course_id
    where d.id = p_day_id
      and e.user_id = auth.uid()
      and (e.expires_at is null or e.expires_at > now())
  )
  or exists (select 1 from course_days where id = p_day_id and is_free_preview);
$$;
