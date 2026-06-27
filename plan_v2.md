# 修复与增强计划 v2.0

## 阶段1（并行）

### Agent 1: 前端滚动Bug修复 + 功能完整性
修复所有页面的双滚动条问题，同时补全功能缺失。

**需修复文件（6个）：**
1. `index.vue` — 去掉scroll-view嵌套，改为pageScrollTo自动滚动
2. `lottery.vue` — 去掉scroll-view嵌套，下拉刷新改为页面级
3. `collection.vue` — 去掉scroll-view嵌套
4. `profile.vue` — 去掉scroll-view嵌套
5. `omission.vue` — 去掉纵向scroll-view嵌套，添加期数切换30/50/100
6. `distribution.vue` — 去掉纵向scroll-view嵌套，添加期数切换30/50/100

**功能补全：**
- 4个工具页面添加loading状态
- 去掉index.vue的chart placeholder
- 去掉index.vue的设置图标（placeholder）
- lottery.vue去掉goToDetail placeholder点击
- pages.json添加trend.vue的enablePullDownRefresh

### Agent 2: 后端AI接入小米API + 数据实时抓取

**AI接入：**
- 修改 `backend/src/ai/kimiClient.ts` → 改为真实HTTP调用
- 使用小米API：`https://token-plan-cn.xiaomimimo.com/v1`
- Key: `tp-cdi2rwbroyx60fcqk2djmocmd795r9k12jhxgvbwm6oucg7x`
- 模型: `mimo-v2.5-pro`
- 注意：该模型返回 `reasoning_content` 和 `content`，需要同时处理
- 系统Prompt保持现有的合规过滤prompt
- 后端先做意图识别，然后构建结构化prompt调用AI

**数据实时抓取：**
- 使用kimi_fetch_v2抓取中国福彩官网最新开奖数据
- 或者用kimi_search_v2搜索最新开奖结果
- 使用Kimi WebBridge如果官网需要JS渲染
- 定期抓取并存入数据库

## 阶段2（串行，依赖阶段1合并）

### Agent 3: UI深度优化 + 选号交互 + 数据分析核心增强

**UI深度优化（去除AI味）：**
- 使用更精致的配色方案（低饱和暖色、卡片阴影、微动画）
- 添加页面过渡动画
- 优化字号和行高
- 统一圆角和间距
- 添加骨架屏loading效果
- 使用CSS图标替代emoji（已完成）
- 优化按钮hover/active状态

**选号交互：**
- 号码收藏页面改为网格选号模式
- 双色球：红球1-33网格+蓝球1-16网格，点击选择/取消
- 3D：0-9数字网格，点击选择3个
- 选号完成后保存到收藏

**数据分析核心增强（多维度、心理学角度）：**
- 新增"综合分析"页面（从AI问答首页快捷入口进入）
- 多维度卡片：遗漏排行+冷热分布+号码关联+和值分析+奇偶比+大小比
- 使用心理学吸引设计：
  - 大号数字突出显示（数字越大越醒目）
  - 颜色编码（红色=热、蓝色=冷、绿色=温）
  - 进度条和百分比可视化
  - 近期趋势箭头（↑↓）
  - 数据对比（当前vs历史平均）
  - 一句话洞察总结（如"红球03近期出现频率高于平均值47%"）
- 从AI问答首页添加快捷入口
- 数据工具页面之间添加导航互跳

## 严守红线
- 所有分析数据必须标注"历史数据仅供参考"
- 无预测、无推荐
- 无诱导性语言
- AI回答必须包含免责声明
- 不收集个人数据
