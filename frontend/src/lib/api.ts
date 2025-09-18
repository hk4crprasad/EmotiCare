const API_BASE_URL = 'http://localhost:8000/api/v1';

class APIClient {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private getAuthHeadersForUpload() {
    const token = localStorage.getItem('token');
    return {
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  // Chat API
  async startChatSession(message: string, emotionalState: string) {
    return this.request('/chat/start-session', {
      method: 'POST',
      body: JSON.stringify({
        initial_message: message,
        emotional_state: emotionalState,
      }),
    });
  }

  async sendChatMessage(sessionId: string, message: string) {
    return this.request(`/chat/sessions/${sessionId}/message`, {
      method: 'POST',
      body: JSON.stringify({ message_content: message }),
    });
  }

  async getChatSessions() {
    return this.request('/chat/sessions');
  }

  async getChatSession(sessionId: string) {
    return this.request(`/chat/sessions/${sessionId}`);
  }

  async endChatSession(sessionId: string) {
    return this.request(`/chat/sessions/${sessionId}/end`, {
      method: 'POST',
    });
  }

  // Assessments API
  async getAvailableAssessments() {
    return this.request('/assessments/types/available');
  }

  async getAssessmentQuestions(assessmentType: string) {
    return this.request(`/assessments/questions/${assessmentType}`);
  }

  async submitAssessment(assessmentType: string, responses: any) {
    return this.request('/assessments/', {
      method: 'POST',
      body: JSON.stringify({
        assessment_type: assessmentType,
        responses,
      }),
    });
  }

  async getUserAssessments() {
    return this.request('/assessments/');
  }

  async getAssessmentDashboard() {
    return this.request('/assessments/summary/dashboard');
  }

  // Appointments API
  async getCounselors() {
    return this.request('/appointments/counselors');
  }

  async getAvailableSlots(counselorId: string, date: string) {
    return this.request(`/appointments/available-slots?counselor_id=${counselorId}&date=${date}`);
  }

  async bookAppointment(appointmentData: any) {
    return this.request('/appointments/book', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  }

  async getMyAppointments() {
    return this.request('/appointments/my-appointments');
  }

  async updateAppointment(appointmentId: string, updates: any) {
    return this.request(`/appointments/${appointmentId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Resources API
  async getResources() {
    return this.request('/resources/');
  }

  async getResourceCategories() {
    return this.request('/resources/categories');
  }

  async getRecommendedResources() {
    return this.request('/resources/recommended');
  }

  async getResource(resourceId: string) {
    return this.request(`/resources/${resourceId}`);
  }

  async rateResource(resourceId: string, rating: number) {
    return this.request(`/resources/${resourceId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating }),
    });
  }

  async markResourceComplete(resourceId: string) {
    return this.request(`/resources/${resourceId}/complete`, {
      method: 'POST',
    });
  }

  async searchResources(query: string, category?: string) {
    const params = new URLSearchParams({ q: query });
    if (category) params.append('category', category);
    return this.request(`/resources/search?${params}`);
  }

  async getResourceTypes() {
    return this.request('/resources/types');
  }

  async getUserProgress() {
    return this.request('/resources/user/progress');
  }

  async uploadResourceFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    const url = `${API_BASE_URL}/resources/upload-file`;
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeadersForUpload(),
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return response.json();
  }

  async createResource(resourceData: {
    title: string;
    description: string;
    resource_type: string;
    content_url?: string;
    author?: string;
    tags?: string[];
    difficulty_level?: string;
    estimated_duration?: number;
  }) {
    return this.request('/resources/', {
      method: 'POST',
      body: JSON.stringify(resourceData),
    });
  }

  // Posts API
  async getPosts(page = 1, limit = 10) {
    return this.request(`/posts/feed?page=${page}&limit=${limit}`);
  }

  async createPost(content: string, hashtags: string[], visibility = 'public') {
    return this.request('/posts/', {
      method: 'POST',
      body: JSON.stringify({ content, hashtags, visibility }),
    });
  }

  async createPostWithImage(postData: {
    title?: string;
    content: string;
    hashtags: string[];
    visibility?: string;
    image_url?: string;
    image_alt_text?: string;
    post_type?: string;
  }) {
    return this.request('/posts/', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  async uploadPostImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    const url = `${API_BASE_URL}/posts/upload-image`;
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeadersForUpload(),
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return response.json();
  }

  async likePost(postId: string) {
    return this.request(`/posts/${postId}/like`, {
      method: 'POST',
    });
  }

  async bookmarkPost(postId: string) {
    return this.request(`/posts/${postId}/bookmark`, {
      method: 'POST',
    });
  }

  async getTrendingHashtags() {
    return this.request('/posts/hashtags/trending');
  }

  // Peer Support API
  async getPeerSupportPosts() {
    return this.request('/peer-support/posts');
  }

  async createPeerSupportPost(content: string, anonymous = true) {
    return this.request('/peer-support/posts', {
      method: 'POST',
      body: JSON.stringify({ content, anonymous }),
    });
  }

  // Admin API
  async getAdminDashboard() {
    return this.request('/admin/dashboard');
  }

  async getCrisisAlerts() {
    return this.request('/admin/alerts/crisis');
  }

  async resolveCrisisAlert(alertId: string, resolution: string, followUpRequired = false) {
    return this.request(`/admin/alerts/${alertId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution, follow_up_required: followUpRequired }),
    });
  }

  async getUserAnalytics() {
    return this.request('/admin/users/analytics');
  }

  async getAssessmentTrends() {
    return this.request('/admin/trends/assessments');
  }
}

export const api = new APIClient();