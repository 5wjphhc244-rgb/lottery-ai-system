import { Router } from 'express';
import * as toolsService from '../services/toolsService';

const router = Router();

// GET /api/tools/trend/:type/:periods
router.get('/trend/:type/:periods', async (req, res) => {
  try {
    const { type, periods } = req.params;
    const data = await toolsService.getTrendData(type, parseInt(periods, 10));
    res.json({ code: 0, message: 'ok', data });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

// GET /api/tools/omission/:type
router.get('/omission/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const periods = parseInt(req.query.periods as string || '50', 10);
    const data = await toolsService.getOmissionData(type, periods);
    res.json({ code: 0, message: 'ok', data });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

// GET /api/tools/distribution/:type
router.get('/distribution/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const periods = parseInt(req.query.periods as string || '50', 10);
    const data = await toolsService.getDistributionData(type, periods);
    res.json({ code: 0, message: 'ok', data });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

// GET /api/tools/hotcold/:type/:periods
router.get('/hotcold/:type/:periods', async (req, res) => {
  try {
    const { type, periods } = req.params;
    const data = await toolsService.getHotColdData(type, parseInt(periods, 10));
    res.json({ code: 0, message: 'ok', data });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

// GET /api/tools/analysis/:type/:periods
router.get('/analysis/:type/:periods', async (req, res) => {
  try {
    const { type, periods } = req.params;
    const data = await toolsService.getAnalysisData(type, parseInt(periods, 10));
    res.json({ code: 0, message: 'ok', data });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

export default router;