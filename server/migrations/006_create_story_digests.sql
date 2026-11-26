CREATE TABLE story_digests (
  url TEXT PRIMARY KEY NOT NULL,
  content TEXT NOT NULL CHECK (json_valid(content))
) STRICT;
