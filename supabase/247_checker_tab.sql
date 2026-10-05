-- 247: the Checker tab (التبيّن) — the requests, their results, the limits.
--
-- (247: taken from the migration ledger in the master task list, 5 Oct 2026,
-- by S2, the Checker tab session. Challenge-day work, Bāzil 4–6 Oct.)
--
-- What it is (the owner's decisions of 3–5 Oct): a signed-in person pastes a
-- YouTube link; a worker on the owner's PC (dorar answers only a home line)
-- picks the request up from here, runs the checker on the clip, and writes the
-- result back. The result is COUNTS + the rows, seen only by the person who ran
-- it; nothing is written to any table a viewer reads, nothing about the clip or
-- its speaker is published.
--
--   checker_settings     one row: the limits as data (3 a person a day, 30 a
--                        day for the app, $100 in total), a pause switch, the
--                        worker's heartbeat. No client reads it directly.
--   checker_tester_codes the tester codes (judges get one in the submission
--                        notes, family testers from the owner). Stored as a
--                        hash; each can be switched off.
--   checker_testers      who has entered a code: once per account.
--   checker_code_tries   every code try, for the guessing limit (10 wrong a
--                        day per account). Service role only.
--   checker_runs         one row per check: the person's own, readable only by
--                        them; written only by request_check() and the worker.
--   checker_run_logs     the worker's internal notes and real error texts
--                        (never shown to anyone in the app). Service role only.
--
-- Who may ask (request_check, every comparison guarded against a missing
-- value — the September lesson): a signed-in account, not a guest, not a
-- child's profile, not suspended, with a tester code entered; then the day's
-- three for the person, the day's thirty for the app and the money left. A day
-- is a Riyadh day. A check refused by gate 1 ("not Islamic content"), a link
-- that is too long or unreadable, and a check that fails are marked
-- counted = false by the worker and give the slot back.
--
-- Can be undone: everything here is new (tables, functions, policies); drop
-- them. Nothing existing is changed.

-- --- the settings row ---------------------------------------------------------

create table if not exists public.checker_settings (
  id                   boolean primary key default true check (id),
  per_person_daily     int not null default 3 check (per_person_daily >= 0),
  app_daily            int not null default 30 check (app_daily >= 0),
  budget_usd           numeric(8,2) not null default 100 check (budget_usd >= 0),
  -- money spent from the same keys outside the tab (the re-test of the engine
  -- on the library clips, test runs), added by hand so the total stays honest
  spent_outside_usd    numeric(8,2) not null default 0 check (spent_outside_usd >= 0),
  -- a waiting or running check holds this much of the budget until its real
  -- cost is written, so many requests at once cannot overshoot the total
  reserve_per_run_usd  numeric(6,2) not null default 1.50 check (reserve_per_run_usd >= 0),
  paused               boolean not null default false,
  rules_version        text,
  worker_seen_at       timestamptz,
  worker_version       text,
  updated_at           timestamptz not null default now()
);

comment on table public.checker_settings is
  'The Checker tab (247): one row. Limits as data (per person a day, per app a day, total budget in USD), the pause switch, and the PC worker''s heartbeat (worker_seen_at). Service role and moderators only; the app reads my_checker_state().';

insert into public.checker_settings (id) values (true) on conflict (id) do nothing;

alter table public.checker_settings enable row level security;
revoke all on public.checker_settings from public, anon, authenticated;

-- --- tester codes -------------------------------------------------------------

create table if not exists public.checker_tester_codes (
  id          uuid primary key default gen_random_uuid(),
  code_hash   text not null unique,
  label       text not null,            -- who it is for: "judges", "family", ...
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on table public.checker_tester_codes is
  'Tester codes for the Checker tab (247), stored as sha256 of the upper-cased code. Created by checker_new_code() (service role), which shows the code once. active = false switches a code off for new entries.';

alter table public.checker_tester_codes enable row level security;
revoke all on public.checker_tester_codes from public, anon, authenticated;

create table if not exists public.checker_testers (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  code_id     uuid not null references public.checker_tester_codes (id) on delete cascade,
  entered_at  timestamptz not null default now()
);

comment on table public.checker_testers is
  'Accounts that entered a tester code for the Checker tab (247): once per account. Written only by checker_enter_code().';

alter table public.checker_testers enable row level security;
revoke all on public.checker_testers from public, anon, authenticated;

create table if not exists public.checker_code_tries (
  id       bigint generated always as identity primary key,
  user_id  uuid not null references auth.users (id) on delete cascade,
  ok       boolean not null,
  at       timestamptz not null default now()
);

create index if not exists checker_code_tries_user_at on public.checker_code_tries (user_id, at);

alter table public.checker_code_tries enable row level security;
revoke all on public.checker_code_tries from public, anon, authenticated;

-- --- the runs -----------------------------------------------------------------

create table if not exists public.checker_runs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  source           text not null default 'youtube' check (source in ('youtube', 'file')),
  youtube_id       text check (youtube_id is null or youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  status           text not null default 'waiting'
                     check (status in ('waiting', 'running', 'done', 'refused', 'failed')),
  -- where a running check is: gate1 · listen · checking · second_look
  step             text check (step is null or step in ('gate1', 'listen', 'checking', 'second_look')),
  step_done        int check (step_done is null or step_done >= 0),
  step_total       int check (step_total is null or step_total >= 0),
  -- why a check stopped without a result; the app maps each to one plain line
  refusal          text check (refusal is null or refusal in (
                     'too_long', 'unreadable', 'not_islamic', 'nothing_to_check', 'failed')),
  -- false gives the person's (and the app's) daily slot back
  counted          boolean not null default true,
  title            text,
  channel_title    text,
  duration_seconds int check (duration_seconds is null or duration_seconds >= 0),
  -- the counts and the rows, written by the worker; see the worker's README
  result           jsonb,
  engine           text,       -- "checker3" | "checker2"
  rules_version    text,
  cost_usd         numeric(8,4) not null default 0 check (cost_usd >= 0),
  created_at       timestamptz not null default now(),
  started_at       timestamptz,
  finished_at      timestamptz,
  constraint checker_runs_youtube_has_id check (source <> 'youtube' or youtube_id is not null),
  constraint checker_runs_refusal_only_when_stopped check (
    (status in ('refused', 'failed')) = (refusal is not null))
);

comment on table public.checker_runs is
  'The Checker tab (247): one row per check a person asked for. Readable only by that person; inserted only through request_check(); updated only by the PC worker (service role). Nothing here is shown to anyone else or published.';

create index if not exists checker_runs_user_created on public.checker_runs (user_id, created_at desc);
create index if not exists checker_runs_created on public.checker_runs (created_at);
create index if not exists checker_runs_waiting on public.checker_runs (created_at) where status = 'waiting';

alter table public.checker_runs enable row level security;
revoke all on public.checker_runs from public, anon, authenticated;
grant select on public.checker_runs to authenticated;

drop policy if exists "A person reads their own checks" on public.checker_runs;
create policy "A person reads their own checks"
  on public.checker_runs for select
  to authenticated
  using (user_id = (select auth.uid()));

create table if not exists public.checker_run_logs (
  id      bigint generated always as identity primary key,
  run_id  uuid references public.checker_runs (id) on delete cascade,
  at      timestamptz not null default now(),
  note    text not null
);

comment on table public.checker_run_logs is
  'The PC worker''s internal notes per check (247), real error texts included. Service role only; never shown in the app.';

alter table public.checker_run_logs enable row level security;
revoke all on public.checker_run_logs from public, anon, authenticated;

-- --- helpers ------------------------------------------------------------------

-- The start of today in Riyadh, as a timestamp.
create or replace function public.checker_day_start()
returns timestamptz
language sql
stable
set search_path = public
as $$
  select (date_trunc('day', now() at time zone 'Asia/Riyadh')) at time zone 'Asia/Riyadh';
$$;

revoke all on function public.checker_day_start() from public, anon;
grant execute on function public.checker_day_start() to authenticated;

-- Who the caller is, for the Checker: 'none' (no session), 'guest' (an
-- anonymous sign-in), 'child', 'suspended', 'tester' (a code entered) or
-- 'member' (signed in, no code yet). Each test is guarded against a missing
-- value so a gap can never read as a pass.
create or replace function public.checker_caller_kind()
returns text
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return 'none';
  end if;
  if coalesce((select u.is_anonymous from auth.users u where u.id = v_uid), true) then
    return 'guest';  -- no auth row at all is treated as a guest, never as a member
  end if;
  if coalesce((select p.is_child_account from profiles p where p.id = v_uid), true) then
    return 'child';  -- no profile row is refused like a child, never let through
  end if;
  if public.is_suspended() then
    return 'suspended';
  end if;
  if exists (select 1 from checker_testers t where t.user_id = v_uid) then
    return 'tester';
  end if;
  return 'member';
end;
$$;

revoke all on function public.checker_caller_kind() from public, anon, authenticated;

-- --- what the tab shows before a check ----------------------------------------

create or replace function public.my_checker_state()
returns jsonb
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_kind  text := public.checker_caller_kind();
  s       checker_settings%rowtype;
  v_mine  int := 0;
  v_all   int := 0;
  v_spent numeric := 0;
begin
  select * into s from checker_settings where id;
  select count(*) into v_mine from checker_runs
   where user_id = v_uid and counted and created_at >= public.checker_day_start();
  select count(*) into v_all from checker_runs
   where counted and created_at >= public.checker_day_start();
  select coalesce(sum(case when status in ('waiting', 'running')
                           then greatest(cost_usd, coalesce(s.reserve_per_run_usd, 0))
                           else cost_usd end), 0)
    into v_spent from checker_runs;
  v_spent := v_spent + coalesce(s.spent_outside_usd, 0);

  return jsonb_build_object(
    'caller', v_kind,
    'per_person_daily', coalesce(s.per_person_daily, 0),
    'left_today', greatest(coalesce(s.per_person_daily, 0) - v_mine, 0),
    'app_left_today', greatest(coalesce(s.app_daily, 0) - v_all, 0),
    'budget_ok', coalesce(v_spent < s.budget_usd, false),
    'paused', coalesce(s.paused, true),
    'worker_online', coalesce(s.worker_seen_at > now() - interval '3 minutes', false)
  );
end;
$$;

comment on function public.my_checker_state() is
  'The Checker tab (247): what the screen needs before a check — the caller kind (none/guest/child/suspended/member/tester), checks left today for the person and the app, whether money is left, the pause switch, and whether the PC worker was seen in the last 3 minutes. No amounts of money are returned.';

revoke all on function public.my_checker_state() from public, anon;
grant execute on function public.my_checker_state() to authenticated;

-- --- entering a tester code ---------------------------------------------------

create or replace function public.checker_enter_code(p_code text)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_kind  text := public.checker_caller_kind();
  v_fails int := 0;
  v_code  uuid;
begin
  if v_kind in ('none', 'guest') then
    return jsonb_build_object('status', 'guest');
  elsif v_kind = 'child' then
    return jsonb_build_object('status', 'child');
  elsif v_kind = 'suspended' then
    return jsonb_build_object('status', 'not_allowed');
  elsif v_kind = 'tester' then
    return jsonb_build_object('status', 'ok');
  elsif v_kind is distinct from 'member' then
    return jsonb_build_object('status', 'not_allowed');
  end if;

  select count(*) into v_fails from checker_code_tries
   where user_id = v_uid and not ok and at > now() - interval '1 day';
  if coalesce(v_fails, 0) >= 10 then
    return jsonb_build_object('status', 'locked');
  end if;

  select c.id into v_code from checker_tester_codes c
   where c.active
     and c.code_hash = encode(extensions.digest(upper(btrim(coalesce(p_code, ''))), 'sha256'), 'hex');

  if v_code is null then
    insert into checker_code_tries (user_id, ok) values (v_uid, false);
    return jsonb_build_object('status', 'wrong');
  end if;

  insert into checker_code_tries (user_id, ok) values (v_uid, true);
  insert into checker_testers (user_id, code_id) values (v_uid, v_code)
    on conflict (user_id) do nothing;
  return jsonb_build_object('status', 'ok');
end;
$$;

comment on function public.checker_enter_code(text) is
  'The Checker tab (247): enter a tester code once per account. Returns {status: ok | wrong | locked | guest | child | not_allowed}. 10 wrong tries a day per account lock it until the day has passed.';

revoke all on function public.checker_enter_code(text) from public, anon;
grant execute on function public.checker_enter_code(text) to authenticated;

-- --- asking for a check -------------------------------------------------------

create or replace function public.request_check(p_youtube_id text)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_kind  text := public.checker_caller_kind();
  s       checker_settings%rowtype;
  v_mine  int := 0;
  v_all   int := 0;
  v_spent numeric := 0;
  v_id    uuid;
begin
  if v_kind in ('none', 'guest') then
    return jsonb_build_object('status', 'refused', 'reason', 'guest');
  elsif v_kind = 'child' then
    return jsonb_build_object('status', 'refused', 'reason', 'child');
  elsif v_kind = 'suspended' then
    return jsonb_build_object('status', 'refused', 'reason', 'not_allowed');
  elsif v_kind = 'member' then
    return jsonb_build_object('status', 'refused', 'reason', 'need_code');
  elsif v_kind is distinct from 'tester' then
    return jsonb_build_object('status', 'refused', 'reason', 'not_allowed');
  end if;

  if not coalesce(p_youtube_id ~ '^[A-Za-z0-9_-]{11}$', false) then
    return jsonb_build_object('status', 'refused', 'reason', 'bad_link');
  end if;

  -- One request at a time across the app, so two taps in the same instant
  -- cannot both take the last slot.
  perform pg_advisory_xact_lock(hashtext('public.request_check'));

  select * into s from checker_settings where id;
  if coalesce(s.paused, true) then
    return jsonb_build_object('status', 'refused', 'reason', 'paused');
  end if;

  select coalesce(sum(case when status in ('waiting', 'running')
                           then greatest(cost_usd, coalesce(s.reserve_per_run_usd, 0))
                           else cost_usd end), 0)
    into v_spent from checker_runs;
  v_spent := v_spent + coalesce(s.spent_outside_usd, 0) + coalesce(s.reserve_per_run_usd, 0);
  if not coalesce(v_spent <= s.budget_usd, false) then
    return jsonb_build_object('status', 'refused', 'reason', 'budget');
  end if;

  select count(*) into v_all from checker_runs
   where counted and created_at >= public.checker_day_start();
  if not coalesce(v_all < s.app_daily, false) then
    return jsonb_build_object('status', 'refused', 'reason', 'app_limit');
  end if;

  select count(*) into v_mine from checker_runs
   where user_id = v_uid and counted and created_at >= public.checker_day_start();
  if not coalesce(v_mine < s.per_person_daily, false) then
    return jsonb_build_object('status', 'refused', 'reason', 'person_limit');
  end if;

  insert into checker_runs (user_id, source, youtube_id)
  values (v_uid, 'youtube', p_youtube_id)
  returning id into v_id;

  return jsonb_build_object('status', 'ok', 'id', v_id);
end;
$$;

comment on function public.request_check(text) is
  'The Checker tab (247): ask for a check of a YouTube clip (its 11-character id). Returns {status: ok, id} or {status: refused, reason: guest | child | not_allowed | need_code | bad_link | paused | budget | app_limit | person_limit}. Every comparison is guarded so a missing value refuses.';

revoke all on function public.request_check(text) from public, anon;
grant execute on function public.request_check(text) to authenticated;

-- --- the worker's side (service role only) ------------------------------------

-- Takes the oldest waiting check and marks it running. One worker today, but
-- skip locked keeps a second one from taking the same row.
create or replace function public.checker_claim_next()
returns setof public.checker_runs
language plpgsql
security definer set search_path = public
as $$
begin
  return query
  update checker_runs r
     set status = 'running', started_at = now(), step = 'gate1', step_done = null, step_total = null
   where r.id = (
     select w.id from checker_runs w
      where w.status = 'waiting'
      order by w.created_at
      limit 1
      for update skip locked)
  returning r.*;
end;
$$;

revoke all on function public.checker_claim_next() from public, anon, authenticated;

create or replace function public.checker_heartbeat(p_version text)
returns void
language sql
security definer set search_path = public
as $$
  update checker_settings set worker_seen_at = now(), worker_version = p_version, updated_at = now() where id;
$$;

revoke all on function public.checker_heartbeat(text) from public, anon, authenticated;

-- Makes a new tester code and returns it ONCE (only its hash is kept).
-- 8 letters/digits from an alphabet without look-alikes, shown as XXXX-XXXX.
create or replace function public.checker_new_code(p_label text)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  v_abc   constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_bytes bytea := extensions.gen_random_bytes(8);
  v_raw   text := '';
  v_code  text;
  i       int;
begin
  for i in 0..7 loop
    v_raw := v_raw || substr(v_abc, 1 + (get_byte(v_bytes, i) % length(v_abc)), 1);
  end loop;
  v_code := substr(v_raw, 1, 4) || '-' || substr(v_raw, 5, 4);
  insert into checker_tester_codes (code_hash, label)
  values (encode(extensions.digest(v_code, 'sha256'), 'hex'), coalesce(nullif(btrim(p_label), ''), 'tester'));
  return v_code;
end;
$$;

revoke all on function public.checker_new_code(text) from public, anon, authenticated;

-- --- probes -------------------------------------------------------------------

do $$
begin
  if (select count(*) from public.checker_settings) <> 1 then
    raise exception '247 probe: checker_settings must hold exactly one row';
  end if;
  if not exists (select 1 from pg_policies where tablename = 'checker_runs'
                  and policyname = 'A person reads their own checks') then
    raise exception '247 probe: the read-own policy is missing';
  end if;
  if has_table_privilege('authenticated', 'public.checker_runs', 'insert')
     or has_table_privilege('authenticated', 'public.checker_runs', 'update')
     or has_table_privilege('anon', 'public.checker_runs', 'select')
     or has_table_privilege('authenticated', 'public.checker_settings', 'select')
     or has_table_privilege('authenticated', 'public.checker_tester_codes', 'select') then
    raise exception '247 probe: a client grant is wider than intended';
  end if;
  if has_function_privilege('authenticated', 'public.checker_claim_next()', 'execute')
     or has_function_privilege('authenticated', 'public.checker_new_code(text)', 'execute')
     or has_function_privilege('anon', 'public.request_check(text)', 'execute') then
    raise exception '247 probe: a worker or code function is callable by a client';
  end if;
end;
$$;
