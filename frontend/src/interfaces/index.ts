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
  picture_url?: string;
}

export interface UserProfile {
  email?: string;
  full_name?: string;
  bio?: string;
  location?: string;
  website?: string;
  company?: string;
  preferences?: {
    email_notifications?: boolean;
    theme?: 'light' | 'dark' | 'system';
    language?: string;
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
  display_name: string;
  description?: string;
  logo_image_id?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  repository_count?: number;
  total_stars?: number;
  role?: 'OWNER' | 'ADMIN' | 'MEMBER';
  members?: OrganizationMember[];
}

export interface OrganizationMember {
  id: string;
  user_id: string;
  organization_id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  user?: User;
  organization?: Organization;
  joined_at: string;
  username?: string;
  email?: string;
  full_name?: string;
  profile_image_id?: string;
}

// Repository interfaces
export interface Repository {
  id: string;
  name: string;
  slug?: string;
  description: string | null;
  visibility?: 'PUBLIC' | 'PRIVATE';
  organizationId?: string;
  createdById?: string;
  created_at: string;
  updatedAt?: string;
  updated_at?: string;
  organization?: Organization;
  createdBy?: User;
  prompts?: Prompt[];
  is_public: boolean;
  owner_user?: {
    id: string;
    username: string;
    profile_image?: {
      id: string;
    };
  };
  owner_org?: {
    id: string;
    name: string;
    logo_image?: {
      id: string;
    };
  };
  stars_count?: number;
  isStarred?: boolean;
  is_starred?: boolean;
  _count?: {
    stars?: number;
  };
  metrics?: {
    promptCount?: number;
    starCount?: number;
    stars?: number;
    isStarred?: boolean;
  };
  primaryPrompt?: {
    id: string;
    title: string;
    description: string;
    created_at: string;
    updated_at: string;
    versions: any[];
  };
  prompt?: {
    id: string;
    title: string;
    description: string | null;
  };
  tags?: Array<{
    id: string;
    name: string;
  }>;
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