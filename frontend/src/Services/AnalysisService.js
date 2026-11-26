import { api } from './http';

const url = (caseId) => `/onboarding/cases/${caseId}`;

export const get_follow_ups_service = (caseId) => api(`${url(caseId)}/follow-ups`);

export const analyze_service = (caseId) => api(`${url(caseId)}/analyze`, {});

export const create_follow_up_service = (caseId, data) => api(`${url(caseId)}/follow-ups`, data);
