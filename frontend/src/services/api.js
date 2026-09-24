import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Attach stored JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const login       = (data) => api.post('/auth/login', data);
export const register    = (data) => api.post('/auth/register', data);
export const getProfile  = ()     => api.get('/auth/profile');

// ─── Employee Leaves ──────────────────────────────────────────────────────────
export const applyLeave      = (data) => api.post('/leaves/apply', data);
export const getMyLeaves     = ()     => api.get('/leaves/my-leaves');
export const getLeaveBalance = ()     => api.get('/leaves/balance');
export const cancelLeave     = (id)   => api.put(`/leaves/cancel/${id}`);

// ─── Admin ────────────────────────────────────────────────────────────────────
export const getAllLeaves      = (params) => api.get('/admin/leaves', { params });
export const reviewLeave      = (id, data) => api.put(`/admin/leaves/${id}`, data);
export const getAllEmployees   = ()     => api.get('/admin/employees');
export const getAdminStats    = ()     => api.get('/admin/stats');
export const updateEmployeeRole = (id, role) =>
  api.put(`/admin/employees/${id}/role`, { role });

export default api;
