import { fetchAllLotteryTypes, saveLotteryData, ScrapedLotteryData } from '../data/lotteryScraper';
import { mockData } from '../data/mockData';

/**
 * 数据同步服务
 * 定期抓取最新开奖数据并更新到数据库
 * 如果外部抓取失败，保留Mock数据作为fallback
 */

const SYNC_INTERVAL = 6 * 60 * 60 * 1000; // 6小时
let syncTimer: NodeJS.Timeout | null = null;
let lastSyncTime: Date | null = null;

/**
 * 执行单次同步
 */
export async function performSync(): Promise<{
  success: boolean;
  inserted: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let totalInserted = 0;

  console.log('[SyncService] Starting lottery data sync...');

  try {
    const allData = await fetchAllLotteryTypes();

    for (const [type, data] of Object.entries(allData)) {
      if (data && data.length > 0) {
        try {
          const inserted = await saveLotteryData(data);
          totalInserted += inserted;
          console.log(`[SyncService] ${type}: ${inserted} records inserted/updated`);
        } catch (err: any) {
          errors.push(`${type}: ${err.message}`);
          console.error(`[SyncService] ${type} save error:`, err.message);
        }
      } else {
        console.log(`[SyncService] ${type}: No data fetched, keeping mock data as fallback`);
      }
    }

    lastSyncTime = new Date();
    console.log(`[SyncService] Sync completed. Total inserted: ${totalInserted}`);
    return { success: true, inserted: totalInserted, errors };
  } catch (err: any) {
    console.error('[SyncService] Sync failed:', err.message);
    errors.push(`General: ${err.message}`);
    return { success: false, inserted: totalInserted, errors };
  }
}

/**
 * 启动定期同步
 */
export function startSyncService(): void {
  if (syncTimer) {
    console.log('[SyncService] Already running');
    return;
  }

  console.log(`[SyncService] Starting with interval: ${SYNC_INTERVAL / 1000 / 60} minutes`);

  // 启动时立即执行一次
  performSync().catch((err) => {
    console.error('[SyncService] Initial sync failed:', err.message);
  });

  // 设置定时器
  syncTimer = setInterval(() => {
    performSync().catch((err) => {
      console.error('[SyncService] Scheduled sync failed:', err.message);
    });
  }, SYNC_INTERVAL);
}

/**
 * 停止同步服务
 */
export function stopSyncService(): void {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
    console.log('[SyncService] Stopped');
  }
}

/**
 * 获取上次同步时间
 */
export function getLastSyncTime(): Date | null {
  return lastSyncTime;
}

/**
 * 手动触发同步
 */
export async function manualSync(): Promise<{
  success: boolean;
  inserted: number;
  errors: string[];
}> {
  return performSync();
}

/**
 * 获取mock数据作为fallback
 */
export function getMockData(type: string): ScrapedLotteryData[] | null {
  const mock = mockData[type];
  if (!mock || mock.length === 0) return null;

  return mock.map((item) => ({
    type: item.type,
    issue: item.issue,
    draw_date: item.draw_date,
    red_balls: item.red_balls,
    blue_ball: item.blue_ball,
    bonus_balls: item.bonus_balls,
    prize_pool: item.prize_pool,
    sales_amount: item.sales_amount,
  }));
}

export default {
  startSyncService,
  stopSyncService,
  performSync,
  manualSync,
  getLastSyncTime,
  getMockData,
};
