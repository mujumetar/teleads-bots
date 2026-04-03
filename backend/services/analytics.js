const Campaign = require('../models/Campaign');
const Group = require('../models/Group');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const AdPost = require('../models/AdPost');
const ImpressionsLog = require('../models/ImpressionsLog');

class AnalyticsService {
  // Get user analytics based on their role
  static async getUserAnalytics(userId, userRole) {
    const analytics = {};

    if (userRole === 'advertiser') {
      analytics.campaigns = await this.getAdvertiserCampaigns(userId);
      analytics.spending = await this.getAdvertiserSpending(userId);
      analytics.performance = await this.getAdvertiserPerformance(userId);
    } else if (userRole === 'publisher') {
      analytics.groups = await this.getPublisherGroups(userId);
      analytics.earnings = await this.getPublisherEarnings(userId);
      analytics.performance = await this.getPublisherPerformance(userId);
    }

    return analytics;
  }

  // Advertiser Analytics
  static async getAdvertiserCampaigns(userId) {
    const campaigns = await Campaign.find({ advertiser: userId })
      .sort({ createdAt: -1 })
      .limit(10);

    const stats = await Campaign.aggregate([
      { $match: { advertiser: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalBudget: { $sum: '$budget' },
          totalSpent: { $sum: '$budgetSpent' }
        }
      }
    ]);

    return {
      recent: campaigns,
      stats: stats.reduce((acc, stat) => {
        acc[stat._id] = stat;
        return acc;
      }, {})
    };
  }

