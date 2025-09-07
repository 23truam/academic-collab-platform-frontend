import React, { useState, useEffect } from 'react';
import { websocketService } from '../services/websocketService';

const ConnectionStatus: React.FC = () => {
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 监听WebSocket连接状态变化
    const handleConnectionStateChange = (state: string, metrics: any) => {
      console.log('[ConnectionStatus] 状态变更:', state, metrics);
      setConnectionState(state);
      
      // 只在非连接状态时显示指示器
      setIsVisible(state !== 'connected');
    };

    websocketService.onConnectionStateChange(handleConnectionStateChange);

    // 初始状态检查
    const initialStatus = websocketService.getConnectionStatus();
    setConnectionState(initialStatus.state);
    setIsVisible(initialStatus.state !== 'connected');

    return () => {
      // 清理监听器（注意：websocketService没有提供removeListener方法，这里只是概念性的）
    };
  }, []);

  // 如果连接正常，不显示指示器
  if (!isVisible) {
    return null;
  }

  const getStatusInfo = () => {
    switch (connectionState) {
      case 'connecting':
        return {
          color: '#1890ff',
          text: '🔄 正在连接...',
          bgColor: '#e6f7ff'
        };
      case 'reconnecting':
        return {
          color: '#fa8c16',
          text: '🔄 正在重连...',
          bgColor: '#fff7e6'
        };
      case 'disconnected':
        return {
          color: '#ff4d4f',
          text: '🔴 连接已断开',
          bgColor: '#fff2f0'
        };
      default:
        return {
          color: '#52c41a',
          text: '🟢 已连接',
          bgColor: '#f6ffed'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        padding: '8px 16px',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: '500',
        color: statusInfo.color,
        backgroundColor: statusInfo.bgColor,
        border: `1px solid ${statusInfo.color}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease'
      }}
    >
      {statusInfo.text}
    </div>
  );
};

export default ConnectionStatus;
