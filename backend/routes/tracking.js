const express = require('express');
const AdPost = require('../models/AdPost');
const Campaign = require('../models/Campaign');
const Group = require('../models/Group');
const ImpressionsLog = require('../models/ImpressionsLog');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/tracking/:postId ── Public redirect + click tracking
router.get('/:postId', async (req, res) => {
  try {
    const adPost = await AdPost.findById(req.params.postId).populate('campaign');
    if (!adPost) return res.status(404).send('Link not found');

    // Track click
    adPost.clicks += 1;
    const impressions = adPost.viewsAt24h || adPost.impressions || 1;
    adPost.ctr = parseFloat(((adPost.clicks / impressions) * 100).toFixed(2));
    await adPost.save();

    // Track on campaign
    if (adPost.campaign?._id) {
      await Campaign.findByIdAndUpdate(adPost.campaign._id, {
        $inc: { totalClicks: 1 }
      });
    }

    const targetUrl = adPost.campaign?.targetUrl || `${process.env.FRONTEND_URL || 'https://t.me'}`;
    res.redirect(targetUrl);
  } catch (err) {
    res.status(500).send('Error processing redirect');
  }
});

// ── GET /api/tracking/stats/:postId ── Authenticated stats for a post
router.get('/stats/:postId', authenticate, async (req, res) => {
  try {
    const adPost = await AdPost.findById(req.params.postId)
      .populate('campaign', 'name cpm advertiser')
      .populate('group', 'name telegramGroupUsername performanceScore');
    
    if (!adPost) return res.status(404).json({ message: 'Not found' });

    const logs = await ImpressionsLog.find({ adPost: adPost._id }).sort({ fetchedAt: 1 });

    res.json({
      adPost,
      impressionLogs: logs,
      summary: {
        views_1h: adPost.viewsAt1h,
        views_6h: adPost.viewsAt6h,
        views_24h: adPost.viewsAt24h,
        clicks: adPost.clicks,
        ctr: adPost.ctr,
        cpm: adPost.cpmUsed,
        costCharged: adPost.costCharged,
        publisherEarnings: adPost.publisherEarnings,
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
