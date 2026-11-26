UPDATE collected_stories
SET content = json_remove(content, '$.url')
WHERE json_type(content, '$.url') IS NOT NULL;

ALTER TABLE collected_stories ADD COLUMN published_on TEXT
  GENERATED ALWAYS AS (json_extract(content, '$.publishedOn')) VIRTUAL;

CREATE INDEX collected_stories_by_publication ON collected_stories (published_on DESC);

ALTER TABLE collected_stories ADD COLUMN translation_needed INTEGER CHECK (translation_needed IN (0, 1));

UPDATE collected_stories SET translation_needed = 0
WHERE json_type(content, '$.translation') IS NOT NULL;

CREATE INDEX collected_stories_pending_translation ON collected_stories (published_on DESC)
WHERE translation_needed IS NOT 0;

UPDATE library_items
SET content = json_remove(content, '$.url')
WHERE json_type(content, '$.url') IS NOT NULL;
