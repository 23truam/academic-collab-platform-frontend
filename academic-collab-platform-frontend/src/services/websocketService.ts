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

  connect(userId: number, onMessageReceived: (message: any) => void): Promise<boolean> {
    this.userId = userId;
    this.onMessageReceived = onMessageReceived;
    return new Promise((resolve) => {
      if (!userId) {
        console.error('[WebSocket] 缺少userId，取消连接');
        this.isConnected = false;
        resolve(false);
        return;
      }
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('[WebSocket] 未找到登录token，取消连接');
          this.isConnected = false;
          resolve(false);
          return;
        }
        const socket = new SockJS(`http://localhost:8081/ws?token=${token}`);
        this.stompClient = Stomp.over(socket);
        // 关闭STOMP冗余日志
        if (this.stompClient && typeof this.stompClient.debug === 'function') {
          this.stompClient.debug = () => {};
        }
        let settled = false;
        this.stompClient.connect(
          {},
          () => {
            this.isConnected = true;
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
              console.log('收到unreadMap', map);
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
            this.isConnected = false;
            if (!settled) {
              settled = true;
              resolve(false);
            }
            // 自动重连
            if (!this.reconnectTimeout) {
              this.reconnectTimeout = setTimeout(() => {
                this.reconnectTimeout = null;
                if (this.userId && this.onMessageReceived) {
                  this.connect(this.userId, this.onMessageReceived);
                }
              }, this.reconnectDelay);
            }
          }
        );
      } catch (error) {
        console.error('WebSocket初始化失败:', error);
        this.isConnected = false;
        resolve(false);
        // 自动重连
        if (!this.reconnectTimeout) {
          this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            if (this.userId && this.onMessageReceived) {
              this.connect(this.userId, this.onMessageReceived);
            }
          }, this.reconnectDelay);
        }
      }
    });
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.disconnect(() => {
        console.log('WebSocket连接已断开');
        this.isConnected = false;
      });
    }
  }

  sendMessage(message: WebSocketMessage) {
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
}

export const websocketService = new WebSocketService(); 