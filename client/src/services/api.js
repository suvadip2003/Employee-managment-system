import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  register: (data) =>
    api.post('/auth/register', data),
  getMe: () =>
    api.get('/auth/me'),
};

// Attendance services
export const attendanceService = {
  checkIn: () =>
    api.post('/attendance/checkin'),
  checkOut: () =>
    api.put('/attendance/checkout'),
  getMyAttendance: (params = {}) =>
    api.get('/attendance/my', { params }),
  getTodayAttendance: () =>
    api.get('/attendance/today'),
};

// Leave services
export const leaveService = {
  createLeave: (data) =>
    api.post('/leave', data),
  getMyLeaves: () =>
    api.get('/leave/my'),
  getLeaveBalance: () =>
    api.get('/leave/balance'),
};

// HR services
export const hrService = {
  getEmployees: (params = {}) =>
    api.get('/hr/employees', { params }),
  getEmployee: (id) =>
    api.get(`/hr/employees/${id}`),
  updateEmployee: (id, data) =>
    api.put(`/hr/employees/${id}`, data),
  getAllAttendance: (params = {}) =>
    api.get('/hr/attendance', { params }),
  getAttendanceStats: () =>
    api.get('/hr/attendance/stats'),
  getAllLeaves: (params = {}) =>
    api.get('/hr/leaves', { params }),
  reviewLeave: (id, data) =>
    api.put(`/hr/leaves/${id}/review`, data),
};

export default api;
