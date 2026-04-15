CREATE TABLE IF NOT EXISTS prs (
  number        INTEGER PRIMARY KEY,
  title         TEXT    NOT NULL,
  url           TEXT    NOT NULL,
  author        TEXT    NOT NULL,
  state         TEXT    NOT NULL,
  merged        INTEGER NOT NULL,
  merge_sha     TEXT,
  head_sha      TEXT    NOT NULL,
  created_at    TEXT    NOT NULL,
  updated_at    TEXT    NOT NULL,
  merged_at     TEXT,
  review_state  TEXT    NOT NULL,
  ci_state      TEXT    NOT NULL,
  column_key    TEXT    NOT NULL,
  raw_json      TEXT    NOT NULL
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS prs_col_updated ON prs (column_key, updated_at DESC);

CREATE TABLE IF NOT EXISTS sync_meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
