const express = require('express');
const { processAdQueue, updateAdImpressions } = require('../bot/telegramBot');
const router = express.Router();

router.get('/process-ads', async (req, res) => {
  try {
    const CRON_SECRET = process.env.CRON_SECRET;
    const authHeader = req.headers.authorization;
    
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return res.status(401).json({ message: 'Unauthorized cron trigger' });
    }

    console.log('⏰ Cron: Processing Ad Queue + Impression Snapshots...');
    await processAdQueue();
    
    res.json({ success: true, message: 'Ad queue + impressions processed' });
  } catch (err) {
    console.error('Cron error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
