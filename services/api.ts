import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  AuthResponse,
  GenericResponse,
  User,
  UserListResponse,
  UserResponse,
  DriveFile,
  DriveListResponse,
  RegisterRequest,
  AgentStatus,
  AgentTask,
  AgentTaskResponse,
  AgentMatch,
  Process,
  ProcessCreateRequest
} from '../types';
import { config } from '../config';

const API_BASE_URL = config.API_BASE_URL;
const AGENT_BASE_URL = config.AGENT_BASE_URL;

// Create centralized Axios instance for main backend
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create Axios instance for Agent service
const agentApiClient = axios.create({
  baseURL: AGENT_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper para obter cookie
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

// Cache para evitar múltiplas verificacje
let csrfTokenValidated = false;

// Verificar se método precisa de CSRF
const requiresCsrfToken = (method?: string): boolean => {
  const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  return stateChangingMethods.includes((method || '').toUpperCase());
};

// Verificar se temos CSRF token disponível
const hasCsrfToken = (): boolean => {
  // Verificar cookies comuns de CSRF
  return !!(
    getCookie('csrf_access_token') ||
    getCookie('csrf_token') ||
    getCookie('X-CSRF-Token') ||
    getCookie('XSRF-TOKEN')
  );
};

// Obter CSRF token do cookie
const getCsrfTokenFromCookie = (): string | null => {
  // Tentar diferentes nomes comuns de cookies CSRF
  return (
    getCookie('csrf_access_token') ||
    getCookie('csrf_token') ||
    getCookie('X-CSRF-Token') ||
    getCookie('XSRF-TOKEN')
  );
};

// Request Interceptor para o backend principal
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Para métodos que modificam estado, adicionar CSRF token
    if (requiresCsrfToken(config.method)) {
      const csrfToken = getCsrfTokenFromCookie();
      /*console.log('CSRF token encontrado para requisição principal:', {
        method: config.method,
        url: config.url,
        csrfToken
      });*/
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      } else {
        console.warn('CSRF token não encontrado para requisição principal:', {
          method: config.method,
          url: config.url
        });
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Request Interceptor para o serviço do Agent (compartilha CSRF do mesmo domínio)
agentApiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (requiresCsrfToken(config.method)) {
      const csrfToken = getCsrfTokenFromCookie();
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      } else {
        console.warn('CSRF token não encontrado para requisição do Agent');
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor para o backend principal
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    // ... (existing logic)

    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data as any;
      const errorMessage = errorData?.msg || errorData?.message || errorData?.error;

      // Caso 1: CSRF token inválido ou expirado
      const isCsrfError = status === 403 && (
        errorMessage?.includes('CSRF') ||
        errorMessage?.includes('csrf') ||
        errorData?.code === 'CSRF_ERROR'
      );

      if (isCsrfError) {
        console.warn('Erro CSRF detectado:', errorMessage);

        // Se chegou aqui, não conseguimos resolver o CSRF automaticamente
        const csrfError = new Error(
          'Erro de segurança (CSRF). Por favor, recarregue a página e tente novamente.'
        ) as any;
        csrfError.isCsrfError = true;
        csrfError.response = error.response;
        return Promise.reject(csrfError);
      }

      // Caso 2: Não autorizado (401) - Sessão expirada
      else if (status === 401) {

        // Check if it's actually a CSRF error (Flask-JWT-Extended sends 401 for Missing CSRF)
        if (errorMessage?.includes('CSRF') || errorMessage?.includes('csrf') || errorMessage?.includes('Missing CSRF token')) {
          console.warn('Erro CSRF (401) detectado:', errorMessage);
          // If retry failed, do NOT redirect to login for Disconnect actions, per user request
          if (originalRequest?.url?.includes('/disconnect')) {
            console.warn('Disconnect falhou por CSRF/Auth. Redirecionando para Dashboard conforme solicitado.');
            window.location.href = '/#/dashboard';
            return Promise.reject(new Error('Falha ao desconectar. Redirecionando...'));
          }
        }

        // SPECIAL HANDLING: Drive endpoints
        // If a drive endpoint returns 401, it might just mean the provider token is invalid/missing,
        // NOT that the user is logged out. We want the component to handle this (show connect screen).
        if (originalRequest?.url?.includes('/drive/files') || originalRequest?.url?.includes('/drive/microsoft/files')) {
          console.warn('401 on Drive endpoint - suppressing global redirect to allow component handling');
          // We reject with the error so the component's catch block receives it
          const driveError = new Error('Drive authentication failed') as any;
          driveError.response = error.response;
          driveError.isDriveAuthError = true;
          return Promise.reject(driveError);
        }

        console.warn('Sessão expirada ou inválida');

        // Limpar qualquer estado de CSRF
        csrfTokenValidated = false;

        // Check if this is a disconnect request - avoid kicking to login if it fails
        if (originalRequest?.url?.includes('/disconnect')) {
          console.warn('Disconnect falhou (401). Redirecionando para Dashboard.');
          window.location.href = '/#/dashboard';
          return Promise.reject(new Error('Sessão expirada durante disconnect.'));
        }

        // Redirecionar para login se não estiver na página de login
        if (!window.location.hash.includes('login') &&
          !window.location.pathname.includes('login')) {
          // Armazenar a URL atual para redirecionamento após login
          sessionStorage.setItem('redirectAfterLogin', window.location.href);
          window.location.href = '/#/login';
        }

        const authError = new Error('Sua sessão expirou. Por favor, faça login novamente.') as any;
        authError.isAuthError = true;
        authError.response = error.response;
        return Promise.reject(authError);
      }

      // Caso 3: Acesso proibido (403) - Sem CSRF (outros motivos)
      else if (status === 403 && !isCsrfError) {
        console.warn('Acesso proibido:', errorMessage);

        const forbiddenError = new Error(
          errorMessage || 'Você não tem permissão para realizar esta ação.'
        ) as any;
        forbiddenError.isForbiddenError = true;
        forbiddenError.response = error.response;
        return Promise.reject(forbiddenError);
      }

      // Formatar mensagem de erro para outros casos
      let formattedErrorMessage = errorMessage || `Erro HTTP ${status}`;

      if (typeof formattedErrorMessage === 'object') {
        const values = Object.values(formattedErrorMessage);
        formattedErrorMessage = values.length > 0
          ? values.join(' ')
          : JSON.stringify(formattedErrorMessage);
      }

      const customError = new Error(formattedErrorMessage) as any;
      customError.response = error.response;
      customError.status = status;

      return Promise.reject(customError);
    }

    // Erro de rede ou timeout
    const networkError = new Error(
      error.code === 'ECONNABORTED'
        ? 'A requisição expirou. Verifique sua conexão e tente novamente.'
        : 'Erro de conexão. Verifique sua conexão com a internet.'
    ) as any;
    networkError.isNetworkError = true;
    networkError.code = error.code;

    return Promise.reject(networkError);
  }
);

// Response Interceptor para o serviço do Agent (simplificado)
agentApiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Możemy tu dodać specyficzną logikę dla błędów agenta, jeśli potrzeba
    return Promise.reject(error);
  }
);

