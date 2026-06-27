import { getPool } from '../utils/db';
import { mockData } from './mockData';

async function seed() {
  const pool = getPool();

  const allData = [
    ...mockData.ssq,
    ...mockData.d3,
    ...mockData.qlc,
    ...mockData.kl8,
  ];

  let inserted = 0;
  let skipped = 0;

  for (const item of allData) {
    try {
      const [result] = await pool.execute(
        `INSERT IGNORE INTO lottery_results
         (type, issue, draw_date, red_balls, blue_ball, bonus_balls, prize_pool, sales_amount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.type,
          item.issue,
          item.draw_date,
          JSON.stringify(item.red_balls),
          item.blue_ball || null,
          item.bonus_balls ? JSON.stringify(item.bonus_balls) : null,
          item.prize_pool || null,
          item.sales_amount || null,
        ]
      );
      const header = result as any;
      if (header && header.affectedRows > 0) {
        inserted++;
      } else {
        skipped++;
      }
    } catch (err) {
      console.error(`Failed to insert ${item.type}-${item.issue}:`, err);
      skipped++;
    }
  }

  console.log(`✅ Seeding complete: ${inserted} inserted, ${skipped} skipped`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
