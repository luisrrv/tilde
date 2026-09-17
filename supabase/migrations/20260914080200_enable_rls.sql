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
-- Owner UUID: the real auth.users id for the one owner account
-- (created 2026-09-17). Not a placeholder anymore — this is the actual
-- UUID this project's RLS policies are pinned to.

alter table logs enable row level security;
alter table now  enable row level security;

create policy "anon reads published logs"
  on logs for select to anon
  using (published = true);

create policy "owner does everything on logs"
  on logs for all to authenticated
  using      (auth.uid() = '2e9f8673-d8d2-4827-80f9-500879ff3b48')
  with check (auth.uid() = '2e9f8673-d8d2-4827-80f9-500879ff3b48');

create policy "anon reads now"
  on now for select to anon
  using (true);

create policy "owner does everything on now"
  on now for all to authenticated
  using      (auth.uid() = '2e9f8673-d8d2-4827-80f9-500879ff3b48')
  with check (auth.uid() = '2e9f8673-d8d2-4827-80f9-500879ff3b48');
