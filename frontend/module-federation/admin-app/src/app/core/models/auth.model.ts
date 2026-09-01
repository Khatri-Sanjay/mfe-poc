export interface LoginRequest {
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  path: string;
  requestId: string;
}

export interface AuthData {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresAt: string;
  user: User;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  emailVerified: boolean;
  roles: string[];
  permissions: string[];
  createdAt: string;
}
