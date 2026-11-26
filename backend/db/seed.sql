BEGIN;

INSERT INTO onboarding_cases (
  case_id,
  employee_name,
  project_name,
  reported_status
)
VALUES (
  'ONB-005',
  'Eva Stone',
  'Project Orion',
  'Ready with Support'
)
ON CONFLICT (case_id) DO UPDATE SET
  employee_name = EXCLUDED.employee_name,
  project_name = EXCLUDED.project_name,
  reported_status = EXCLUDED.reported_status;

INSERT INTO onboarding_evidence (
  case_id,
  source_id,
  author_role,
  source_date,
  original_text
)
VALUES
  (
    'ONB-005',
    'Email 3',
    'Technical Lead',
    '2026-10-13',
    'Eva completed the first training topics and can handle standard requests with occasional support. Two complex scenarios still need to be covered. The Technical Lead classifies her as Ready with Support.'
  ),
  (
    'ONB-005',
    'Email 4',
    'Line Manager',
    '2026-10-13',
    'From the local side everything looks complete and Eva is working independently. The Line Manager considers onboarding closed.'
  )
ON CONFLICT (case_id, source_id) DO UPDATE SET
  author_role = EXCLUDED.author_role,
  source_date = EXCLUDED.source_date,
  original_text = EXCLUDED.original_text;

DELETE FROM onboarding_evidence
WHERE case_id = 'ONB-005'
  AND source_id NOT IN ('Email 3', 'Email 4');

COMMIT;
