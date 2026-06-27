import { Router } from 'express';
import * as lotteryService from '../services/lotteryService';

const router = Router();

// GET /api/lottery/latest/:type
router.get('/latest/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const data = await lotteryService.getLatestResult(type);
    res.json({ code: 0, message: 'ok', data });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

// GET /api/lottery/history/:type
router.get('/history/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const limit = parseInt(req.query.limit as string || '20', 10);
    const offset = parseInt(req.query.offset as string || '0', 10);
    const data = await lotteryService.getHistory(type, limit, offset);
    res.json({ code: 0, message: 'ok', data });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

// GET /api/lottery/detail/:type/:issue
router.get('/detail/:type/:issue', async (req, res) => {
  try {
    const { type, issue } = req.params;
    const data = await lotteryService.getDetail(type, issue);
    res.json({ code: 0, message: 'ok', data });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

// GET /api/lottery/next/:type
router.get('/next/:type', (req, res) => {
  try {
    const { type } = req.params;
    const nextDrawDate = lotteryService.getNextDrawDate(type);
    res.json({ code: 0, message: 'ok', data: { type, nextDrawDate } });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

export default router;