// Serviços de Autenticação
export const authService = {
  login: async (credentials: { username: string; password: string }): Promise<AuthResponse> => {
    const response = await apiClient.post<any, AuthResponse>('/auth/login', credentials);

    // Após login, verificar se temos CSRF token
    if (!hasCsrfToken()) {
      console.warn('CSRF token não encontrado após login');
    }

    return response;
  },

  logout: async (mode: 'full' | 'soft' = 'full'): Promise<GenericResponse> => {
    try {
      const response = await apiClient.post<any, GenericResponse>('/auth/logout', { mode });
      return response;
    } finally {
      // Limpar estado de CSRF após logout
      csrfTokenValidated = false;
    }
  },

  disconnectProvider: async (provider: string): Promise<GenericResponse> => {
    const endpoint = `/auth/disconnect/${provider}`;
    return apiClient.post(endpoint);
  },

  register: async (userData: RegisterRequest): Promise<GenericResponse> => {
    const response = await apiClient.post<any, GenericResponse>('/user/register', userData);

    // Após registro, verificar CSRF (similar ao login)
    if (!hasCsrfToken()) {
      console.debug('Verificando CSRF após registro');
    }

    return response;
  },

  // Login social - redirecionamentos
  googleLogin: async (): Promise<void> => {
    window.location.href = `${API_BASE_URL}/auth2/google/login`;
  },

  googleLogout: async (): Promise<GenericResponse> => {
    const response = await apiClient.get<any, GenericResponse>('/auth2/google/logout');
    csrfTokenValidated = false;
    return response;
  },

  githubLogin: async (): Promise<void> => {
    window.location.href = `${API_BASE_URL}/auth2/github/login`;
  },

  githubSignIn: async (): Promise<void> => {
    window.location.href = `${API_BASE_URL}/auth2/github/signin`;
  },

  githubLogout: async (): Promise<GenericResponse> => {
    const response = await apiClient.post<any, GenericResponse>('/auth2/github/logout');
    csrfTokenValidated = false;
    return response;
  },

  microsoftLogin: async (): Promise<void> => {
    window.location.href = `${API_BASE_URL}/auth2/microsoft/login`;
  },



  // Verificar se temos CSRF token (útil para debug)
  checkCsrfToken: (): { hasToken: boolean; tokenName?: string } => {
    const token = getCsrfTokenFromCookie();
    return {
      hasToken: !!token,
      tokenName: token ? 'csfr_token_encontrado' : undefined
    };
  }
};

