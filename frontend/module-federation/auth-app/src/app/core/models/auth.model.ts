export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  emailVerified: boolean;
  roles: string[];
  permissions: string[];
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresAt: string;
}

export interface AuthResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: AuthTokens & { user: User };
  timestamp: string;
  path: string;
  requestId: string;
}

export interface ApiErrorResponse {
  success: boolean;
  statusCode: number;
  errorCode: string;
  message: string;
  errors?: Array<{ field: string; message: string }>;
  timestamp: string;
  path: string;
  requestId: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface MessageResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: { status: string };
  timestamp: string;
  path: string;
  requestId: string;
}
