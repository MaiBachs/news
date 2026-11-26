CREATE TABLE ranking_assessments (
  date TEXT PRIMARY KEY NOT NULL,
  content TEXT NOT NULL CHECK (json_valid(content))
) STRICT;
