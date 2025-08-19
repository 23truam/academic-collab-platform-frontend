import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, LoginRequest } from '../services/authService';
import { chatService } from '../services/chatService';
import { websocketService } from '../services/websocketService';

const LoginPage: React.FC<{ setAuthenticated: (authenticated: boolean) => void }> = ({ setAuthenticated }) => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // 检查是否已经登录
    useEffect(() => {
        if (authService.isAuthenticated()) {
            setAuthenticated(true);
            navigate('/personal');
        }
    }, [navigate, setAuthenticated]);

    const handleLogin = async () => {
        if ((!email.trim() && !username.trim()) || !password.trim()) {
            alert('请输入用户名或邮箱和密码');
            return;
        }
        setLoading(true);
        try {
            const loginData: LoginRequest = { password };
            if (email.trim()) loginData.email = email.trim();
            if (!email.trim() && username.trim()) loginData.username = username.trim();
            const response = await authService.login(loginData);
            if (response.success) {
                // 记录登录时间，用于聊天记录分割
                const loginTime = Date.now();
                localStorage.setItem('loginTime', loginTime.toString());
                
                // 登录成功后设置为在线
                await chatService.setOnlineStatus(true);
                // 登录成功后全局建立WebSocket连接
                const userId = response.userId;
                if (userId) {
                  websocketService.connect(userId, () => {});
                }
                setAuthenticated(true);
                navigate('/personal');
            } else {
                alert(response.message || '登录失败');
            }
        } catch (error) {
            alert('登录失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    const handleNavigateToRegister = () => {
        navigate('/register');
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row relative">
            {/* 左侧登录区域 */}
            <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 bg-gray-50">
                <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-xl border border-gray-100">
                    <div className="flex items-center mb-8">
                        <svg className="h-6 w-6 text-blue-500 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M4 4h16v16H4z"/>
                        </svg>
                        <span className="text-2xl font-bold text-gray-800" style={{fontFamily: "'Helvetica Neue', Arial, sans-serif", letterSpacing: '0.5px'}}>学术合作推荐系统</span>
                    </div>
                    <h2 className="text-xs uppercase text-gray-500 mb-2" style={{letterSpacing: '1.5px'}}>开始您的学术之旅！</h2>
                    <h1 className="text-3xl font-bold text-gray-800 mb-6" style={{fontFamily: "'Helvetica Neue', Arial, sans-serif", letterSpacing: '0.5px'}}>登录网站</h1>
                    <form onSubmit={e => { e.preventDefault(); handleLogin(); }} className="space-y-4">
                        <div>
                            <label htmlFor="username" className="text-sm text-gray-600 block mb-1" style={{fontWeight: '500'}}>用户名</label>
                            <input
                                id="username"
                                type="text"
                                placeholder="请输入用户名（可选）"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md hover:shadow-lg transition-shadow duration-300"
                                style={{fontFamily: "'Helvetica Neue', Arial, sans-serif"}}
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="text-sm text-gray-600 block mb-1" style={{fontWeight: '500'}}>邮箱</label>
                            <input
                                id="email"
                                type="email"
                                placeholder="请输入邮箱"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md hover:shadow-lg transition-shadow duration-300"
                                style={{fontFamily: "'Helvetica Neue', Arial, sans-serif"}}
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="text-sm text-gray-600 block mb-1" style={{fontWeight: '500'}}>密码</label>
                            <input
                                id="password"
                                type="password"
                                placeholder="请输入密码"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md hover:shadow-lg transition-shadow duration-300"
                                style={{fontFamily: "'Helvetica Neue', Arial, sans-serif"}}
                                disabled={loading}
                                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-md shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{fontFamily: "'Helvetica Neue', Arial, sans-serif", fontWeight: '600', letterSpacing: '0.5px'}}>
                            {loading ? '登录中...' : '登录'}
                        </button>
                        <div className="mt-4 text-center">
                            <span className="text-gray-600" style={{fontFamily: "'Helvetica Neue', Arial, sans-serif"}}>还没有账号？</span>
                            <button
                                type="button"
                                onClick={handleNavigateToRegister}
                                className="text-blue-600 hover:underline ml-2 font-medium"
                                style={{fontFamily: "'Helvetica Neue', Arial, sans-serif", fontWeight: '500'}}>
                                注册
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            {/* 右侧区域 - 使用与AuthorDocument.css相同的渐变背景 */}
            <div className="hidden md:block md:w-1/2" style={{
                background: 'linear-gradient(45deg, #ff6b6b, #f0f2f5, #1890ff)',
                backgroundSize: '200% 200%',
                animation: 'gradient-move 15s linear infinite',
                boxShadow: 'inset 0 0 70px rgba(0, 0, 0, 0.1)'
            }}>
                {/* 添加动画关键帧 */}
                <style dangerouslySetInnerHTML={{__html: `
                    @keyframes gradient-move {
                        0% {
                            background-position: 0% 50%;
                        }
                        100% {
                            background-position: 100% 50%;
                        }
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}} />
                
                {/* 内容部分 - 移除小框框，使用现代化字体样式 */}
                <div className="h-full flex flex-col justify-center items-center text-white p-12">
                    <h2 className="text-5xl font-bold mb-6" 
                        style={{
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                            fontFamily: "'Helvetica Neue', Arial, sans-serif",
                            letterSpacing: '1px',
                            animation: 'fadeIn 1s ease-out'
                        }}>
                        欢迎加入学术合作平台
                    </h2>
                    <p className="text-2xl mb-12 max-w-lg text-center" 
                        style={{
                            textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                            fontFamily: "'Helvetica Neue', Arial, sans-serif",
                            lineHeight: '1.6',
                            animation: 'fadeIn 1s ease-out 0.3s forwards',
                            opacity: 0
                        }}>
                        连接全球学者，促进学术交流与合作，推动科研创新
                    </p>
                    
                    <div className="flex flex-col space-y-6 w-full max-w-lg">
                        <div className="text-center" 
                            style={{
                                animation: 'fadeIn 1s ease-out 0.6s forwards',
                                opacity: 0
                            }}>
                            <div className="inline-block mb-3">
                                <svg className="h-8 w-8 text-white mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-2" style={{textShadow: '0 1px 2px rgba(0,0,0,0.3)'}}>发现合作者</h3>
                            <p className="text-white text-opacity-90">基于研究领域和兴趣匹配潜在的合作伙伴</p>
                        </div>
                        
                        <div className="text-center" 
                            style={{
                                animation: 'fadeIn 1s ease-out 0.9s forwards',
                                opacity: 0
                            }}>
                            <div className="inline-block mb-3">
                                <svg className="h-8 w-8 text-white mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-2" style={{textShadow: '0 1px 2px rgba(0,0,0,0.3)'}}>追踪研究趋势</h3>
                            <p className="text-white text-opacity-90">了解您研究领域的最新发展和热门话题</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;