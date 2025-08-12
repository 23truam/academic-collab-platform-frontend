import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecentSearchHistory, SearchHistoryItem, SearchType, clearSearchHistory } from '../services/searchHistoryService';

interface RecentSearchesProps {
  className?: string;
}

const RecentSearches: React.FC<RecentSearchesProps> = ({ className }) => {
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 获取最近搜索记录
  useEffect(() => {
    const fetchRecentSearches = async () => {
      setLoading(true);
      try {
        const searches = await getRecentSearchHistory(5);
        setRecentSearches(searches);
      } catch (error) {
        console.error('获取搜索历史失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentSearches();
  }, []);

  // 处理点击搜索项
  const handleSearchClick = (item: SearchHistoryItem) => {
    if (item.type === SearchType.PROFESSOR) {
      navigate('/professor-search', { state: { keyword: item.keyword } });
    } else if (item.type === SearchType.LITERATURE) {
      navigate('/literature-search', { state: { keyword: item.keyword } });
    }
  };

  // 清空搜索历史
  const handleClearHistory = async () => {
    if (window.confirm('确定要清空所有浏览记录吗？')) {
      await clearSearchHistory();
      setRecentSearches([]);
    }
  };

  // 如果没有搜索记录则不显示
  if (recentSearches.length === 0 && !loading) {
    return null;
  }

  // 格式化时间
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">最近搜索</h3>
        <button
          className="text-sm text-red-500 hover:underline focus:outline-none"
          onClick={handleClearHistory}
          disabled={loading || recentSearches.length === 0}
        >
          清空浏览记录
        </button>
      </div>
      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">加载中...</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {recentSearches.map((item) => (
            <li 
              key={item.id} 
              className="flex items-center p-2 hover:bg-blue-50 rounded cursor-pointer transition-colors duration-200"
              onClick={() => handleSearchClick(item)}
            >
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 mr-3">
                {item.type === SearchType.PROFESSOR ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800 truncate">{item.keyword}</div>
                <div className="text-xs text-gray-500">
                  {item.type === SearchType.PROFESSOR ? '教授搜索' : '文献搜索'} · {formatDate(item.timestamp)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecentSearches; 