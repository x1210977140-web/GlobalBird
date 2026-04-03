CREATE SCHEMA IF NOT EXISTS gbs;

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS gbs.download (
  download_key      TEXT PRIMARY KEY,
  predicate_json    JSONB NOT NULL,
  format            TEXT NOT NULL,
  status            TEXT NOT NULL,
  doi               TEXT,
  download_url      TEXT,
  requested_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at       TIMESTAMPTZ,
  raw_response_json JSONB
);

CREATE INDEX IF NOT EXISTS idx_download_status
ON gbs.download(status);

CREATE TABLE IF NOT EXISTS gbs.species (
  species_key       BIGINT PRIMARY KEY,
  scientific_name   TEXT NOT NULL,
  canonical_name    TEXT,
  rank              TEXT,
  kingdom           TEXT,
  phylum            TEXT,
  class             TEXT,
  "order"           TEXT,
  family            TEXT,
  genus             TEXT,
  vernacular_zh     TEXT,
  gbif_last_sync_at TIMESTAMPTZ,
  raw_json          JSONB
);

CREATE INDEX IF NOT EXISTS idx_species_name_trgm
ON gbs.species USING GIN (scientific_name gin_trgm_ops);

CREATE TABLE IF NOT EXISTS gbs.occurrence_staging (
  download_key TEXT NOT NULL,
  row_json     JSONB NOT NULL,
  ingested_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gbs.occurrence (
  gbif_id           BIGINT PRIMARY KEY,
  dataset_key       UUID,
  species_key       BIGINT,
  occurrence_id     TEXT,
  basis_of_record   TEXT,
  country_code      TEXT,
  event_date        DATE,
  year              INT,
  month             INT,
  decimal_latitude  DOUBLE PRECISION,
  decimal_longitude DOUBLE PRECISION,
  geom              geometry(Point, 4326) NOT NULL,
  h3_r8             TEXT,
  h3_r7             TEXT,
  license           TEXT,
  rights_holder     TEXT,
  publisher         TEXT,
  issues            TEXT,
  raw_json          JSONB
);

CREATE INDEX IF NOT EXISTS idx_occurrence_geom_gist
ON gbs.occurrence USING GIST (geom);

CREATE INDEX IF NOT EXISTS idx_occurrence_h3_r8
ON gbs.occurrence (h3_r8);

CREATE INDEX IF NOT EXISTS idx_occurrence_h3_r7
ON gbs.occurrence (h3_r7);

CREATE INDEX IF NOT EXISTS idx_occurrence_species_key
ON gbs.occurrence (species_key);

CREATE INDEX IF NOT EXISTS idx_occurrence_event_date
ON gbs.occurrence (event_date);

CREATE TABLE IF NOT EXISTS gbs.h3_index (
  h3_res        INT NOT NULL,
  h3_id         TEXT NOT NULL,
  center_lat    DOUBLE PRECISION NOT NULL,
  center_lon    DOUBLE PRECISION NOT NULL,
  center_geom   geometry(Point, 4326) NOT NULL,
  boundary_geom geometry(Polygon, 4326),
  PRIMARY KEY (h3_res, h3_id)
);

CREATE INDEX IF NOT EXISTS idx_h3_index_center_gist
ON gbs.h3_index USING GIST(center_geom);

CREATE TABLE IF NOT EXISTS gbs.h3_agg (
  h3_res           INT NOT NULL,
  h3_id            TEXT NOT NULL,
  occurrence_count BIGINT NOT NULL,
  species_count    BIGINT NOT NULL,
  top_species      JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (h3_res, h3_id)
);

CREATE INDEX IF NOT EXISTS idx_h3_agg_updated_at
ON gbs.h3_agg(updated_at);
