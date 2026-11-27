-- The wins_set_local_date trigger always sets local_date from the author's
-- timezone. This default never wins over it; it only marks the column as
-- optional on insert, so generated types don't ask the app to send it.
alter table public.wins alter column local_date set default current_date;
