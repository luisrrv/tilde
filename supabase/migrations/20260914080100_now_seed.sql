-- Seed the five `now` fields with empty values (blueprint.md §11).
-- sort_order is seeded once, with gaps, and never touched again — the
-- admin defaults a new field to max + 10 later. No real content: the
-- values stay empty until Luis fills them in through /admin.

insert into now (key, value, sort_order) values
  ('status',    '', 10),
  ('listening', '', 20),
  ('playing',   '', 30),
  ('watching',  '', 40),
  ('learning',  '', 50);
