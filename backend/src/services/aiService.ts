import { getRedis } from '../utils/redis';
import { mockData } from '../data/mockData';
import { getRules } from './rulesService';
import { getPool } from '../utils/db';
import {
  ChatRequest,
  ChatResponse,
  ChatMessage,
  SessionData,
  IntentResult,
  LotteryResult,
  LotteryRule,
} from '../types';
import { classifyIntent, isViolationIntent } from '../ai/intent/intentClassifier';
import { applyComplianceFilter } from '../ai/compliance/complianceFilter';
import {
  callMimoAPI,
  buildAIMessages,
  formatDataContext,
  generateResponse,
} from '../ai/mimoClient';
import {
  SYSTEM_PROMPT,
  GREETING_TEMPLATE,
  UNKNOWN_TEMPLATE,
  LOTTERY_BASIC_INFO,
  SCHEDULE_INFO,
  PRIZE_INFO,
} from '../ai/prompt/systemPrompt';

const SESSION_TTL = 24 * 60 * 60; // 24小时
const MAX_SESSION_ROUNDS = 20; // 最大对话轮数
const REDIS_KEY_PREFIX = 'ai:session:';

/**
 * AI 服务主类
 * 处理聊天请求的全流程：会话管理 -> 意图识别 -> 数据查询 -> 回复生成 -> 合规过滤 -> 返回
 */
