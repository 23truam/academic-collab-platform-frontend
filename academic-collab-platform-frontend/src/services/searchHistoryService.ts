// 搜索历史服务，用于管理最近搜索记录

import axios from 'axios';
import { authService } from './authService';

const API_BASE_URL = 'http://localhost:8081/api';

// 搜索类型枚举
export enum SearchType {
  PROFESSOR = 'professor',
  LITERATURE = 'literature'
}

// 搜索记录接口 - 与后端 SearchHistory 模型保持一致
export interface SearchHistoryItem {
  id: number; // 修改为 number 类型，与后端 Long 类型对应
  userId: string;
  type: SearchType;
  keyword: string;
  timestamp: number;
}

// 后端响应接口
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// 创建axios实例
const searchHistoryApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：添加token
searchHistoryApi.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 获取所有搜索历史
export const getSearchHistory = async (): Promise<SearchHistoryItem[]> => {
  try {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      return [];
    }
    
    const response = await searchHistoryApi.get<ApiResponse<any>>('/search-history', {
      params: {
        userId: currentUser.userId,
        page: 1,
        size: 50
      }
    });
    
    // 处理统一响应格式
    if (response.data.success && response.data.data) {
      return response.data.data.records || [];
    }
    return [];
  } catch (error) {
    console.error('获取搜索历史失败:', error);
    return [];
  }
};

// 添加新的搜索记录
export const addSearchHistory = async (type: SearchType, keyword: string): Promise<void> => {
  try {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      return;
    }
    
    const historyItem = {
      userId: currentUser.userId.toString(),
      keyword: keyword,
      type: type,
      timestamp: Date.now()
    };
    
    await searchHistoryApi.post<ApiResponse<any>>('/search-history', historyItem);
  } catch (error) {
    console.error('添加搜索历史失败:', error);
  }
};

// 获取最近的搜索历史，最多返回指定数量的记录
export const getRecentSearchHistory = async (limit: number = 5): Promise<SearchHistoryItem[]> => {
  try {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      return [];
    }
    
    // 修复：使用专门的 /recent 接口获取最近搜索历史
    const response = await searchHistoryApi.get<ApiResponse<SearchHistoryItem[]>>('/search-history/recent', {
      params: {
        userId: currentUser.userId,
        limit: limit
      }
    });
    
    // 处理统一响应格式
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('获取最近搜索历史失败:', error);
    return [];
  }
};

// 清除搜索历史
export const clearSearchHistory = async (): Promise<void> => {
  try {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      return;
    }
    
    await searchHistoryApi.delete<ApiResponse<any>>('/search-history', {
      params: {
        userId: currentUser.userId
      }
    });
  } catch (error) {
    console.error('清除搜索历史失败:', error);
  }
}; 