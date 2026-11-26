import { api, API_URL } from './http';

// GET ALL, with everything the dashboards show
export const get_cases_overview_service = () => api('/cases/overview');

// GET BY ID
export const get_case_service = (id) => api(`/cases/${id}`);

// CREATE
export const create_case_service = (data) => api('/cases', data);

// One workflow record: access, task, review, report...
export const add_record_service = (id, data) => api(`/cases/${id}/events`, data);

export const advice_service = (id) => api(`/cases/${id}/advice`, {});

export const review_draft_service = (id, data) => api(`/cases/${id}/reviews`, data);

// CV
export const cvUrl = (caseId, role) => `${API_URL}/cases/${caseId}/cv?role=${role}`;

export async function uploadCv(caseId, file) {
  const res = await fetch(cvUrl(caseId, 'HR'), { method: 'POST', headers: { 'Content-Type': 'application/pdf' }, body: file });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? `Upload failed (${res.status})`);
}
