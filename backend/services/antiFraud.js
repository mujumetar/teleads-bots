const User = require('../models/User');
const Group = require('../models/Group');
const Campaign = require('../models/Campaign');
const AdPost = require('../models/AdPost');
const ImpressionsLog = require('../models/ImpressionsLog');
const SystemConfig = require('../models/SystemConfig');

class AntiFraudService {
  // Check group for fraud indicators
  static async checkGroupFraud(groupId) {
    const group = await Group.findById(groupId).populate('owner');
    if (!group) return { isFraud: false, reasons: [] };

    const reasons = [];
    let fraudScore = 0;

    // Check 1: Member count vs average views ratio
    if (group.memberCount > 0 && group.avgViews > 0) {
      const viewToMemberRatio = group.avgViews / group.memberCount;
      
      // Suspicious if views > members (impossible) or very low engagement
      if (viewToMemberRatio > 1) {
        reasons.push('Views exceed member count - impossible metrics');
        fraudScore += 50;
      } else if (viewToMemberRatio > 0.8) {
        reasons.push('Suspiciously high view-to-member ratio');
        fraudScore += 30;
      } else if (viewToMemberRatio < 0.01) {
        reasons.push('Extremely low engagement rate');
        fraudScore += 20;
      }
    }

    // Check 2: Performance score anomalies
    if (group.performanceScore > 50) {
      reasons.push('Performance score too high for real engagement');
      fraudScore += 25;
    }

    // Check 3: Sudden spikes in views
    const recentLogs = await ImpressionsLog.find({
      group: groupId,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).sort({ createdAt: 1 });

    if (recentLogs.length > 1) {
      const viewCounts = recentLogs.map(log => log.views || 0);
      const maxViews = Math.max(...viewCounts);
      const avgViews = viewCounts.reduce((a, b) => a + b, 0) / viewCounts.length;
      
      if (maxViews > avgViews * 5) {
        reasons.push('Sudden spike in views detected');
        fraudScore += 35;
      }
    }

    // Check 4: Group owner history
    const ownerGroups = await Group.find({ owner: group.owner._id });
    const flaggedGroups = ownerGroups.filter(g => g.isFlagged).length;
    
    if (flaggedGroups > 0) {
      reasons.push('Group owner has other flagged groups');
      fraudScore += flaggedGroups * 20;
    }

    // Check 5: Minimum member threshold
    const config = await SystemConfig.findOne();
    const minMembers = config?.minGroupMembers || 1000;
    
    if (group.memberCount < minMembers) {
      reasons.push(`Group has fewer than ${minMembers} members`);
      fraudScore += 15;
    }

    // Check 6: Posting frequency abuse
    const recentPosts = await AdPost.find({
      group: groupId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    if (recentPosts.length > 10) {
      reasons.push('Excessive posting frequency');
      fraudScore += 25;
    }

    // Get fraud threshold from config
    const fraudThreshold = config?.fraudThreshold || 0.3;
    const isFraud = fraudScore > (fraudThreshold * 100);

    return {
      isFraud,
      fraudScore,
      reasons,
      recommendations: this.getRecommendations(fraudScore, reasons)
    };
  }

  // Check campaign for fraud indicators
  static async checkCampaignFraud(campaignId) {
    const campaign = await Campaign.findById(campaignId).populate('advertiser');
    if (!campaign) return { isFraud: false, reasons: [] };

    const reasons = [];
    let fraudScore = 0;

    // Check 1: Budget anomalies
    if (campaign.budget > 100000) {
      reasons.push('Unusually high campaign budget');
      fraudScore += 20;
    }

    // Check 2: CPM anomalies
    if (campaign.cpm < 10) {
      reasons.push('Suspiciously low CPM');
      fraudScore += 15;
    } else if (campaign.cpm > 1000) {
      reasons.push('Unusually high CPM');
      fraudScore += 10;
    }

    // Check 3: Advertiser history
    const advertiserCampaigns = await Campaign.find({ advertiser: campaign.advertiser._id });
    const rejectedCampaigns = advertiserCampaigns.filter(c => c.status === 'rejected').length;
    
    if (rejectedCampaigns > 2) {
      reasons.push('Advertiser has multiple rejected campaigns');
      fraudScore += rejectedCampaigns * 15;
    }

    // Check 4: Ad content analysis
    const suspiciousKeywords = [
      'clickbait', 'fake', 'scam', 'bitcoin', 'crypto', 'investment',
      'guaranteed', 'instant', 'free money', 'get rich quick'
    ];

    const adText = campaign.adText.toLowerCase();
    const foundKeywords = suspiciousKeywords.filter(keyword => adText.includes(keyword));
    
    if (foundKeywords.length > 0) {
      reasons.push(`Suspicious keywords in ad: ${foundKeywords.join(', ')}`);
      fraudScore += foundKeywords.length * 10;
    }

    // Check 5: Target URL analysis
    if (campaign.targetUrl) {
      try {
        const url = new URL(campaign.targetUrl);
        const suspiciousDomains = [
          'bit.ly', 'tinyurl.com', 'short.link', 't.co',
          'suspicious-domain.com' // Add more as needed
        ];
        
        if (suspiciousDomains.some(domain => url.hostname.includes(domain))) {
          reasons.push('Suspicious URL shortener or domain');
          fraudScore += 25;
        }
      } catch (error) {
        reasons.push('Invalid target URL');
        fraudScore += 15;
      }
    }

    const config = await SystemConfig.findOne();
    const fraudThreshold = config?.fraudThreshold || 0.3;
    const isFraud = fraudScore > (fraudThreshold * 100);

    return {
      isFraud,
      fraudScore,
      reasons,
      recommendations: this.getRecommendations(fraudScore, reasons)
    };
  }

  // Check user for fraud indicators
  static async checkUserFraud(userId) {
    const user = await User.findById(userId);
    if (!user) return { isFraud: false, reasons: [] };

    const reasons = [];
    let fraudScore = 0;

    // Check 1: Multiple accounts from same IP (if tracking is implemented)
    // This would require IP tracking in the authentication system

    // Check 2: Rapid account creation and campaign creation
    const accountAge = Date.now() - user.createdAt.getTime();
    const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24);

    if (daysSinceCreation < 1) {
      const campaigns = await Campaign.find({ advertiser: userId });
      if (campaigns.length > 0) {
        reasons.push('Campaign created immediately after account creation');
        fraudScore += 30;
      }
    }

    // Check 3: Unusual wallet activity
    const WalletTransaction = require('../models/WalletTransaction');
    const recentTransactions = await WalletTransaction.find({
      user: userId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    if (recentTransactions.length > 20) {
      reasons.push('Excessive transaction activity');
      fraudScore += 25;
    }

    // Check 4: Payment patterns
    const deposits = recentTransactions.filter(t => t.type === 'deposit');
    const withdrawals = recentTransactions.filter(t => t.type === 'withdrawal');

    if (withdrawals.length > deposits.length) {
      reasons.push('More withdrawals than deposits in 24h');
      fraudScore += 35;
    }

    const config = await SystemConfig.findOne();
    const fraudThreshold = config?.fraudThreshold || 0.3;
    const isFraud = fraudScore > (fraudThreshold * 100);

    return {
      isFraud,
      fraudScore,
      reasons,
      recommendations: this.getRecommendations(fraudScore, reasons)
    };
  }

  // Real-time fraud detection for impressions
  static async detectImpressionFraud(adPostId, newViews) {
    const adPost = await AdPost.findById(adPostId).populate('group');
    if (!adPost) return { isFraud: false, action: 'allow' };

    const reasons = [];
    let fraudScore = 0;

    // Check 1: View velocity (too many views in short time)
    const recentLogs = await ImpressionsLog.find({
      adPost: adPostId,
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
    });

    const totalRecentViews = recentLogs.reduce((sum, log) => sum + (log.views || 0), 0);
    const viewVelocity = newViews - totalRecentViews;

    if (viewVelocity > adPost.group.memberCount * 0.5) {
      reasons.push('View velocity exceeds half of group members in 1 hour');
      fraudScore += 40;
    }

    // Check 2: Consistent view patterns (bot-like)
    if (recentLogs.length > 5) {
      const viewDifferences = [];
      for (let i = 1; i < recentLogs.length; i++) {
        viewDifferences.push(recentLogs[i].views - recentLogs[i-1].views);
      }
      
      const avgDifference = viewDifferences.reduce((a, b) => a + b, 0) / viewDifferences.length;
      const variance = viewDifferences.reduce((sum, diff) => sum + Math.pow(diff - avgDifference, 2), 0) / viewDifferences.length;
      
      if (variance < 1) { // Very consistent view increments
        reasons.push('Consistent view pattern suggests bot activity');
        fraudScore += 35;
      }
    }

    // Check 3: Time-based anomalies
    const currentHour = new Date().getHours();
    if (currentHour >= 2 && currentHour <= 5) { // Late night activity
      if (viewVelocity > adPost.group.memberCount * 0.1) {
        reasons.push('High activity during unusual hours');
        fraudScore += 20;
      }
    }

    const config = await SystemConfig.findOne();
    const fraudThreshold = config?.fraudThreshold || 0.3;
    const isFraud = fraudScore > (fraudThreshold * 100);

    let action = 'allow';
    if (isFraud) {
      if (fraudScore > 70) {
        action = 'block';
      } else if (fraudScore > 50) {
        action = 'review';
      }
    }

    return {
      isFraud,
      fraudScore,
      reasons,
      action,
      recommendations: this.getRecommendations(fraudScore, reasons)
    };
  }

  // Get recommendations based on fraud score
  static getRecommendations(fraudScore, reasons) {
    const recommendations = [];

    if (fraudScore > 70) {
      recommendations.push({
        priority: 'high',
        action: 'immediate_review',
        message: 'Immediate manual review required'
      });
    } else if (fraudScore > 50) {
      recommendations.push({
        priority: 'medium',
        action: 'enhanced_monitoring',
        message: 'Place under enhanced monitoring'
      });
    } else if (fraudScore > 30) {
      recommendations.push({
        priority: 'low',
        action: 'additional_verification',
        message: 'Request additional verification'
      });
    }

    // Specific recommendations based on reasons
    if (reasons.includes('Views exceed member count')) {
      recommendations.push({
        priority: 'high',
        action: 'suspend_group',
        message: 'Suspend group for manual review'
      });
    }

    if (reasons.includes('Sudden spike in views')) {
      recommendations.push({
        priority: 'medium',
        action: 'freeze_impressions',
        message: 'Freeze impression counting for 24 hours'
      });
    }

    return recommendations;
  }

  // Automated actions based on fraud detection
  static async executeFraudAction(entityType, entityId, action, reason) {
    switch (entityType) {
      case 'group':
        const group = await Group.findById(entityId);
        if (group) {
          if (action === 'suspend') {
            group.status = 'suspended';
            group.isFlagged = true;
            group.flagReason = reason;
          } else if (action === 'flag') {
            group.isFlagged = true;
            group.flagReason = reason;
          }
          await group.save();
        }
        break;

      case 'campaign':
        const campaign = await Campaign.findById(entityId);
        if (campaign) {
          if (action === 'suspend') {
            campaign.status = 'rejected';
            campaign.rejectionReason = reason;
          }
          await campaign.save();
        }
        break;

      case 'user':
        const user = await User.findById(entityId);
        if (user) {
          if (action === 'suspend') {
            user.isActive = false;
            user.isBanned = true;
            user.banReason = reason;
          }
          await user.save();
        }
        break;
    }

    console.log(`Fraud action executed: ${action} on ${entityType} ${entityId} - ${reason}`);
  }

  // Generate fraud report
  static async generateFraudReport(timeRange = '24h') {
    const now = new Date();
    let startDate;

    switch (timeRange) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const [
      flaggedGroups,
      flaggedCampaigns,
      suspiciousUsers,
      fraudTransactions
    ] = await Promise.all([
      Group.find({ isFlagged: true, updatedAt: { $gte: startDate } }),
      Campaign.find({ status: 'rejected', updatedAt: { $gte: startDate } }),
      User.find({ isBanned: true, updatedAt: { $gte: startDate } }),
      // Add suspicious transactions query if needed
    ]);

    return {
      timeRange,
      generatedAt: now,
      summary: {
        flaggedGroups: flaggedGroups.length,
        flaggedCampaigns: flaggedCampaigns.length,
        suspiciousUsers: suspiciousUsers.length,
        fraudTransactions: fraudTransactions.length || 0
      },
      details: {
        flaggedGroups,
        flaggedCampaigns,
        suspiciousUsers,
        fraudTransactions
      }
    };
  }
}

module.exports = AntiFraudService;
