export interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin";
}

export interface Ride {
  id: number;
  destination: string;
  pickup_location: string;
  time_window_start: string;
  time_window_end: string;
  date: string;
  max_seats: number;
  current_seats: number;
  creator_id: number;
  creator_name: string;
  creator_email: string;
  status: "active" | "full" | "completed" | "cancelled";
  notes?: string;
  participants: RideParticipant[];
  messages?: ChatMessage[];
}

export interface RideParticipant {
  id: number;
  name: string;
  email: string;
  joined_at: string;
}

export interface ChatMessage {
  id: number;
  message: string;
  user_name: string;
  user_id: number;
  created_at: string;
  ride_id: number;
}

export interface ApiResponse<T> {
  message: string;
  data?: T;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RideFormData {
  destination: string;
  pickupLocation?: string;
  timeWindowStart: string;
  timeWindowEnd: string;
  date: string;
  maxSeats: number;
  notes?: string;
}
