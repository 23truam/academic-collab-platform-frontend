# 前后端接口集成文档

## 搜索历史功能接口对应关系

### 1. 获取搜索历史（分页）

**前端调用：**
```typescript
// 文件：src/services/searchHistoryService.ts
export const getSearchHistory = async (): Promise<SearchHistoryItem[]> => {
  const response = await searchHistoryApi.get<ApiResponse<any>>('/search-history', {
    params: {
      userId: currentUser.userId,
      page: 1,
      size: 50
    }
  });
  
  if (response.data.success && response.data.data) {
    return response.data.data.records || [];
  }
  return [];
};
```

**后端接口：**
```java
// 文件：SearchHistoryController.java
@GetMapping
public Map<String, Object> getHistory(
    @RequestParam String userId,
    @RequestParam(defaultValue = "1") int page,
    @RequestParam(defaultValue = "10") int size) {
    IPage<SearchHistory> result = searchHistoryService.getHistory(userId, page, size);
    return ResponseUtil.success(result);
}
```

**接口地址：** `GET /api/search-history`

### 2. 添加搜索历史

**前端调用：**
```typescript
// 文件：src/services/searchHistoryService.ts
export const addSearchHistory = async (type: SearchType, keyword: string): Promise<void> => {
  const historyItem = {
    userId: currentUser.userId.toString(),
    keyword: keyword,
    type: type,
    timestamp: Date.now()
  };
  
  await searchHistoryApi.post<ApiResponse<any>>('/search-history', historyItem);
};
```

**后端接口：**
```java
// 文件：SearchHistoryController.java
@PostMapping
public Map<String, Object> addHistory(@RequestBody SearchHistory item) throws JsonProcessingException {
    searchHistoryService.addSearchHistory(item);
    return ResponseUtil.successMsg("搜索历史添加成功");
}
```

**接口地址：** `POST /api/search-history`

### 3. 获取最近搜索历史

**前端调用：**
```typescript
// 文件：src/services/searchHistoryService.ts
export const getRecentSearchHistory = async (limit: number = 5): Promise<SearchHistoryItem[]> => {
  const response = await searchHistoryApi.get<ApiResponse<SearchHistoryItem[]>>('/search-history/recent', {
    params: {
      userId: currentUser.userId,
      limit: limit
    }
  });
  
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  return [];
};
```

**后端接口：**
```java
// 文件：SearchHistoryController.java
@GetMapping("/recent")
public Map<String, Object> getRecentSearchHistory(
    @RequestParam String userId,
    @RequestParam(defaultValue = "5") int limit) {
    List<SearchHistory> result = searchHistoryService.getRecentSearchHistory(userId, limit);
    return ResponseUtil.success(result);
}
```

**接口地址：** `GET /api/search-history/recent`

### 4. 清空搜索历史

**前端调用：**
```typescript
// 文件：src/services/searchHistoryService.ts
export const clearSearchHistory = async (): Promise<void> => {
  await searchHistoryApi.delete<ApiResponse<any>>('/search-history', {
    params: {
      userId: currentUser.userId
    }
  });
};
```

**后端接口：**
```java
// 文件：SearchHistoryController.java
@DeleteMapping
public Map<String, Object> clearHistory(@RequestParam String userId) {
    searchHistoryService.clearHistory(userId);
    return ResponseUtil.successMsg("搜索历史清空成功");
}
```

**接口地址：** `DELETE /api/search-history`

## 数据结构对应关系

### 前端数据类型
```typescript
// 文件：src/services/searchHistoryService.ts
export interface SearchHistoryItem {
  id: number;           // 对应后端 Long 类型
  userId: string;       // 对应后端 String 类型
  type: SearchType;     // 对应后端 String 类型
  keyword: string;      // 对应后端 String 类型
  timestamp: number;    // 对应后端 Long 类型
}

export enum SearchType {
  PROFESSOR = 'professor',
  LITERATURE = 'literature'
}

// 后端响应格式
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
```

### 后端数据类型
```java
// 文件：SearchHistory.java
@Data
@TableName("search_history")
public class SearchHistory {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String userId;
    private String keyword;
    private String type;
    private Long timestamp;
}
```

## 使用场景

### 1. 教授搜索页面
**文件：** `src/pages/ProfessorSearchPage.tsx`
- 点击教授时调用：`addSearchHistory(SearchType.PROFESSOR, professorName)`
- 搜索关键词时调用：`addSearchHistory(SearchType.PROFESSOR, keyword)`

### 2. 文献搜索页面
**文件：** `src/pages/LiteratureSearchPage.tsx`
- 搜索文献时调用：`addSearchHistory(SearchType.LITERATURE, query)`

### 3. 最近搜索组件
**文件：** `src/components/RecentSearches.tsx`
- 获取最近搜索：`getRecentSearchHistory(5)`
- 清空搜索历史：`clearSearchHistory()`

## 响应格式统一

所有后端接口都使用统一的响应格式：
```json
{
  "success": true,
  "data": {
    // 具体数据
  },
  "message": "操作成功"
}
```

前端统一处理响应格式，确保数据解析的一致性。

## 认证机制

前端通过请求拦截器自动添加 JWT Token：
```typescript
searchHistoryApi.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }
);
```

## 错误处理

前端统一处理 API 错误：
```typescript
try {
  // API 调用
} catch (error) {
  console.error('操作失败:', error);
  // 返回默认值或空数组
}
```

## 缓存机制

后端实现了多层缓存机制：
1. **Redis 缓存**：存储最近搜索历史
2. **消息队列**：保证同一用户消息的顺序处理
3. **延迟双删**：保证缓存一致性

前端通过调用 `/recent` 接口优先获取缓存数据，提升用户体验。 