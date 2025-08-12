# 学术交流区聊天功能

## 功能概述

本项目新增了仿微信聊天框的学术交流功能，允许用户之间进行实时聊天交流。该功能完全前后端分离，使用WebSocket技术实现实时通信。

## 主要特性

### 1. 仿微信聊天界面
- 左侧用户列表，显示可聊天的用户
- 右侧聊天区域，显示消息历史
- 支持发送和接收消息
- 消息气泡样式，区分发送和接收

### 2. 实时通信
- 使用WebSocket技术实现实时消息推送
- 支持在线状态显示
- 消息即时送达

### 3. 消息管理
- 消息历史记录保存
- 未读消息标记
- 消息已读状态

## 技术架构

### 后端技术栈
- **Spring Boot 2.7.18**: 主框架
- **Spring WebSocket**: WebSocket支持
- **MyBatis Plus**: 数据库操作
- **MySQL**: 数据存储
- **STOMP**: WebSocket消息协议

### 前端技术栈
- **React 18**: 前端框架
- **TypeScript**: 类型安全
- **SockJS**: WebSocket客户端
- **STOMP.js**: STOMP协议客户端
- **Tailwind CSS**: 样式框架

## 数据库设计

### 1. 聊天消息表 (chat_messages)
```sql
CREATE TABLE chat_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sender_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'TEXT',
    is_read BOOLEAN DEFAULT FALSE,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2. 用户在线状态表 (user_online_status)
```sql
CREATE TABLE user_online_status (
    user_id BIGINT PRIMARY KEY,
    is_online BOOLEAN DEFAULT FALSE,
    last_online_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(255)
);
```

## API接口

### REST API
- `POST /api/chat/send` - 发送消息
- `GET /api/chat/history/{userId}` - 获取聊天历史
- `GET /api/chat/users` - 获取用户列表
- `POST /api/chat/mark-read/{userId}` - 标记消息已读
- `GET /api/chat/unread-count` - 获取未读消息数

### WebSocket端点
- `/ws` - WebSocket连接端点
- `/app/chat.sendMessage` - 发送消息
- `/app/chat.addUser` - 用户加入
- `/app/chat.leave` - 用户离开
- `/user/{userId}/queue/messages` - 个人消息订阅
- `/topic/public` - 公共消息订阅

## 安装和运行

### 1. 数据库初始化
```sql
-- 执行数据库表创建脚本
source academic-collab-platform-backend/src/main/resources/sql/chat_tables.sql

-- 执行初始化数据脚本
source academic-collab-platform-backend/src/main/resources/sql/init_chat_data.sql
```

### 2. 后端启动
```bash
cd academic-collab-platform-backend
mvn spring-boot:run
```

### 3. 前端启动
```bash
cd frontend
npm install
npm run dev
```

### 4. 访问聊天功能
- 打开浏览器访问: `http://localhost:5173`
- 点击导航栏中的"学术交流区"
- 选择用户开始聊天

## 使用说明

### 1. 用户列表
- 左侧显示所有可聊天的用户
- 点击用户头像或姓名选择聊天对象
- 显示用户在线状态

### 2. 发送消息
- 在底部输入框输入消息内容
- 按回车键或点击发送按钮发送消息
- 支持实时消息推送

### 3. 消息历史
- 右侧显示与选中用户的聊天历史
- 消息按时间顺序排列
- 自动滚动到最新消息

### 4. 在线状态
- 实时显示用户在线/离线状态
- 连接状态指示器

## 配置说明

### 后端配置
在 `application.properties` 中配置数据库连接：
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/academic_collab
spring.datasource.username=your_username
spring.datasource.password=your_password
```

### 前端配置
在 `chatService.ts` 中配置API地址：
```typescript
const API_BASE_URL = 'http://localhost:8080/api';
```

在 `websocketService.ts` 中配置WebSocket地址：
```typescript
const socket = new SockJS('http://localhost:8080/ws');
```

## 扩展功能

### 1. 消息类型支持
- 文本消息 (TEXT)
- 图片消息 (IMAGE) - 待实现
- 文件消息 (FILE) - 待实现

### 2. 群聊功能
- 创建群聊
- 群成员管理
- 群消息广播

### 3. 消息搜索
- 按关键词搜索消息
- 按时间范围搜索

### 4. 消息通知
- 桌面通知
- 声音提醒
- 未读消息计数

## 注意事项

1. **用户认证**: 当前版本使用固定用户ID，实际使用时需要集成JWT认证
2. **消息持久化**: 所有消息都会保存到数据库
3. **在线状态**: 用户在线状态会实时更新
4. **错误处理**: 包含完整的错误处理机制
5. **响应式设计**: 支持移动端访问

## 故障排除

### WebSocket连接失败
- 检查后端服务是否启动
- 确认WebSocket端点配置正确
- 检查防火墙设置

### 消息发送失败
- 检查网络连接
- 确认用户ID正确
- 查看浏览器控制台错误信息

### 数据库连接问题
- 检查数据库服务状态
- 确认数据库连接配置
- 验证表结构是否正确 