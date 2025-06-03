export interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  bio?: string;
  profile_image_id?: string;
  picture_url?: string;
  created_at: string;
  updated_at: string;
  profile_image?: Image;
}

export interface Image {
  id: string;
  data?: any;
  mime_type: string;
  description?: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

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

export interface Organization {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  logo_image_id?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  logo_image?: Image;
  owner?: User;
  repositories?: Repository[];
  _count?: {
    memberships?: number;
    repositories?: number;
  };
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

export interface Repository {
  id: string;
  name: string;
  description?: string;
  is_public: boolean;
  owner_user_id?: string;
  owner_org_id?: string;
  created_at: string;
  updated_at: string;
  owner_user?: User;
  owner_org?: Organization;
  prompts?: Prompt[];
  _count?: {
    stars?: number;
    prompts?: number;
  };
  is_starred?: boolean;
  latest_prompt?: Prompt;
  // Unified stats object for different API endpoints
  stats?: {
    stars?: number;
    is_starred?: boolean;
    prompts?: number;
  };
  // Owner info for different API responses
  owner?: {
    id: string;
    name: string;
    display_name?: string;
    username?: string;
    profile_image_id?: string;
    profile_image?: Image;
    logo_image?: Image;
  };
}

export interface Prompt {
  id: string;
  repository_id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  repository?: Repository;
  versions?: PromptVersion[];
  prompt_runs?: PromptRun[];
  merge_requests?: MergeRequest[];
  metadata_json?: any;
}

export interface PromptVersion {
  id: string;
  prompt_id: string;
  content: string;
  content_snapshot?: string;
  metadata_json?: {
    parameters?: PromptParameters;
    [key: string]: any;
  };
  commit_message?: string;
  author_id?: string;
  version_number: number;
  created_at: string;
  created_at_deprecated?: string;
  prompt?: Prompt;
  author?: User;
  created_by?: User;
  parameters?: PromptParameters;
}

export interface PromptParameters {
  temperature: number;
  top_p: number;
  frequency_penalty: number;
  max_tokens: number;
  presence_penalty?: number;
  [key: string]: any;
}

export interface PromptRun {
  id: string;
  prompt_id: string;
  version_id?: string;
  user_id?: string;
  model: string;
  input_variables: Record<string, any>;
  prompt_content?: string;
  output?: string;
  success: boolean;
  error_message?: string;
  metadata?: {
    tokens_input?: number;
    tokens_output?: number;
    total_tokens?: number;
    processing_time_ms?: number;
    cost_usd?: number;
    cost_input?: number;
    cost_output?: number;
    model_parameters?: Record<string, any>;
    [key: string]: any;
  };
  created_at: string;
  prompt?: Prompt;
  version?: PromptVersion;
  user?: User;
}

export interface MergeRequest {
  id: string;
  prompt_id: string;
  description: string;
  content: string;
  metadata_json?: any;
  status: 'OPEN' | 'REJECTED' | 'MERGED';
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: User;
  prompt?: Prompt;
}

export interface AvailableModel {
  id: string;
  name: string;
  provider: string;
}

// Tab panel props used across multiple components
export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export type UserRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type MergeRequestStatus = 'OPEN' | 'REJECTED' | 'MERGED'; 