/**
 * API Service
 * 
 * Centralized API client for communicating with the backend.
 * Automatically handles authentication tokens and error responses.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  total?: number;
  summary?: any;
}

/** Get stored auth token */
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('edunova_token');
}

/** Make an authenticated API request */
async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    return data;
  } catch (error: any) {
    // Handle network errors
    if (error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to server. Please check if the backend is running.');
    }
    throw error;
  }
}

// ============================================
// AUTH API
// ============================================

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getProfile: () => apiRequest('/auth/me'),

  register: (data: { email: string; password: string; name: string; role: string; schoolId?: string }) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ============================================
// SCHOOLS API
// ============================================

export const schoolsApi = {
  getAll: (params?: { search?: string; status?: string }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiRequest(`/schools${query}`);
  },

  getById: (id: string) => apiRequest(`/schools/${id}`),

  create: (data: any) =>
    apiRequest('/schools', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    apiRequest(`/schools/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiRequest(`/schools/${id}`, { method: 'DELETE' }),
};

// ============================================
// STAFF API
// ============================================

export const staffApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/staff${query}`);
  },

  getById: (id: string) => apiRequest(`/staff/${id}`),

  create: (data: any) =>
    apiRequest('/staff', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    apiRequest(`/staff/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiRequest(`/staff/${id}`, { method: 'DELETE' }),
};

// ============================================
// TIMETABLE API
// ============================================

export const timetableApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/timetable${query}`);
  },

  getTeacherTimetable: (teacherId: string) =>
    apiRequest(`/timetable/teacher/${teacherId}`),

  create: (data: any) =>
    apiRequest('/timetable', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    apiRequest(`/timetable/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiRequest(`/timetable/${id}`, { method: 'DELETE' }),

  bulkCreate: (entries: any[]) =>
    apiRequest('/timetable/bulk', { method: 'POST', body: JSON.stringify({ entries }) }),
};

// ============================================
// ATTENDANCE API
// ============================================

export const attendanceApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/attendance${query}`);
  },

  mark: (records: any[]) =>
    apiRequest('/attendance/mark', {
      method: 'POST',
      body: JSON.stringify({ records }),
    }),

  getSummary: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/attendance/summary${query}`);
  },
};

// ============================================
// ANALYTICS API
// ============================================

export const analyticsApi = {
  getDashboard: () => apiRequest('/analytics/dashboard'),
  getTeacherWorkload: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/analytics/teachers${query}`);
  },
};
