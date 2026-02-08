
export interface User {
  id: string;
  phoneNumber: string;
  fullName?: string;
  email?: string;
  profilePhotoUrl?: string;
  userType?: 'Passenger' | 'Driver';
  homeCity?: string;
  verificationLevel: 'PhoneVerified' | 'IDUploaded' | 'FullyVerified';
  createdAt: string;
}

export interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  error: string | null;
}

export interface OTPResponse {
  success: boolean;
  message: string;
  expiresIn?: number;
}

export interface VerifyOTPResponse {
  success: boolean;
  token: string;
  user: User;
}
