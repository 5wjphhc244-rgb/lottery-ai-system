import mysql from 'mysql2/promise';
import { config } from '../config';

let pool: mysql.Pool;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

export async function query<T>(sql: string, values?: any[]): Promise<T[]> {
  const [rows] = await getPool().execute(sql, values);
  return rows as T[];
}

export async function initDatabase(): Promise<void> {
  const pool = getPool();
  
  // 开奖结果表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS lottery_results (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type VARCHAR(20) NOT NULL COMMENT '彩种:ssq/d3/qlc/kl8',
      issue VARCHAR(20) NOT NULL COMMENT '期号',
      draw_date DATE NOT NULL COMMENT '开奖日期',
      red_balls JSON COMMENT '红球/主号码',
      blue_ball VARCHAR(5) COMMENT '蓝球(双色球)',
      bonus_balls JSON COMMENT '附加号码(快乐8)',
      prize_pool VARCHAR(50) COMMENT '奖池金额',
      sales_amount VARCHAR(50) COMMENT '销售额',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_type_issue (type, issue),
      KEY idx_draw_date (draw_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='开奖结果';
  `);
  
  // 统计指标表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS lottery_stats (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type VARCHAR(20) NOT NULL,
      stat_type VARCHAR(50) NOT NULL COMMENT '统计类型:omission/hotcold/etc',
      stat_data JSON NOT NULL COMMENT '统计JSON数据',
      computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      periods INT DEFAULT 50 COMMENT '计算期数',
      KEY idx_type_stat (type, stat_type),
      KEY idx_computed_at (computed_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预计算统计指标';
  `);
  
  // 玩法规则表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS lottery_rules (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type VARCHAR(20) NOT NULL COMMENT '彩种',
      title VARCHAR(100) NOT NULL COMMENT '规则标题',
      content TEXT NOT NULL COMMENT '规则内容',
      section VARCHAR(50) COMMENT '章节',
      sort_order INT DEFAULT 0,
      UNIQUE KEY uk_type_section (type, section),
      KEY idx_type (type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='玩法规则';
  `);
  
  // AI会话缓存表(24h过期)
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS ai_sessions (
      session_id VARCHAR(64) PRIMARY KEY,
      messages JSON NOT NULL COMMENT '对话历史',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI会话缓存';
  `);
  
  // 系统配置表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS system_config (
      config_key VARCHAR(100) PRIMARY KEY,
      config_value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置';
  `);
  
  console.log('✅ Database initialized');
}
