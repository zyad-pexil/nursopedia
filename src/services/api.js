// API service for communicating with the backend
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL)
  ? import.meta.env.VITE_API_BASE_URL
  : (typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:5000/api');
export const API_ORIGIN = new URL(API_BASE_URL).origin;
export function resolveFileUrl(path) {
  if (!path) return path;
  if (typeof path !== 'string') return path;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_ORIGIN}${path}`;
}

class ApiService {
  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  // Helper method to make HTTP requests
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const isFormData = options && options.body instanceof FormData;
    const baseHeaders = isFormData ? {} : { 'Content-Type': 'application/json' };

    const config = {
      ...options,
      headers: {
        ...baseHeaders,
        ...(options.headers || {}),
      },
    };

    // Add authorization header if token exists
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      const contentType = response.headers.get('content-type') || '';
      let data = null;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // fallback: try text for HTML/error pages
        const text = await response.text();
        try { data = JSON.parse(text); } catch { data = { success: response.ok, message: text || '' }; }
      }
      if (!response.ok) {
        const msg = (data && (data.message || data.error || data.detail)) || `HTTP ${response.status}`;
        // Auto logout on session conflicts or invalid session
        const status = response.status;
        const m = (msg || '').toString();
        if (status === 401 || status === 409) {
          if (m.includes('تم تسجيل دخولك من جهاز آخر') || m.includes('هذا الحساب مسجل دخول') || m.includes('انتهت صلاحية الجلسة')) {
            try { await this.logout(); } catch (_) {}
          }
        }
        const err = new Error(m);
        err.status = status;
        err.data = data;
        throw err;
      }
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(username, password, captchaToken = null) {
    const payload = { username, password }
    if (captchaToken) payload.captcha_token = captchaToken
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (response.success) {
      this.token = response.token;
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  }

  async register(userData, captchaToken = null) {
    const payload = { ...userData }
    if (captchaToken) payload.captcha_token = captchaToken
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return response;
  }

  async uploadReceipt(userId, file) {
    const formData = new FormData();
    formData.append('receipt', file);
    formData.append('user_id', userId);

    const response = await this.request('/auth/upload-receipt', {
      method: 'POST',
      headers: {}, // Remove Content-Type to let browser set it for FormData
      body: formData,
    });

    return response;
  }

  async forgotPassword(email) {
    const response = await this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    return response;
  }

  async resetPassword(token, newPassword) {
    const response = await this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    });

    return response;
  }

  async verifyToken(token) {
    const response = await this.request('/auth/verify-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });

    return response;
  }

  // Academic data methods
  async getAcademicYears() {
    const response = await this.request('/auth/academic-years');
    return response;
  }

  async getSubjectsByYear(academicYearId) {
    const response = await this.request(`/auth/subjects/${academicYearId}`);
    return response;
  }

  // Content (student)
  async getUserSubjects() {
    return this.request('/content/subjects');
  }

  async getSubjectLessons(subjectId) {
    return this.request(`/content/subjects/${subjectId}/lessons`);
  }

  async getLessonDetails(lessonId) {
    return this.request(`/content/lessons/${lessonId}`);
  }

  async updateLessonProgress(lessonId, payload) {
    return this.request(`/content/lessons/${lessonId}/progress`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getSubjectExams(subjectId) {
    return this.request(`/content/subjects/${subjectId}/exams`);
  }

  async getExamDetails(examId) {
    return this.request(`/content/exams/${examId}`);
  }

  async submitExam(examId, answers) {
    return this.request(`/content/exams/${examId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  }

  // Profile & notifications
  async getProfile() {
    return this.request('/me/profile');
  }

  // Student: Add Subject flow
  async getAvailableSubjects() {
    return this.request('/me/available-subjects');
  }

  async createAddSubjectRequest(subjectId, file) {
    const fd = new FormData();
    fd.append('subject_id', subjectId);
    fd.append('receipt', file);
    return this.request('/me/add-subject-request', {
      method: 'POST',
      headers: {},
      body: fd,
    });
  }

  // Optional helper to send multiple add-subject requests sequentially
  async createAddSubjectRequests(subjectIds = [], file) {
    const results = [];
    for (const sid of subjectIds) {
      // eslint-disable-next-line no-await-in-loop
      const res = await this.createAddSubjectRequest(sid, file);
      results.push(res);
    }
    return results;
  }

  async getNotifications() {
    return this.request('/me/notifications');
  }

  async markNotificationRead(id) {
    return this.request(`/me/notifications/${id}/read`, { method: 'POST' });
  }
  async markNotificationUnread(id) {
    return this.request(`/me/notifications/${id}/unread`, { method: 'POST' });
  }
  async markAllNotificationsRead() {
    return this.request('/me/notifications/read-all', { method: 'POST' });
  }
  async deleteNotification(id) {
    return this.request(`/me/notifications/${id}`, { method: 'DELETE' });
  }
  async deleteAllNotifications() {
    return this.request('/me/notifications', { method: 'DELETE' });
  }
  async getUnreadNotificationsCount() {
    return this.request('/me/notifications/unread-count');
  }

  // Admin
  async getAdminStats() {
    return this.request('/admin/dashboard/stats');
  }

  async getSubscriptionRequests(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/admin/subscription-requests${qs ? `?${qs}` : ''}`);
  }

  async approveRequest(requestId, notes = '') {
    return this.request(`/admin/subscription-requests/${requestId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async rejectRequest(requestId, notes = '') {
    return this.request(`/admin/subscription-requests/${requestId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  // Admin: additional subject requests
  async getAdditionalSubjectRequests(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/admin/additional-subject-requests${qs ? `?${qs}` : ''}`);
  }
  async approveAdditionalSubjectRequest(id) {
    return this.request(`/admin/additional-subject-requests/${id}/approve`, { method: 'POST' });
  }
  async rejectAdditionalSubjectRequest(id, notes = '') {
    return this.request(`/admin/additional-subject-requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  // Admin Content
  async getAdminSubjects() {
    return this.request('/admin/subjects');
  }
  async createSubject(payload) {
    return this.request('/admin/subjects', { method: 'POST', body: JSON.stringify(payload) });
  }

  async getLessons(subjectId) {
    return this.request(`/admin/subjects/${subjectId}/lessons`);
  }
  async createLesson(payload) {
    return this.request('/admin/lessons', { method: 'POST', body: JSON.stringify(payload) });
  }
  async updateLesson(id, payload) {
    return this.request(`/admin/lessons/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  }
  async deleteLesson(id) {
    return this.request(`/admin/lessons/${id}`, { method: 'DELETE' });
  }

  async getExams(lessonId) {
    return this.request(`/admin/lessons/${lessonId}/exams`);
  }
  async createExam(payload) {
    return this.request('/admin/exams', { method: 'POST', body: JSON.stringify(payload) });
  }
  async updateExam(id, payload) {
    return this.request(`/admin/exams/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  }
  async deleteExam(id) {
    return this.request(`/admin/exams/${id}`, { method: 'DELETE' });
  }

  async getQuestions(examId) {
    return this.request(`/admin/exams/${examId}/questions`);
  }
  async createQuestion(payload) {
    return this.request('/admin/questions', { method: 'POST', body: JSON.stringify(payload) });
  }
  async updateQuestion(id, payload) {
    return this.request(`/admin/questions/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  }
  async deleteQuestion(id) {
    return this.request(`/admin/questions/${id}`, { method: 'DELETE' });
  }

  async createAnswer(payload) {
    return this.request('/admin/answers', { method: 'POST', body: JSON.stringify(payload) });
  }
  async updateAnswer(id, payload) {
    return this.request(`/admin/answers/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  }
  async deleteAnswer(id) {
    return this.request(`/admin/answers/${id}`, { method: 'DELETE' });
  }

  // Admin Users
  async getAdminUserProfile(userId) {
    return this.request(`/admin/users/${userId}/profile`)
  }

  // User methods
  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  async logout() {
    try {
      // Call backend to invalidate current session id
      await this.request('/auth/logout', { method: 'POST' });
    } catch (e) {
      // Even if server call fails, proceed with local cleanup
      console.warn('Logout API failed or session already invalid:', e?.message || e);
    }
    this.token = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  isAuthenticated() {
    return !!this.token;
  }
}

export default new ApiService();