  static async getAdvertiserSpending(userId) {
    const spending = await WalletTransaction.aggregate([
      { $match: { user: userId, type: 'campaign_spend', status: 'completed' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    const totalSpent = await WalletTransaction.aggregate([
      { $match: { user: userId, type: 'campaign_spend', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    return {
      monthly: spending,
      total: totalSpent[0]?.total || 0
    };
  }

  static async getAdvertiserPerformance(userId) {
    const performance = await Campaign.aggregate([
      { $match: { advertiser: userId } },
      {
        $group: {
          _id: null,
          totalImpressions: { $sum: '$totalImpressions' },
          totalViews: { $sum: '$totalViews' },
          totalClicks: { $sum: '$totalClicks' },
          totalBudget: { $sum: '$budget' },
          totalSpent: { $sum: '$budgetSpent' },
          avgCPM: { $avg: '$cpm' },
          campaignCount: { $sum: 1 }
        }
      }
    ]);

    const data = performance[0] || {};
    return {
      totalImpressions: data.totalImpressions || 0,
      totalViews: data.totalViews || 0,
      totalClicks: data.totalClicks || 0,
      totalBudget: data.totalBudget || 0,
      totalSpent: data.totalSpent || 0,
      avgCPM: data.avgCPM || 0,
      campaignCount: data.campaignCount || 0,
      ctr: data.totalViews > 0 ? ((data.totalClicks / data.totalViews) * 100).toFixed(2) : 0,
      budgetUtilization: data.totalBudget > 0 ? ((data.totalSpent / data.totalBudget) * 100).toFixed(2) : 0
    };
  }

  // Publisher Analytics
  static async getPublisherGroups(userId) {
    const groups = await Group.find({ owner: userId })
      .sort({ createdAt: -1 })
      .limit(10);

    const stats = await Group.aggregate([
      { $match: { owner: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalMembers: { $sum: '$memberCount' },
          totalRevenue: { $sum: '$revenueEarned' },
          avgPerformance: { $avg: '$performanceScore' }
        }
      }
    ]);

    return {
      recent: groups,
      stats: stats.reduce((acc, stat) => {
        acc[stat._id] = stat;
        return acc;
      }, {})
    };
  }

  static async getPublisherEarnings(userId) {
    const earnings = await WalletTransaction.aggregate([
      { $match: { user: userId, type: 'earning', status: 'completed' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    const totalEarned = await WalletTransaction.aggregate([
      { $match: { user: userId, type: 'earning', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    return {
      monthly: earnings,
      total: totalEarned[0]?.total || 0
    };
  }

  static async getPublisherPerformance(userId) {
    const performance = await Group.aggregate([
      { $match: { owner: userId } },
      {
        $group: {
          _id: null,
          totalGroups: { $sum: 1 },
          totalMembers: { $sum: '$memberCount' },
          totalRevenue: { $sum: '$revenueEarned' },
          totalAdsPosted: { $sum: '$totalAdsPosted' },
          avgPerformanceScore: { $avg: '$performanceScore' },
          avgViewsPerPost: { $avg: '$avgViews' }
        }
      }
    ]);

    const data = performance[0] || {};
    return {
      totalGroups: data.totalGroups || 0,
      totalMembers: data.totalMembers || 0,
      totalRevenue: data.totalRevenue || 0,
      totalAdsPosted: data.totalAdsPosted || 0,
      avgPerformanceScore: data.avgPerformanceScore || 0,
      avgViewsPerPost: data.avgViewsPerPost || 0,
      revenuePerMember: data.totalMembers > 0 ? (data.totalRevenue / data.totalMembers).toFixed(2) : 0
    };
  }

  // Platform-wide Analytics (for admin/superadmin)
  static async getPlatformAnalytics() {
    const [
      userStats,
      campaignStats,
      groupStats,
      financialStats,
      performanceStats
    ] = await Promise.all([
      this.getUserStats(),
      this.getCampaignStats(),
      this.getGroupStats(),
      this.getFinancialStats(),
      this.getPerformanceStats()
    ]);

    return {
      users: userStats,
      campaigns: campaignStats,
      groups: groupStats,
      financial: financialStats,
      performance: performanceStats
    };
  }

  static async getUserStats() {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          advertisers: {
            $sum: { $cond: [{ $eq: ['$roles.advertiser', true] }, 1, 0] }
          },
          publishers: {
            $sum: { $cond: [{ $eq: ['$roles.publisher', true] }, 1, 0] }
          },
          admins: {
            $sum: { $cond: [{ $eq: ['$roles.isAdmin', true] }, 1, 0] }
          },
          totalAdvertiserBalance: { $sum: '$advertiserWallet' },
          totalPublisherBalance: { $sum: '$publisherWallet' }
        }
      }
    ]);

    return stats[0] || {};
  }

  static async getCampaignStats() {
    const stats = await Campaign.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalBudget: { $sum: '$budget' },
          totalSpent: { $sum: '$budgetSpent' },
          totalImpressions: { $sum: '$totalImpressions' },
          totalViews: { $sum: '$totalViews' }
        }
      }
    ]);

    const monthlyStats = await Campaign.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          totalBudget: { $sum: '$budget' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    return {
      byStatus: stats.reduce((acc, stat) => {
        acc[stat._id] = stat;
        return acc;
      }, {}),
      monthly: monthlyStats
    };
  }

  static async getGroupStats() {
    const stats = await Group.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalMembers: { $sum: '$memberCount' },
          totalRevenue: { $sum: '$revenueEarned' },
          avgPerformance: { $avg: '$performanceScore' }
        }
      }
    ]);

    const performanceDistribution = await Group.aggregate([
      {
        $bucket: {
          groupBy: '$performanceScore',
          boundaries: [0, 5, 10, 15, 20, 100],
          default: 'other',
          output: {
            count: { $sum: 1 },
            avgRevenue: { $avg: '$revenueEarned' }
          }
        }
      }
    ]);

    return {
      byStatus: stats.reduce((acc, stat) => {
        acc[stat._id] = stat;
        return acc;
      }, {}),
      performanceDistribution
    };
  }

  static async getFinancialStats() {
    const stats = await WalletTransaction.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const monthlyRevenue = await WalletTransaction.aggregate([
      {
        $match: { type: 'campaign_spend', status: 'completed' }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          platformRevenue: { $sum: '$amount' },
          publisherEarnings: {
            $sum: { $multiply: ['$amount', 0.65] } // Assuming 65% publisher share
          }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    return {
      byType: stats.reduce((acc, stat) => {
        acc[stat._id] = stat;
        return acc;
      }, {}),
      monthlyRevenue
    };
  }

  static async getPerformanceStats() {
    const topCampaigns = await Campaign.find({ status: 'completed' })
      .sort({ totalImpressions: -1 })
      .limit(10)
      .select('name totalImpressions totalViews budgetSpent cpm');

    const topGroups = await Group.find({ status: 'approved' })
      .sort({ performanceScore: -1 })
      .limit(10)
      .select('name performanceScore revenueEarned memberCount');

    return {
      topCampaigns,
      topGroups
    };
  }

  // Real-time metrics
  static async getRealTimeMetrics() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      activeCampaigns,
      recentImpressions,
      recentEarnings,
      activeGroups
    ] = await Promise.all([
      Campaign.countDocuments({ status: 'active' }),
      ImpressionsLog.countDocuments({ createdAt: { $gte: last24h } }),
      WalletTransaction.aggregate([
        { $match: { type: 'earning', status: 'completed', createdAt: { $gte: last24h } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Group.countDocuments({ status: 'approved', isFlagged: false })
    ]);

    return {
      activeCampaigns,
      impressions24h: recentImpressions,
      earnings24h: recentEarnings[0]?.total || 0,
      activeGroups
    };
  }
}

module.exports = AnalyticsService;
