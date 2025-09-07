import React, { useState } from 'react';
import { websocketService } from '../services/websocketService';
import { authService } from '../services/authService';

const DebugPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});

  // 只在开发环境显示
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const collectDebugInfo = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const currentUser = authService.getCurrentUser();
    const connectionStatus = websocketService.getConnectionStatus();

    const info = {
      localStorage: {
        hasToken: !!token,
        tokenPreview: token ? token.substring(0, 50) + '...' : null,
        hasUser: !!user,
        userRaw: user,
        userParsed: currentUser
      },
      websocket: {
        connectionStatus,
        isConnected: websocketService.isConnectedToServer()
      },
      timestamp: new Date().toLocaleTimeString()
    };

    setDebugInfo(info);
    console.log('[DebugPanel] 调试信息收集:', info);
  };

  const testWebSocketConnection = async () => {
    console.log('[DebugPanel] 开始测试WebSocket连接...');
    
    const currentUser = authService.getCurrentUser();
    const userId = currentUser?.userId || currentUser?.id;
    
    if (!userId) {
      console.error('[DebugPanel] 无法获取用户ID');
      alert('无法获取用户ID，请检查登录状态');
      return;
    }

    try {
      const connected = await websocketService.connect(userId, (message) => {
        console.log('[DebugPanel] 收到WebSocket消息:', message);
      });
      
      alert(connected ? 'WebSocket连接成功！' : 'WebSocket连接失败！');
      collectDebugInfo();
    } catch (error) {
      console.error('[DebugPanel] WebSocket连接错误:', error);
      alert('WebSocket连接错误: ' + error);
    }
  };

  const forceLogout = () => {
    websocketService.forceLogout('调试面板强制退出');
  };

  if (!isVisible) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9998,
          backgroundColor: '#001529',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
        onClick={() => setIsVisible(true)}
      >
        🐛 Debug
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9998,
        backgroundColor: 'white',
        border: '1px solid #d9d9d9',
        borderRadius: '4px',
        padding: '16px',
        maxWidth: '400px',
        maxHeight: '500px',
        overflow: 'auto',
        fontSize: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <strong>🐛 调试面板</strong>
        <button
          onClick={() => setIsVisible(false)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
        >
          ✕
        </button>
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <button
          onClick={collectDebugInfo}
          style={{
            marginRight: '8px',
            padding: '4px 8px',
            fontSize: '12px',
            backgroundColor: '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '2px',
            cursor: 'pointer'
          }}
        >
          刷新状态
        </button>
        
        <button
          onClick={testWebSocketConnection}
          style={{
            marginRight: '8px',
            padding: '4px 8px',
            fontSize: '12px',
            backgroundColor: '#52c41a',
            color: 'white',
            border: 'none',
            borderRadius: '2px',
            cursor: 'pointer'
          }}
        >
          测试连接
        </button>
        
        <button
          onClick={forceLogout}
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            backgroundColor: '#ff4d4f',
            color: 'white',
            border: 'none',
            borderRadius: '2px',
            cursor: 'pointer'
          }}
        >
          强制退出
        </button>
      </div>

      {debugInfo.timestamp && (
        <div>
          <div style={{ marginBottom: '8px', fontSize: '10px', color: '#666' }}>
            最后更新: {debugInfo.timestamp}
          </div>
          <pre style={{ 
            fontSize: '10px', 
            background: '#f5f5f5', 
            padding: '8px', 
            borderRadius: '2px',
            overflow: 'auto',
            maxHeight: '300px'
          }}>
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DebugPanel;
