import knuth_photo from '../assets/knuth-photo.jpg'
import RecentSearches from '../components/RecentSearches';

const KnuthResume = () => {
    return (
        <div className="max-w-7xl mx-auto p-8 flex">
            {/* 左侧高德纳简介 - 占据宽度的2/3 */}
            <div className="w-2/3 pr-6">
                <div className="bg-blue-100 rounded-lg shadow-md transition-all duration-300 hover:bg-blue-200 hover:shadow-2xl hover:transform hover:rotate-1 p-8">
                    <div className="flex bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 hover:transform hover:rotate-1">
                        <img src={knuth_photo} alt="高德纳照片" className="w-1/3 object-cover border-r-4 border-blue-200 transition-transform duration-300 hover:scale-110 hover:rotate-1" />
                        <div className="w-2/3 p-6">
                            <h1 className="text-3xl font-bold mb-2 text-blue-800 transition-colors duration-300 hover:text-blue-600">高德纳</h1>
                            <h2 className="text-xl text-gray-600 mb-4 transition-colors duration-300 hover:text-gray-800">计算机科学家</h2>
                            <div className="bg-amber-100 p-4 rounded-lg transition-transform duration-300 hover:scale-105 hover:rotate-1">
                                <p className="mb-2"><span className="icon">📞</span> +1-650-723-4417</p>
                                <p className="mb-2"><span className="icon">📧</span> knuth@cs.stanford.edu</p>
                                <p><span className="icon">📍</span> 斯坦福大学计算机科学系</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-8">
                        <div className="bg-blue-50 p-4 rounded-lg shadow-md transition-transform duration-300 hover:scale-105 hover:rotate-1">
                            <h3 className="text-2xl font-bold mb-4 text-blue-800 transition-colors duration-300 hover:text-blue-600">个人简介</h3>
                            <p className="text-gray-700">
                                高德纳是美国计算机科学家、数学家，被誉为"算法分析之父"。
                                他的多卷本著作《计算机程序设计艺术》被认为是计算机科学领域最具影响力的参考资料之一。
                                高德纳还发明了TeX排版系统，对计算机科学的多个方面都做出了重大贡献。
                            </p>
                        </div>

                        <div className="bg-green-50 p-4 rounded-lg shadow-md transition-transform duration-300 hover:scale-105 hover:rotate-1">
                            <h3 className="text-2xl font-bold mb-4 text-blue-800 transition-colors duration-300 hover:text-blue-600">学术成就</h3>
                            <div className="mb-4">
                                <h4 className="font-bold text-blue-700">斯坦福大学 | 加利福尼亚</h4>
                                <p className="text-gray-600">1968年 - 至今</p>
                                <p className="text-gray-700">
                                    计算机科学教授（现已退休），致力于算法分析、编程语言和数学写作系统的研究。
                                    主导了多项重要的计算机科学研究项目。
                                </p>
                            </div>
                            <div>
                                <h4 className="font-bold text-blue-700">加州理工学院 | 加利福尼亚</h4>
                                <p className="text-gray-600">1963年 - 1968年</p>
                                <p className="text-gray-700">
                                    担任助理教授，开始撰写《计算机程序设计艺术》系列著作。
                                    这段时期奠定了他在计算机科学领域的基础地位。
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 bg-yellow-50 p-4 rounded-lg shadow-md transition-transform duration-300 hover:scale-105 hover:rotate-1">
                        <h3 className="text-2xl font-bold mb-4 text-blue-800 transition-colors duration-300 hover:text-blue-600">主要贡献</h3>
                        <ul className="list-disc list-inside text-gray-700">
                            <li>《计算机程序设计艺术》系列著作</li>
                            <li>TeX和METAFONT排版系统</li>
                            <li>文学编程概念的提出</li>
                            <li>KMP算法（与Pratt和Morris共同发明）</li>
                            <li>LR(k)文法分析理论</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            {/* 右侧最近搜索栏 - 占据宽度的1/3 */}
            <div className="w-1/3">
                <RecentSearches className="mb-6" />
            </div>
        </div>
    );
};

export default KnuthResume;