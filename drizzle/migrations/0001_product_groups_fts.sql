-- FTS5 virtual table for product search autocomplete
-- Indexes searchable text fields from the product_groups table
CREATE VIRTUAL TABLE IF NOT EXISTS product_groups_fts USING fts5(
  name,
  catalog,
  botanical_name,
  tags,
  common_names,
  short_description,
  quality_badge,
  content='product_groups',
  content_rowid='id'
);

-- Sync triggers: keep product_groups_fts in sync with product_groups table

CREATE TRIGGER IF NOT EXISTS product_groups_ai AFTER INSERT ON product_groups BEGIN
  INSERT INTO product_groups_fts(rowid, name, catalog, botanical_name, tags, common_names, short_description, quality_badge)
  VALUES (new.id, new.name, new.catalog, new.botanical_name, new.tags, new.common_names, new.short_description, new.quality_badge);
END;

CREATE TRIGGER IF NOT EXISTS product_groups_ad AFTER DELETE ON product_groups BEGIN
  INSERT INTO product_groups_fts(product_groups_fts, rowid, name, catalog, botanical_name, tags, common_names, short_description, quality_badge)
  VALUES ('delete', old.id, old.name, old.catalog, old.botanical_name, old.tags, old.common_names, old.short_description, old.quality_badge);
END;

CREATE TRIGGER IF NOT EXISTS product_groups_au AFTER UPDATE ON product_groups BEGIN
  INSERT INTO product_groups_fts(product_groups_fts, rowid, name, catalog, botanical_name, tags, common_names, short_description, quality_badge)
  VALUES ('delete', old.id, old.name, old.catalog, old.botanical_name, old.tags, old.common_names, old.short_description, old.quality_badge);
  INSERT INTO product_groups_fts(rowid, name, catalog, botanical_name, tags, common_names, short_description, quality_badge)
  VALUES (new.id, new.name, new.catalog, new.botanical_name, new.tags, new.common_names, new.short_description, new.quality_badge);
END;
