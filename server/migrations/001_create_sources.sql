CREATE TABLE feed_sources (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
  feed_url TEXT NOT NULL CHECK (length(feed_url) BETWEEN 1 AND 2048),
  market TEXT NOT NULL CHECK (market IN ('GLOBAL', 'CHINA', 'VIETNAM')),
  purpose TEXT NOT NULL CHECK (purpose IN ('NEWS', 'LIBRARY')),
  enabled INTEGER NOT NULL CHECK (enabled IN (0, 1)),
  UNIQUE (feed_url, purpose)
) STRICT;
