import { Router } from 'express';
import * as rulesService from '../services/rulesService';

const router = Router();

// GET /api/rules/:type
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const data = rulesService.getRules(type);
    res.json({ code: 0, message: 'ok', data });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

// GET /api/rules/prizes/:type
router.get('/prizes/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const data = rulesService.getPrizeTable(type);
    res.json({ code: 0, message: 'ok', data });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

export default router;