-- FTS5 virtual table for product search autocomplete
-- Indexes searchable text fields from the products table
CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(
  name,
  catalog,
  botanical_name,
  tags,
  common_names,
  short_description,
  quality_badge,
  content='products',
  content_rowid='id'
);

-- Sync triggers: keep products_fts in sync with products table

CREATE TRIGGER IF NOT EXISTS products_ai AFTER INSERT ON products BEGIN
  INSERT INTO products_fts(rowid, name, catalog, botanical_name, tags, common_names, short_description, quality_badge)
  VALUES (new.id, new.name, new.catalog, new.botanical_name, new.tags, new.common_names, new.short_description, new.quality_badge);
END;

CREATE TRIGGER IF NOT EXISTS products_ad AFTER DELETE ON products BEGIN
  INSERT INTO products_fts(products_fts, rowid, name, catalog, botanical_name, tags, common_names, short_description, quality_badge)
  VALUES ('delete', old.id, old.name, old.catalog, old.botanical_name, old.tags, old.common_names, old.short_description, old.quality_badge);
END;

CREATE TRIGGER IF NOT EXISTS products_au AFTER UPDATE ON products BEGIN
  INSERT INTO products_fts(products_fts, rowid, name, catalog, botanical_name, tags, common_names, short_description, quality_badge)
  VALUES ('delete', old.id, old.name, old.catalog, old.botanical_name, old.tags, old.common_names, old.short_description, old.quality_badge);
  INSERT INTO products_fts(rowid, name, catalog, botanical_name, tags, common_names, short_description, quality_badge)
  VALUES (new.id, new.name, new.catalog, new.botanical_name, new.tags, new.common_names, new.short_description, new.quality_badge);
END;
