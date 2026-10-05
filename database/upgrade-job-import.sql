USE careerforge;

-- Fields used to retain a traceable external job source and prevent duplicate imports.
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS source VARCHAR(40) NULL AFTER created_by;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS external_id VARCHAR(100) NULL AFTER source;
ALTER TABLE jobs MODIFY COLUMN external_id VARCHAR(512) NULL;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS source_url VARCHAR(600) NULL AFTER external_id;
ALTER TABLE jobs ADD UNIQUE KEY uq_jobs_external_source (source, external_id);
