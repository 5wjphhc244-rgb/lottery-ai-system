# 福彩AI助手 - API 共享契约

## 基础信息
- 后端服务: `http://localhost:3000`
- 前端 H5 dev: `http://localhost:5173` 或 `http://localhost:8080`
- API 前缀: `/api`

## 响应格式
```typescript
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
```

## 彩种编码
- `ssq` - 双色球
- `d3` - 福彩3D
- `qlc` - 七乐彩
- `kl8` - 快乐8

## 接口清单

### 开奖查询
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/lottery/latest/:type` | 最新开奖 |
| GET | `/api/lottery/history/:type` | 历史开奖(分页) |
| GET | `/api/lottery/detail/:type/:issue` | 按期号查询 |

### 数据工具
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/tools/trend/:type/:periods` | 走势图数据(periods=30/50/100) |
| GET | `/api/tools/omission/:type` | 遗漏统计 |
| GET | `/api/tools/distribution/:type` | 号码分布 |
| GET | `/api/tools/hotcold/:type/:periods` | 冷热分析 |

### AI 问答
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/ai/chat` | 非流式对话 |
| POST | `/api/ai/chat/stream` | 流式对话(SSE) |

### 玩法规则
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/rules/:type` | 玩法规则 |
| GET | `/api/rules/prizes/:type` | 奖金对照表 |

### 广告
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/ads/config` | 广告位配置 |

## 数据模型

### LotteryResult
```typescript
interface LotteryResult {
  id: number;
  type: string;        // ssq/d3/qlc/kl8
  issue: string;       // 期号
  drawDate: string;    // 开奖日期 YYYY-MM-DD
  redBalls: string[];  // 红球号码
  blueBall?: string;  // 蓝球号码(双色球)
  bonusBalls?: string[]; // 附加号码(快乐8)
  prizePool?: string;  // 奖池金额
  salesAmount?: string; // 销售额
  createdAt: string;
}
```

### AIChatRequest
```typescript
interface AIChatRequest {
  sessionId: string;   // 前端生成的临时会话ID
  message: string;     // 用户消息
  history?: Array<{role: 'user'|'assistant', content: string}>;
}

interface AIChatResponse {
  sessionId: string;
  reply: string;
  data?: any;          // 附带数据(如走势图数据)
  type: 'text' | 'chart' | 'data';
  disclaimer: string;  // 固定免责声明
}
```

## 前端页面路由
| 路径 | 页面 |
|------|------|
| `/` | AI问答中心(首页) |
| `/pages/lottery/lottery` | 开奖查询 |
| `/pages/tools/trend` | 走势图 |
| `/pages/tools/omission` | 遗漏统计 |
| `/pages/tools/distribution` | 号码分布 |
| `/pages/tools/hotcold` | 冷热分析 |
| `/pages/rules/rules` | 玩法规则 |
| `/pages/collection/collection` | 号码收藏 |
| `/pages/profile/profile` | 个人中心 |

## 合规红线
- AI回答必须包含免责声明
- 禁止任何预测/推荐/诱导性内容
- 所有数据页面标注"历史数据，仅供参考"
- 无登录/注册功能
- 收藏仅本地存储
