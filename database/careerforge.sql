CREATE DATABASE IF NOT EXISTS careerforge
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE careerforge;

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  public_uuid CHAR(36) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
  status ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE student_profiles (
  user_id BIGINT UNSIGNED PRIMARY KEY,
  university VARCHAR(180) NULL,
  degree VARCHAR(180) NULL,
  graduation_year SMALLINT UNSIGNED NULL,
  experience_years TINYINT UNSIGNED NULL,
  target_role VARCHAR(180) NULL,
  location VARCHAR(180) NULL,
  bio TEXT NULL,
  skills TEXT NULL,
  hobbies TEXT NULL,
  profile_photo_url VARCHAR(500) NULL,
  career_interests JSON NULL,
  profile_visibility ENUM('private', 'admin_only', 'public') NOT NULL DEFAULT 'private',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE skills (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(120) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_skills_name (name)
) ENGINE=InnoDB;

CREATE TABLE user_skills (
  user_id BIGINT UNSIGNED NOT NULL,
  skill_id BIGINT UNSIGNED NOT NULL,
  proficiency_level TINYINT UNSIGNED NOT NULL DEFAULT 1,
  evidence TEXT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, skill_id),
  CONSTRAINT fk_user_skills_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_skills_skill FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE companies (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  website VARCHAR(500) NULL,
  location VARCHAR(180) NULL,
  description TEXT NULL,
  logo_url VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_companies_name (name)
) ENGINE=InnoDB;

CREATE TABLE jobs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  public_uuid CHAR(36) NOT NULL UNIQUE,
  company_id BIGINT UNSIGNED NOT NULL,
  created_by BIGINT UNSIGNED NULL,
  source VARCHAR(40) NULL,
  external_id VARCHAR(512) NULL,
  source_url VARCHAR(600) NULL,
  title VARCHAR(220) NOT NULL,
  location VARCHAR(500) NULL,
  employment_type ENUM('internship', 'part_time', 'full_time', 'contract') NOT NULL,
  work_mode ENUM('onsite', 'hybrid', 'remote') NOT NULL DEFAULT 'onsite',
  salary_text VARCHAR(120) NULL,
  description TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  min_experience_years TINYINT UNSIGNED NULL,
  max_experience_years TINYINT UNSIGNED NULL,
  source_published_at DATETIME NULL,
  last_verified_at DATETIME NULL,
  validation_status ENUM('unknown', 'valid', 'needs_review', 'invalid') NOT NULL DEFAULT 'unknown',
  normalized_role VARCHAR(180) NULL,
  extracted_skills TEXT NULL,
  nlp_status VARCHAR(30) NOT NULL DEFAULT 'pending',
  nlp_confidence DECIMAL(5,2) NULL,
  nlp_processed_at DATETIME NULL,
  status ENUM('draft', 'published', 'closed') NOT NULL DEFAULT 'draft',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_jobs_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_jobs_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_jobs_external_source (source, external_id),
  INDEX idx_jobs_visibility (status, expiry_date)
) ENGINE=InnoDB;

