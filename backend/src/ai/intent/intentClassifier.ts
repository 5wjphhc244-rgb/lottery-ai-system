import { Intent, IntentResult, LotteryType } from '../../types';

// 彩票类型映射
const LOTTERY_TYPE_KEYWORDS: Record<LotteryType, string[]> = {
  ssq: ['双色球', 'ssq', '双', '红球', '蓝球'],
  d3: ['福彩3d', '3d', '福彩三', '排列三', '三位'],
  qlc: ['七乐彩', 'qlc', '七'],
  kl8: ['快乐8', 'kl8', '快乐八', 'k8'],
};

// 意图关键词映射
const INTENT_KEYWORDS: Record<Intent, string[]> = {
  latest_draw: ['最近一期', '最新', '最近', '最新一期', '上期', '上一期', '开奖号码', '开奖结果', '开什么', '中了什么'],
  history_query: ['历史', '查询', '查', '往期', '记录', '以前的', '过去的', '某期', '期号', '年月', '最近几期', '近几期', '多少期'],
  omission_query: ['遗漏', '多少期没出', '多久没出', '没出', '多久', '冷号', '漏'],
  trend_query: ['走势', '趋势', '变化', '走向', '图', '50期', '100期', '30期'],
  distribution_query: ['分布', '号码分布', '区间', '段分布', '奇偶', '大小'],
  hotcold_query: ['冷热', '热号', '冷号', '频繁', '出现次数', '统计', '频率'],
  rules_query: ['怎么玩', '玩法', '规则', '怎么买', '怎么选', '说明', '介绍', '是什么'],
  prize_query: ['一等奖', '奖金', '多少钱', '中奖', ' prize', '奖励', '金额', ' payout', '奖级'],
  schedule_query: ['什么时候', '开奖时间', '时间', '周几', '星期', '几点', '停售', '截止'],
  comparison_query: ['对比', '比较', '差异', '区别', '两期', '同期', '相差', '和'],
  basic_info: ['什么是', '福彩', '福利彩票', '彩票', '介绍', '说明', '关于'],
  greeting: ['你好', '您好', '哈喽', 'hi', 'hello', '在吗', '在不在', '有人吗', '早上好', '晚上好', '下午好'],
  prediction: ['预测', '下期', '下一期', '会出什么', '该出了', '要出了', '必出', '一定会', '猜测', '估计', '可能出', '大概率出'],
  recommendation: ['推荐', '建议', '选号', '跟号', '杀号', '定胆', '胆码', '复式', '单式', '选什么', '买什么', '怎么选', '号码建议', '给个数', '帮我选', '推荐号码'],
  unknown: [],
};

// 预测/推荐相关正则（更精确捕获）
const PREDICTION_PATTERNS = [
  /(?:预测|推荐|必中|稳赚|选号|跟号|杀号|定胆|胆码|复式|单式|买什么|怎么选|号码建议|给个数|帮我选|推荐号码|号码推荐)/,
  /(?:下期|下一期|该出了|要出了|必出|一定会|大概率出|近期会出|下期.*?出|下一期.*?开)/,
  /(?:稳赢|包中|中奖率|命中率|概率高| chances|predict|forecast|recommend|pick numbers)/i,
];

// 推荐类意图正则
const RECOMMENDATION_PATTERNS = [
  /(?:推荐|建议|选号|跟号|杀号|定胆|胆码|复式|单式|选什么|买什么|怎么选|号码建议|给个数|帮我选|推荐号码|号码推荐)/,
  /(?:给我|帮我|建议|推荐).*(?:号码|球|数|组合|方案)/,
  /(?:选|买|投).*(?:什么|哪些|哪个|好|合适)/,
];

/**
 * 提取彩种类型
 */
function extractLotteryType(message: string): LotteryType | null {
  const lowerMsg = message.toLowerCase();
  for (const [type, keywords] of Object.entries(LOTTERY_TYPE_KEYWORDS)) {
    for (const kw of keywords) {
      if (lowerMsg.includes(kw.toLowerCase())) {
        return type as LotteryType;
      }
    }
  }
  // 默认双色球
  if (lowerMsg.includes('球') || lowerMsg.includes('奖')) {
    return 'ssq';
  }
  return null;
}

/**
 * 提取期号/日期等实体
 */
function extractEntities(message: string): Record<string, any> {
  const entities: Record<string, any> = {};
  const lotteryType = extractLotteryType(message);
  if (lotteryType) {
    entities.lotteryType = lotteryType;
  }

  // 提取数字期号 (e.g., 2024001, 24001)
  const issueMatch = message.match(/(?:20)?\d{3,5}期?/);
  if (issueMatch) {
    entities.issue = issueMatch[0].replace('期', '');
  }

  // 提取期数限制 (e.g., 50期, 100期)
  const periodsMatch = message.match(/(\d{1,3})期/);
  if (periodsMatch) {
    entities.periods = parseInt(periodsMatch[1], 10);
  }

  // 提取日期
  const dateMatch = message.match(/(\d{4})年(\d{1,2})月/);
  if (dateMatch) {
    entities.year = parseInt(dateMatch[1], 10);
    entities.month = parseInt(dateMatch[2], 10);
  }

  // 提取具体号码
  const numberMatch = message.match(/(?:红球|蓝球|球|号).*?(\d{1,2})/);
  if (numberMatch) {
    entities.number = numberMatch[1].padStart(2, '0');
  }

  return entities;
}

/**
 * 检查是否匹配预测意图
 */
function isPredictionIntent(message: string): boolean {
  const lowerMsg = message.toLowerCase();
  // 直接关键词匹配
  const predictionKeywords = ['预测', '必中', '稳赚', '下期', '下一期', '该出了', '要出了', '必出', '一定会', '大概率出', '近期会出'];
  if (predictionKeywords.some(kw => lowerMsg.includes(kw.toLowerCase()))) {
    return true;
  }
  // 正则匹配
  if (PREDICTION_PATTERNS.some(p => p.test(message))) {
    return true;
  }
  return false;
}

/**
 * 检查是否匹配推荐意图
 */
function isRecommendationIntent(message: string): boolean {
  const lowerMsg = message.toLowerCase();
  const recommendationKeywords = ['推荐', '建议', '选号', '跟号', '杀号', '定胆', '胆码', '复式', '单式', '选什么', '买什么', '怎么选', '号码建议', '给我数', '帮我选', '推荐号码', '号码推荐'];
  if (recommendationKeywords.some(kw => lowerMsg.includes(kw.toLowerCase()))) {
    return true;
  }
  if (RECOMMENDATION_PATTERNS.some(p => p.test(message))) {
    return true;
  }
  return false;
}

/**
 * 计算意图匹配分数
 */
function scoreIntent(message: string, keywords: string[]): number {
  const lowerMsg = message.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (lowerMsg.includes(kw.toLowerCase())) {
      score += 1;
      // 精确匹配加分
      if (lowerMsg === kw.toLowerCase() || lowerMsg.includes(kw.toLowerCase() + ' ') || lowerMsg.includes(' ' + kw.toLowerCase())) {
        score += 0.5;
      }
    }
  }
  return score;
}

/**
 * 意图分类主函数
 */
export function classifyIntent(message: string): IntentResult {
  // 第一层：合规拦截 - 预测/推荐意图
  if (isPredictionIntent(message)) {
    return {
      intent: 'prediction',
      confidence: 1.0,
      entities: extractEntities(message),
    };
  }
  if (isRecommendationIntent(message)) {
    return {
      intent: 'recommendation',
      confidence: 1.0,
      entities: extractEntities(message),
    };
  }

  // 第二层：正常意图分类
  const scores: Record<string, number> = {};
  const normalIntents: Intent[] = [
    'latest_draw', 'history_query', 'omission_query', 'trend_query',
    'distribution_query', 'hotcold_query', 'rules_query', 'prize_query',
    'schedule_query', 'comparison_query', 'basic_info', 'greeting',
  ];

  for (const intent of normalIntents) {
    scores[intent] = scoreIntent(message, INTENT_KEYWORDS[intent]);
  }

  // 找出最高分意图
  let bestIntent: Intent = 'unknown';
  let bestScore = 0;
  for (const [intent, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent as Intent;
    }
  }

  // 特殊规则："最近X期" 应归为 history_query 而非 latest_draw
  const recentPeriodsMatch = message.match(/最近\s*(\d+|几|多|N)\s*期/);
  if (recentPeriodsMatch && bestIntent === 'latest_draw') {
    bestIntent = 'history_query';
  }

  // 最低置信度阈值
  if (bestScore < 0.5) {
    bestIntent = 'unknown';
  }

  return {
    intent: bestIntent,
    confidence: Math.min(bestScore / 2, 1.0),
    entities: extractEntities(message),
  };
}

/**
 * 快速检查是否为违规意图（用于 Layer 1）
 */
export function isViolationIntent(intent: Intent): boolean {
  return intent === 'prediction' || intent === 'recommendation';
}
