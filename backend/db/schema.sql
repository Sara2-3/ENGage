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
