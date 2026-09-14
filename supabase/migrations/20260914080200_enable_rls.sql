-- Row Level Security (blueprint.md §13), pinned to a single owner UUID.
--
--   anonymous       -> SELECT published logs only, SELECT all of `now`
--   authenticated    -> full access, but ONLY when auth.uid() matches
--                       the owner UUID below
--
-- There are no anonymous writes anywhere on this site (the visitor
-- counter was dropped, §4), so these policies need no exception, no
-- security-definer RPC, and no rate limiting.
--
-- >>> REPLACE '00000000-0000-0000-0000-000000000000' BELOW <<<
-- This is an obvious placeholder, not a real UUID. It must be replaced
-- with the actual Supabase auth.users UUID for the one owner account,
-- once that account exists (see SETUP.md). Until it is replaced, NO
-- authenticated user — including the real owner — can write anything.

alter table logs enable row level security;
alter table now  enable row level security;

create policy "anon reads published logs"
  on logs for select to anon
  using (published = true);

create policy "owner does everything on logs"
  on logs for all to authenticated
  using      (auth.uid() = '00000000-0000-0000-0000-000000000000')
  with check (auth.uid() = '00000000-0000-0000-0000-000000000000');

create policy "anon reads now"
  on now for select to anon
  using (true);

create policy "owner does everything on now"
  on now for all to authenticated
  using      (auth.uid() = '00000000-0000-0000-0000-000000000000')
  with check (auth.uid() = '00000000-0000-0000-0000-000000000000');
