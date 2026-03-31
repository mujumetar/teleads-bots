const express = require('express');
const AdPost = require('../models/AdPost');
const Campaign = require('../models/Campaign');
const Group = require('../models/Group');

const router = express.Router();

// GET /api/tracking/:postId - Redirect and track click
router.get('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const adPost = await AdPost.findById(postId).populate('campaign').populate('group');
    if (!adPost) return res.status(404).json({ message: 'Ad post not found' });

    // Track click
    adPost.totalClicks += 1;
    await adPost.save();

    // Track total clicks on campaign
    if (adPost.campaign) {
      await Campaign.findByIdAndUpdate(adPost.campaign._id, { $inc: { totalClicks: 1 } });
    }

    const targetUrl = adPost.campaign.trackingUrl || 'https://t.me/TeleAdsBot';
    res.redirect(targetUrl);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
