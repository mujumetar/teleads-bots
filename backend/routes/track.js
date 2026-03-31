const express = require('express');
const Campaign = require('../models/Campaign');

const router = express.Router();

/**
 * GET /api/track/:campaignId
 * Tracking endpoint for ad link clicks
 * Increments click count and redirects user to the final destination
 */
router.get('/:campaignId', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId);
    if (!campaign) {
      return res.status(404).send('Invalid tracking link or campaign terminated.');
    }

    // Increment click counts
    campaign.totalClicks = (campaign.totalClicks || 0) + 1;
    await campaign.save();

    // Redirection Logic
    // If the trackingUrl is missing, redirect back to the home site
    const destination = campaign.trackingUrl || 'https://teleads-bots.vercel.app';
    
    // Smooth redirect with 302 Found
    res.redirect(302, destination);
  } catch (err) {
    console.error('Tracking Node Error:', err);
    res.status(500).send('Telemetry infrastructure sync error.');
  }
});

module.exports = router;