CREATE TABLE job_embeddings (
  job_id BIGINT UNSIGNED PRIMARY KEY,
  model VARCHAR(80) NOT NULL,
  dimensions INT UNSIGNED NOT NULL,
  vector_json LONGTEXT NOT NULL,
  content_hash CHAR(64) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  error_message VARCHAR(500) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_job_embeddings_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE profile_embeddings (
  user_id BIGINT UNSIGNED PRIMARY KEY,
  model VARCHAR(80) NOT NULL,
  dimensions INT UNSIGNED NOT NULL,
  vector_json LONGTEXT NOT NULL,
  content_hash CHAR(64) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  error_message VARCHAR(500) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_profile_embeddings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE job_skills (
  job_id BIGINT UNSIGNED NOT NULL,
  skill_id BIGINT UNSIGNED NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  weight DECIMAL(4,3) NOT NULL DEFAULT 1.000,
  PRIMARY KEY (job_id, skill_id),
  CONSTRAINT fk_job_skills_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_job_skills_skill FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE applications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  public_uuid CHAR(36) NOT NULL UNIQUE,
  user_id BIGINT UNSIGNED NOT NULL,
  job_id BIGINT UNSIGNED NOT NULL,
  status ENUM('submitted', 'under_review', 'shortlisted', 'rejected', 'cancelled') NOT NULL DEFAULT 'submitted',
  match_percentage DECIMAL(5,2) NULL,
  cover_letter TEXT NULL,
  cv_snapshot JSON NULL,
  match_explanation JSON NULL,
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_applications_user_job (user_id, job_id),
  CONSTRAINT fk_applications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_applications_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  INDEX idx_applications_status (status)
) ENGINE=InnoDB;

CREATE TABLE assessments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  created_by BIGINT UNSIGNED NULL,
  title VARCHAR(220) NOT NULL,
  description TEXT NULL,
  category VARCHAR(120) NOT NULL,
  difficulty ENUM('beginner', 'intermediate', 'advanced') NOT NULL,
  duration_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 15,
  passing_percentage DECIMAL(5,2) NOT NULL DEFAULT 60.00,
  status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_assessments_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE questions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  assessment_id BIGINT UNSIGNED NOT NULL,
  prompt TEXT NOT NULL,
  question_type ENUM('multiple_choice', 'numeric', 'code', 'scenario') NOT NULL DEFAULT 'multiple_choice',
  difficulty ENUM('beginner', 'intermediate', 'advanced') NOT NULL,
  correct_answer TEXT NULL,
  explanation TEXT NULL,
  points DECIMAL(7,2) NOT NULL DEFAULT 1.00,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT fk_questions_assessment FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE question_options (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question_id BIGINT UNSIGNED NOT NULL,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT fk_question_options_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE assessment_attempts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  assessment_id BIGINT UNSIGNED NOT NULL,
  status ENUM('started', 'submitted', 'expired') NOT NULL DEFAULT 'started',
  score DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  total_points DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,
  completed_at DATETIME NULL,
  CONSTRAINT fk_attempts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_attempts_assessment FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
  INDEX idx_attempts_user_assessment (user_id, assessment_id)
) ENGINE=InnoDB;

CREATE TABLE assessment_answers (
  attempt_id BIGINT UNSIGNED NOT NULL,
  question_id BIGINT UNSIGNED NOT NULL,
  selected_option_id BIGINT UNSIGNED NULL,
  answer_text TEXT NULL,
  is_correct BOOLEAN NULL,
  awarded_points DECIMAL(7,2) NOT NULL DEFAULT 0.00,
  answered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (attempt_id, question_id),
  CONSTRAINT fk_answers_attempt FOREIGN KEY (attempt_id) REFERENCES assessment_attempts(id) ON DELETE CASCADE,
  CONSTRAINT fk_answers_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  CONSTRAINT fk_answers_option FOREIGN KEY (selected_option_id) REFERENCES question_options(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Gemini-powered, student-owned progressive practice paths.
CREATE TABLE learning_paths (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  topic VARCHAR(180) NOT NULL,
  path_type ENUM('skill', 'job') NOT NULL,
  level_count TINYINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_learning_path_level_count CHECK (level_count BETWEEN 1 AND 50),
  CONSTRAINT fk_learning_paths_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_learning_paths_user (user_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE learning_levels (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  path_id BIGINT UNSIGNED NOT NULL,
  level_number TINYINT UNSIGNED NOT NULL,
  question_set TEXT NULL,
  CONSTRAINT fk_learning_levels_path FOREIGN KEY (path_id) REFERENCES learning_paths(id) ON DELETE CASCADE,
  CONSTRAINT uq_learning_level_number UNIQUE (path_id, level_number)
) ENGINE=InnoDB;

CREATE TABLE learning_attempts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  level_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  correct_answers TINYINT UNSIGNED NOT NULL,
  total_questions TINYINT UNSIGNED NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  passed BOOLEAN NOT NULL DEFAULT FALSE,
  answers TEXT NULL,
  completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_learning_attempts_level FOREIGN KEY (level_id) REFERENCES learning_levels(id) ON DELETE CASCADE,
  CONSTRAINT fk_learning_attempts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_learning_attempts_progress (user_id, level_id, passed)
) ENGINE=InnoDB;

CREATE TABLE resume_versions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  content JSON NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_resume_versions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE documents (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  resume_version_id BIGINT UNSIGNED NULL,
  file_name VARCHAR(255) NOT NULL,
  content_type VARCHAR(100) NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  file_size_bytes BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_documents_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_documents_resume FOREIGN KEY (resume_version_id) REFERENCES resume_versions(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE learning_resources (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  created_by BIGINT UNSIGNED NULL,
  title VARCHAR(220) NOT NULL,
  description TEXT NULL,
  category VARCHAR(120) NOT NULL,
  resource_type ENUM('article', 'video', 'course', 'pdf', 'template') NOT NULL,
  resource_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(600) NULL,
  provider_name VARCHAR(160) NULL,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  recommendation_note VARCHAR(300) NULL,
  estimated_minutes SMALLINT UNSIGNED NULL,
  status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_resources_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE resource_progress (
  user_id BIGINT UNSIGNED NOT NULL,
  resource_id BIGINT UNSIGNED NOT NULL,
  progress_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  completed_at DATETIME NULL,
  saved BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, resource_id),
  CONSTRAINT fk_resource_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_resource_progress_resource FOREIGN KEY (resource_id) REFERENCES learning_resources(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE community_posts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  content TEXT NOT NULL,
  media_url VARCHAR(500) NULL,
  status ENUM('visible', 'pending_review', 'removed') NOT NULL DEFAULT 'visible',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_posts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_posts_status_created (status, created_at)
) ENGINE=InnoDB;

CREATE TABLE comments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  content TEXT NOT NULL,
  status ENUM('visible', 'removed') NOT NULL DEFAULT 'visible',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comments_post FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE post_likes (
  post_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, user_id),
  CONSTRAINT fk_post_likes_post FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_post_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE moderation_audits (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  moderator_id BIGINT UNSIGNED NOT NULL,
  target_type ENUM('post', 'comment') NOT NULL,
  target_id BIGINT UNSIGNED NOT NULL,
  action ENUM('approved', 'removed') NOT NULL,
  reason VARCHAR(500) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_moderation_audits_moderator FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  created_by BIGINT UNSIGNED NULL,
  title VARCHAR(220) NOT NULL,
  description TEXT NULL,
  category VARCHAR(120) NOT NULL,
  location VARCHAR(220) NULL,
  event_url VARCHAR(500) NULL,
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NOT NULL,
  capacity INT UNSIGNED NULL,
  status ENUM('draft', 'published', 'cancelled') NOT NULL DEFAULT 'draft',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_events_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_events_status_starts (status, starts_at)
) ENGINE=InnoDB;

CREATE TABLE event_registrations (
  event_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  attended BOOLEAN NOT NULL DEFAULT FALSE,
  registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (event_id, user_id),
  CONSTRAINT fk_event_registrations_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_event_registrations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE achievements (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(80) NOT NULL,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(80) NULL,
  criteria JSON NOT NULL,
  status ENUM('active', 'archived') NOT NULL DEFAULT 'active',
  UNIQUE KEY uq_achievements_code (code)
) ENGINE=InnoDB;

CREATE TABLE user_achievements (
  user_id BIGINT UNSIGNED NOT NULL,
  achievement_id BIGINT UNSIGNED NOT NULL,
  progress DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  unlocked_at DATETIME NULL,
  PRIMARY KEY (user_id, achievement_id),
  CONSTRAINT fk_user_achievements_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_achievements_achievement FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_id BIGINT UNSIGNED NULL,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id VARCHAR(80) NULL,
  reason VARCHAR(500) NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_logs_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_logs_created_at (created_at)
) ENGINE=InnoDB;

CREATE TABLE platform_settings (
  setting_key VARCHAR(80) PRIMARY KEY,
  setting_value JSON NOT NULL,
  updated_by BIGINT UNSIGNED NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_platform_settings_user FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Private Community Chat (also kept in upgrade-community-chat.sql for existing databases).
CREATE TABLE student_connections (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_low_id BIGINT UNSIGNED NOT NULL,
  user_high_id BIGINT UNSIGNED NOT NULL,
  requested_by BIGINT UNSIGNED NOT NULL,
  status ENUM('pending', 'accepted') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_student_connection_pair UNIQUE (user_low_id, user_high_id),
  CONSTRAINT fk_connection_low_user FOREIGN KEY (user_low_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_connection_high_user FOREIGN KEY (user_high_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_connection_requester FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE student_messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  connection_id BIGINT UNSIGNED NOT NULL,
  sender_id BIGINT UNSIGNED NOT NULL,
  content VARCHAR(2000) NOT NULL,
  read_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_message_connection FOREIGN KEY (connection_id) REFERENCES student_connections(id) ON DELETE CASCADE,
  CONSTRAINT fk_message_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_messages_connection_created (connection_id, created_at)
) ENGINE=InnoDB;
