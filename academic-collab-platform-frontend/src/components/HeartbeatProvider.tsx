import React, { useEffect } from 'react';
import { useHeartbeat } from '../hooks/useHeartbeat';

interface HeartbeatProviderProps {
  children: React.ReactNode;
}

/**
 * 心跳机制Provider组件
 * 在应用根组件中使用，自动管理用户在线状态
 */
export const HeartbeatProvider: React.FC<HeartbeatProviderProps> = ({ children }) => {
  // 从localStorage获取token
  const token = localStorage.getItem('token');
  
  // 使用心跳hook，每5秒发送一次心跳（开发环境快速反馈）
  useHeartbeat(token, 5000);

  // 页面关闭或刷新时发送最后一次心跳
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (token) {
        // 使用sendBeacon确保请求能发送成功
        const data = new FormData();
        data.append('token', token);
        navigator.sendBeacon('/api/auth/logout', data);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [token]);

  return <>{children}</>;
};

export default HeartbeatProvider; 