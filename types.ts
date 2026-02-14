export interface User {
  id?: number;
  email: string;
  username: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  country?: string;
  address?: string;
  postal_code?: string;
  role?: 'admin' | 'user';
  is_administrator?: boolean;
  has_drive_access?: boolean; // Google Drive
  has_microsoft_drive_access?: boolean; // OneDrive
  providers?: Providers;
}

export interface Provider {
  connected: boolean;
  email: string | null;
}

export interface Providers {
  [key: string]: Provider;
}

export interface CloudFile {
  id: string;
  name: string;
  type: string;
  webViewLink?: string;
  iconLink?: string;
}

export interface CloudFilesResponse {
  count: number;
  data: {
    provider: string;
    status: 'success' | 'error';
    message?: string;
    files?: CloudFile[];
  }[];
}

export interface RegisterRequest {
  authEmail: string;
  authPassword: string;
  firstName: string;
  lastName: string;
  countryName: string;
  countryTelCode: string;
  phoneNumber: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  iconLink?: string;
  isFolder: boolean;
  is_folder: boolean; // Added per backend structure
  webViewLink?: string;
}

export interface DriveListResponse {
  success: boolean;
  files: DriveFile[];
  current_folder?: string;
}

export interface AuthResponse {
  success?: boolean;
  status_code?: number;
  message?: string;
  access_token?: string;
  username?: string;
  user?: User;
}

export interface UserResponse {
  success?: boolean;
  status_code: number;
  user: User;
}

export interface UserListResponse {
  status_code: number;
  users: User[];
}

export interface GenericResponse {
  status_code: number;
  message: string;
}

export enum AuthStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  AUTHENTICATED = 'AUTHENTICATED',
  UNAUTHENTICATED = 'UNAUTHENTICATED',
}

// Agent FundingDetective Types
export interface AgentStatus {
  agent_status: 'active' | 'stopped' | 'paused';
  plan: string;
  selected_model: string;
  id?: number;
}

export interface AgentControlRequest {
  action: 'start' | 'stop' | 'pause';
}

export interface AgentConfigRequest {
  model: string;
}

export interface AgentTaskRequest {
  filename: string;
  phone: string;
}

export interface AgentTaskResponse {
  msg: string;
  task_id: string;
}

export interface AgentTask {
  id: string;
  filename: string;
  phone: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  created_at: string;
  updated_at: string;
}

export interface ConnectionEmailsRequest {
  connection_emails: string[];
}
export interface AgentMatch {
  id: number;
  aviso_id: string;
  title: string;
  match_score: number;
  reasoning?: string;
  matched_at: string;
  task_id?: string;
}

// Process API Types
export interface Process {
  id: number;
  user_id: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  trigger_type: 'manual' | 'scheduled' | 'webhook';
  config_snapshot: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ProcessCreateRequest {
  name: string;
  trigger_type: 'manual' | 'scheduled' | 'webhook';
  config_snapshot: Record<string, any>;
}
export interface DataSource {
  id: string; // Changed to string (mongo_id)
  process_id: string; // Changed to string
  platform: 'google_drive' | 'sharepoint' | 'external_api';
  resource_identifier: string;
  config?: any[]; // Default structure is a list of objects
  created_at: string;
  updated_at: string;
}

export interface DataSourceCreateRequest {
  process_id?: string;
  platform: 'google_drive' | 'sharepoint' | 'external_api';
  resource_identifier: string;
  config: any[];
}
