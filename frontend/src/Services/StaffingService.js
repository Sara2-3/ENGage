import { api } from './http';

// GET ALL
export const get_staffing_service = () => api('/staffing');

// CREATE a request to HR
export const create_request_service = (data) => api('/staffing', data);

export const assign_project_service = (data) => api('/staffing/assign', data);

export const hire_service = (id, data) => api(`/staffing/${id}/hire`, data);

export const fill_service = (id, data) => api(`/staffing/${id}/fill`, data);
