import React from 'react';
import { useOnlineStatus } from '../hooks/useHeartbeat';

interface OnlineStatusIndicatorProps {
  email: string;
  showText?: boolean;
  className?: string;
}

/**
 * 在线状态指示器组件
 * 显示用户的在线状态（在线/离线）
 */
export const OnlineStatusIndicator: React.FC<OnlineStatusIndicatorProps> = ({ 
  email, 
  showText = true, 
  className = '' 
}) => {
  const { isOnline, loading } = useOnlineStatus(email);

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
        {showText && <span className="text-sm text-gray-500">检查中...</span>}
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div 
        className={`w-2 h-2 rounded-full ${
          isOnline ? 'bg-green-500' : 'bg-gray-400'
        }`}
      ></div>
      {showText && (
        <span className={`text-sm ${
          isOnline ? 'text-green-600' : 'text-gray-500'
        }`}>
          {isOnline ? '在线' : '离线'}
        </span>
      )}
    </div>
  );
};

export default OnlineStatusIndicator; 