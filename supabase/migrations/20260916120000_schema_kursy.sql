-- ============================================================================
--  Strefa kursów zelak.pl — schemat bazy (Faza 1 instrukcji wdrożenia)
--
--  Zasada: frontend niczego nie chroni. Dostęp egzekwują polityki RLS niżej
--  oraz Edge Functions. Zapis do `enrollments` ma wyłącznie webhook Stripe
--  (service_role) — użytkownik może swoje wpisy tylko czytać.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1.1 Tabele
-- ---------------------------------------------------------------------------

-- Profil użytkownika (tworzony automatycznie po rejestracji — patrz 1.2)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  -- Zgoda marketingowa: osobny, domyślnie NIEzaznaczony checkbox przy rejestracji
  -- (wymóg z Fazy 9). Data zgody jest potrzebna jako dowód przy kontroli.
  marketing_consent boolean not null default false,
  marketing_consent_at timestamptz,
  created_at timestamptz default now()
);

create table public.dogs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  breed text,
  birth_date date,
  created_at timestamptz default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  cover_url text,
  duration_days int not null default 60,
  is_published boolean default false
);

create table public.course_days (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  day_number int not null check (day_number between 1 and 366),
  title text not null,
  intro_md text,
  is_free_preview boolean default false,
  unique (course_id, day_number)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  course_day_id uuid not null references public.course_days(id) on delete cascade,
  position int not null default 0,
  title text not null,
  instructions_md text,
  bunny_video_id text,          -- NULL = zadanie tylko z instrukcją
  duration_min int
);

create type public.plan_type as enum ('basic', 'premium');

create table public.products (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  plan public.plan_type not null,
  price_pln numeric(10,2) not null,
  stripe_price_id text not null,
  active boolean default true,
  unique (course_id, plan)
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  plan public.plan_type not null,
  started_at timestamptz not null default now(),
  expires_at timestamptz,        -- NULL = premium (dożywotnio)
  stripe_session_id text unique, -- chroni przed podwójnym zapisem webhooka
  created_at timestamptz default now(),
  unique (user_id, course_id)
);

create table public.task_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  completed_at timestamptz default now(),
  primary key (user_id, task_id)
);

create index on public.course_days (course_id, day_number);
create index on public.tasks (course_day_id, position);
create index on public.enrollments (user_id);
create index on public.task_progress (user_id);

-- ---------------------------------------------------------------------------
-- 1.2 Automatyczny profil po rejestracji
--     Pola imię i zgoda marketingowa przychodzą w `options.data` przy signUp.
-- ---------------------------------------------------------------------------
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  consent boolean := coalesce((new.raw_user_meta_data->>'marketing_consent')::boolean, false);
begin
  insert into public.profiles (id, email, full_name, marketing_consent, marketing_consent_at)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    consent,
    case when consent then now() else null end
  );
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 1.3 Funkcje dostępu
-- ---------------------------------------------------------------------------

-- Czy użytkownik ma aktywny dostęp do kursu
create function public.has_access(p_course_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from enrollments
    where user_id = auth.uid()
      and course_id = p_course_id
      and (expires_at is null or expires_at > now())
  );
$$;

-- Czy dzień jest odblokowany (wariant kalendarzowy: dzień N = started_at + N-1 dni).
--
-- Daty liczone w strefie Europe/Warsaw, a nie w UTC serwera. Bez tego kolejny
-- dzień odblokowywałby się o 1:00 lub 2:00 w nocy polskiego czasu, a frontend
-- (liczący dzień z lokalnej daty telefonu) pokazywałby co innego niż baza.
create function public.day_unlocked(p_day_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from course_days d
    join enrollments e on e.course_id = d.course_id
    where d.id = p_day_id
      and e.user_id = auth.uid()
      and (e.expires_at is null or e.expires_at > now())
      and (
        (now() at time zone 'Europe/Warsaw')::date
        - (e.started_at at time zone 'Europe/Warsaw')::date
      ) >= d.day_number - 1
  )
  or exists (select 1 from course_days where id = p_day_id and is_free_preview);
$$;

-- ---------------------------------------------------------------------------
-- 1.4 Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.dogs          enable row level security;
alter table public.courses       enable row level security;
alter table public.course_days   enable row level security;
alter table public.tasks         enable row level security;
alter table public.products      enable row level security;
alter table public.enrollments   enable row level security;
alter table public.task_progress enable row level security;

-- Profil i psy: tylko własne
create policy "own profile" on public.profiles for all
  using (id = auth.uid()) with check (id = auth.uid());
create policy "own dogs" on public.dogs for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Katalog: publiczny (opublikowane kursy, cennik, lista tytułów dni)
create policy "published courses" on public.courses for select using (is_published);
create policy "active products"   on public.products for select using (active);
-- UWAGA: `intro_md` jest publiczny razem z tytułem dnia. Jeśli wstęp dnia ma być
-- płatny, przenieś go do `tasks` albo do osobnej tabeli chronionej jak `tasks`.
create policy "day titles" on public.course_days for select using (true);

-- Zadania: tylko odblokowane dni
create policy "tasks unlocked" on public.tasks for select
  using (public.day_unlocked(course_day_id));

-- Enrollmenty: użytkownik tylko czyta swoje. Zapis wyłącznie przez webhook (service_role)
create policy "own enrollments" on public.enrollments for select using (user_id = auth.uid());

-- Postęp: własny, i tylko dla odblokowanych zadań
create policy "read own progress" on public.task_progress for select
  using (user_id = auth.uid());
create policy "insert own progress" on public.task_progress for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.tasks t
      where t.id = task_id and public.day_unlocked(t.course_day_id)
    )
  );
create policy "delete own progress" on public.task_progress for delete
  using (user_id = auth.uid());
