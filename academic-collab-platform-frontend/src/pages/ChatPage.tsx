import React, { useState, useEffect, useRef, memo } from 'react';
import { chatService, ChatMessage, ChatUser, markMessagesAsRead, getUnreadMap, getAllUsersWithStatus } from '../services/chatService';
import { websocketService } from '../services/websocketService';
// import { authService } from '../services/authService'; // 如果需要的话可以取消注释
import { beaconLogout } from '../utils/beaconLogout';
import './ChatPage.css';

const ChatPage: React.FC = () => {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // const [unreadCount, setUnreadCount] = useState<number>(0); // 如果需要的话可以取消注释
  const [unreadMap, setUnreadMap] = useState<{[userId: string]: number}>({});
  // const [hasHistoryDivider, setHasHistoryDivider] = useState(false); // 如果需要的话可以取消注释
  const [loginTime] = useState<number>(() => {
    // 🔧 使用用户真正的登录时间作为分割点
    // 登录前的消息 = 历史消息，登录后的消息 = 新消息
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        if (userObj.loginTime) {
          console.log('🕰️ [ChatPage] 使用用户登录时间:', new Date(userObj.loginTime));
          return userObj.loginTime;
        }
      } catch (e) {
        console.error('解析用户信息失败:', e);
      }
    }
    
    // 如果没有登录时间，使用当前时间减去1小时，这样能看到一些历史消息
    const fallbackTime = Date.now() - (60 * 60 * 1000); // 1小时前
    console.log('🕰️ [ChatPage] 使用fallback时间（1小时前）:', new Date(fallbackTime));
    return fallbackTime;
  });
  const [historyMessages, setHistoryMessages] = useState<ChatMessage[]>([]);
  const [recentMessages, setRecentMessages] = useState<ChatMessage[]>([]);
  // 记录当前活跃会话对端ID，避免闭包导致的旧 selectedUser
  const activePeerRef = useRef<number | null>(null);

  // 🕰️ 统一时间格式化函数 - 显示北京时间
  const formatMessageTime = (timeString: string): string => {
    try {
      const date = new Date(timeString);
      // 确保显示北京时间 (UTC+8)
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Shanghai', // 强制使用北京时间
        hour12: false // 使用24小时格式
      };
      return date.toLocaleString('zh-CN', options);
    } catch (error) {
      console.error('时间格式化错误:', error);
      return timeString;
    }
  };

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
        const response = await getAllUsersWithStatus();
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
    // websocketService.onUnreadCount(setUnreadCount); // 如果需要未读数量功能可以取消注释
    websocketService.onUnreadMap(setUnreadMap);
  }, []);

  // 在unreadMap变化时打印一次
  useEffect(() => {
    console.log('📊 [ChatPage] unreadMap 变化:', {
      unreadMap,
      timestamp: new Date().toLocaleTimeString(),
      selectedUserId: selectedUser?.userId,
      activePeer: activePeerRef.current
    });
  }, [unreadMap]);

  // 🆕 智能WebSocket连接 - 检查是否已连接，避免重复连接
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (!currentUserId) {
          console.error('未获取到当前用户ID，跳过WebSocket连接');
          setWsConnected(false);
          return;
        }
        
        // 🆕 检查WebSocket是否已经连接
        if (websocketService.isConnectedToServer()) {
          console.log('[ChatPage] WebSocket已连接，跳过重复连接');
          setWsConnected(true);
          return;
        }
        
        console.log('[ChatPage] WebSocket未连接，开始建立连接...');
        websocketService
          .connect(currentUserId, (message) => {
            const activePeer = activePeerRef.current;
            console.log('🔔 [ChatPage] 收到WebSocket消息详情:', {
              messageId: message.id,
              senderId: message.senderId,
              receiverId: message.receiverId,
              content: message.content,
              currentUserId,
              activePeer,
              timestamp: new Date().toLocaleTimeString()
            });
            
            // 🔧 修复消息接收逻辑 - 更精确的匹配条件
            const shouldAddToRecentMessages = activePeer && (
              (message.senderId === activePeer && message.receiverId === currentUserId) ||
              (message.senderId === currentUserId && message.receiverId === activePeer)
            );
            
            console.log('🔍 [ChatPage] 消息匹配检查:', {
              activePeer,
              messageSenderId: message.senderId,
              messageReceiverId: message.receiverId,
              currentUserId,
              shouldAdd: shouldAddToRecentMessages,
              matchReason: shouldAddToRecentMessages ? 
                (message.senderId === activePeer ? '收到来自当前聊天对象的消息' : '自己发给当前聊天对象的消息') :
                '不匹配当前聊天会话'
            });
            
            if (shouldAddToRecentMessages) {
              setRecentMessages(prev => {
                // 消息去重
                if (message.id && prev.some(m => m.id === message.id)) {
                  console.log('🚫 [ChatPage] 消息去重-ID重复:', message.id);
                  return prev;
                }
                if (message.createTime && prev.some(m => m.createTime === message.createTime && m.content === message.content)) {
                  console.log('🚫 [ChatPage] 消息去重-时间内容重复:', message.createTime, message.content);
                  return prev;
                }
                console.log('✅ [ChatPage] 添加新消息到recentMessages:', {
                  messageId: message.id,
                  content: message.content,
                  currentCount: prev.length
                });
                return [...prev, message];
              });
            } else {
              console.log('🚫 [ChatPage] 消息不匹配当前会话，不添加到recentMessages');
            }
            
            // 🔧 完全禁用WebSocket自动标记已读，只通过手动点击用户来标记
            console.log('📬 [ChatPage] WebSocket自动标记已读已禁用');
            
            // if (activePeer && message.senderId === activePeer) {
            //   console.log('📖 [ChatPage] 自动标记已读: 收到来自当前会话对端的消息', {
            //     activePeer,
            //     messageSenderId: message.senderId,
            //     currentUserId,
            //     messageContent: message.content
            //   });
            //   markMessagesAsRead(activePeer).catch(() => {});
            // }
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
          console.log('🔍 [ChatPage] 发送请求参数:', { 
            userId: selectedUser.userId, 
            limit: 200, 
            loginTime,
            loginTimeDate: new Date(loginTime),
            currentTimeForReference: new Date(),
            timeDiffHours: (Date.now() - loginTime) / (1000 * 60 * 60)
          });
          // 🔧 使用用户登录时间作为分割点
          const response = await chatService.getChatHistoryWithCache(selectedUser.userId, 200, loginTime);
          if (response.success) {
            const data = response.data;
            console.log('📋 [ChatPage] 后端返回数据:', {
              historyCount: data.historyMessages?.length || 0,
              recentCount: data.recentMessages?.length || 0,
              hasHistoryDivider: data.hasHistoryDivider,
              cacheHit: data.cacheHit,
              serverLoginTime: data.loginTime,
              shouldShowDivider: (data.historyMessages?.length || 0) > 0
            });
            console.log('📋 [ChatPage] 消息详情:', {
              historyMessages: data.historyMessages?.map((m: ChatMessage) => ({
                id: m.id, 
                content: m.content, 
                senderId: m.senderId, 
                receiverId: m.receiverId,
                createTime: m.createTime,
                createTimeDate: m.createTime ? new Date(m.createTime) : null
              })) || [],
              recentMessages: data.recentMessages?.map((m: ChatMessage) => ({
                id: m.id, 
                content: m.content, 
                senderId: m.senderId, 
                receiverId: m.receiverId,
                createTime: m.createTime,
                createTimeDate: m.createTime ? new Date(m.createTime) : null
              })) || []
            });
            setHistoryMessages(data.historyMessages || []);
            setRecentMessages(data.recentMessages || []);
            // setHasHistoryDivider(data.hasHistoryDivider || false); // 不再需要，因为直接使用historyMessages.length > 0判断
          }
        } catch (error) {
          console.error('获取聊天历史失败:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchChatHistory();
      // 🔧 移除自动标记已读逻辑，改为只在用户真正查看消息时才标记已读
      // 自动标记会导致其他用户的未读提示错误消失
      // setTimeout(() => {
      //   markMessagesAsRead(selectedUser.userId).then(() => {
      //     getUnreadMap().then(setUnreadMap);
      //   });
      // }, 3000); // 3秒延迟
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
                      console.log('👤 [ChatPage] 用户点击选择聊天对象:', {
                        userId: user.userId,
                        userName: user.username,
                        previousActivePeer: activePeerRef.current,
                        currentUserId,
                        timestamp: new Date().toLocaleTimeString()
                      });
                      
                      setSelectedUser(user);
                      activePeerRef.current = user.userId;
                      console.log('🔄 [ChatPage] activePeer更新为:', user.userId);
                      chatService.setActiveSession(user.userId).catch(() => {});
                      
                      // 🔧 手动标记已读：只在用户真正点击选择用户时才标记已读
                      setTimeout(() => {
                        console.log('📖 [ChatPage] 执行手动标记已读:', {
                          userId: user.userId,
                          timestamp: new Date().toLocaleTimeString()
                        });
                        markMessagesAsRead(user.userId).then(() => {
                          console.log('✅ [ChatPage] 标记已读成功，更新unreadMap');
                          getUnreadMap().then(setUnreadMap);
                        }).catch(err => {
                          console.error('❌ [ChatPage] 标记已读失败:', err);
                        });
                      }, 1000); // 1秒延迟，确保消息加载完成
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
                    .filter(message => !!selectedUser && (
                      (message.senderId === currentUserId && message.receiverId === selectedUser.userId) ||
                      (message.senderId === selectedUser.userId && message.receiverId === currentUserId)
                    ))
                    .map((message) => (
                    <div
                      key={message.id ?? message.createTime ?? Math.random()}
                      className={`message ${message.senderId === currentUserId ? 'sent' : 'received'}`}
                    >
                      <div className="message-content">
                        <div className="message-text">{message.content}</div>
                        <div className="message-time">
                          {message.createTime ? formatMessageTime(message.createTime) : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* 只要historyMessages有内容就显示分割线 */}
                  {historyMessages.length > 0 && recentMessages.length > 0 && (
                    <div className="history-divider">
                      <div className="divider-line"></div>
                      <span className="divider-text">登录前的历史消息</span>
                      <div className="divider-line"></div>
                    </div>
                  )}
                  {/* 调试信息 */}
                  {historyMessages.length > 0 && (
                    <div style={{fontSize: '12px', color: '#999', textAlign: 'center', margin: '5px 0'}}>
                      历史消息: {historyMessages.length}条, 新消息: {recentMessages.length}条
                    </div>
                  )}
                  {recentMessages
                    .filter(message => message.messageType !== 'SYSTEM')
                    .filter(message => !!selectedUser && (
                      (message.senderId === currentUserId && message.receiverId === selectedUser.userId) ||
                      (message.senderId === selectedUser.userId && message.receiverId === currentUserId)
                    ))
                    .map((message) => (
                    <div
                      key={message.id ?? message.createTime ?? Math.random()}
                      className={`message ${message.senderId === currentUserId ? 'sent' : 'received'} ${message.isOfflineMessage ? 'offline-message' : ''}`}
                    >
                      <div className="message-content">
                        <div className="message-text">
                          {message.content}
                          {message.isOfflineMessage && (
                            <span className="offline-message-indicator">离线消息</span>
                          )}
                        </div>
                        <div className="message-time">
                          {message.createTime ? formatMessageTime(message.createTime) : ''}
                          {message.isOfflineMessage && ' (离线时收到)'}
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