import { queryClient } from './queryClient';
import { authStorage, getAuthHeaders } from './auth';

const API_BASE_URL = "http://localhost:8000" || window.location.origin;

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorText = await response.text();
    
    if (response.status === 401) {
      // Clear auth and redirect to login
      authStorage.clear();
      window.location.href = '/login';
    }
    
    throw new ApiError(
      errorText || response.statusText,
      response.status,
      response
    );
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return response.text();
}

export const api = {
  // Auth endpoints
  login: async (credentials: { username: string; password: string }) => {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      body: formData,
    });
    
    return handleResponse(response);
  },

  register: async (userData: {
    email: string;
    full_name: string;
    password: string;
    role: string;
    student_id: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    return handleResponse(response);
  },

  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  updateProfile: async (data: { full_name?: string; phone_number?: string }) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    
    return handleResponse(response);
  },

  changePassword: async (data: { current_password: string; new_password: string }) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    
    return handleResponse(response);
  },

  // Chat endpoints
  startChatSession: async (data: { initial_message: string; emotional_state?: string }) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/chat/start-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    
    return handleResponse(response);
  },

  sendChatMessage: async (sessionId: string, message: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/chat/sessions/${sessionId}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ message }),
    });
    
    return handleResponse(response);
  },

  getChatSessions: async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/chat/sessions`, {
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  getChatSession: async (sessionId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/chat/sessions/${sessionId}`, {
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  endChatSession: async (sessionId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/chat/sessions/${sessionId}/end`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  getEmergencyResources: async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/chat/emergency-resources`, {
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  // Assessment endpoints
  getAssessmentTypes: async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/assessments/types/available`, {
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  getAssessmentQuestions: async (assessmentType: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/assessments/questions/${assessmentType}`, {
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  submitAssessment: async (data: {
    assessment_type: string;
    responses: Record<string, number>;
  }) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/assessments/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    
    return handleResponse(response);
  },

  getAssessments: async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/assessments/`, {
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  getAssessment: async (assessmentId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/assessments/${assessmentId}`, {
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  // Appointment endpoints
  getCounselors: async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/appointments/counselors`, {
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  getAvailableSlots: async (counselorId: string, date: string) => {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/appointments/available-slots?counselor_id=${counselorId}&date=${date}`,
      {
        headers: getAuthHeaders(),
      }
    );
    
    return handleResponse(response);
  },

  bookAppointment: async (data: {
    counselor_id: string;
    appointment_date: string;
    start_time: string;
    end_time: string;
    appointment_type: string;
    mode: string;
    reason: string;
    urgency_level?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/appointments/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    
    return handleResponse(response);
  },

  getMyAppointments: async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/appointments/my-appointments`, {
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  updateAppointment: async (appointmentId: string, data: { status?: string; reason?: string }) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/appointments/${appointmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    
    return handleResponse(response);
  },

  cancelAppointment: async (appointmentId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/appointments/${appointmentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  // Resource endpoints
  getResources: async (category?: string, type?: string) => {
    let url = `${API_BASE_URL}/api/v1/resources/`;
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (type) params.append('type', type);
    if (params.toString()) url += `?${params.toString()}`;
    
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  getResource: async (resourceId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/resources/${resourceId}`, {
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  getResourceCategories: async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/resources/categories`, {
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  getResourceTypes: async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/resources/types`, {
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  getRecommendedResources: async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/resources/recommended`, {
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  rateResource: async (resourceId: string, rating: number) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/resources/${resourceId}/rate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ rating }),
    });
    
    return handleResponse(response);
  },

  completeResource: async (resourceId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/resources/${resourceId}/complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  searchResources: async (query: string, category?: string) => {
    let url = `${API_BASE_URL}/api/v1/resources/search?q=${encodeURIComponent(query)}`;
    if (category) url += `&category=${category}`;
    
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },
};
