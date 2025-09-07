import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

export interface WebSocketMessage {
  senderId: number;
  receiverId: number;
  content: string;
  messageType: string;
}

class WebSocketService {
  private stompClient: any = null;
  private isConnected = false;
  private messageCallbacks: ((message: any) => void)[] = [];
  private userStatusCallbacks: ((userStatus: any) => void)[] = [];
  private unreadCountCallbacks: ((count: number) => void)[] = [];
  private unreadMapCallbacks: ((map: Record<number, number>) => void)[] = [];
  private reconnectTimeout: any = null;
  private reconnectDelay = 3000;
  private userId: number | null = null;
  private onMessageReceived: ((message: any) => void) | null = null;
  
  // 🆕 连接状态监控
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' = 'disconnected';
  private connectionStateCallbacks: ((state: string, metrics: any) => void)[] = [];
  private connectionMetrics = {
    totalConnections: 0,
    totalReconnects: 0,
    lastConnectTime: 0,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5
  };

  // 🆕 统一的认证失败处理
  private handleAuthenticationFailure(reason: string = '认证失败') {
    console.warn(`[WebSocket] ${reason}，清除token并跳转到登录页面`);
    
    // 清除认证信息
    localStorage.removeItem('token');
    
    // 重置WebSocket状态
    this.isConnected = false;
    this.updateConnectionState('disconnected');
    
    // 跳转到登录页面
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  // 🆕 检查错误是否为认证相关错误
  private isAuthenticationError(error: any): boolean {
    if (!error) return false;
    
    const errorString = error.toString().toLowerCase();
    const errorMessage = error.message ? error.message.toLowerCase() : '';
    
    // 检查常见的认证失败标识
    const authErrorKeywords = [
      '401', 'unauthorized', 'authentication', 'forbidden', '403',
      'token', 'expired', 'invalid', 'access denied'
    ];
    
    return authErrorKeywords.some(keyword => 
      errorString.includes(keyword) || errorMessage.includes(keyword)
    );
  }

  connect(userId: number, onMessageReceived: (message: any) => void): Promise<boolean> {
    console.log(`[WebSocket] 开始连接 - userId: ${userId}`);
    this.userId = userId;
    this.onMessageReceived = onMessageReceived;
    
    // 🆕 更新连接状态
    this.updateConnectionState('connecting');
    this.connectionMetrics.totalConnections++;
    
    console.log(`[WebSocket] 连接状态更新为 connecting, 总连接次数: ${this.connectionMetrics.totalConnections}`);
    
    return new Promise((resolve) => {
      if (!userId) {
        console.error('[WebSocket] 缺少userId，取消连接');
        this.handleAuthenticationFailure('缺少用户ID');
        resolve(false);
        return;
      }
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('[WebSocket] 未找到登录token，取消连接');
          this.handleAuthenticationFailure('未找到登录token');
          resolve(false);
          return;
        }
        const socket = new SockJS(`http://localhost:8081/ws?token=${token}`);
        this.stompClient = Stomp.over(socket);
        
        // 配置 WebSocket 心跳机制
        this.stompClient.heartbeatIncoming = 30000;  // 期望每30秒收到服务器心跳
        this.stompClient.heartbeatOutgoing = 30000;  // 每30秒向服务器发送心跳
        
        // 关闭STOMP冗余日志
        if (this.stompClient && typeof this.stompClient.debug === 'function') {
          this.stompClient.debug = () => {};
        }
        let settled = false;
        this.stompClient.connect(
          {},
          () => {
            this.isConnected = true;
            this.connectionMetrics.lastConnectTime = Date.now();
            this.connectionMetrics.reconnectAttempts = 0; // 重置重连计数
            this.updateConnectionState('connected');
            console.log('WebSocket连接成功');
            // 订阅个人消息
            this.stompClient.subscribe('/user/queue/messages', (message: any) => {
              try {
                const receivedMessage = JSON.parse(message.body);
                // 简单校验字段，避免不完整消息导致前端状态异常
                if (receivedMessage && typeof receivedMessage.senderId === 'number' && typeof receivedMessage.receiverId === 'number') {
                  console.log('[WebSocket] 收到普通消息:', receivedMessage);
                  onMessageReceived(receivedMessage);
                }
              } catch (e) {
                console.error('[WebSocket] 解析普通消息失败', e);
              }
            });
            
            // 🆕 订阅离线消息队列
            this.stompClient.subscribe('/user/queue/offline-messages', (message: any) => {
              try {
                const receivedMessage = JSON.parse(message.body);
                // 简单校验字段，避免不完整消息导致前端状态异常
                if (receivedMessage && typeof receivedMessage.senderId === 'number' && typeof receivedMessage.receiverId === 'number') {
                  console.log('[WebSocket] 收到离线消息:', receivedMessage);
                  // 🎯 标记为离线消息，前端可以特殊处理（比如显示不同的样式）
                  receivedMessage.isOfflineMessage = true;
                  onMessageReceived(receivedMessage);
                }
              } catch (e) {
                console.error('[WebSocket] 解析离线消息失败', e);
              }
            });
            // 订阅用户状态变更
            this.stompClient.subscribe('/topic/user-status', (message: any) => {
              const userStatus = JSON.parse(message.body);
              console.log('[WebSocket] 收到用户状态推送', userStatus);
              this.userStatusCallbacks.forEach(cb => cb(userStatus));
            });
            // 订阅全局未读数
            this.stompClient.subscribe('/user/queue/unread-count', (message: any) => {
              const count = JSON.parse(message.body);
              this.unreadCountCallbacks.forEach(cb => cb(count));
            });
            // 订阅每个发送者的未读数
            this.stompClient.subscribe('/user/queue/unread-map', (message: any) => {
              let map;
              try {
                map = JSON.parse(message.body);
              } catch {
                map = {};
              }
              console.log('📨 [WebSocket] 收到unreadMap更新', {
                map,
                timestamp: new Date().toLocaleTimeString(),
                keys: Object.keys(map),
                values: Object.values(map)
              });
              this.unreadMapCallbacks.forEach(cb => cb(map));
            });
            // 发送用户加入消息
            this.stompClient.send('/app/chat.addUser', {}, JSON.stringify({ userId }));
            if (!settled) {
              settled = true;
              resolve(true);
            }
          },
          (error: any) => {
            console.error('WebSocket连接失败:', error);
            
            // 🆕 检查是否为认证相关错误
            if (this.isAuthenticationError(error)) {
              this.handleAuthenticationFailure('WebSocket连接认证失败');
              if (!settled) {
                settled = true;
                resolve(false);
              }
              return; // 认证失败不进行重连
            }
            
            this.isConnected = false;
            this.updateConnectionState('disconnected');
            if (!settled) {
              settled = true;
              resolve(false);
            }
            // 智能重连机制（仅在非认证错误时执行）
            this.handleReconnect();
          }
        );
      } catch (error) {
        console.error('WebSocket初始化失败:', error);
        
        // 🆕 检查是否为认证相关错误
        if (this.isAuthenticationError(error)) {
          this.handleAuthenticationFailure('WebSocket初始化认证失败');
          resolve(false);
          return; // 认证失败不进行重连
        }
        
        this.isConnected = false;
        this.updateConnectionState('disconnected');
        resolve(false);
        // 智能重连机制（仅在非认证错误时执行）
        this.handleReconnect();
      }
    });
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.disconnect(() => {
        console.log('WebSocket连接已断开');
        this.isConnected = false;
        this.updateConnectionState('disconnected');
      });
    }
    
    // 🆕 清理重连定时器
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // 🆕 重置状态
    this.isConnected = false;
    this.updateConnectionState('disconnected');
  }

  sendMessage(message: WebSocketMessage) {
    // 🆕 发送消息前检查认证状态
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('[WebSocket] 发送消息时发现token缺失');
      this.handleAuthenticationFailure('发送消息时token缺失');
      return;
    }

    if (this.isConnected && this.stompClient) {
      console.log('[WebSocket] 发送消息到 /app/chat.sendMessage:', message);
      this.stompClient.send('/app/chat.sendMessage', {}, JSON.stringify(message));
    } else {
      console.error('WebSocket未连接，尝试重连...');
      // 可选：自动重连并延迟发送
      // 这里只做提示，实际可根据需要实现重连逻辑
    }
  }

  isConnectedToServer() {
    return this.isConnected;
  }

  // 订阅用户状态变更
  onUserStatusChange(callback: (userStatus: any) => void) {
    this.userStatusCallbacks.push(callback);
  }

  onUnreadCount(callback: (count: number) => void) {
    this.unreadCountCallbacks.push(callback);
  }
  onUnreadMap(callback: (map: Record<number, number>) => void) {
    this.unreadMapCallbacks.push(callback);
  }

  // 🆕 连接状态监控方法
  onConnectionStateChange(callback: (state: string, metrics: any) => void) {
    this.connectionStateCallbacks.push(callback);
  }

  private updateConnectionState(newState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting') {
    const oldState = this.connectionState;
    this.connectionState = newState;
    
    console.log(`[WebSocket] 连接状态变更: ${oldState} -> ${newState}`);
    
    // 通知所有监听器
    this.connectionStateCallbacks.forEach(callback => {
      callback(newState, { ...this.connectionMetrics });
    });
  }

  private handleReconnect() {
    // 🆕 重连前检查token是否仍然存在
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('[WebSocket] 重连时发现token已被清除，停止重连');
      this.updateConnectionState('disconnected');
      return;
    }

    if (this.connectionMetrics.reconnectAttempts >= this.connectionMetrics.maxReconnectAttempts) {
      console.error('[WebSocket] 已达到最大重连次数，停止重连');
      this.updateConnectionState('disconnected');
      return;
    }

    if (!this.reconnectTimeout) {
      this.connectionMetrics.reconnectAttempts++;
      this.connectionMetrics.totalReconnects++;
      this.updateConnectionState('reconnecting');
      
      const delay = Math.min(this.reconnectDelay * this.connectionMetrics.reconnectAttempts, 30000); // 最大30秒
      console.log(`[WebSocket] 第${this.connectionMetrics.reconnectAttempts}次重连，${delay}ms后执行`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectTimeout = null;
        if (this.userId && this.onMessageReceived) {
          this.connect(this.userId, this.onMessageReceived);
        }
      }, delay);
    }
  }

  // 🆕 获取连接状态和指标
  getConnectionStatus() {
    return {
      state: this.connectionState,
      isConnected: this.isConnected,
      metrics: { ...this.connectionMetrics }
    };
  }

  // 🆕 手动重置重连计数
  resetReconnectAttempts() {
    this.connectionMetrics.reconnectAttempts = 0;
  }

  // 🆕 手动检查认证状态
  checkAuthenticationStatus(): boolean {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('[WebSocket] 检查认证状态：未找到token');
      this.handleAuthenticationFailure('认证状态检查失败');
      return false;
    }
    
    console.log('[WebSocket] 认证状态检查：token存在');
    return true;
  }

  // 🆕 强制退出登录（清除所有状态并跳转）
  forceLogout(reason: string = '强制退出') {
    console.log(`[WebSocket] ${reason}`);
    this.disconnect(); // 先断开连接
    this.handleAuthenticationFailure(reason);
  }

  // 🆕 应用启动时验证token有效性
  async validateTokenOnStartup(): Promise<boolean> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('[WebSocket] 启动验证：未找到token');
      return false;
    }

    try {
      // 向后端验证token有效性
      const response = await fetch('http://localhost:8081/api/auth/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('[WebSocket] 启动验证：token有效');
        return true;
      } else {
        console.warn('[WebSocket] 启动验证：token无效，状态码:', response.status);
        this.handleAuthenticationFailure('应用启动时token验证失败');
        return false;
      }
    } catch (error) {
      console.error('[WebSocket] 启动验证：验证请求失败', error);
      // 网络错误时不强制退出，给用户一次机会
      console.warn('[WebSocket] 由于网络问题无法验证token，允许继续使用');
      return true;
    }
  }

  // 🆕 定期验证token有效性（可用于心跳检测）
  async validateTokenPeriodically(): Promise<boolean> {
    const token = localStorage.getItem('token');
    if (!token) {
      this.handleAuthenticationFailure('定期检查时发现token缺失');
      return false;
    }

    try {
      const response = await fetch('http://localhost:8081/api/auth/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        this.handleAuthenticationFailure('定期token验证失败');
        return false;
      }

      return true;
    } catch (error) {
      console.error('[WebSocket] 定期token验证失败', error);
      return false;
    }
  }
}

export const websocketService = new WebSocketService(); 