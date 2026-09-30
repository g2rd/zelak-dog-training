-- ============================================================================
--  „Konta bez dostępu” w panelu trenera.
--  Obsługa: INSTRUKCJA-KURSY.md, sekcja 12.2.
--
--  Po założeniu konta, zanim ktoś zgłosi psa, trener dostawał tylko maila
--  „Nowe konto” — w /trener tej osoby nie było, bo polityki na `profiles`
--  i `dogs` pokazują trenerowi wyłącznie zgłoszonych. Nie dało się więc
--  jednym kliknięciem dać jej kodu.
--
--  DLACZEGO FUNKCJA, A NIE SZERSZA POLITYKA RLS
--
--  Poszerzenie polityk „trainer reads applicant …” na wszystkie konta
--  otworzyłoby trenerowi CAŁE tabele `profiles` i `dogs` w każdym zapytaniu
--  strefy. Funkcja zwraca dokładnie to, czego potrzebuje ta jedna lista
--  (imię, e-mail, data, czy adres potwierdzony, imiona psów, wolny kod),
--  i tylko trenerowi. Reszta zasad dostępu zostaje bez zmian.
-- ============================================================================

create function public.trainer_accounts_without_access()
returns table (
  user_id uuid,
  full_name text,
  email text,
  created_at timestamptz,
  email_confirmed boolean,
  dogs jsonb,
  free_code text
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_trainer() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select
    u.id,
    p.full_name,
    u.email::text,
    u.created_at,
    u.email_confirmed_at is not null,
    coalesce(
      (select jsonb_agg(jsonb_build_object('name', d.name, 'breed', d.breed) order by d.created_at)
         from dogs d where d.user_id = u.id),
      '[]'::jsonb
    ),
    -- Najnowszy niewykorzystany kod na ten adres — żeby nie wystawiać drugiego.
    (select c.code from access_codes c
      where c.email = lower(u.email) and c.redeemed_at is null and c.revoked_at is null
      order by c.created_at desc limit 1)
  from auth.users u
  left join profiles p on p.id = u.id
  where not exists (select 1 from participants pa where pa.user_id = u.id)
    and not exists (select 1 from trainers t where t.user_id = u.id)
  order by u.created_at desc;
end; $$;

revoke execute on function public.trainer_accounts_without_access() from public, anon;
