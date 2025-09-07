import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

/**
 * 心跳机制Hook - 定时发送心跳包保持用户在线状态
 * @param token JWT token
 * @param interval 心跳间隔（毫秒），默认60秒（优化后）
 */
export const useHeartbeat = (token: string | null, interval: number = 60000) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 如果没有token，不启动心跳
    if (!token) {
      return;
    }

    // 立即发送一次心跳
    const sendHeartbeat = async () => {
      try {
        await axios.post('/api/heartbeat', {}, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('Heartbeat sent successfully');
      } catch (error) {
        console.error('Heartbeat failed:', error);
        // 如果心跳失败（如token过期），可以在这里处理
        // 比如清除本地token，跳转到登录页等
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          console.log('Token expired, clearing local storage');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // 可以触发重新登录
          window.location.href = '/login';
        }
      }
    };

    // 发送第一次心跳
    sendHeartbeat();

    // 设置定时器，定期发送心跳
    intervalRef.current = setInterval(sendHeartbeat, interval);

    // 清理函数
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [token, interval]);

  // 手动发送心跳的方法
  const sendHeartbeatNow = async () => {
    if (!token) return;
    
    try {
      await axios.post('/api/heartbeat', {}, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Manual heartbeat sent successfully');
      return true;
    } catch (error) {
      console.error('Manual heartbeat failed:', error);
      return false;
    }
  };

  return { sendHeartbeatNow };
};

/**
 * 检查用户在线状态的Hook
 * @param email 用户邮箱
 */
export const useOnlineStatus = (email: string | null) => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const checkOnlineStatus = async () => {
    if (!email) {
      setIsOnline(null);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`/api/heartbeat/status/${email}`);
      setIsOnline(response.data);
    } catch (error) {
      console.error('Failed to check online status:', error);
      setIsOnline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkOnlineStatus();
  }, [email]);

  return { isOnline, loading, checkOnlineStatus };
}; 