// Serviço de Usuários
export const userService = {
  register: async (userData: User): Promise<GenericResponse> => {
    return apiClient.post('/user/dao', userData);
  },

  getCurrentUser: async (): Promise<{ success: boolean; user: User }> => {
    const response = await apiClient.get<{ success: boolean; user: any }>('/admin/user');
    const payload = response as unknown as { success: boolean; user: any };

    if (payload.user) {
      payload.user = {
        ...payload.user,
        id: payload.user.id,
        email: payload.user.email || '',
        username: payload.user.username || '',
        is_administrator: payload.user.is_administrator || false,
        has_drive_access: payload.user.has_drive_access || false,
        has_microsoft_drive_access: payload.user.has_microsoft_drive_access || false,
      };
    }
    return payload;
  },

  getUserById: async (id: number): Promise<UserResponse> => {
    return apiClient.get(`/user/dao/${id}`);
  },

  updateUser: async (id: number, data: Partial<User>): Promise<UserResponse> => {
    return apiClient.put(`/user/dao/${id}`, data);
  },

  deleteUser: async (id: number): Promise<GenericResponse> => {
    return apiClient.delete(`/user/dao/${id}`);
  },

  exportUser: async (): Promise<{ status_code: number; data: any }> => {
    return apiClient.get('/user/export');
  },
};

// Serviço de Administração
export const adminService = {
  getAllUsers: async (): Promise<UserListResponse> => {
    return apiClient.get('/user/manager');
  }
};

// Serviço do Google Drive
export const driveService = {
  listFiles: async (folderId?: string): Promise<DriveListResponse> => {
    const url = folderId
      ? `/drive/files?folder_id=${folderId}`
      : `/drive/files`;

    const rawData = await apiClient.get<any>(url) as any;
    const driveData = rawData.data || {};

    const files = (driveData.files || []).map((file: any) => ({
      ...file,
      isFolder: file.is_folder || file.mimeType === 'application/vnd.google-apps.folder',
      modifiedTime: file.modifiedTime || file.createdTime
    }));

    return {
      success: rawData.success,
      files,
      current_folder: driveData.folder_id
    };
  },

  getFileDetail: async (fileId: string): Promise<DriveFile> => {
    return apiClient.get(`/drive/file/${fileId}`);
  },
};

