import React, { useState, useEffect, useRef, memo } from 'react';
import { chatService, ChatMessage, ChatUser, getUnreadCount, markMessagesAsRead, getUnreadMap } from '../services/chatService';
import { websocketService } from '../services/websocketService';
import { authService } from '../services/authService';
import { beaconLogout } from '../utils/beaconLogout';
import './ChatPage.css';

const ChatPage: React.FC = () => {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [unreadMap, setUnreadMap] = useState<{[userId: string]: number}>({});
  const [hasHistoryDivider, setHasHistoryDivider] = useState(false);
  const [loginTime, setLoginTime] = useState<number>(() => Date.now());
  const [historyMessages, setHistoryMessages] = useState<ChatMessage[]>([]);
  const [recentMessages, setRecentMessages] = useState<ChatMessage[]>([]);
  // 记录当前活跃会话对端ID，避免闭包导致的旧 selectedUser
  const activePeerRef = useRef<number | null>(null);

  // 获取当前登录用户ID
  const currentUserId = (() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        return userObj.userId;
      } catch {
        return undefined;
      }
    }
    return undefined;
  })();

  // 首次加载用户列表时设置loading
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await chatService.getAllUsersWithStatus();
        setUsers(response);
      } catch (error) {
        console.error('获取用户列表失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
    // 监听WebSocket用户状态变更
    websocketService.onUserStatusChange((userStatus) => {
      setUsers(prevUsers => {
        const updated = prevUsers.map(user =>
          user.userId === userStatus.userId ? { ...user, isOnline: userStatus.isOnline } : user
        );
        return updated;
      });
    });
  }, []);

  // 获取全局未读消息数和每个用户的未读消息数map，改为WebSocket推送
  useEffect(() => {
    websocketService.onUnreadCount(setUnreadCount);
    websocketService.onUnreadMap(setUnreadMap);
  }, []);

  // 在unreadMap变化时打印一次
  useEffect(() => {
    console.log('unreadMap 变化:', unreadMap);
  }, [unreadMap]);

  // 连接WebSocket - 延迟连接，避免页面加载时就连接
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (!currentUserId) {
          console.error('未获取到当前用户ID，跳过WebSocket连接');
          setWsConnected(false);
          return;
        }
        websocketService
          .connect(currentUserId, (message) => {
            const activePeer = activePeerRef.current;
            // 属于当前会话的消息（收或发）才渲染到当前会话
            if (activePeer && (message.senderId === activePeer || message.receiverId === activePeer)) {
              setRecentMessages(prev => {
                // 消息去重
                if (message.id && prev.some(m => m.id === message.id)) return prev;
                if (message.createTime && prev.some(m => m.createTime === message.createTime && m.content === message.content)) return prev;
                return [...prev, message];
              });
            }
            // 仅在“收到来自当前会话对端”的消息时标记为已读（避免误判）
            if (activePeer && message.senderId === activePeer) {
              markMessagesAsRead(activePeer).catch(() => {});
            }
          })
          .then((connected) => setWsConnected(connected))
          .catch((error) => {
            console.error('WebSocket连接失败:', error);
            setWsConnected(false);
          });
      } catch (error) {
        console.error('WebSocket连接失败:', error);
        setWsConnected(false);
      }
    }, 1000);

    // 页面关闭/刷新时自动下线
    const handleUnload = () => {
      beaconLogout();
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearTimeout(timer);
      setWsConnected(false);
      window.removeEventListener('beforeunload', handleUnload);
      // 不再自动调用authService.logout()
    };
  }, [currentUserId]);

  // 组件卸载时清除活跃会话
  useEffect(() => {
    return () => {
      chatService.clearActiveSession().catch(() => {});
    };
  }, []);

  // 获取聊天历史并标记为已读（带缓存）
  useEffect(() => {
    if (selectedUser) {
      const fetchChatHistory = async () => {
        try {
          setLoading(true);
          const response = await chatService.getChatHistoryWithCache(selectedUser.userId, 200, loginTime);
          if (response.success) {
            const data = response.data;
            console.log('cacheHit?', data?.cacheHit);
            setHistoryMessages((data.historyMessages || []).reverse());
            setRecentMessages((data.recentMessages || []).reverse());
            setHasHistoryDivider(data.hasHistoryDivider || false);
          }
        } catch (error) {
          console.error('获取聊天历史失败:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchChatHistory();
      markMessagesAsRead(selectedUser.userId).then(() => {
        getUnreadMap().then(setUnreadMap);
      });
    }
  }, [selectedUser, loginTime]);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [historyMessages, recentMessages]);

  // 发送消息
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    const message: ChatMessage = {
      senderId: currentUserId,
      receiverId: selectedUser.userId,
      content: newMessage.trim(),
      messageType: 'TEXT'
    };

    if (wsConnected) {
      // 生成客户端幂等ID（UUID）
      const clientMsgId = (crypto && 'randomUUID' in crypto) ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      websocketService.sendMessage({ ...message, clientMsgId } as any);
      // 本地立即添加到 recentMessages
      setRecentMessages(prev => [
        ...prev,
        {
          ...message,
          createTime: new Date().toISOString()
        }
      ]);
      setNewMessage('');
    } else {
      // 可选：提示用户“连接中，请稍后重试”
      alert('WebSocket未连接，消息发送失败');
    }
  };

  // 处理回车键发送
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 用户列表项组件，显示未读红点
  const UserListItem = memo(({ user, selected, onClick }: { user: ChatUser; selected: boolean; onClick: () => void }) => {
    return (
      <div
        key={user.userId}
        className={`user-item ${selected ? 'active' : ''}`}
        onClick={onClick}
        style={{ position: 'relative' }}
      >
        <div className="user-avatar">
          <div className="avatar-circle">
            {(user.username || '').charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="user-info">
          <div className="user-name">{user.username}</div>
          <div className="user-status" style={{color: user.isOnline ? '#27ae60' : '#888'}}>
            {user.isOnline ? '在线' : '不在线'}
          </div>
        </div>
        {/* 只在未选中且有未读消息时显示红点（每个用户单独） */}
        {user.userId !== currentUserId && !selected && Number(unreadMap[String(user.userId)]) > 0 && (
          <span style={{
            position: 'absolute',
            right: 10,
            top: 18,
            background: '#f5222d',
            color: '#fff',
            borderRadius: '50%',
            minWidth: 18,
            height: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            padding: '0 5px',
            fontWeight: 700
          }}>{unreadMap[String(user.userId)] > 99 ? '99+' : unreadMap[String(user.userId)]}</span>
        )}
      </div>
    );
  });

  return (
    <div className="chat-container">
      {/* 左侧用户列表 */}
      <div className="chat-sidebar">
        <div className="chat-header">
          <h2 className="text-xl font-bold text-gray-800">学术交流区</h2>
        </div>
        <div className="user-list">
          {loading ? (
            <div className="loading">加载中...</div>
          ) : (
            users
              .filter(user => user.userId !== currentUserId)
              .map((user) => {
                return (
                  <UserListItem
                    key={user.userId}
                    user={user}
                    selected={selectedUser?.userId === user.userId}
                    onClick={() => {
                      setSelectedUser(user);
                      activePeerRef.current = user.userId;
                      chatService.setActiveSession(user.userId).catch(() => {});
                    }}
                  />
                );
              })
          )}
        </div>
      </div>

      {/* 右侧聊天区域 */}
      <div className="chat-main">
        {selectedUser ? (
          <>
            {/* 聊天头部 */}
            <div className="chat-header">
              <div className="chat-user-info">
                <div className="avatar-circle">
                  {(selectedUser.username || '').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="user-name">{selectedUser.username}</div>
                  <div className="user-status" style={{color: selectedUser.isOnline ? '#27ae60' : '#888'}}>
                    {selectedUser.isOnline ? '在线' : '不在线'}
                  </div>
                </div>
              </div>
            </div>

            {/* 消息列表 */}
            <div className="messages-container">
              {loading ? (
                <div className="loading">加载中...</div>
              ) : (
                <div className="messages-list">
                  {historyMessages
                    .filter(message => message.messageType !== 'SYSTEM')
                    .filter(message => !!selectedUser && (message.senderId === selectedUser.userId || message.receiverId === selectedUser.userId))
                    .map((message) => (
                    <div
                      key={message.id ?? message.createTime ?? Math.random()}
                      className={`message ${message.senderId === currentUserId ? 'sent' : 'received'}`}
                    >
                      <div className="message-content">
                        <div className="message-text">{message.content}</div>
                        <div className="message-time">
                          {message.createTime ? new Date(message.createTime).toLocaleString() : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* 只要historyMessages有内容就显示分割线 */}
                  {historyMessages.length > 0 && (
                    <div className="history-divider">
                      <div className="divider-line"></div>
                      <span className="divider-text">之前的聊天记录</span>
                      <div className="divider-line"></div>
                    </div>
                  )}
                  {recentMessages
                    .filter(message => message.messageType !== 'SYSTEM')
                    .filter(message => !!selectedUser && (message.senderId === selectedUser.userId || message.receiverId === selectedUser.userId))
                    .map((message) => (
                    <div
                      key={message.id ?? message.createTime ?? Math.random()}
                      className={`message ${message.senderId === currentUserId ? 'sent' : 'received'}`}
                    >
                      <div className="message-content">
                        <div className="message-text">{message.content}</div>
                        <div className="message-time">
                          {message.createTime ? new Date(message.createTime).toLocaleString() : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* 输入框 */}
            <div className="message-input-container">
              <div className="message-input-wrapper">
                <textarea
                  className="message-input"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入消息..."
                  rows={1}
                />
                <button
                  className="send-button"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  发送
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <div className="no-chat-content">
              <div className="no-chat-icon">💬</div>
              <h3>选择用户开始聊天</h3>
              <p>从左侧用户列表中选择一个用户开始学术交流</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage; 