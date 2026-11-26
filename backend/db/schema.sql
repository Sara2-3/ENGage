CREATE TABLE IF NOT EXISTS onboarding_cases (
  case_id TEXT PRIMARY KEY,
  employee_name TEXT NOT NULL,
  project_name TEXT NOT NULL,
  reported_status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS onboarding_evidence (
  case_id TEXT NOT NULL REFERENCES onboarding_cases(case_id) ON DELETE CASCADE,
  source_id TEXT NOT NULL,
  author_role TEXT NOT NULL,
  source_date DATE NOT NULL,
  original_text TEXT NOT NULL,
  PRIMARY KEY (case_id, source_id)
);

CREATE TABLE IF NOT EXISTS follow_up_tasks (
  task_id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES onboarding_cases(case_id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  description TEXT NOT NULL,
  assignee_role TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS one_open_technical_review_per_case
  ON follow_up_tasks (case_id)
  WHERE task_type = 'Technical Review' AND status = 'Open';
