// API Service for EmotiCare Frontend
const API_BASE_URL = 'http://localhost:8000/api/v1';

// Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'counselor' | 'admin';
  is_active: boolean;
  student_id?: string;
  department?: string;
  year_of_study?: 'first_year' | 'second_year' | 'third_year' | 'fourth_year' | 'postgraduate' | 'phd';
  gender?: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
  age?: number;
  phone_number?: string;
  emergency_contact?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  role: 'student' | 'counselor' | 'admin';
  student_id?: string;
  department?: string;
  year_of_study?: 'first_year' | 'second_year' | 'third_year' | 'fourth_year' | 'postgraduate' | 'phd';
  gender?: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
  age?: number;
  phone_number?: string;
  emergency_contact?: string;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  timestamp: string;
  emotional_analysis?: {
    requires_intervention: boolean;
    emotional_support_level: string;
    suggested_resources: string[];
  };
}

export interface ChatSession {
  id: string;
  user_id: string;
  messages: ChatMessage[];
  session_type: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface ChatResponse {
  message: string;
  requires_intervention: boolean;
  emotional_support_level: string;
  suggested_resources: string[];
  session_id: string;
}

export interface EmergencyResource {
  name: string;
  number?: string;
  available?: string;
  languages?: string[];
  url?: string;
  description?: string;
}

export interface CrisisResources {
  crisis_hotlines: EmergencyResource[];
  online_resources?: EmergencyResource[];
  immediate_coping?: string[];
  mental_health_centers?: EmergencyResource[];
  emergency_services?: EmergencyResource[];
}

// API Service Class
class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('access_token');
  }

  // Token management
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('access_token', token);
  }

  getToken(): string | null {
    return this.token || localStorage.getItem('access_token');
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('access_token');
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add authorization header if token exists
    if (this.getToken()) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${this.getToken()}`,
      };
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({
          detail: `HTTP ${response.status}: ${response.statusText}`,
          status_code: response.status,
        }));
        throw new Error(errorData.detail);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // Authentication methods
  async login(email: string, password: string): Promise<LoginResponse> {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({
        detail: 'Login failed',
        status_code: response.status,
      }));
      throw new Error(errorData.detail);
    }

    const data: LoginResponse = await response.json();
    this.setToken(data.access_token);
    return data;
  }

  async register(userData: RegisterData): Promise<User> {
    return this.request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async updateCurrentUser(userData: Partial<User>): Promise<User> {
    return this.request<User>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
  }

  async logout(): Promise<{ message: string }> {
    const response = await this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
    this.clearToken();
    return response;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; app_name: string; version: string }> {
    const response = await fetch(`${this.baseURL.replace('/api/v1', '')}/health`);
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return response.json();
  }

  // Chat API methods
  async startChatSession(initialMessage: string, emotionalState?: string) {
    const requestBody: any = {
      initial_message: initialMessage,
    };
    
    // Only include emotional_state if it's a valid value
    if (emotionalState && ['very_distressed', 'distressed', 'neutral', 'calm', 'positive'].includes(emotionalState)) {
      requestBody.emotional_state = emotionalState;
    }
    
    return this.request('/chat/start-session', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }

  async sendChatMessage(sessionId: string, message: string) {
    return this.request(`/chat/sessions/${sessionId}/message`, {
      method: 'POST',
      body: JSON.stringify({
        message_content: message,
      }),
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

  async getEmergencyResources(): Promise<CrisisResources> {
    return this.request('/chat/emergency-resources');
  }

  // Assessment API methods
  async createAssessment(assessmentType: string, responses: Record<string, any>, notes?: string) {
    return this.request('/assessments', {
      method: 'POST',
      body: JSON.stringify({
        assessment_type: assessmentType,
        responses,
        notes,
      }),
    });
  }

  async getUserAssessments() {
    return this.request('/assessments');
  }

  async getAssessment(assessmentId: string) {
    return this.request(`/assessments/${assessmentId}`);
  }

  async getAssessmentTypes() {
    return this.request('/assessments/types/available');
  }

  async getAssessmentQuestions(assessmentType: string) {
    return this.request(`/assessments/questions/${assessmentType}`);
  }

  // Appointment API methods
  async bookAppointment(bookingData: {
    counselor_id: string;
    appointment_date: string;
    start_time: string;
    end_time: string;
    appointment_type: string;
    mode: string;
    reason: string;
    urgency_level: string;
    notes?: string;
  }) {
    return this.request('/appointments/book', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async getAvailableSlots(counselorId?: string, date?: string) {
    const params = new URLSearchParams();
    if (counselorId) params.append('counselor_id', counselorId);
    if (date) params.append('date', date);

    return this.request(`/appointments/available-slots?${params.toString()}`);
  }

  async getMyAppointments() {
    return this.request('/appointments/my-appointments');
  }

  async updateAppointment(appointmentId: string, updateData: any) {
    return this.request(`/appointments/${appointmentId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async cancelAppointment(appointmentId: string) {
    return this.request(`/appointments/${appointmentId}`, {
      method: 'DELETE',
    });
  }

  async getCounselors() {
    return this.request('/appointments/counselors');
  }

  // Counselor-specific appointment methods
  async getCounselorAppointments() {
    return this.request('/appointments/counselor/appointments');
  }

  async updateCounselorAvailability(availabilityData: any) {
    return this.request('/appointments/counselor/availability', {
      method: 'PUT',
      body: JSON.stringify(availabilityData),
    });
  }

  // Additional Assessment methods
  async getAssessmentSummary() {
    return this.request('/assessments/summary/dashboard');
  }

  async getHighRiskAssessments() {
    return this.request('/assessments/admin/high-risk');
  }

  // Admin API methods
  async getDashboardMetrics() {
    return this.request('/admin/dashboard');
  }

  async getUserAnalytics() {
    return this.request('/admin/users/analytics');
  }

  async getCrisisAlerts() {
    return this.request('/admin/alerts/crisis');
  }

  async resolveCrisisAlert(alertId: string, resolutionNotes: string) {
    return this.request(`/admin/alerts/${alertId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({
        resolution_notes: resolutionNotes,
      }),
    });
  }

  // Additional Admin methods
  async getAssessmentTrends() {
    return this.request('/admin/trends/assessments');
  }

  async getInstitutionReport() {
    return this.request('/admin/reports/institution');
  }

  async getAnonymizedUserData() {
    return this.request('/admin/users/anonymized');
  }

  async createInterventionPlan(planData: any) {
    return this.request('/admin/interventions/plan', {
      method: 'POST',
      body: JSON.stringify(planData),
    });
  }

  async getEmotionalInsights(userId: string) {
    return this.request(`/admin/emotional-insights/${userId}`);
  }

  async getNotifications() {
    return this.request('/admin/notifications');
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request(`/admin/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  // Peer Support API methods
  async getPeerSupportPosts() {
    return this.request('/peer-support/posts');
  }

  async createPeerSupportPost(postData: {
    title: string;
    content: string;
    category?: string;
    tags?: string[];
    is_anonymous?: boolean;
  }) {
    return this.request('/peer-support/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  // Resources API methods
  // Resources API methods
  async getResources(params?: {
    category?: string;
    resource_type?: string;
    language?: string;
    difficulty_level?: number;
    is_premium?: boolean;
    skip?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const queryString = searchParams.toString();
    return this.request(`/resources${queryString ? `?${queryString}` : ''}`);
  }

  async getResourceCategories() {
    return this.request('/resources/categories');
  }

  async getResourceTypes() {
    return this.request('/resources/types');
  }

  async getRecommendedResources(limit = 10) {
    return this.request(`/resources/recommended?limit=${limit}`);
  }

  async getResource(resourceId: string) {
    return this.request(`/resources/${resourceId}`);
  }

  async createResource(resourceData: {
    title: string;
    description: string;
    resource_type: string;
    category: string;
    language: string;
    content_url?: string;
    file_path?: string;
    duration_minutes?: number;
    difficulty_level: number;
    tags?: string[];
    is_premium: boolean;
  }) {
    return this.request('/resources', {
      method: 'POST',
      body: JSON.stringify(resourceData),
    });
  }

  async uploadResourceFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.request('/resources/upload-file', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
        // Don't set Content-Type header, let browser set it for FormData
      },
    });
  }

  async updateResource(resourceId: string, resourceData: {
    title?: string;
    description?: string;
    category?: string;
    content_url?: string;
    file_path?: string;
    duration_minutes?: number;
    difficulty_level?: number;
    tags?: string[];
    is_active?: boolean;
  }) {
    return this.request(`/resources/${resourceId}`, {
      method: 'PUT',
      body: JSON.stringify(resourceData),
    });
  }

  async deleteResource(resourceId: string) {
    return this.request(`/resources/${resourceId}`, {
      method: 'DELETE',
    });
  }

  async rateResource(resourceId: string, rating: number, review?: string) {
    return this.request(`/resources/${resourceId}/rate`, {
      method: 'POST',
      body: JSON.stringify({
        resource_id: resourceId,
        rating,
        review,
      }),
    });
  }

  async markResourceComplete(resourceId: string) {
    return this.request(`/resources/${resourceId}/complete`, {
      method: 'POST',
    });
  }

  async getUserResourceProgress() {
    return this.request('/resources/user/progress');
  }

  async searchResources(query: string, limit = 20) {
    return this.request(`/resources/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  }

  // Voice Chat API methods
  async getVoiceChatStatus() {
    return this.request('/voice-chat/status');
  }

  // Posts API methods
  async createPost(postData: {
    title?: string;
    content: string;
    post_type?: string;
    image_url?: string;
    image_alt_text?: string;
    video_url?: string;
    link_url?: string;
    link_title?: string;
    link_description?: string;
    hashtags?: string[];
    mentions?: string[];
    visibility?: string;
    allow_comments?: boolean;
    allow_shares?: boolean;
    is_anonymous?: boolean;
    location?: string;
  }) {
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  async uploadPostImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.request('/posts/upload-image', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
        // Don't set Content-Type header, let browser set it for FormData
      },
    });
  }

  async getPostFeed(params: {
    limit?: number;
    offset?: number;
    feed_type?: 'public' | 'following' | 'trending';
  } = {}) {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    if (params.feed_type) queryParams.append('feed_type', params.feed_type);
    
    const queryString = queryParams.toString();
    return this.request(`/posts/feed${queryString ? `?${queryString}` : ''}`);
  }

  async searchPosts(params: {
    q?: string;
    hashtags?: string;
    author_id?: string;
    post_type?: string;
    location?: string;
    sort_by?: string;
    sort_order?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    const queryString = queryParams.toString();
    return this.request(`/posts/search${queryString ? `?${queryString}` : ''}`);
  }

  async getTrendingHashtags(limit = 10) {
    return this.request(`/posts/hashtags/trending?limit=${limit}`);
  }

  async getPost(postId: string) {
    return this.request(`/posts/${postId}`);
  }

  async updatePost(postId: string, updateData: {
    title?: string;
    content?: string;
    image_url?: string;
    image_alt_text?: string;
    video_url?: string;
    link_url?: string;
    link_title?: string;
    link_description?: string;
    hashtags?: string[];
    mentions?: string[];
    visibility?: string;
    allow_comments?: boolean;
    allow_shares?: boolean;
    location?: string;
    status?: string;
  }) {
    return this.request(`/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deletePost(postId: string) {
    return this.request(`/posts/${postId}`, {
      method: 'DELETE',
    });
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

  async getUserPosts(userId?: string, params: {
    limit?: number;
    offset?: number;
  } = {}) {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    if (userId) queryParams.append('author_id', userId);
    
    const queryString = queryParams.toString();
    return this.request(`/posts/search${queryString ? `?${queryString}` : ''}`);
  }

  async getUserBookmarks(params: {
    limit?: number;
    offset?: number;
  } = {}) {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    
    const queryString = queryParams.toString();
    return this.request(`/posts/bookmarks${queryString ? `?${queryString}` : ''}`);
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getUserRole(): 'student' | 'counselor' | 'admin' | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      // Decode JWT token to get user role (simplified)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || null;
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;