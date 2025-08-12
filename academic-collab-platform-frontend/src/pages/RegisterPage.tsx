import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, RegisterRequest } from '../services/authService';

const RegisterPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async () => {
        if (username.trim() === '') {
            alert('用户名不能为空');
            return;
        }
        if (username.length < 3 || username.length > 20) {
            alert('用户名长度必须在3-20个字符之间');
            return;
        }
        const emailRegex = /^[\w-\.]+@[\w-]+\.[a-z]{2,4}$/i;
        if (!emailRegex.test(email)) {
            alert('请输入有效的邮箱地址');
            return;
        }
        if (password.trim() === '') {
            alert('密码不能为空');
            return;
        }
        if (password !== confirmPassword) {
            alert('两次输入的密码不一致');
            return;
        }

        setLoading(true);
        
        try {
            const registerData: RegisterRequest = { username, email, password };
            const response = await authService.register(registerData);
            
            if (response.success) {
                alert('注册成功！');
                navigate('/login');
            } else {
                alert(response.message || '注册失败');
            }
        } catch (error) {
            alert('注册失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row relative">
            {/* 左侧注册区域 */}
            <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 bg-gray-50">
                <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-xl border border-gray-100">
                    <div className="flex items-center mb-8">
                        <svg className="h-6 w-6 text-blue-500 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M4 4h16v16H4z"/>
                        </svg>
                        <span className="text-2xl font-bold text-gray-800" style={{fontFamily: "'Helvetica Neue', Arial, sans-serif", letterSpacing: '0.5px'}}>学术合作推荐系统</span>
                    </div>
                    <h2 className="text-xs uppercase text-gray-500 mb-2" style={{letterSpacing: '1.5px'}}>加入我们的平台</h2>
                    <h1 className="text-3xl font-bold text-gray-800 mb-6" style={{fontFamily: "'Helvetica Neue', Arial, sans-serif", letterSpacing: '0.5px'}}>注册账号</h1>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="username" className="text-sm text-gray-600 block mb-1" style={{fontWeight: '500'}}>用户名</label>
                            <input
                                id="username"
                                type="text"
                                placeholder="请输入用户名（3-20个字符）"
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
                            />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="text-sm text-gray-600 block mb-1" style={{fontWeight: '500'}}>确认密码</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                placeholder="请再次输入密码"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md hover:shadow-lg transition-shadow duration-300"
                                style={{fontFamily: "'Helvetica Neue', Arial, sans-serif"}}
                                disabled={loading}
                                onKeyPress={(e) => e.key === 'Enter' && handleRegister()}
                            />
                        </div>
                        <button
                            onClick={handleRegister}
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-md shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{fontFamily: "'Helvetica Neue', Arial, sans-serif", fontWeight: '600', letterSpacing: '0.5px'}}
                        >
                            {loading ? '注册中...' : '注册'}
                        </button>
                        <div className="mt-4 text-center">
                            <span className="text-gray-600" style={{fontFamily: "'Helvetica Neue', Arial, sans-serif"}}>已有账号？</span>
                            <button
                                onClick={() => navigate('/login')}
                                className="text-blue-600 hover:underline ml-2 font-medium"
                                style={{fontFamily: "'Helvetica Neue', Arial, sans-serif", fontWeight: '500'}}
                            >
                                返回登录
                            </button>
                        </div>
                    </div>
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
                        注册成为会员，开启您的学术合作之旅
                    </p>
                    
                    <div className="flex flex-col space-y-6 w-full max-w-lg">
                        <div className="text-center" 
                            style={{
                                animation: 'fadeIn 1s ease-out 0.6s forwards',
                                opacity: 0
                            }}>
                            <div className="inline-block mb-3">
                                <svg className="h-8 w-8 text-white mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-2" style={{textShadow: '0 1px 2px rgba(0,0,0,0.3)'}}>创建个人档案</h3>
                            <p className="text-white text-opacity-90">展示您的研究成果和专业领域</p>
                        </div>
                        
                        <div className="text-center" 
                            style={{
                                animation: 'fadeIn 1s ease-out 0.9s forwards',
                                opacity: 0
                            }}>
                            <div className="inline-block mb-3">
                                <svg className="h-8 w-8 text-white mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-2" style={{textShadow: '0 1px 2px rgba(0,0,0,0.3)'}}>拓展学术网络</h3>
                            <p className="text-white text-opacity-90">与志同道合的研究者建立联系</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage; 