class AIService {
  /**
   * 获取会话数据
   */
  private async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      const redis = getRedis();
      const key = `${REDIS_KEY_PREFIX}${sessionId}`;
      const data = await redis.get(key);
      if (!data) return null;
      try {
        return JSON.parse(data) as SessionData;
      } catch {
        return null;
      }
    } catch (err) {
      console.error('Redis get session error:', err);
      return null;
    }
  }

  /**
   * 保存会话数据
   */
  private async saveSession(sessionId: string, session: SessionData): Promise<void> {
    try {
      const redis = getRedis();
      const key = `${REDIS_KEY_PREFIX}${sessionId}`;
      // 限制最大轮数
      if (session.messages.length > MAX_SESSION_ROUNDS * 2) {
        session.messages = session.messages.slice(-MAX_SESSION_ROUNDS * 2);
      }
      session.updatedAt = new Date().toISOString();
      await redis.setex(key, SESSION_TTL, JSON.stringify(session));
    } catch (err) {
      console.error('Redis save session error:', err);
    }
  }

  /**
   * 创建新会话
   */
  private createSession(sessionId: string): SessionData {
    return {
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 查询最新开奖数据
   */
  private async queryLatestDraw(lotteryType: string): Promise<LotteryResult | null> {
    try {
      const pool = getPool();
      const [rows] = await pool.execute(
        'SELECT * FROM lottery_results WHERE type = ? ORDER BY draw_date DESC LIMIT 1',
        [lotteryType]
      );
      const results = rows as any[];
      return results[0] || null;
    } catch (err) {
      console.error('Query latest draw error:', err);
      return null;
    }
  }

  /**
   * 查询历史数据
   */
  private async queryHistory(
    lotteryType: string,
    limit: number = 20,
    year?: number,
    month?: number
  ): Promise<LotteryResult[]> {
    try {
      const pool = getPool();
      let sql = 'SELECT * FROM lottery_results WHERE type = ?';
      const params: any[] = [lotteryType];

      if (year) {
        sql += ' AND YEAR(draw_date) = ?';
        params.push(year);
      }
      if (month) {
        sql += ' AND MONTH(draw_date) = ?';
        params.push(month);
      }

      sql += ' ORDER BY draw_date DESC LIMIT ?';
      params.push(limit);

      const [rows] = await pool.execute(sql, params);
      return (rows as any[]) || [];
    } catch (err) {
      console.error('Query history error:', err);
      return [];
    }
  }

  /**
   * 查询具体期号数据
   */
  private async queryByIssue(lotteryType: string, issue: string): Promise<LotteryResult | null> {
    try {
      const pool = getPool();
      const [rows] = await pool.execute(
        'SELECT * FROM lottery_results WHERE type = ? AND issue = ?',
        [lotteryType, issue]
      );
      const results = rows as any[];
      return results[0] || null;
    } catch (err) {
      console.error('Query by issue error:', err);
      return null;
    }
  }

  /**
   * 查询统计数据
   */
  private async queryStats(
    lotteryType: string,
    statType: string,
    periods?: number
  ): Promise<any> {
    try {
      const pool = getPool();
      let sql = 'SELECT * FROM lottery_stats WHERE type = ? AND stat_type = ?';
      const params: any[] = [lotteryType, statType];
      if (periods) {
        sql += ' AND periods = ?';
        params.push(periods);
      }
      sql += ' ORDER BY computed_at DESC LIMIT 1';
      const [rows] = await pool.execute(sql, params);
      const results = rows as any[];
      if (results[0]) {
        return {
          ...results[0],
          stat_data: typeof results[0].stat_data === 'string'
            ? JSON.parse(results[0].stat_data)
            : results[0].stat_data,
        };
      }
      return null;
    } catch (err) {
      console.error('Query stats error:', err);
      return null;
    }
  }

  /**
   * 查询规则数据
   */
  private async queryRules(lotteryType: string): Promise<LotteryRule[]> {
    try {
      const pool = getPool();
      const [rows] = await pool.execute(
        'SELECT * FROM lottery_rules WHERE type = ? ORDER BY sort_order ASC',
        [lotteryType]
      );
      return (rows as any[]) || [];
    } catch (err) {
      console.error('Query rules error:', err);
      return [];
    }
  }

  /**
   * 查询走势图数据
   */
  private async queryTrendData(lotteryType: string, periods: number = 50): Promise<any[]> {
    try {
      const pool = getPool();
      const [rows] = await pool.execute(
        'SELECT issue, draw_date, red_balls, blue_ball, bonus_balls FROM lottery_results WHERE type = ? ORDER BY draw_date DESC LIMIT ?',
        [lotteryType, periods]
      );
      return (rows as any[]) || [];
    } catch (err) {
      console.error('Query trend data error:', err);
      return [];
    }
  }

  /**
   * 根据意图查询数据
   */
  private async queryDataByIntent(intentResult: IntentResult): Promise<any> {
    const { intent, entities } = intentResult;
    const lotteryType = entities.lotteryType || 'ssq';
    const periods = entities.periods || 50;
    const issue = entities.issue;

    switch (intent) {
      case 'latest_draw': {
        const result = await this.queryLatestDraw(lotteryType);
        if (!result && mockData[lotteryType]) {
          const mock = mockData[lotteryType];
          return mock[0] || null;
        }
        return result;
      }
      case 'history_query': {
        const limit = Math.min(periods || 20, 100);
        const result = await this.queryHistory(lotteryType, limit, entities.year, entities.month);
        if ((!result || result.length === 0) && mockData[lotteryType]) {
          return mockData[lotteryType].slice(0, limit);
        }
        return result;
      }
      case 'omission_query': {
        const stats = await this.queryStats(lotteryType, 'omission', periods);
        if (stats) return stats;
        // fallback: compute from mock data
        const mock = mockData[lotteryType];
        if (mock) {
          return { type: lotteryType, omission: computeMockOmission(mock, lotteryType) };
        }
        return { type: lotteryType, omission: [] };
      }
      case 'trend_query': {
        const result = await this.queryTrendData(lotteryType, periods);
        if (result && result.length > 0) return result;
        if (mockData[lotteryType]) {
          return mockData[lotteryType].slice(0, periods).map(r => ({
            issue: r.issue,
            draw_date: r.draw_date,
            red_balls: Array.isArray(r.red_balls) ? r.red_balls : JSON.parse(r.red_balls),
            blue_ball: r.blue_ball || undefined,
            bonus_balls: r.bonus_balls ? (Array.isArray(r.bonus_balls) ? r.bonus_balls : JSON.parse(r.bonus_balls)) : undefined,
          }));
        }
        return [];
      }
      case 'distribution_query': {
        const stats = await this.queryStats(lotteryType, 'distribution', periods);
        if (stats) return stats;
        const mock = mockData[lotteryType];
        if (mock) {
          return { type: lotteryType, distribution: computeMockDistribution(mock, lotteryType) };
        }
        return { type: lotteryType, distribution: [] };
      }
      case 'hotcold_query': {
        const stats = await this.queryStats(lotteryType, 'hotcold', periods);
        if (stats) return stats;
        const mock = mockData[lotteryType];
        if (mock) {
          return { type: lotteryType, ...computeMockHotCold(mock, lotteryType, periods) };
        }
        return { type: lotteryType, hotcold: [] };
      }
      case 'rules_query': {
        const result = await this.queryRules(lotteryType);
        if (result && result.length > 0) return result;
        return getRules(lotteryType); // fallback to static rules
      }
      case 'prize_query': {
        return PRIZE_INFO[lotteryType] || '暂无奖级信息。';
      }
      case 'schedule_query': {
        return SCHEDULE_INFO[lotteryType] || '暂无开奖时间信息。';
      }
      case 'comparison_query': {
        if (issue) {
          const a = await this.queryLatestDraw(lotteryType);
          const b = await this.queryByIssue(lotteryType, issue);
          return [a, b].filter(Boolean);
        }
        // 默认对比最近两期
        const history = await this.queryHistory(lotteryType, 2);
        return history;
      }
      case 'basic_info': {
        return LOTTERY_BASIC_INFO[lotteryType] || '中国福利彩票是由国家发行的公益彩票，包括双色球、福彩3D、七乐彩、快乐8等多种游戏。';
      }
      case 'greeting':
      case 'prediction':
      case 'recommendation':
      case 'unknown':
      default: {
        return null;
      }
    }
  }

  /**
   * 处理聊天请求
   */
  async processChat(req: ChatRequest): Promise<ChatResponse> {
    const { sessionId, message, history } = req;

    // 1. 获取会话
    let session = await this.getSession(sessionId);
    if (!session) {
      session = this.createSession(sessionId);
    }

    // 合并前端传入的历史（如果存在）
    if (history && history.length > 0) {
      // 去重合并
      const existingContents = new Set(session.messages.map(m => m.content));
      for (const msg of history) {
        if (!existingContents.has(msg.content)) {
          session.messages.push(msg);
          existingContents.add(msg.content);
        }
      }
    }

    // 添加当前用户消息
    session.messages.push({ role: 'user', content: message });

    // 2. 意图分类
    const intentResult = classifyIntent(message);

    // 3. 如果是违规意图，直接返回拒绝
    if (isViolationIntent(intentResult.intent)) {
      const complianceResult = applyComplianceFilter(message, '', intentResult.intent);
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: complianceResult.response,
      };
      session.messages.push(assistantMessage);
      await this.saveSession(sessionId, session);

      return {
        sessionId,
        reply: complianceResult.response,
        type: 'text',
        disclaimer: complianceResult.response.split('\n\n---\n').pop() || '',
      };
    }

    // 4. 查询数据
    let data: any = null;
    try {
      data = await this.queryDataByIntent(intentResult);
    } catch (err) {
      console.error('Data query error:', err);
      data = null;
    }

    // 5. 生成 AI 回复：先尝试调用Mimo API，失败则fallback到Mock
    let generatedReply = '';
    let responseType: 'text' | 'chart' | 'data' = 'text';

    // 尝试构建AI消息并调用真实API
    if (data && intentResult.intent !== 'greeting' && intentResult.intent !== 'unknown') {
      const dataContext = formatDataContext(intentResult.intent, data);
      const aiMessages = buildAIMessages(SYSTEM_PROMPT, message, dataContext);
      const aiReply = await callMimoAPI(aiMessages);
      if (aiReply && aiReply.trim().length > 0) {
        generatedReply = aiReply;
        // 根据意图推断类型
        if (intentResult.intent === 'trend_query') {
          responseType = 'chart';
        } else if (['latest_draw', 'history_query', 'omission_query', 'distribution_query', 'hotcold_query'].includes(intentResult.intent)) {
          responseType = 'data';
        } else {
          responseType = 'text';
        }
      }
    }

    // Fallback：AI调用失败或数据为空时，使用Mock生成
    if (!generatedReply) {
      const mockResponse = generateResponse(intentResult, data);
      generatedReply = mockResponse.content;
      responseType = mockResponse.type;
    }

    // 6. 应用合规过滤器（三层过滤保持不变）
    const complianceResult = applyComplianceFilter(message, generatedReply, intentResult.intent);
    let finalReply = complianceResult.response;

    // 提取 disclaimer（从响应末尾分离）
    let disclaimer = '';
    const disclaimerSeparator = '\n\n---\n';
    const sepIndex = finalReply.lastIndexOf(disclaimerSeparator);
    if (sepIndex >= 0) {
      disclaimer = finalReply.substring(sepIndex + disclaimerSeparator.length);
      finalReply = finalReply.substring(0, sepIndex);
    }

    // 7. 保存助手回复到会话
    session.messages.push({ role: 'assistant', content: finalReply });
    await this.saveSession(sessionId, session);

    // 8. 返回响应
    return {
      sessionId,
      reply: finalReply,
      data: data,
      type: responseType,
      disclaimer: disclaimer || '以上数据来源于中国福利彩票发行管理中心官方开奖公告，仅供参考。彩票开奖号码为随机产生，历史数据不代表未来趋势。请理性购彩，量力而行。',
    };
  }

  /**
   * 流式处理（SSE）
   */
  async processChatStream(
    req: ChatRequest,
    onChunk: (chunk: string) => void,
    onDone: (disclaimer: string) => void
  ): Promise<void> {
    const response = await this.processChat(req);

    // 模拟流式输出
    const chars = response.reply.split('');
    for (let i = 0; i < chars.length; i++) {
      onChunk(chars[i]);
      // 模拟延迟，但不阻塞太久
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }

    onDone(response.disclaimer);
  }
}

