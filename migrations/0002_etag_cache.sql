CREATE TABLE IF NOT EXISTS etag_cache (
  key        TEXT PRIMARY KEY,
  etag       TEXT NOT NULL,
  body       TEXT NOT NULL,
  updated_at TEXT NOT NULL
) WITHOUT ROWID;
