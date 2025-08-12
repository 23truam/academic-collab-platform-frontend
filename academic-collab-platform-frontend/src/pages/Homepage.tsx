import React from 'react';
import logo from '../assets/path_to_suda_logo.svg'
import collab_photo from '../assets/collaboration-team-svgrepo-com.svg'
import {useNavigate} from "react-router-dom";



const Header: React.FC = () => {
    const navigate = useNavigate();
    return(
    <header className="flex justify-between items-center py-4">
        <div className="flex items-center">
            <img src={logo} alt="苏州大学 Logo" className="w-10 h-10 mr-2" />
            <span className="text-lg font-semibold">学术合作推荐系统</span>
        </div>
        <nav className="hidden md:flex space-x-6">
            {['关于我们', '功能介绍', '用户反馈', '帮助中心'].map((item) => (
                <a key={item} href="#" className="text-gray-700 hover:text-gray-900">
                    {item}
                </a>
            ))}
        </nav>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition duration-300" onClick={() => navigate("/login") }>
            立即登录
        </button>
    </header>
)};

const MainContent: React.FC = () => {
    const navigate = useNavigate();
    return (
    <main className="flex flex-col md:flex-row items-center justify-between mt-20">
        <div className="md:w-1/2">
            <h1 className="text-5xl font-bold mb-4">发现您的完美学术合作伙伴</h1>
            <p className="text-xl mb-8">
                利用先进的算法和全面的学术数据库，我们为您匹配最合适的研究合作对象，助力您的学术事业更上一层楼。
            </p>
            <div className="space-x-4">
                <button onClick={() => navigate("/login")}
                    className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition duration-300">
                    登录
                </button>
                <a href="#" className="text-blue-600 hover:underline">
                    了解更多 →
                </a>
            </div>
        </div>
        <div className="md:w-1/2 mt-10 md:mt-0">
            <img src={collab_photo} alt="学术合作图示" className="w-full"/>
        </div>
    </main>)
}

const Homepage: React.FC = () => {

    return (
        <div className="bg-gradient-to-b from-blue-100 to-blue-300 min-h-screen">
            <div className="container mx-auto px-4">
                <Header />
                <MainContent />
            </div>
        </div>
    );
};

export default Homepage;