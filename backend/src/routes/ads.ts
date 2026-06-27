import { Router } from 'express';

const router = Router();

// GET /api/ads/config
router.get('/config', async (req, res) => {
  try {
    res.json({
      code: 0, message: 'ok',
      data: {
        banner: { enabled: true, position: 'bottom', adUnitId: 'demo_banner' },
        interstitial: { enabled: false },
      }
    });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

export default router;