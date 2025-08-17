import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081/api';

export interface ChatMessage {
  id?: number;
  senderId: number;
  senderName?: string;
  receiverId: number;
  receiverName?: string;
  content: string;
  messageType: string;
  isRead?: boolean;
  createTime?: string;
}

export interface ChatUser {
  userId: number;
  username: string;
  isOnline: boolean;
}

// 创建axios实例
const chatApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：添加token
chatApi.interceptors.request.use(
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

export const chatService = {
  // 发送消息
  async sendMessage(message: ChatMessage): Promise<any> {
    try {
      const response = await chatApi.post('/chat/send', {
        receiverId: message.receiverId,
        content: message.content,
        messageType: message.messageType
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '发送消息失败');
    }
  },

  // 获取聊天历史
  async getChatHistory(userId: number, limit: number = 50): Promise<any> {
    try {
      const response = await chatApi.get(`/chat/history/${userId}?limit=${limit}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '获取聊天历史失败');
    }
  },

  // 获取聊天历史（带缓存）
  async getChatHistoryWithCache(userId: number, limit: number = 50, loginTime?: number): Promise<any> {
    try {
      let url = `/chat/history-with-cache/${userId}?limit=${limit}`;
      if (loginTime) {
        url += `&loginTime=${loginTime}`;
      }
      const response = await chatApi.get(url);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '获取聊天历史失败');
    }
  },

  // 清除聊天缓存
  async clearChatCache(userId: number): Promise<any> {
    try {
      const response = await chatApi.delete(`/chat/cache/${userId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '清除缓存失败');
    }
  },

  // 获取用户列表
  async getUserList(): Promise<ChatUser[]> {
    try {
      const response = await chatApi.get('/chat/users');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '获取用户列表失败');
    }
  },

  // 标记消息为已读
  async markMessagesAsRead(userId: number): Promise<any> {
    try {
      const response = await chatApi.post(`/chat/mark-read/${userId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '标记已读失败');
    }
  },

  // 获取未读消息数
  async getUnreadMessageCount(): Promise<any> {
    try {
      const response = await chatApi.get('/chat/unread-count');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '获取未读消息数失败');
    }
  },

  // 获取所有用户及在线状态（兼容老接口，实际与getUserList一致）
  async getAllUsersWithStatus(): Promise<ChatUser[]> {
    return this.getUserList();
  },

  // 设置用户在线/离线状态
  async setOnlineStatus(isOnline: boolean): Promise<any> {
    try {
      const response = await chatApi.post('/user/online', { isOnline });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '设置在线状态失败');
    }
  },

  // 设置当前活跃会话对端
  async setActiveSession(peerUserId: number): Promise<any> {
    try {
      const response = await chatApi.post(`/chat/active-session/${peerUserId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '设置活跃会话失败');
    }
  },

  // 清除当前活跃会话
  async clearActiveSession(): Promise<any> {
    try {
      const response = await chatApi.delete('/chat/active-session');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '清除活跃会话失败');
    }
  }
};

export const getUnreadCount = async () => {
  const res = await axios.get('/api/chat/unread-count', {
    headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
  });
  return res.data.data; // 假设返回的是数字
};

export const markMessagesAsRead = async (userId: number) => {
  await axios.post(`/api/chat/mark-read/${userId}`, {}, {
    headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
  });
};

export const getUnreadMap = async () => {
  const res = await axios.get('/api/chat/unread-map', {
    headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
  });
  return res.data.data as Record<number, number>;
}; 