// User interfaces
export interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  bio?: string;
  profile_image_id?: string;
  created_at?: string;
  updated_at?: string;
  profile_image?: {
    id: string;
    mime_type: string;
  };
}

export interface Account {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  user?: User;
}

// Organization interfaces
export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  members?: OrganizationMember[];
}

export interface OrganizationMember {
  userId: string;
  organizationId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  user?: User;
  organization?: Organization;
}

// Repository interfaces
export interface Repository {
  id: string;
  name: string;
  slug: string;
  description?: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  organizationId?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  organization?: Organization;
  createdBy?: User;
  prompts?: Prompt[];
}

// Prompt interfaces
export interface Prompt {
  id: string;
  title: string;
  description?: string;
  format: 'TEXT' | 'CHAT';
  repositoryId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  repository?: Repository;
  createdBy?: User;
  versions?: PromptVersion[];
  latestVersion?: PromptVersion;
}

export interface PromptVersion {
  id: string;
  promptId: string;
  version: number;
  content: string | ChatMessage[];
  description?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  prompt?: Prompt;
  createdBy?: User;
  runs?: PromptRun[];
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface PromptRun {
  id: string;
  promptId: string;
  versionId: string;
  model: string;
  input: Record<string, string>;
  parameters: PromptParameters;
  output: string;
  metrics: PromptRunMetrics;
  log?: PromptRunLog[];
  status: 'SUCCESS' | 'FAILURE' | 'PENDING';
  createdById: string;
  createdAt: string;
  updatedAt: string;
  prompt?: Prompt;
  version?: PromptVersion;
  createdBy?: User;
}

export interface PromptParameters {
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  [key: string]: any;
}

export interface PromptRunMetrics {
  processing_time_ms: number;
  tokens_input: number;
  tokens_output: number;
  total_tokens: number;
}

export interface PromptRunLog {
  type: 'info' | 'warning' | 'error';
  message: string;
  timestamp?: string;
}

// MergeRequest interfaces
export interface MergeRequest {
  id: string;
  title: string;
  description?: string;
  status: 'OPEN' | 'CLOSED' | 'MERGED';
  promptId: string;
  sourceVersionId: string;
  targetVersionId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  prompt?: Prompt;
  sourceVersion?: PromptVersion;
  targetVersion?: PromptVersion;
  createdBy?: User;
  comments?: MergeRequestComment[];
}

export interface MergeRequestComment {
  id: string;
  mergeRequestId: string;
  content: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  mergeRequest?: MergeRequest;
  createdBy?: User;
}

// Auth interfaces
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  bio?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Pagination interface
export interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
} 