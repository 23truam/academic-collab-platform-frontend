import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081/api';

export interface CollaborationPredictRequest {
  authorId: number;
  directions: string[];
  minPapers: number;
  startYear: number;
  endYear: number;
}

// 创建axios实例
const collaborationApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：添加token
collaborationApi.interceptors.request.use(
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

export const predictCollaborators = async (params: CollaborationPredictRequest) => {
  const res = await collaborationApi.post('/collaboration/predict', params);
  return res.data;
}; 