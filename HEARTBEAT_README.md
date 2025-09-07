# 心跳机制使用说明

## 概述

心跳机制用于自动管理用户在线状态，通过定时发送心跳包来判断用户是否在线，并在用户长时间无响应时自动标记为离线。

## 特性

- ✅ **不影响现有JWT校验机制** - 完全复用现有的JWT验证逻辑
- ✅ **自动在线状态管理** - 前端定时发送心跳，后端自动判断在线状态
- ✅ **页面关闭自动下线** - 使用sendBeacon确保页面关闭时能发送下线请求
- ✅ **Token过期自动处理** - 心跳失败时自动清除本地token并跳转登录页
- ✅ **实时在线状态检查** - 提供Hook检查任意用户的在线状态

## 后端实现

### 1. HeartbeatController

位置：`academic-collab-platform-backend/src/main/java/com/example/academic_collab_platform_backend/controller/HeartbeatController.java`

**主要接口：**

- `POST /api/heartbeat` - 发送心跳包
- `GET /api/heartbeat/status/{email}` - 检查用户在线状态
- `GET /api/heartbeat/online-users` - 获取在线用户列表

**工作原理：**
- 心跳接口接收JWT token，验证用户身份
- 将用户邮箱作为key存储到Redis，120秒过期
- 前端每30秒发送一次心跳，确保用户在线状态

### 2. 安全配置

心跳接口**不需要**在SecurityConfig中特殊配置，完全使用现有的JWT校验机制。

## 前端实现

### 1. useHeartbeat Hook

位置：`frontend/src/hooks/useHeartbeat.ts`

**使用方法：**
```tsx
import { useHeartbeat } from '../hooks/useHeartbeat';

const MyComponent = () => {
  const token = localStorage.getItem('token');
  const { sendHeartbeatNow } = useHeartbeat(token, 30000); // 30秒间隔
  
  // 手动发送心跳
  const handleManualHeartbeat = () => {
    sendHeartbeatNow();
  };
  
  return <div>...</div>;
};
```

### 2. HeartbeatProvider 组件

位置：`frontend/src/components/HeartbeatProvider.tsx`

**使用方法：**
```tsx
import HeartbeatProvider from './components/HeartbeatProvider';

const App = () => {
  return (
    <HeartbeatProvider>
      {/* 你的应用内容 */}
    </HeartbeatProvider>
  );
};
```

### 3. OnlineStatusIndicator 组件

位置：`frontend/src/components/OnlineStatusIndicator.tsx`

**使用方法：**
```tsx
import OnlineStatusIndicator from './components/OnlineStatusIndicator';

const UserCard = ({ user }) => {
  return (
    <div>
      <h3>{user.name}</h3>
      <OnlineStatusIndicator email={user.email} />
    </div>
  );
};
```

## 配置说明

### 心跳间隔配置（已优化）

- **WebSocket 心跳间隔**：30秒（用于连接保活）
- **HTTP 心跳间隔**：60秒（用于用户状态维护）
- **后端过期时间**：90秒
- **重连策略**：指数退避，最多5次，最大延迟30秒

### Redis Key 格式

- 在线状态：`online:{email}`
- 值：时间戳（毫秒）
- 过期时间：120秒

## 使用示例

### 1. 在聊天页面中使用

```tsx
import { useHeartbeat } from '../hooks/useHeartbeat';
import OnlineStatusIndicator from '../components/OnlineStatusIndicator';

const ChatPage = () => {
  const token = localStorage.getItem('token');
  useHeartbeat(token); // 启动心跳机制
  
  return (
    <div>
      <h1>聊天室</h1>
      <div className="user-list">
        {users.map(user => (
          <div key={user.id}>
            <span>{user.name}</span>
            <OnlineStatusIndicator email={user.email} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 2. 在用户列表中显示在线状态

```tsx
import OnlineStatusIndicator from '../components/OnlineStatusIndicator';

const UserList = ({ users }) => {
  return (
    <div>
      {users.map(user => (
        <div key={user.id} className="user-item">
          <img src={user.avatar} alt={user.name} />
          <div>
            <h4>{user.name}</h4>
            <OnlineStatusIndicator 
              email={user.email} 
              showText={true}
              className="mt-1"
            />
          </div>
        </div>
      ))}
    </div>
  );
};
```

## 故障排除

### 1. 心跳失败

**可能原因：**
- Token过期
- 网络连接问题
- 后端服务异常

**解决方案：**
- 检查浏览器控制台错误信息
- 验证token有效性
- 检查后端服务状态

### 2. 在线状态不准确

**可能原因：**
- 心跳间隔设置不当
- Redis过期时间配置错误
- 网络延迟导致心跳丢失

**解决方案：**
- 调整心跳间隔和过期时间
- 检查网络连接稳定性
- 监控Redis服务状态

### 3. 页面关闭时未自动下线

**可能原因：**
- sendBeacon请求失败
- 后端logout接口异常

**解决方案：**
- 检查logout接口是否支持FormData参数
- 验证sendBeacon请求格式
- 查看后端日志

## 注意事项

1. **性能考虑**：心跳间隔不宜过短，避免频繁请求
2. **网络优化**：心跳包数据量小，对网络影响微乎其微
3. **安全性**：心跳接口使用现有JWT校验，安全性有保障
4. **兼容性**：sendBeacon在现代浏览器中支持良好
5. **扩展性**：可轻松扩展为WebSocket心跳机制

## 扩展功能

### 1. WebSocket心跳

如需更实时的在线状态，可扩展为WebSocket心跳机制：

```tsx
// 前端WebSocket心跳
const ws = new WebSocket('ws://localhost:8080/ws');
setInterval(() => {
  ws.send(JSON.stringify({ type: 'heartbeat', token }));
}, 30000);
```

### 2. 批量在线状态检查

```tsx
// 批量检查多个用户在线状态
const checkMultipleUsers = async (emails: string[]) => {
  const results = await Promise.all(
    emails.map(email => 
      axios.get(`/api/heartbeat/status/${email}`)
    )
  );
  return results.map(r => r.data);
};
```

### 3. 在线状态统计

```tsx
// 获取在线用户统计
const getOnlineStats = async () => {
  const response = await axios.get('/api/heartbeat/online-users');
  return response.data;
};
``` 