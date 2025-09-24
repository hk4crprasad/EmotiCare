export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  student_id?: string;
  phone_number?: string;
  created_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  full_name: string;
  password: string;
  role: string;
  student_id: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface ChatSession {
  id: string;
  user_id: string;
  messages: ChatMessage[];
  status: string;
  emotional_state: string;
  created_at: string;
  message_count: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface Assessment {
  id: string;
  user_id: string;
  assessment_type: string;
  responses: Record<string, number>;
  score: number;
  interpretation: string;
  recommendations: string[];
  completed_at: string;
}

export interface AssessmentType {
  type: string;
  name: string;
  description: string;
  questions: AssessmentQuestion[];
}

export interface AssessmentQuestion {
  id: string;
  text: string;
  options: string[];
}

export interface Appointment {
  id: string;
  counselor_id: string;
  counselor_name: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  appointment_type: string;
  mode: string;
  reason: string;
  status: string;
  urgency_level?: string;
}

export interface Counselor {
  id: string;
  name: string;
  specialization: string;
  rating: number;
  available_today: boolean;
}

export interface Resource {
  id: string;
  title: string;
  type: string;
  category: string;
  content?: string;
  description?: string;
  rating: number;
  duration?: string;
  url?: string;
}

export interface EmergencyResource {
  name: string;
  number: string;
  available_24_7: boolean;
  description?: string;
}
