-- /lab entries move from a hardcoded list in lab.astro to a table,
-- so they can be published from /admin like logs and now (§11: the
-- table is added now because a real feature needs it).
--
-- One file, run once: table, RLS (same owner UUID as the other two
-- tables), and the existing keymash entry carried over verbatim.

create table lab (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  tagline     text not null default '',
  story       text not null default '',   -- markdown, same renderer as logs
  url         text not null,
  source_url  text,                        -- optional
  made        date not null,               -- displayed as YYYY-MM
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table lab enable row level security;

create policy "anon reads published lab"
  on lab for select to anon
  using (published = true);

create policy "owner does everything on lab"
  on lab for all to authenticated
  using      (auth.uid() = '2e9f8673-d8d2-4827-80f9-500879ff3b48')
  with check (auth.uid() = '2e9f8673-d8d2-4827-80f9-500879ff3b48');

insert into lab (name, tagline, story, url, source_url, made, published) values
  ('keymash',
   'a keyboard toy for very small humans.',
   'my toddler kept trying to use my keyboard, so I made the keyboard do something.',
   'https://keymash.netlify.app',
   'https://github.com/luisrrv/keymash',
   '2026-10-01',
   true);
