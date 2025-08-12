import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { websocketService } from '../services/websocketService';

const Navbar: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const navItems = [
        { path: '/personal', label: '个人主页' },
        // { path: '/collaboration', label: '合作分析' },
        { path: '/professor-search', label: '教授搜索' },
        // { path: '/discover', label: '发现' },
        // { path: '/relation-schema', label: '合作关系图' },
        { path: '/author-document', label: '文献发表统计' },
        { path: '/collaboration-prediction', label: '合作者预测' },
        { path: '/literature-search', label: '文献搜索' },
        { path: '/chat', label: '学术交流区' },
    ];

    // 退出登录逻辑，增加确认弹窗
    const handleLogout = async () => {
        const confirmed = window.confirm('确定要退出登录吗？');
        if (!confirmed) return;
        try {
            await authService.logout();
        } catch (e) {
            // 忽略错误
        }
        try {
            websocketService.disconnect();
        } catch (e) {}
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <nav className="bg-gradient-to-r from-blue-100 to-blue-300 shadow-lg">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex justify-between">
                    <div className="flex space-x-7">
                        <div className="flex items-center py-4 px-2">
                            <span className="font-semibold text-lg">学术网络</span>
                        </div>
                        <div className="hidden md:flex items-center space-x-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`py-4 px-2 font-semibold hover:text-gray-200 transition duration-300 ${
                                        location.pathname === item.path ? 'border-b-4 border-white' : ''
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button
                            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded transition duration-300"
                            onClick={handleLogout}
                        >
                            退出登录
                        </button>
                        <div className="md:hidden flex items-center">
                            <button className="outline-none mobile-menu-button" onClick={() => setIsOpen(!isOpen)}>
                                <svg
                                    className="w-6 h-6 text-white hover:text-gray-200"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    {isOpen ? (
                                        <path d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className={`md:hidden ${isOpen ? 'block' : 'hidden'}`}>
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className="block py-2 px-4 text-sm hover:bg-blue-700 text-white"
                        onClick={() => setIsOpen(false)}
                    >
                        {item.label}
                    </Link>
                ))}
                <button
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded transition duration-300 mt-2"
                    onClick={handleLogout}
                >
                    退出登录
                </button>
            </div>
        </nav>
    );
};

export default Navbar;