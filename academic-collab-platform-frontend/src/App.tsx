import React, { useEffect } from 'react';
import {Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PersonalPage from './pages/PersonalPage';
import CollaborationAnalysisPage from './pages/CollaborationAnalysisPage';
import ProfessorSearchPage from './pages/ProfessorSearchPage';
import DiscoverPage from './pages/DiscoverPage';
import LoginPage from './pages/LoginPage';
import Navbar from './components/Navbar';
import Homepage from "./pages/Homepage.tsx";
import NodeList from './pages/NodeList';
import AuthorDocument from './pages/AuthorDocument.tsx';
import * as echarts from 'echarts';
import RegisterPage from './pages/RegisterPage';
import CollaborationPrediction from './pages/CollaborationPrediction';
import LiteratureSearchPage from './pages/LiteratureSearchPage';
import ChatPage from './pages/ChatPage';
import { chatService } from './services/chatService';
import HeartbeatProvider from './components/HeartbeatProvider';
import { websocketService } from './services/websocketService';
import { authService } from './services/authService';
import ConnectionStatus from './components/ConnectionStatus';
import DebugPanel from './components/DebugPanel';

interface NodeData {
    id: string; // 节点的 ID，根据实际数据结构调整
    name: string; // 节点的名称，根据实际数据结构调整
}

const App: React.FC = () => {
    const [authenticated, setAuthenticated] = React.useState(false);
    const handleNodeClick = (nodeData: NodeData) => {
        // 处理节点点击事件的逻辑
        console.log("Node clicked:", nodeData);
    };

    const location = useLocation();
    const hideNavbarRoutes = ['/login', '/register', '/homepage'];
    const showNavbar = !hideNavbarRoutes.includes(location.pathname);

    useEffect(() => {
        // 🆕 检查localStorage状态
        const checkLocalStorageStatus = () => {
            const token = localStorage.getItem('token');
            const user = localStorage.getItem('user');
            console.log('[App] localStorage状态检查:', {
                hasToken: !!token,
                tokenLength: token?.length,
                hasUser: !!user,
                userRaw: user,
                userParsed: user ? JSON.parse(user) : null
            });
        };

        // 🆕 应用启动时验证token有效性并建立WebSocket连接
        const validateAuthOnStartup = async () => {
            // 先检查localStorage状态
            checkLocalStorageStatus();
            
            const token = localStorage.getItem('token');
            if (token) {
                console.log('[App] 检测到已登录状态，验证token有效性...');
                try {
                    const isValid = await websocketService.validateTokenOnStartup();
                    if (!isValid) {
                        console.warn('[App] token验证失败，将自动跳转到登录页');
                        // 注意：handleAuthenticationFailure内部会自动跳转到登录页
                    } else {
                        console.log('[App] token验证成功，准备建立WebSocket连接');
                        
                        // 🆕 获取当前用户信息并建立WebSocket连接
                        const currentUser = authService.getCurrentUser();
                        console.log('[App] 获取到的用户信息:', currentUser);
                        
                        // 🔧 修复字段名问题：可能是userId而不是id
                        const userId = currentUser?.userId || currentUser?.id;
                        if (currentUser && userId) {
                            console.log('[App] 建立WebSocket连接，userId:', userId);
                            try {
                                const connected = await websocketService.connect(userId, (message) => {
                                    console.log('[App] 收到WebSocket消息:', message);
                                    // 这里可以处理全局消息，如通知等
                                });
                                
                                if (connected) {
                                    console.log('[App] WebSocket连接建立成功，用户现在处于在线状态');
                                } else {
                                    console.warn('[App] WebSocket连接建立失败');
                                }
                            } catch (error) {
                                console.error('[App] WebSocket连接过程中出错:', error);
                            }
                        } else {
                            console.warn('[App] 从localStorage无法获取用户信息，尝试从token解析');
                            
                            // 🆕 备用方案：从JWT token中解析用户ID
                            try {
                                const token = localStorage.getItem('token');
                                if (token) {
                                    // 简单的JWT解析（仅用于获取用户ID）
                                    const base64Url = token.split('.')[1];
                                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                                    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                                    }).join(''));
                                    
                                    const payload = JSON.parse(jsonPayload);
                                    const userIdFromToken = payload.userId;
                                    
                                    console.log('[App] 从token解析到的用户ID:', userIdFromToken);
                                    
                                    if (userIdFromToken) {
                                        const connected = await websocketService.connect(parseInt(userIdFromToken), (message) => {
                                            console.log('[App] 收到WebSocket消息:', message);
                                        });
                                        
                                        if (connected) {
                                            console.log('[App] 通过token解析建立WebSocket连接成功');
                                        } else {
                                            console.warn('[App] 通过token解析建立WebSocket连接失败');
                                        }
                                    }
                                }
                            } catch (error) {
                                console.error('[App] token解析失败:', error);
                            }
                        }
                    }
                } catch (error) {
                    console.error('[App] token验证过程出错:', error);
                }
            } else {
                console.log('[App] 未检测到登录状态');
            }
        };

        const handleUnload = async () => {
            try {
                await chatService.setOnlineStatus(false);
            } catch (e) {}
            try {
                websocketService.disconnect();
            } catch (e) {}
        };

        // 🆕 延迟验证认证状态，确保页面完全加载
        const timer = setTimeout(() => {
            validateAuthOnStartup();
        }, 1000); // 延迟1秒

        window.addEventListener('beforeunload', handleUnload);
        
        return () => {
            clearTimeout(timer);
            window.removeEventListener('beforeunload', handleUnload);
        };
    }, []);

    // 🆕 改进的受保护路由组件
    const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('[ProtectedRoute] 未找到token，重定向到登录页');
            return <Navigate to="/login" replace />;
        }
        
        // 可以在这里添加额外的认证检查
        // 注意：不在这里做异步验证，因为它会在每次路由切换时触发
        // 主要的token验证在应用启动时进行
        return children;
    };

    return (
        <HeartbeatProvider>
            <div className="font-sans text-gray-900">
                {/* 🆕 WebSocket连接状态指示器 */}
                <ConnectionStatus />
                {/* 🆕 开发环境调试面板 */}
                <DebugPanel />
                {showNavbar && localStorage.getItem('token') && <Navbar />}
                <Routes>
                    <Route path="/login" element={<LoginPage setAuthenticated={setAuthenticated} />} />
                    <Route path="/chat" element={
                        <ProtectedRoute>
                            <ChatPage />
                        </ProtectedRoute>
                    } />
                    <Route path="/personal" element={
                        <ProtectedRoute>
                            <PersonalPage />
                        </ProtectedRoute>
                    } />
                    {/* <Route path="/collaboration" element={<CollaborationAnalysisPage />} /> */}
                    <Route path="/professor-search" element={<ProfessorSearchPage />} />
                    {/* <Route path="/discover" element={<DiscoverPage />} /> */}
                    <Route path="/homepage" element={<Homepage />} />
                    {/* <Route path="/relation-schema" element={<NodeList />} /> */}
                    <Route path="/author-document" element={<AuthorDocument />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/collaboration-prediction" element={<CollaborationPrediction />} />
                    <Route path="/literature-search" element={<LiteratureSearchPage />} />
                    <Route path="*" element={<Navigate to="/homepage" />} />
                </Routes>
            </div>
        </HeartbeatProvider>
    );
};

export default App;