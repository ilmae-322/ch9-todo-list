-- =====================================================================
-- Supabase SQL Editor에서 한 번 실행한다.
-- 회원 정보(profiles)와 할 일(todos) 테이블, RLS 정책을 만든다.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. 회원 정보: 인증은 Supabase Auth(auth.users)가 담당하고,
--    화면에 표시할 닉네임은 profiles에 저장한다.
-- ---------------------------------------------------------------------
create table public.profiles (
  id         uuid        primary key references auth.users (id) on delete cascade,
  nickname   text        not null check (char_length(btrim(nickname)) between 1 and 30),
  created_at timestamptz not null default now()
);

-- 회원가입 시 profiles 행을 자동으로 만든다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname)
  values (
    new.id,
    -- nickname 컬럼 제한(30자)을 넘으면 가입 자체가 실패하므로 잘라서 넣는다.
    left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'nickname'), ''), split_part(new.email, '@', 1)), 30)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2. 할 일
--    user_id의 기본값을 auth.uid()로 두어, 클라이언트가 보내지 않아도
--    로그인한 사용자의 id가 저장된다.
-- ---------------------------------------------------------------------
create table public.todos (
  id         bigint      generated always as identity primary key,
  user_id    uuid        not null default auth.uid()
                         references auth.users (id) on delete cascade,
  title      text        not null check (char_length(btrim(title)) between 1 and 100),
  memo       text        check (memo is null or char_length(memo) <= 1000),
  is_done    boolean     not null default false,
  created_at timestamptz not null default now()
);

create index todos_user_id_created_at_idx on public.todos (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- 3. RLS: 로그인한 사용자는 본인 데이터만 읽고 쓸 수 있다.
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.todos    enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using      (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy todos_select_own on public.todos
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy todos_insert_own on public.todos
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy todos_update_own on public.todos
  for update to authenticated
  using      (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy todos_delete_own on public.todos
  for delete to authenticated
  using (user_id = (select auth.uid()));
