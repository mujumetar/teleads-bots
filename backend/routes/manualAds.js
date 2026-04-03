const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const Campaign = require('../models/Campaign');
const Group = require('../models/Group');
const User = require('../models/User');
const { postAdToGroup } = require('../bot/telegramBot');

const router = express.Router();

// GET /api/admin/manual-ads/campaigns - Get active campaigns for manual posting
router.get('/manual-ads/campaigns', authenticate, requireRole('superadmin'), async (req, res) => {
  try {
    const campaigns = await Campaign.find({
      status: 'active',
      $expr: { $lt: ['$budgetSpent', '$budget'] }
    }).select('name adText adImageUrl targetUrl niche budget budgetSpent cpm')
      .sort({ createdAt: -1 });
    
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/manual-ads/groups - Get approved groups for manual posting
router.get('/manual-ads/groups', authenticate, requireRole('superadmin'), async (req, res) => {
  try {
    const { niche, category } = req.query;
    
    let query = {
      status: 'approved',
      isFlagged: false,
      memberCount: { $gte: 1000 }
    };
    
    if (niche) query.niche = niche;
    if (category) query.category = category;
    
    const groups = await Group.find(query)
      .select('name telegramGroupId telegramGroupUsername memberCount niche category avgViews performanceScore dynamicCpm owner')
      .populate('owner', 'email firstName')
      .sort({ performanceScore: -1 });
    
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/manual-ads/send - Manually send ad to specific group(s)
router.post('/manual-ads/send', authenticate, requireRole('superadmin'), async (req, res) => {
  try {
    const { campaignId, groupIds, skipFrequencyCheck } = req.body;
    
    if (!campaignId || !groupIds || !Array.isArray(groupIds) || groupIds.length === 0) {
      return res.status(400).json({ 
        message: 'Campaign ID and array of Group IDs are required' 
      });
    }
    
    // Get campaign
    const campaign = await Campaign.findById(campaignId).populate('advertiser');
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    if (campaign.status !== 'active') {
      return res.status(400).json({ 
        message: `Campaign is ${campaign.status}, must be active to send ads` 
      });
    }
    
    // Check budget
    if (campaign.budgetSpent >= campaign.budget) {
      return res.status(400).json({ message: 'Campaign budget exhausted' });
    }
    
    // Get groups
    const groups = await Group.find({
      _id: { $in: groupIds },
      status: 'approved',
      isFlagged: false
    });
    
    if (groups.length === 0) {
      return res.status(404).json({ message: 'No valid approved groups found' });
    }
    
    // Send ads to each group
    const results = [];
    for (const group of groups) {
      try {
        // Check frequency unless skipped
        if (!skipFrequencyCheck && group.lastAdPostedAt) {
          const hoursToWait = group.postFrequency || 4;
          const diff = (Date.now() - group.lastAdPostedAt.getTime()) / (1000 * 3600);
          if (diff < hoursToWait) {
            results.push({
              groupId: group._id,
              groupName: group.name,
              status: 'skipped',
              reason: `Frequency limit: ${Math.round(hoursToWait - diff)}h remaining`
            });
            continue;
          }
        }
        
        // Check budget for this ad
        const estimatedCost = (group.avgViews / 1000) * (campaign.cpm || group.dynamicCpm);
        if (campaign.budgetSpent + estimatedCost > campaign.budget) {
          results.push({
            groupId: group._id,
            groupName: group.name,
            status: 'skipped',
            reason: 'Campaign budget would be exceeded'
          });
          continue;
        }
        
        // Post the ad
        const adPost = await postAdToGroup(campaign, group);
        
        if (adPost) {
          results.push({
            groupId: group._id,
            groupName: group.name,
            status: 'success',
            adPostId: adPost._id,
            cost: adPost.costCharged,
            publisherEarnings: adPost.publisherEarnings
          });
        } else {
          results.push({
            groupId: group._id,
            groupName: group.name,
            status: 'failed',
            reason: 'Failed to post ad (check bot/token)'
          });
        }
      } catch (err) {
        results.push({
          groupId: group._id,
          groupName: group.name,
          status: 'error',
          reason: err.message
        });
      }
    }
    
    // Summary
    const success = results.filter(r => r.status === 'success').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const failed = results.filter(r => r.status === 'failed' || r.status === 'error').length;
    
    res.json({
      campaign: {
        id: campaign._id,
        name: campaign.name
      },
      summary: {
        total: results.length,
        success,
        skipped,
        failed
      },
      results
    });
    
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/manual-ads/broadcast - Send ad to multiple matching groups
router.post('/manual-ads/broadcast', authenticate, requireRole('superadmin'), async (req, res) => {
  try {
    const { campaignId, targetNiche, targetCategory, maxGroups, skipFrequencyCheck } = req.body;
    
    if (!campaignId) {
      return res.status(400).json({ message: 'Campaign ID is required' });
    }
    
    // Get campaign
    const campaign = await Campaign.findById(campaignId).populate('advertiser');
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    // Build query for matching groups
    let query = {
      status: 'approved',
      isFlagged: false,
      memberCount: { $gte: 1000 }
    };
    
    if (targetNiche) query.niche = targetNiche;
    if (targetCategory) query.category = targetCategory;
    
    // Find matching groups
    let groups = await Group.find(query)
      .sort({ performanceScore: -1 })
      .limit(maxGroups || 10);
    
    // If no niche match, fallback to top performing groups
    if (groups.length === 0 && (targetNiche || targetCategory)) {
      groups = await Group.find({
        status: 'approved',
        isFlagged: false,
        memberCount: { $gte: 1000 }
      })
        .sort({ performanceScore: -1 })
        .limit(maxGroups || 5);
    }
    
    if (groups.length === 0) {
      return res.status(404).json({ message: 'No matching groups found' });
    }
    
    // Send to all matching groups using the send endpoint logic
    const groupIds = groups.map(g => g._id);
    
    // Forward to the send endpoint logic
    req.body.groupIds = groupIds;
    req.body.skipFrequencyCheck = skipFrequencyCheck;
    
    // Reuse the send logic
    const results = [];
    for (const group of groups) {
      try {
        if (!skipFrequencyCheck && group.lastAdPostedAt) {
          const hoursToWait = group.postFrequency || 4;
          const diff = (Date.now() - group.lastAdPostedAt.getTime()) / (1000 * 3600);
          if (diff < hoursToWait) continue;
        }
        
        const estimatedCost = (group.avgViews / 1000) * (campaign.cpm || group.dynamicCpm);
        if (campaign.budgetSpent + estimatedCost > campaign.budget) continue;
        
        const adPost = await postAdToGroup(campaign, group);
        if (adPost) {
          results.push({
            groupId: group._id,
            groupName: group.name,
            status: 'success'
          });
        }
      } catch (err) {
        console.error(`Broadcast error for ${group.name}:`, err.message);
      }
    }
    
    res.json({
      campaign: { id: campaign._id, name: campaign.name },
      targeted: { niche: targetNiche, category: targetCategory },
      matchedGroups: groups.length,
      sent: results.length,
      results
    });
    
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
