-- smoke test: creates and drops a temp table
CREATE TABLE IF NOT EXISTS _migration_check (id SERIAL PRIMARY KEY);
DROP TABLE IF EXISTS _migration_check;
