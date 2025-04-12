import { Request } from 'express';

// JWT Payload type
export interface JwtPayload {
  id: string;
  username: string;
  iat?: number;
  exp?: number;
}

// Extended Express Request
export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

// Common response types
export interface PaginationResponse {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// API Error response
export interface ApiError {
  message: string;
  error?: string;
  status: number;
}

// Repository types
export interface CreateRepositoryDto {
  name: string;
  description?: string;
  isPublic?: boolean;
  ownerType: 'user' | 'organization';
  orgId?: string;
}

export interface UpdateRepositoryDto {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

// Account types
export interface RegisterUserDto {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  bio?: string;
}

export interface LoginUserDto {
  email: string;
  password: string;
}

export interface UpdateProfileDto {
  bio?: string;
  email?: string;
  full_name?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

// Prompt types
export interface UpdatePromptDto {
  title?: string;
  description?: string;
  content?: string;
  metadata_json?: Record<string, any>;
  commitMessage?: string;
} 