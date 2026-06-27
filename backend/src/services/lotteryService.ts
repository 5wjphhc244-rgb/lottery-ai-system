import { getPool } from '../utils/db';
import { mockData } from '../data/mockData';
import type { LotteryResult } from '../types';

const DISCLAIMER = '以上数据为历史开奖记录，仅供娱乐参考，不构成任何投注建议。彩票开奖号码为随机产生，历史数据不代表未来趋势。请理性购彩，量力而行。';

function rowToLotteryResult(row: any): LotteryResult {
  return {
    id: row.id,
    type: row.type,
    issue: row.issue,
    draw_date: row.draw_date,
    red_balls:
      typeof row.red_balls === 'string' ? JSON.parse(row.red_balls) : row.red_balls,
    blue_ball: row.blue_ball || undefined,
    bonus_balls: row.bonus_balls
      ? typeof row.bonus_balls === 'string'
        ? JSON.parse(row.bonus_balls)
        : row.bonus_balls
      : undefined,
    prize_pool: row.prize_pool || undefined,
    sales_amount: row.sales_amount || undefined,
    created_at: row.created_at,
  };
}

export async function getLatestResult(
  type: string
): Promise<LotteryResult & { disclaimer: string }> {
  // Try database first
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM lottery_results WHERE type = ? ORDER BY draw_date DESC LIMIT 1',
      [type]
    );
    const result = (rows as any[])[0];
    if (result) {
      return { ...rowToLotteryResult(result), disclaimer: DISCLAIMER };
    }
  } catch {
    // Fallback to mock data
  }

  const data = mockData[type];
  if (data && data.length > 0) {
    return { ...data[0], disclaimer: DISCLAIMER };
  }

  throw new Error(`No data available for type: ${type}`);
}

export async function getHistory(
  type: string,
  limit: number,
  offset: number
): Promise<(LotteryResult & { disclaimer: string })[]> {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM lottery_results WHERE type = ? ORDER BY draw_date DESC LIMIT ? OFFSET ?',
      [type, limit, offset]
    );
    if ((rows as any[]).length > 0) {
      return (rows as any[]).map((row) => ({
        ...rowToLotteryResult(row),
        disclaimer: DISCLAIMER,
      }));
    }
  } catch {
    // Fallback to mock data
  }

  const data = mockData[type] || [];
  return data.slice(offset, offset + limit).map((item) => ({
    ...item,
    disclaimer: DISCLAIMER,
  }));
}

export async function getDetail(
  type: string,
  issue: string
): Promise<(LotteryResult & { disclaimer: string }) | null> {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM lottery_results WHERE type = ? AND issue = ?',
      [type, issue]
    );
    const result = (rows as any[])[0];
    if (result) {
      return { ...rowToLotteryResult(result), disclaimer: DISCLAIMER };
    }
  } catch {
    // Fallback to mock data
  }

  const data = mockData[type] || [];
  const found = data.find((item) => item.issue === issue);
  return found ? { ...found, disclaimer: DISCLAIMER } : null;
}

export function getNextDrawDate(type: string): string {
  const now = new Date();

  const schedules: Record<string, number[]> = {
    ssq: [2, 4, 0], // Tue, Thu, Sun
    d3: [0, 1, 2, 3, 4, 5, 6], // daily
    qlc: [1, 3, 5], // Mon, Wed, Fri
    kl8: [0, 1, 2, 3, 4, 5, 6], // daily
  };

  const schedule = schedules[type] || [];
  if (schedule.length === 7) {
    return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }

  const today = now.getDay();
  let daysUntil = 1;

  for (let i = 1; i <= 7; i++) {
    const nextDay = (today + i) % 7;
    if (schedule.includes(nextDay)) {
      daysUntil = i;
      break;
    }
  }

  const next = new Date(now.getTime() + daysUntil * 24 * 60 * 60 * 1000);
  return next.toISOString().split('T')[0];
}
