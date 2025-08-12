import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { addSearchHistory, SearchType } from '../services/searchHistoryService';

type Result = {
    title: string,
    year: string,
    authors: string[],
}

type Professor = {
    name: string,
    paperCount: number,
}

const PAGE_SIZE = 12; // 每页显示12条

const ProfessorSearchPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [keyword, setKeyword] = useState('');
    const [results, setResults] = useState<Result[]>([]);
    const [professors, setProfessors] = useState<Professor[]>([]);
    const [allProfessors, setAllProfessors] = useState<Professor[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [jumpPage, setJumpPage] = useState(''); // 新增跳转页码状态

    // 在组件加载时提取所有教授并检查URL参数
    useEffect(() => {
        // 从后端获取所有作者及其论文数
        axios.get('/api/authors/all-with-count').then(res => {
            const professorList: Professor[] = res.data;
            // 按文章数量降序排序
            professorList.sort((a, b) => b.paperCount - a.paperCount);
            setAllProfessors(professorList);
            setTotal(professorList.length);
        });

        // 检查是否有从其他页面传入的关键词
        const searchKeyword = location.state?.keyword;
        if (searchKeyword) {
            setKeyword(searchKeyword);
            handleKeywordChangeFromState(searchKeyword);
        }
    }, [location.state]);

    // 从状态处理关键词变化
    const handleKeywordChangeFromState = (value: string) => {
        if (value.trim() === '') {
            setProfessors([]);
            return;
        }
        
        // 模糊搜索匹配的教授
        const matchedProfessors = allProfessors.filter(professor => 
            professor.name.toLowerCase().includes(value.toLowerCase())
        ).slice(0, 15); // 限制显示前15个结果
        
        setProfessors(matchedProfessors);
    };

    // 处理关键词变化的模糊搜索，带分页
    const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setKeyword(value);
        setPage(1); // 关键词变化时重置到第一页
        if (value.trim() === '') {
            setProfessors([]);
            setTotal(allProfessors.length);
            return;
        }
        const matchedProfessors = allProfessors.filter(professor => 
            professor.name.toLowerCase().includes(value.toLowerCase())
        );
        setTotal(matchedProfessors.length);
        setProfessors(matchedProfessors.slice(0, PAGE_SIZE));
    };

    // 分页切换时刷新当前页数据
    useEffect(() => {
        if (keyword.trim() === '') {
            setProfessors(allProfessors.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
            return;
        }
        const matchedProfessors = allProfessors.filter(professor => 
            professor.name.toLowerCase().includes(keyword.toLowerCase())
        );
        setProfessors(matchedProfessors.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
    }, [page, allProfessors, keyword]);

    // 点击教授跳转到作者文档页面
    const handleProfessorClick = async (professorName: string) => {
        // 添加到搜索历史
        await addSearchHistory(SearchType.PROFESSOR, professorName);
        // 跳转
        navigate('/author-document', { state: { author: professorName } });
    };

    const handleSearch = async () => {
        if (keyword.trim()) {
            // 添加到搜索历史
            await addSearchHistory(SearchType.PROFESSOR, keyword);
        }
        
        try {
            const response = await axios.get(`http://localhost:8081/api/professor-search?keyword=${keyword}`);
            setResults(response.data);
        } catch (error) {
            console.error('搜索教授时出错', error);
        }
    };

    // 处理回车键搜索
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // 跳转页码函数
    const handleJump = () => {
        const num = Number(jumpPage);
        const maxPage = Math.ceil(total / PAGE_SIZE);
        if (!isNaN(num) && num >= 1 && num <= maxPage) {
            setPage(num);
        }
        setJumpPage('');
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* SVG 背景 */}
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#4facfe" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#00f2fe" stopOpacity="0.3" />
                    </linearGradient>
                    <linearGradient id="grad2" x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#4158D0" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="#C850C0" stopOpacity="0.2" />
                    </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#grad1)" />
                <circle cx="5%" cy="5%" r="10%" fill="url(#grad2)" />
                <circle cx="95%" cy="95%" r="15%" fill="url(#grad2)" />
                <path d="M0,50 Q50,0 100,50 T200,50" stroke="url(#grad2)" strokeWidth="0.5" fill="none" />
                <path d="M0,80 Q50,30 100,80 T200,80" stroke="url(#grad2)" strokeWidth="0.5" fill="none" />
            </svg>

            {/* 内容区域 */}
            <div className="relative z-10 max-w-6xl mx-auto p-8">
                <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">教授搜索系统</h1>
                <div className="mb-12">
                    <div className="flex mb-6">
                        <input
                            className="flex-grow p-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white bg-opacity-80"
                            type="text"
                            placeholder="输入关键词搜索教授"
                            value={keyword}
                            onChange={handleKeywordChange}
                            onKeyPress={handleKeyPress}
                        />
                        <button
                            className="px-6 py-3 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 transition duration-300"
                            onClick={handleSearch}
                        >
                            搜索
                        </button>
                    </div>
                    
                    {/* 模糊搜索结果 - 教授卡片列表 */}
                    {professors.length > 0 && (
                        <div className="mt-4 w-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {professors.map((professor, index) => (
                                    <div 
                                        key={index} 
                                        className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg cursor-pointer transition-all flex flex-col justify-between"
                                        onClick={() => handleProfessorClick(professor.name)}
                                    >
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2 text-gray-800">{professor.name}</h3>
                                            <div className="h-0.5 w-12 bg-blue-400 mb-2"></div>
                                        </div>
                                        <div className="mt-2 flex justify-between items-center">
                                            <span className="text-sm text-gray-500">发表论文</span>
                                            <span className="text-base font-medium text-blue-600">{professor.paperCount} 篇</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* 分页控件 */}
                            <div className="flex justify-center items-center mt-6 space-x-4">
                                <button
                                    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                                    disabled={page === 1}
                                    onClick={() => setPage(page - 1)}
                                >上一页</button>
                                <span>第 {page} / {Math.max(1, Math.ceil(total / PAGE_SIZE))} 页</span>
                                <button
                                    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                                    disabled={page === Math.ceil(total / PAGE_SIZE) || total === 0}
                                    onClick={() => setPage(page + 1)}
                                >下一页</button>
                                {/* 新增跳转输入框 */}
                                <input
                                    type="number"
                                    min={1}
                                    max={Math.ceil(total / PAGE_SIZE)}
                                    value={jumpPage}
                                    onChange={e => setJumpPage(e.target.value)}
                                    className="w-16 px-2 py-1 border rounded"
                                    placeholder="页码"
                                />
                                <button
                                    className="px-3 py-1 bg-blue-400 text-white rounded"
                                    onClick={handleJump}
                                    disabled={
                                        !jumpPage ||
                                        isNaN(Number(jumpPage)) ||
                                        Number(jumpPage) < 1 ||
                                        Number(jumpPage) > Math.ceil(total / PAGE_SIZE)
                                    }
                                >跳转</button>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
                    {results.map((result, index) => (
                        <div key={index} className="bg-white bg-opacity-80 p-6 rounded-lg shadow-md hover:shadow-lg transition duration-300">
                            <h2 className="text-xl font-semibold mb-2 text-gray-800">{result.title}</h2>
                            <p className="text-gray-600 mb-4">发表年份: {result.year}</p>
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-2">作者:</h3>
                                <ul className="list-disc list-inside text-gray-600">
                                    {result.authors.map((author, authorIndex) => (
                                        <li 
                                            key={authorIndex} 
                                            className="hover:text-blue-500 cursor-pointer"
                                            onClick={() => handleProfessorClick(author)}
                                        >
                                            {author}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
                {results.length > 0 && (
                    <div className="mt-12 text-center">
                        <p className="text-gray-600 italic">
                            "使用这个应用，我们可以轻松搜索教授、追踪他们的研究，并在一个平台上管理所有学术信息。"
                        </p>
                        <div className="mt-4 flex items-center justify-center">
                            <img src="https://via.placeholder.com/40" alt="用户头像" className="rounded-full mr-3" />
                        </div>
                    </div>
                )}
                {results.length === 0 && professors.length === 0 && keyword && (
                    <div className="text-center text-gray-600 mt-8">
                        <p>没有找到相关结果，请尝试其他关键词。</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfessorSearchPage;