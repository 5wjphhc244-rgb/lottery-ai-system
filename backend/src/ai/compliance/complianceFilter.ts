import { Intent } from '../../types';

// 第一层：意图拦截关键词
const VIOLATION_KEYWORDS = [
  '预测', '推荐', '必中', '稳赚', '选号', '跟号', '杀号', '定胆', '胆码', '复式', '单式',
  '热门', '冷门', '该出了', '要出了', '下期', '下一期', '必出', '一定会', '大概率出',
  '近期会出', '号码建议', '帮我选', '推荐号码', '号码推荐', '买什么', '怎么选', '选什么',
  '稳赢', '包中', '中奖率', '命中率', ' chances', 'predict', 'forecast', 'recommend',
  'pick numbers', 'buy numbers', 'lucky numbers', 'hot numbers', 'cold numbers',
];

// 第二层：响应审查禁用词
const FORBIDDEN_WORDS = [
  '预测', '推荐', '必中', '稳赚', '跟号', '杀号', '专家', '大概率', '近期会出',
  '该出了', '要出了', '必出', '稳赢', '包中', '中奖率', '命中率', ' chances of winning',
  'guaranteed', 'predict', 'recommend', 'hot number', 'cold number', 'must appear',
];

// 安全替代词映射
const SAFE_REPLACEMENTS: Record<string, string> = {
  '预测': '统计',
  '推荐': '说明',
  '必中': '随机',
  '稳赚': '理性',
  '跟号': '查看',
  '杀号': '排除',
  '专家': '系统',
  '大概率': '历史出现',
  '近期会出': '历史出现',
  '该出了': '历史出现',
  '要出了': '历史出现',
  '必出': '历史出现',
  '稳赢': '理性',
  '包中': '随机',
  '中奖率': '出现频率',
  '命中率': '出现次数',
};

// 标准免责声明
export const DISCLAIMER = '以上数据来源于中国福利彩票发行管理中心官方开奖公告，仅供参考。彩票开奖号码为随机产生，历史数据不代表未来趋势。请理性购彩，量力而行。';

// 标准拒绝话术
export const REFUSAL_MESSAGE = '抱歉，我仅提供已开奖的历史数据查询，不做任何预测或推荐。请问您需要查询哪期的开奖号码？';

/**
 * 第一层：意图拦截
 * 检查用户输入是否包含违规关键词
 */
export function checkInputViolation(message: string): { isViolation: boolean; reason?: string } {
  const lowerMsg = message.toLowerCase();
  for (const keyword of VIOLATION_KEYWORDS) {
    if (lowerMsg.includes(keyword.toLowerCase())) {
      return {
        isViolation: true,
        reason: `检测到违规关键词: ${keyword}`,
      };
    }
  }
  return { isViolation: false };
}

/**
 * 第二层：响应审查
 * 扫描生成的响应，替换禁用词
 */
export function reviewResponse(response: string): string {
  let cleaned = response;
  for (const word of FORBIDDEN_WORDS) {
    const lowerWord = word.toLowerCase();
    const regex = new RegExp(lowerWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    cleaned = cleaned.replace(regex, (match) => {
      const replacement = SAFE_REPLACEMENTS[match] || SAFE_REPLACEMENTS[match.toLowerCase()];
      return replacement || '**';
    });
  }
  return cleaned;
}

/**
 * 第三层：添加免责声明
 */
export function appendDisclaimer(response: string): string {
  return `${response}\n\n---\n${DISCLAIMER}`;
}

/**
 * 完整的合规过滤器
 * 对输入进行拦截检查，对输出进行审查和添加免责声明
 */
export function applyComplianceFilter(
  userMessage: string,
  generatedResponse: string,
  intent: Intent
): { response: string; isBlocked: boolean; blockReason?: string } {
  // 第一层：意图拦截
  if (intent === 'prediction' || intent === 'recommendation') {
    return {
      response: appendDisclaimer(REFUSAL_MESSAGE),
      isBlocked: true,
      blockReason: '检测到预测/推荐请求',
    };
  }

  // 输入安全检查（二次确认）
  const inputCheck = checkInputViolation(userMessage);
  if (inputCheck.isViolation) {
    return {
      response: appendDisclaimer(REFUSAL_MESSAGE),
      isBlocked: true,
      blockReason: inputCheck.reason,
    };
  }

  // 第二层：响应审查
  const reviewedResponse = reviewResponse(generatedResponse);

  // 第三层：添加免责声明
  const finalResponse = appendDisclaimer(reviewedResponse);

  return {
    response: finalResponse,
    isBlocked: false,
  };
}

/**
 * 生成合规拒绝响应（用于直接返回）
 */
export function generateRefusalResponse(): string {
  return appendDisclaimer(REFUSAL_MESSAGE);
}

/**
 * 生成带免责声明的响应（用于非拒绝场景）
 */
export function generateSafeResponse(content: string): string {
  const reviewed = reviewResponse(content);
  return appendDisclaimer(reviewed);
}
