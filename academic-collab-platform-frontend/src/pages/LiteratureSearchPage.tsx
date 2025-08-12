import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { searchLiterature, Paper } from '../services/literatureService';
import { addSearchHistory, SearchType } from '../services/searchHistoryService';

const LiteratureSearchPage: React.FC = () => {
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');
    const [papers, setPapers] = useState<Paper[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const papersPerPage = 10;

    // 初始化时检查是否有搜索关键词传入
    useEffect(() => {
        const keyword = location.state?.keyword;
        if (keyword) {
            setSearchQuery(keyword);
            handleSearch(keyword);
        }
    }, [location.state]);

    const handleSearch = async (queryOverride?: string) => {
        const query = queryOverride || searchQuery;
        
        if (!query.trim()) {
            setError('请输入搜索关键词');
            return;
        }
        
        // 添加到搜索历史
        await addSearchHistory(SearchType.LITERATURE, query);
        
        setLoading(true);
        setError('');
        
        try {
            const results = await searchLiterature(query);
            if (results.length === 0) {
                setError('未找到相关文献');
                setPapers([]);
            } else {
                setPapers(results);
                setCurrentPage(1);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || '搜索失败，请检查API密钥是否正确配置');
            setPapers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const indexOfLastPaper = currentPage * papersPerPage;
    const indexOfFirstPaper = indexOfLastPaper - papersPerPage;
    const currentPapers = papers.slice(indexOfFirstPaper, indexOfLastPaper);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* 搜索区域 */}
            <div className="relative w-full max-w-4xl mx-auto pt-20 px-4">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 shadow-lg transform skew-y-0 -rotate-6 rounded-3xl"></div>
                <div className="relative bg-white rounded-3xl shadow-xl px-8 py-12 transform transition-all duration-300 hover:scale-[1.01]">
                    <h1 className="text-4xl font-bold mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                        文献快速搜索
                    </h1>
                    <p className="text-gray-600 text-center mb-8">
                        使用 DeepSeek AI 快速查找相关学术文献
                    </p>
                    
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg blur opacity-20 group-hover:opacity-30 transition-all duration-300"></div>
                        <div className="relative flex gap-4">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleInputChange}
                                placeholder="输入关键词搜索文献..."
                                className="flex-1 p-4 border-2 border-gray-200 rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                                onKeyPress={handleKeyPress}
                                disabled={loading}
                            />
                            <button
                                onClick={() => handleSearch()}
                                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        搜索中...
                                    </span>
                                ) : '搜索'}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 text-red-500 p-4 bg-red-50 rounded-xl border border-red-200 shadow-sm">
                            {error}
                        </div>
                    )}
                </div>
            </div>

            {/* 搜索结果区域 */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="space-y-4">
                    {currentPapers.map((paper, index) => (
                        <div 
                            key={index} 
                            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg border border-gray-100 transform transition-all duration-200 hover:-translate-y-1"
                        >
                            <h2 className="text-xl font-semibold mb-2">
                                <a 
                                    href={paper.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-blue-600 hover:text-purple-600 transition-colors duration-200"
                                >
                                    {paper.title}
                                </a>
                            </h2>
                            <p className="text-gray-600 mb-2 text-sm">
                                {paper.authors.join(', ')} ({paper.year})
                            </p>
                            <p className="text-gray-700 leading-relaxed">{paper.abstract}</p>
                        </div>
                    ))}
                </div>

                {papers.length > 0 && (
                    <div className="mt-8 flex justify-center gap-4">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-6 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:text-blue-500 transition-all duration-200 disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:text-gray-500 transform hover:-translate-y-0.5"
                        >
                            上一页
                        </button>
                        <span className="px-6 py-2 bg-white rounded-lg border-2 border-gray-200">
                            第 {currentPage} 页，共 {Math.ceil(papers.length / papersPerPage)} 页
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(papers.length / papersPerPage)))}
                            disabled={currentPage === Math.ceil(papers.length / papersPerPage)}
                            className="px-6 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:text-blue-500 transition-all duration-200 disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:text-gray-500 transform hover:-translate-y-0.5"
                        >
                            下一页
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiteratureSearchPage; 