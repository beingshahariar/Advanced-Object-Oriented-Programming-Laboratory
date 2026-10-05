-- JSearch job IDs are opaque strings and can exceed the original 100-character limit.
ALTER TABLE jobs MODIFY COLUMN external_id VARCHAR(512) NULL;