// Serviço do OneDrive
export const oneDriveService = {
  listFiles: async (folderId?: string): Promise<DriveListResponse> => {
    const url = folderId
      ? `/drive/microsoft/files?folder_id=${folderId}`
      : `/drive/microsoft/files`;

    const rawData = await apiClient.get<any>(url) as any;
    const driveData = rawData.data || {};

    const files = (driveData.files || []).map((file: any) => ({
      ...file,
      isFolder: file.is_folder || file.folder !== undefined,
      modifiedTime: file.lastModifiedDateTime,
      name: file.name
    }));

    return {
      success: rawData.success,
      files,
      current_folder: driveData.folder_id
    };
  },

  getFileDetail: async (fileId: string): Promise<DriveFile> => {
    return apiClient.get(`/drive/microsoft/file/${fileId}`);
  },
};

// Serviço de Nuvem Agregada
export const cloudService = {
  getAggregatedFiles: async (): Promise<import('../types').CloudFilesResponse> => {
    return apiClient.get('/cloud/files');
  }
};

// Serviço de Arquivos em Nuvem
export const cloudFilesService = {
  saveFiles: async (files: Array<{ id: string; name: string; provider: string }>): Promise<GenericResponse> => {
    return apiClient.post('/cloud-files', { files });
  },

  listFiles: async (): Promise<{ success: boolean; files: Array<{ id: string; name: string; provider: string }> }> => {
    return apiClient.get('/cloud-files');
  }
};

// FundingDetective Agent Service
export const agentService = {
  getStatus: async (): Promise<AgentStatus> => {
    return agentApiClient.get('/agent/status');
  },

  control: async (action: 'start' | 'stop' | 'pause', user_id?: number, process_id?: number): Promise<{ msg: string; status: string }> => {
    return agentApiClient.post('/agent/control', { action, user_id, process_id });
  },

  updateConfig: async (model: string): Promise<{ msg: string; selected_model: string }> => {
    return agentApiClient.post('/agent/config', { model });
  },

  triggerTask: async (filename: string, phone: string): Promise<AgentTaskResponse> => {
    return agentApiClient.post('/agent/task', { filename, phone });
  },

  getTaskStatus: async (taskId: string): Promise<AgentTask> => {
    return agentApiClient.get(`/agent/task/${taskId}`);
  },

  getMatches: async (): Promise<AgentMatch[]> => {
    return agentApiClient.get('/agent/matches');
  }
};

// Configuration Service
export const configService = {
  getConnectionEmails: async (): Promise<{ connection_emails: string[] }> => {
    return agentApiClient.get('/config/connection-emails');
  },

  updateConnectionEmails: async (emails: string[]): Promise<GenericResponse> => {
    return agentApiClient.post('/config/connection-emails', { connection_emails: emails });
  }
};

// Processes Service
export const processesService = {
  list: async (): Promise<Process[]> => {
    return apiClient.get('/admin/processes');
  },

  create: async (data: ProcessCreateRequest): Promise<Process> => {
    return apiClient.post('/admin/processes', data);
  },

  get: async (id: number): Promise<Process> => {
    return apiClient.get(`/admin/processes/${id}`);
  },

  update: async (id: number, data: Partial<Process>): Promise<Process> => {
    return apiClient.put(`/admin/processes/${id}`, data);
  },

  delete: async (id: number): Promise<GenericResponse> => {
    return apiClient.delete(`/admin/processes/${id}`);
  }
};

// Exportar função para debug (apenas desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  (window as any).debugAuth = {
    getCsrfToken: getCsrfTokenFromCookie,
    hasCsrfToken,
    checkCookies: () => {
      console.log('Cookies atuais:', document.cookie);
      console.log('CSRF token encontrado:', getCsrfTokenFromCookie());
    }
  };
}

export default apiClient;
