import axios from 'axios';
import { config } from '../config';
import { Intent, IntentResult } from '../types';

/**
 * Mimo AI 客户端
 * 调用小米mimo-v2.5-pro API生成自然语言回复
 * 支持 content 和 reasoning_content 双字段回取
 */

export async function callMimoAPI(
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  try {
    const response = await axios.post(
      `${config.mimo.baseUrl}/chat/completions`,
      {
        model: config.mimo.model,
        messages,
        max_tokens: 2000,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${config.mimo.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const choice = response.data.choices?.[0];
    if (!choice) return '';

    // mimo-v2.5-pro 返回 reasoning_content 和 content
    const content = choice.message?.content || '';
    const reasoning = choice.message?.reasoning_content || '';

    // 优先使用content，如果为空则使用reasoning
    return content || reasoning || '';
  } catch (error: any) {
    console.error('Mimo API error:', error.message);
    if (error.response) {
      console.error('Mimo API status:', error.response.status);
      console.error('Mimo API data:', JSON.stringify(error.response.data, null, 2));
    }
    return '';
  }
}

/**
 * 构建系统提示 + 数据上下文的messages数组
 */
export function buildAIMessages(
  systemPrompt: string,
  userMessage: string,
  dataContext?: string
): Array<{ role: string; content: string }> {
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];

  if (dataContext) {
    messages.push({
      role: 'system',
      content: `以下是用户查询的相关数据上下文，请基于这些数据回答：\n\n${dataContext}`,
    });
  }

  messages.push({ role: 'user', content: userMessage });

  return messages;
}

/**
 * 格式化数据为自然语言上下文
 */
export function formatDataContext(intent: string, data: any): string {
  if (!data) return '';

  try {
    switch (intent) {
      case 'latest_draw': {
        if (!data) return '';
        const typeNames: Record<string, string> = {
          ssq: '双色球',
          d3: '福彩3D',
          qlc: '七乐彩',
          kl8: '快乐8',
        };
        const typeName = typeNames[data.type] || data.type;
        const redBalls = Array.isArray(data.red_balls)
          ? data.red_balls.join(', ')
          : data.red_balls;
        const parts = [
          `${typeName}第${data.issue}期开奖结果：`,
          `红球：${redBalls}`,
        ];
        if (data.blue_ball) {
          parts.push(`蓝球：${data.blue_ball}`);
        }
        if (data.bonus_balls && Array.isArray(data.bonus_balls) && data.bonus_balls.length > 0) {
          parts.push(`附加号码：${data.bonus_balls.join(', ')}`);
        }
        parts.push(`开奖日期：${data.draw_date}`);
        if (data.prize_pool) parts.push(`奖池金额：${data.prize_pool}`);
        if (data.sales_amount) parts.push(`销售额：${data.sales_amount}`);
        return parts.join('\n');
      }
      case 'history_query': {
        if (!Array.isArray(data) || data.length === 0) return '';
        const lines = data.slice(0, 10).map((r: any) => {
          const nums = Array.isArray(r.red_balls)
            ? r.red_balls.join(', ')
            : r.red_balls;
          const blue = r.blue_ball ? ` + ${r.blue_ball}` : '';
          return `第${r.issue}期（${r.draw_date}）：${nums}${blue}`;
        });
        const more = data.length > 10 ? `\n...共${data.length}条记录，仅展示前10条` : '';
        return `查询到以下历史开奖数据：\n${lines.join('\n')}${more}`;
      }
      case 'omission_query': {
        if (!data || !data.omission || data.omission.length === 0) return '';
        const lines = data.omission.map((item: any) => {
          return `${item.number}号：连续${item.missed}期未出现`;
        });
        return `遗漏统计如下（历史数据）：\n${lines.join('\n')}`;
      }
      case 'trend_query': {
        if (!data || data.length === 0) return '';
        return `已为您查询到${data.length}期历史开奖记录。`;
      }
      case 'distribution_query': {
        if (!data || !data.distribution || data.distribution.length === 0) return '';
        const lines = data.distribution.map((item: any) => {
          return `${item.range || item.number}：出现${item.count}次`;
        });
        return `号码分布统计如下：\n${lines.join('\n')}`;
      }
      case 'hotcold_query': {
        if (!data || !data.hotcold || data.hotcold.length === 0) return '';
        const hot = data.hotcold
          .filter((item: any) => item.type === 'hot')
          .map((item: any) => item.number)
          .join(', ');
        const cold = data.hotcold
          .filter((item: any) => item.type === 'cold')
          .map((item: any) => item.number)
          .join(', ');
        const warm = data.hotcold
          .filter((item: any) => item.type === 'warm')
          .map((item: any) => item.number)
          .join(', ');
        const parts: string[] = ['冷热分析如下（基于历史数据统计）：'];
        if (hot) parts.push(`热号（出现频率较高）：${hot}`);
        if (warm) parts.push(`温号（出现频率中等）：${warm}`);
        if (cold) parts.push(`冷号（出现频率较低）：${cold}`);
        return parts.join('\n');
      }
      case 'rules_query': {
        if (!data) return '';
        if (!Array.isArray(data) && data.bettingRules) {
          const parts = [
            `【${data.name}】玩法规则：`,
            data.description,
            '',
            '【开奖时间】' + data.drawSchedule,
            '',
            '【投注规则】',
            ...data.bettingRules.map((r: string) => '• ' + r),
            '',
            '【开奖规则】',
            ...data.drawRules.map((r: string) => '• ' + r),
            '',
            '【奖金规则】',
            ...data.prizeRules.map((r: string) => '• ' + r),
            '',
            '【兑奖指南】',
            `兑奖地点：${data.claimGuide.location}`,
            `兑奖期限：${data.claimGuide.deadline}`,
            `所需证件：${data.claimGuide.documents.join('、')}`,
          ];
          return parts.join('\n');
        }
        if (Array.isArray(data)) {
          const lines = data.map((r: any) => `${r.title}：${r.content}`);
          return lines.join('\n\n');
        }
        return JSON.stringify(data, null, 2);
      }
      case 'prize_query': {
        if (typeof data === 'string') return data;
        if (!data || !data.prizes || data.prizes.length === 0) return '';
        const lines = data.prizes.map(
          (p: any) => `${p.level}：${p.amount}元（条件：${p.condition}）`
        );
        return `奖级设置如下：\n${lines.join('\n')}`;
      }
      case 'schedule_query': {
        return typeof data === 'string' ? data : JSON.stringify(data);
      }
      case 'comparison_query': {
        if (!data || data.length < 2) return '';
        const [a, b] = data;
        const aNums = Array.isArray(a.red_balls)
          ? a.red_balls.join(', ')
          : a.red_balls;
        const bNums = Array.isArray(b.red_balls)
          ? b.red_balls.join(', ')
          : b.red_balls;
        const aBlue = a.blue_ball ? ` + ${a.blue_ball}` : '';
        const bBlue = b.blue_ball ? ` + ${b.blue_ball}` : '';
        return [
          `期次对比：`,
          `第${a.issue}期（${a.draw_date}）：${aNums}${aBlue}`,
          `第${b.issue}期（${b.draw_date}）：${bNums}${bBlue}`,
        ].join('\n');
      }
      case 'basic_info': {
        return typeof data === 'string' ? data : JSON.stringify(data);
      }
      default:
        return JSON.stringify(data, null, 2);
    }
  } catch (e) {
    console.error('formatDataContext error:', e);
    return '';
  }
}

// ============================================================
// Fallback: Mock response generators (used when Mimo API fails)
// ============================================================

interface MockKimiResponse {
  content: string;
  type: 'text' | 'chart' | 'data';
}

function formatDrawNumbers(result: any): string {
  const redBalls = Array.isArray(result.red_balls) ? result.red_balls.join(', ') : result.red_balls;
  const parts: string[] = [`红球：${redBalls}`];
  if (result.blue_ball) {
    parts.push(`蓝球：${result.blue_ball}`);
  }
  if (result.bonus_balls && Array.isArray(result.bonus_balls) && result.bonus_balls.length > 0) {
    parts.push(`附加号码：${result.bonus_balls.join(', ')}`);
  }
  return parts.join('，');
}

function generateLatestDrawResponse(data: any): MockKimiResponse {
  if (!data) {
    return { content: '未查询到相关开奖数据。', type: 'text' };
  }

  const typeNames: Record<string, string> = {
    ssq: '双色球',
    d3: '福彩3D',
    qlc: '七乐彩',
    kl8: '快乐8',
  };

  const typeName = typeNames[data.type] || data.type;
  const numbers = formatDrawNumbers(data);
  const parts = [
    `${typeName}第${data.issue}期开奖结果：`,
    numbers,
    `开奖日期：${data.draw_date}`,
  ];
  if (data.prize_pool) {
    parts.push(`奖池金额：${data.prize_pool}`);
  }
  if (data.sales_amount) {
    parts.push(`销售额：${data.sales_amount}`);
  }

  return { content: parts.join('\n'), type: 'data' };
}

function generateHistoryResponse(data: any[]): MockKimiResponse {
  if (!data || data.length === 0) {
    return { content: '未查询到相关历史开奖数据。', type: 'text' };
  }
  const lines = data.slice(0, 10).map((r: any) => {
    const nums = formatDrawNumbers(r);
    return `第${r.issue}期（${r.draw_date}）：${nums}`;
  });
  const more = data.length > 10 ? `\n...共${data.length}条记录，仅展示前10条` : '';
  return { content: `查询到以下历史开奖数据：\n${lines.join('\n')}${more}`, type: 'data' };
}

function generateOmissionResponse(data: any): MockKimiResponse {
  if (!data || !data.omission || data.omission.length === 0) {
    return { content: '暂无遗漏统计数据。遗漏统计反映的是某个号码在历史开奖中连续未出现的期数，属于历史数据回顾。', type: 'text' };
  }
  const lines = data.omission.map((item: any) => {
    return `${item.number}号：连续${item.missed}期未出现`;
  });
  return { content: `遗漏统计如下（历史数据）：\n${lines.join('\n')}`, type: 'data' };
}

function generateTrendResponse(data: any[]): MockKimiResponse {
  if (!data || data.length === 0) {
    return { content: '暂无走势数据。走势图展示的是历史开奖号码的分布情况，供您参考历史规律。', type: 'text' };
  }
  return {
    content: `已为您生成走势图数据，共${data.length}期历史开奖记录。您可以查看各号码的出现位置和频率分布。`,
    type: 'chart',
  };
}

function generateDistributionResponse(data: any): MockKimiResponse {
  if (!data || !data.distribution || data.distribution.length === 0) {
    return { content: '暂无号码分布数据。号码分布展示的是历史开奖中各号码的出现次数统计。', type: 'text' };
  }
  const lines = data.distribution.map((item: any) => {
    return `${item.range || item.number}：出现${item.count}次`;
  });
  return { content: `号码分布统计如下：\n${lines.join('\n')}`, type: 'data' };
}

function generateHotColdResponse(data: any): MockKimiResponse {
  if (!data || !data.hotcold || data.hotcold.length === 0) {
    return { content: '暂无冷热分析数据。冷热统计基于历史开奖频率计算，仅为历史数据回顾。', type: 'text' };
  }
  const hot = data.hotcold.filter((item: any) => item.type === 'hot').map((item: any) => item.number).join(', ');
  const cold = data.hotcold.filter((item: any) => item.type === 'cold').map((item: any) => item.number).join(', ');
  const warm = data.hotcold.filter((item: any) => item.type === 'warm').map((item: any) => item.number).join(', ');
  const parts: string[] = ['冷热分析如下（基于历史数据统计）：'];
  if (hot) parts.push(`热号（出现频率较高）：${hot}`);
  if (warm) parts.push(`温号（出现频率中等）：${warm}`);
  if (cold) parts.push(`冷号（出现频率较低）：${cold}`);
  parts.push('注：冷热统计仅为历史数据回顾，不代表未来趋势。');
  return { content: parts.join('\n'), type: 'data' };
}

function generateRulesResponse(data: any): MockKimiResponse {
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return { content: '暂无规则数据，以下是通用说明：中国福利彩票是由国家发行的公益彩票，各彩种玩法可在我查询系统中查看。', type: 'text' };
  }
  if (!Array.isArray(data) && data.bettingRules) {
    const parts = [
      `【${data.name}】玩法规则：`,
      data.description,
      '',
      '【开奖时间】' + data.drawSchedule,
      '',
      '【投注规则】',
      ...data.bettingRules.map((r: string) => '• ' + r),
      '',
      '【开奖规则】',
      ...data.drawRules.map((r: string) => '• ' + r),
      '',
      '【奖金规则】',
      ...data.prizeRules.map((r: string) => '• ' + r),
      '',
      '【兑奖指南】',
      `兑奖地点：${data.claimGuide.location}`,
      `兑奖期限：${data.claimGuide.deadline}`,
      `所需证件：${data.claimGuide.documents.join('、')}`,
    ];
    return { content: parts.join('\n'), type: 'text' };
  }
  const lines = data.map((r: any) => `${r.title}：${r.content}`);
  return { content: lines.join('\n\n'), type: 'text' };
}

function generatePrizeResponse(data: any): MockKimiResponse {
  if (typeof data === 'string') {
    return { content: data, type: 'text' };
  }
  if (!data || !data.prizes || data.prizes.length === 0) {
    return { content: '暂无奖级数据，具体奖金以每期开奖公告为准。', type: 'text' };
  }
  const lines = data.prizes.map((p: any) => `${p.level}：${p.amount}元（条件：${p.condition}）`);
  return { content: `奖级设置如下：\n${lines.join('\n')}`, type: 'text' };
}

function generateScheduleResponse(data: string): MockKimiResponse {
  return { content: data, type: 'text' };
}

function generateComparisonResponse(data: any[]): MockKimiResponse {
  if (!data || data.length < 2) {
    return { content: '未找到足够的数据进行对比。请提供两期具体的期号。', type: 'text' };
  }
  const [a, b] = data;
  const lines = [
    `期次对比：`,
    `第${a.issue}期（${a.draw_date}）：${formatDrawNumbers(a)}`,
    `第${b.issue}期（${b.draw_date}）：${formatDrawNumbers(b)}`,
  ];
  return { content: lines.join('\n'), type: 'data' };
}

function generateBasicInfoResponse(data: string): MockKimiResponse {
  return { content: data, type: 'text' };
}

function generateGreetingResponse(): MockKimiResponse {
  return {
    content: `您好！我是福彩AI助手，可以为您提供以下服务：
• 查询历史开奖数据（双色球、福彩3D、七乐彩、快乐8）
• 解释各彩种玩法规则和中奖条件
• 查看历史统计指标（走势、遗漏、冷热、分布等）
• 了解开奖时间和购彩须知

请问您想了解哪方面的信息？`,
    type: 'text',
  };
}

function generateUnknownResponse(): MockKimiResponse {
  return {
    content: '抱歉，我没有理解您的问题。我可以帮您查询历史开奖数据、解释玩法规则或查看统计指标。请问您具体想了解什么？',
    type: 'text',
  };
}

function generateRefusalResponse(): MockKimiResponse {
  return {
    content: '抱歉，我仅提供已开奖的历史数据查询，不做任何预测或推荐。请问您需要查询哪期的开奖号码？',
    type: 'text',
  };
}

/**
 * 主入口：根据意图和数据生成回复（Mock fallback，当Mimo API调用失败时使用）
 */
export function generateResponse(intentResult: IntentResult, data: any): MockKimiResponse {
  const { intent } = intentResult;

  switch (intent) {
    case 'latest_draw':
      return generateLatestDrawResponse(data);
    case 'history_query':
      return generateHistoryResponse(data);
    case 'omission_query':
      return generateOmissionResponse(data);
    case 'trend_query':
      return generateTrendResponse(data);
    case 'distribution_query':
      return generateDistributionResponse(data);
    case 'hotcold_query':
      return generateHotColdResponse(data);
    case 'rules_query':
      return generateRulesResponse(data);
    case 'prize_query':
      return generatePrizeResponse(data);
    case 'schedule_query':
      return generateScheduleResponse(data);
    case 'comparison_query':
      return generateComparisonResponse(data);
    case 'basic_info':
      return generateBasicInfoResponse(data);
    case 'greeting':
      return generateGreetingResponse();
    case 'prediction':
    case 'recommendation':
      return generateRefusalResponse();
    case 'unknown':
    default:
      return generateUnknownResponse();
  }
}

export default { callMimoAPI, buildAIMessages, formatDataContext, generateResponse };
