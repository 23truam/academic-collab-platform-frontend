# 学术协作平台

这是一个基于React和TypeScript的学术协作平台，用于搜索教授、文献，进行学术合作分析，并提供个性化推荐。

## 功能介绍

### 1. 个人主页
- 展示高德纳教授的个人简介、学术成就和主要贡献
- 右侧展示最近搜索记录，最多显示5条，可点击跳转到相应搜索页面

### 2. 教授搜索
- 支持关键词搜索教授
- 显示教授的论文发表数量
- 点击教授可跳转到其详细资料页面
- 搜索记录会保存到最近搜索

### 3. 文献发表统计
- 展示所有作者的论文发表情况，不限制论文数量
- 针对"J"和"TAM"两位作者设计了特殊的个人简介
- 显示作者的论文数量统计图表
- 展示作者的合作关系图谱
- 列出作者发表的所有论文

### 4. 文献搜索
- 基于DeepSeek AI的文献快速搜索功能
- 显示文献的标题、作者、年份和摘要
- 支持分页浏览搜索结果
- 搜索记录会保存到最近搜索

### 5. 搜索历史记录
- 在个人主页右侧显示最近搜索记录
- 记录用户在教授搜索和文献搜索中的搜索关键词
- 最多保存5条搜索记录
- 点击搜索记录可快速跳转到相应页面

### 6. 其他功能
- 合作者预测
- 支持响应式布局，适配不同设备

## 项目结构

```
frontend/
├── src/                    # 源代码
│   ├── assets/             # 静态资源(图片等)
│   ├── components/         # 公共组件
│   │   ├── Navbar.tsx      # 导航栏组件
│   │   └── RecentSearches.tsx  # 最近搜索组件
│   ├── pages/              # 页面组件
│   │   ├── PersonalPage.tsx     # 个人主页
│   │   ├── ProfessorSearchPage.tsx  # 教授搜索页面
│   │   ├── AuthorDocument.tsx   # 文献发表统计页面
│   │   ├── LiteratureSearchPage.tsx  # 文献搜索页面
│   │   └── ...             # 其他页面
│   ├── services/           # 服务
│   │   ├── literatureService.ts  # 文献搜索服务
│   │   └── searchHistoryService.ts  # 搜索历史服务
│   ├── styles/             # 样式文件
│   ├── App.tsx             # 应用程序根组件
│   ├── main.tsx            # 入口文件
│   └── ...
├── public/                 # 公共资源
├── package.json            # 项目依赖
└── ...
```

## 技术栈

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite
- **样式解决方案**：TailwindCSS + Ant Design
- **路由**：React Router v6
- **HTTP请求**：Axios
- **数据可视化**：ECharts
- **状态管理**：React Hooks

## 本地开发环境配置

### 系统要求
- Node.js 18.0+
- npm 9.0+ 或 yarn 1.22+

### 安装步骤

1. 克隆仓库
```bash
git clone <repository-url>
cd academic-collab-platform
```

2. 安装依赖
```bash
cd frontend
npm install
# 或
yarn install
```

3. 环境变量配置
在 `frontend/.env` 文件中配置必要的环境变量，例如：
```
VITE_API_BASE_URL=http://localhost:8080
VITE_DEEPSEEK_API_KEY=your_api_key_here
```

4. 启动开发服务器
```bash
npm run dev
# 或
yarn dev
```

5. 打开浏览器访问
```
http://localhost:5173
```

## 构建生产版本

```bash
npm run build
# 或
yarn build
```

生成的文件将位于 `frontend/dist` 目录下。

## 注意事项

- 文献搜索功能需要有效的DeepSeek API密钥才能正常工作
- 如果API调用失败，系统会回退到使用模拟数据
- 本地存储用于保存搜索历史
- 响应式设计支持桌面和移动设备 