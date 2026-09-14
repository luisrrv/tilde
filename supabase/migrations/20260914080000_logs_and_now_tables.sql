-- tilde — V1 tables (blueprint.md §11), DDL verbatim.
-- `links` is deliberately not created here — it is a "Later" feature
-- (§16) and §11's own rule is not to add tables preemptively.

create table logs (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text,
  body        text not null,
  tags        text[] not null default '{}',
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table now (
  id          uuid primary key default gen_random_uuid(),
  key         text        not null unique,
  value       text        not null default '',
  sort_order  int         not null,
  updated_at  timestamptz not null default now()
);
