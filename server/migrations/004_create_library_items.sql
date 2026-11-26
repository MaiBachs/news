CREATE TABLE library_items (
  url TEXT PRIMARY KEY NOT NULL,
  content TEXT NOT NULL CHECK (json_valid(content)),
  saved INTEGER NOT NULL DEFAULT 0 CHECK (saved IN (0, 1))
) STRICT;
