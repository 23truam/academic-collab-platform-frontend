import axios from 'axios';
import { authService } from './authService';

const API_BASE_URL = 'http://localhost:8081/api';
const DEEPSEEK_API_URL = import.meta.env.VITE_DEEPSEEK_API_URL;
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;

export interface Paper {
  title: string;
  authors: string[];
  abstract: string;
  url: string;
  year: number;
}

// 创建axios实例
const literatureApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：添加token
literatureApi.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 添加调试信息
console.log('API URL:', DEEPSEEK_API_URL);
console.log('API KEY 是否配置:', DEEPSEEK_API_KEY ? '已配置' : '未配置');

export const searchLiterature = async (query: string): Promise<Paper[]> => {
  console.log('搜索查询:', query);
  
  try {
    // 优先使用后端API
    const response = await literatureApi.post('/literature/search', {
      query: query
    });
    
    if (response.data && response.data.length > 0) {
      console.log('使用后端API搜索结果:', response.data);
      return response.data;
    }
    
    // 如果后端没有数据，使用DeepSeek API作为备选
    console.log('后端无数据，使用DeepSeek API');
    return await searchWithDeepSeek(query);
    
  } catch (error) {
    console.error('后端API搜索失败，使用DeepSeek API:', error);
    return await searchWithDeepSeek(query);
  }
};

// 使用DeepSeek API搜索
const searchWithDeepSeek = async (query: string): Promise<Paper[]> => {
  try {
    console.log('准备发送请求到 DeepSeek API');
    
    const response = await axios.post(
      `${DEEPSEEK_API_URL}/chat/completions`,
      {
        messages: [
          { 
            role: 'system', 
            content: `你是一个专业的学术文献检索助手。请根据用户的查询，返回相关的学术文献信息。
              请以JSON格式返回结果，包含以下字段：title（标题）、authors（作者数组）、abstract（摘要）、url（文献链接）、year（发表年份）。
              返回至少5篇相关文献，最多10篇。只返回JSON数组，不要有其他文字说明。` 
          },
          {
            role: 'user',
            content: `请查找与"${query}"相关的学术文献。`
          }
        ],
        model: 'deepseek-chat',
        response_format: { type: "json_object" }
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('API 响应:', response.data);

    // 检查 choices 是否存在并且是数组
    if (!response.data.choices || !Array.isArray(response.data.choices) || response.data.choices.length === 0) {
      throw new Error('API 响应格式不正确，choices 不是数组或为空');
    }

    try {
      // 尝试解析响应中的 JSON
      const content = response.data.choices[0].message?.content || '';
      console.log('响应内容:', content);
      
      const parsedContent = JSON.parse(content);
      
      // 检查解析后的内容是否是数组
      if (Array.isArray(parsedContent)) {
        return parsedContent;
      } 
      // 检查是否有 papers 或 results 字段
      else if (parsedContent.papers && Array.isArray(parsedContent.papers)) {
        return parsedContent.papers;
      }
      else if (parsedContent.results && Array.isArray(parsedContent.results)) {
        return parsedContent.results;
      }
      else {
        // 如果没有预期的结构，返回模拟数据
        console.error('无法从响应中提取文献数据，使用模拟数据代替');
        return createMockData(query);
      }
    } catch (parseError) {
      console.error('解析响应内容失败:', parseError);
      console.error('响应内容:', response.data.choices[0].message?.content);
      // 如果解析失败，返回模拟数据
      return createMockData(query);
    }

  } catch (error) {
    console.error('文献搜索失败详细信息:', error);
    if (axios.isAxiosError(error)) {
      console.error('状态码:', error.response?.status);
      console.error('响应数据:', error.response?.data);
      console.error('请求配置:', error.config);
    }
    // 出错时返回模拟数据
    return createMockData(query);
  }
};

// 创建模拟数据的函数
function createMockData(query: string): Paper[] {
  return [
    {
      title: '神经网络在自然语言处理中的应用',
      authors: ['张三', '李四', '王五'],
      abstract: '本文探讨了神经网络技术在自然语言处理领域的最新进展和应用。通过分析多个案例研究，我们展示了深度学习模型如何有效地解决文本分类、情感分析和机器翻译等问题。',
      url: 'https://example.com/paper1',
      year: 2023
    },
    {
      title: '深度学习架构的比较研究',
      authors: ['赵六', '钱七'],
      abstract: '这项研究比较了不同深度学习架构在图像识别任务上的性能。我们评估了卷积神经网络、递归神经网络和transformer模型在多个数据集上的效果，并提出了性能优化建议。',
      url: 'https://example.com/paper2',
      year: 2022
    },
    {
      title: '机器学习在医疗诊断中的应用',
      authors: ['孙八', '周九', '吴十'],
      abstract: '本文研究了机器学习算法在医疗诊断领域的应用。我们开发了一个基于深度学习的系统，用于分析医学图像并辅助医生进行疾病诊断，取得了显著的准确率提升。',
      url: 'https://example.com/paper3',
      year: 2023
    },
    {
      title: '强化学习算法在自动驾驶中的实现',
      authors: ['郑十一', '王十二'],
      abstract: '这项研究探讨了如何将强化学习算法应用于自动驾驶系统。我们提出了一个新的奖励函数设计方法，显著提高了模拟环境中自动驾驶的安全性和效率。',
      url: 'https://example.com/paper4',
      year: 2021
    },
    {
      title: '大语言模型知识表示的研究进展',
      authors: ['张十三', '刘十四', '陈十五'],
      abstract: '本文综述了大型语言模型中知识表示的最新研究进展。我们分析了不同预训练策略对模型理解和生成能力的影响，并探讨了知识提取的有效方法。',
      url: 'https://example.com/paper5',
      year: 2023
    }
  ].filter(paper => 
    paper.title.toLowerCase().includes(query.toLowerCase()) || 
    paper.abstract.toLowerCase().includes(query.toLowerCase())
  );
} 