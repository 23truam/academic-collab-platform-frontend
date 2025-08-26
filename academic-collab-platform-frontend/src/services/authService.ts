import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081/api';

export interface LoginRequest {
  email?: string;
  username?: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  email?: string;
  userId?: number;
}

// 创建axios实例
const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：添加token
authApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：处理token过期
authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  // 登录
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await authApi.post('/auth/login', credentials);
      const data = response.data;
      
      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
          email: data.email,
          userId: data.userId,
          loginTime: Date.now() // 🔧 保存登录时间
        }));
      }
      
      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || '登录失败'
      };
    }
  },

  // 注册
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await authApi.post('/auth/register', userData);
      const data = response.data;
      
      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || '注册失败'
      };
    }
  },

  // 验证token
  async validateToken(): Promise<AuthResponse> {
    try {
      const response = await authApi.get('/auth/validate');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: 'Token验证失败'
      };
    }
  },

  // 退出登录
  async logout(): Promise<any> {
    try {
      const response = await authApi.post('/auth/logout');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '退出登录失败');
    }
  },

  // 检查是否已登录
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },

  // 获取当前用户信息
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // 获取token
  getToken(): string | null {
    return localStorage.getItem('token');
  }
}; 