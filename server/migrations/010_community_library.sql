ALTER TABLE feed_sources ADD COLUMN library_kind TEXT
  CHECK (library_kind IS NULL OR (library_kind = 'COMMUNITY' AND market = 'CHINA' AND purpose = 'LIBRARY'));

ALTER TABLE library_items ADD COLUMN translation_needed INTEGER CHECK (translation_needed IN (0, 1));
