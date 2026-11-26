CREATE TABLE channel_videos (
  channel_url TEXT NOT NULL REFERENCES library_items(url) ON DELETE CASCADE,
  url TEXT NOT NULL,
  content TEXT NOT NULL CHECK (json_valid(content)),
  expires_at INTEGER,
  PRIMARY KEY (channel_url, url)
) STRICT;
