-- ============================================================
-- UW Blueprint People Tracker — Supabase Schema
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor)
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Teams ───────────────────────────────────────────────────
create table if not exists public.teams (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null unique,
  created_at timestamptz not null default now()
);

-- Seed default teams
insert into public.teams (name) values
  ('Nonprofit A'),
  ('Nonprofit B'),
  ('Nonprofit C'),
  ('Nonprofit D'),
  ('Nonprofit E')
on conflict (name) do nothing;

-- ─── Members ─────────────────────────────────────────────────
create table if not exists public.members (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references auth.users(id) on delete set null,

  -- Tier 1: all members
  first_name       text not null,
  last_name        text not null,
  bp_email         text not null unique,
  team_id          uuid references public.teams(id) on delete set null,
  roles            text[] not null default '{}',
  program          text,
  year_of_study    text,
  status           text not null default 'current' check (status in ('current', 'alumni')),

  -- Tier 2: team leads (own team) + VPs + super admins
  study_coop       text,
  location         text,
  terms_on_bp      integer,
  skill_level      text,       -- hidden from the member themselves
  notes            text,       -- hidden from the member themselves
  coming_back      boolean,
  role_next_term   text,

  -- Tier 3: super admin only
  personal_email   text,
  socials          jsonb,
  gender           text,
  ethnic_background text,

  -- Public profile fields (visible to all, editable by member themselves)
  avatar_url       text,
  bio              text,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists members_updated_at on public.members;
create trigger members_updated_at
  before update on public.members
  for each row execute function public.handle_updated_at();

-- ─── Member Notes / Comments ─────────────────────────────────
create table if not exists public.member_notes (
  id          uuid primary key default uuid_generate_v4(),
  member_id   uuid not null references public.members(id) on delete cascade,
  author_id   uuid not null references public.members(id),
  content     text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists member_notes_updated_at on public.member_notes;
create trigger member_notes_updated_at
  before update on public.member_notes
  for each row execute function public.handle_updated_at();

-- ─── Helper: get current member's record ─────────────────────
create or replace function public.current_member()
returns public.members language sql security definer stable as $$
  select * from public.members
  where user_id = auth.uid()
  limit 1;
$$;

-- ─── Helper: permission tier for the calling user ────────────
create or replace function public.my_permission_tier()
returns text language sql security definer stable as $$
  select case
    when exists (
      select 1 from public.members
      where user_id = auth.uid()
        and roles && array['Co-president', 'VP Talent']
    ) then 'super_admin'
    when exists (
      select 1 from public.members
      where user_id = auth.uid()
        and roles && array['VP Engineering', 'VP Design', 'VP Product',
                           'VP Project Scoping', 'VP Finance',
                           'Internal Director', 'External Director']
    ) then 'vp'
    when exists (
      select 1 from public.members
      where user_id = auth.uid()
        and roles && array['Project Lead', 'Product Manager']
    ) then 'team_lead'
    else 'member'
  end;
$$;

-- ─── Helper: team lead's team id ─────────────────────────────
create or replace function public.my_team_id()
returns uuid language sql security definer stable as $$
  select team_id from public.members
  where user_id = auth.uid()
  limit 1;
$$;

-- ─── Row Level Security ──────────────────────────────────────
alter table public.teams enable row level security;
alter table public.members enable row level security;
alter table public.member_notes enable row level security;

-- Teams: everyone authenticated can read
create policy "teams_select_authenticated"
  on public.teams for select
  to authenticated
  using (true);

-- Teams: only super admins can insert/update/delete
create policy "teams_insert_super_admin"
  on public.teams for insert
  to authenticated
  with check (public.my_permission_tier() = 'super_admin');

create policy "teams_update_super_admin"
  on public.teams for update
  to authenticated
  using (public.my_permission_tier() = 'super_admin');

create policy "teams_delete_super_admin"
  on public.teams for delete
  to authenticated
  using (public.my_permission_tier() = 'super_admin');

-- Members: SELECT
-- All authenticated users can select members.
-- Column-level filtering (tier 2/3 fields) happens in the application layer.
create policy "members_select_authenticated"
  on public.members for select
  to authenticated
  using (true);

-- Members: INSERT
-- Super admins can create anyone.
-- Any authenticated @uwblueprint.org user can self-register (their bp_email must
-- match their auth email, and they must not already have a linked record).
create policy "members_insert_self_or_super_admin"
  on public.members for insert
  to authenticated
  with check (
    public.my_permission_tier() = 'super_admin'
    or (
      bp_email = auth.email()
      and not exists (
        select 1 from public.members where user_id = auth.uid()
      )
    )
  );

-- Members: UPDATE
-- A member can update their own row (limited fields enforced app-side).
-- A user can claim a pre-created row where user_id IS NULL and bp_email matches.
-- Team leads can update members on their team.
-- VPs and super admins can update anyone.
create policy "members_update_self_or_elevated"
  on public.members for update
  to authenticated
  using (
    user_id = auth.uid()                                            -- own linked row
    or (user_id is null and bp_email = auth.email())               -- claim pre-created row
    or public.my_permission_tier() in ('vp', 'super_admin')        -- VP / super admin
    or (                                                             -- team lead, own team
      public.my_permission_tier() = 'team_lead'
      and team_id = public.my_team_id()
    )
  );

-- Members: DELETE — super admin only
create policy "members_delete_super_admin"
  on public.members for delete
  to authenticated
  using (public.my_permission_tier() = 'super_admin');

-- Notes: SELECT
-- Team leads see notes for their team (but not about themselves).
-- VPs see notes for all members (not about themselves).
-- Super admins see all notes (not about themselves).
-- Regular members cannot see any notes.
create policy "notes_select_elevated"
  on public.member_notes for select
  to authenticated
  using (
    member_id != (select id from public.members where user_id = auth.uid() limit 1)
    and (
      public.my_permission_tier() = 'super_admin'
      or public.my_permission_tier() = 'vp'
      or (
        public.my_permission_tier() = 'team_lead'
        and exists (
          select 1 from public.members m
          where m.id = member_id
            and m.team_id = public.my_team_id()
        )
      )
    )
  );

-- Notes: INSERT — team leads, VPs, super admins can add notes
create policy "notes_insert_elevated"
  on public.member_notes for insert
  to authenticated
  with check (
    public.my_permission_tier() in ('team_lead', 'vp', 'super_admin')
  );

-- Notes: UPDATE — author only
create policy "notes_update_author"
  on public.member_notes for update
  to authenticated
  using (
    author_id = (select id from public.members where user_id = auth.uid() limit 1)
  );

-- Notes: DELETE — author or super admin
create policy "notes_delete_author_or_admin"
  on public.member_notes for delete
  to authenticated
  using (
    author_id = (select id from public.members where user_id = auth.uid() limit 1)
    or public.my_permission_tier() = 'super_admin'
  );

-- ─── Table Grants ────────────────────────────────────────────
grant select, insert, update, delete on public.members to authenticated;
grant select, insert, update, delete on public.member_notes to authenticated;
grant select on public.teams to authenticated;

-- ─── Role Change Requests ────────────────────────────────────
-- Members can request a role change; Co-presidents / VP Talent approve or reject.
create table if not exists public.role_change_requests (
  id              uuid primary key default uuid_generate_v4(),
  member_id       uuid not null references public.members(id) on delete cascade,
  requested_roles text[] not null,
  current_roles   text[] not null,
  reason          text,
  status          text not null default 'pending'
                  check (status in ('pending', 'approved', 'rejected')),
  reviewed_by     uuid references public.members(id),
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now()
);

alter table public.role_change_requests enable row level security;

-- Members see their own requests; super admins see all
create policy "role_requests_select"
  on public.role_change_requests for select
  to authenticated
  using (
    member_id = (select id from public.members where user_id = auth.uid() limit 1)
    or public.my_permission_tier() = 'super_admin'
  );

-- Any member can submit a request for themselves (only one pending at a time enforced app-side)
create policy "role_requests_insert_self"
  on public.role_change_requests for insert
  to authenticated
  with check (
    member_id = (select id from public.members where user_id = auth.uid() limit 1)
  );

-- Only super admins can approve or reject
create policy "role_requests_update_super_admin"
  on public.role_change_requests for update
  to authenticated
  using (public.my_permission_tier() = 'super_admin');

grant select, insert, update on public.role_change_requests to authenticated;

create index if not exists role_requests_member_idx on public.role_change_requests(member_id);
create index if not exists role_requests_status_idx  on public.role_change_requests(status);

-- ─── Indexes ─────────────────────────────────────────────────
create index if not exists members_user_id_idx on public.members(user_id);
create index if not exists members_team_id_idx on public.members(team_id);
create index if not exists members_bp_email_idx on public.members(bp_email);
create index if not exists notes_member_id_idx on public.member_notes(member_id);

-- ─── Migrations (run if table already exists) ────────────────
-- Run these in Supabase SQL Editor if you applied schema before these columns were added:
alter table public.members add column if not exists bio text;

-- ─── Storage: avatars bucket ─────────────────────────────────
-- Run AFTER creating the "avatars" bucket in Supabase Dashboard > Storage.
-- Make sure the bucket is set to PUBLIC.

-- Anyone authenticated can upload/update avatars
create policy "avatars_upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars');

create policy "avatars_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars');

-- Public read so avatar URLs work in <img> tags without auth
create policy "avatars_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

-- Authenticated users can delete (e.g. replace their own avatar)
create policy "avatars_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars');