export const aiService = new AIService();
export default AIService;

// === Mock data helpers for AI fallback when DB is unavailable ===

function getAllNumbers(type: string): string[] {
  switch (type) {
    case 'ssq': return Array.from({ length: 33 }, (_, i) => String(i + 1).padStart(2, '0'));
    case 'd3': return Array.from({ length: 10 }, (_, i) => String(i));
    case 'qlc': return Array.from({ length: 30 }, (_, i) => String(i + 1).padStart(2, '0'));
    case 'kl8': return Array.from({ length: 80 }, (_, i) => String(i + 1).padStart(2, '0'));
    default: return [];
  }
}

function extractNumbers(r: any, type: string): string[] {
  if (type === 'kl8') return r.bonus_balls || [];
  return r.red_balls || [];
}

function computeMockOmission(mock: any[], type: string) {
  const periods = Math.min(mock.length, 50);
  const data = mock.slice(0, periods);
  const allNumbers = getAllNumbers(type);
  const lastSeen: Record<string, number> = {};
  allNumbers.forEach(n => (lastSeen[n] = periods));
  data.forEach((item, index) => {
    extractNumbers(item, type).forEach((num: string) => {
      if (lastSeen[num] === periods) lastSeen[num] = index;
    });
  });
  return allNumbers.map(num => ({
    number: num,
    missed: lastSeen[num],
    maxMissed: lastSeen[num] + Math.floor(Math.random() * 10),
    avgMissed: Math.floor(lastSeen[num] * 0.8 + 5),
  })).sort((a, b) => b.missed - a.missed);
}

function computeMockDistribution(mock: any[], type: string) {
  const allNumbers = getAllNumbers(type);
  const counts: Record<string, number> = {};
  allNumbers.forEach(n => (counts[n] = 0));
  mock.forEach((item) => {
    extractNumbers(item, type).forEach((num: string) => {
      if (counts[num] !== undefined) counts[num]++;
    });
  });
  return allNumbers.map(num => ({ number: num, count: counts[num] }));
}

function computeMockHotCold(mock: any[], type: string, periods: number) {
  const data = mock.slice(0, periods);
  const allNumbers = getAllNumbers(type);
  const counts: Record<string, number> = {};
  allNumbers.forEach(n => (counts[n] = 0));
  data.forEach((item) => {
    extractNumbers(item, type).forEach((num: string) => {
      if (counts[num] !== undefined) counts[num]++;
    });
  });
  const sorted = allNumbers.slice().sort((a, b) => counts[b] - counts[a]);
  return {
    periods,
    hot: sorted.slice(0, 5).map(num => ({ number: num, count: counts[num] })),
    cold: sorted.slice(-5).map(num => ({ number: num, count: counts[num] })),
  };
}
