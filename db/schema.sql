-- The API creates this table automatically on first use.
-- This file is here for reference, or if you prefer to run it yourself:
--   turso db shell tarot-table < db/schema.sql
CREATE TABLE IF NOT EXISTS readings (
  id          TEXT PRIMARY KEY,
  created_at  INTEGER NOT NULL,
  spread_id   TEXT NOT NULL,
  spread_name TEXT NOT NULL,
  question    TEXT NOT NULL DEFAULT '',
  notes       TEXT NOT NULL DEFAULT '',
  cards       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS readings_created_idx ON readings (created_at DESC);
