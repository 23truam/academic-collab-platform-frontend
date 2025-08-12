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
        const handleUnload = async () => {
            try {
                await chatService.setOnlineStatus(false);
            } catch (e) {}
            try {
                websocketService.disconnect();
            } catch (e) {}
        };
        window.addEventListener('beforeunload', handleUnload);
        return () => {
            window.removeEventListener('beforeunload', handleUnload);
        };
    }, []);

    // 受保护路由组件
    const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('未登录，请先登录');
            return <Navigate to="/login" replace />;
        }
        return children;
    };

    return (
        <HeartbeatProvider>
            <div className="font-sans text-gray-900">
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