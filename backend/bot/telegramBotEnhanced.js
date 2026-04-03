const { Telegraf, Markup } = require('telegraf');
const { message } = require('telegraf/filters');
const Campaign = require('../models/Campaign');
const Group = require('../models/Group');
const AdPost = require('../models/AdPost');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const ImpressionsLog = require('../models/ImpressionsLog');
const BotModel = require('../models/Bot');
const GlobalSetting = require('../models/GlobalSetting');
const FraudDetection = require('../services/fraudDetection');
const { push, Notify } = require('../services/notify');

let bot = null;
let botStartTime = null;

// ── CPM & Revenue Math ──
const calcCost = (views, cpm) => (views / 1000) * cpm;
const calcPublisherEarning = (cost, share = 0.65) => cost * share;
const calcPlatformFee = (cost, share = 0.35) => cost * share;

// ── Rate Limiting Store ──
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 20; // max commands per window

// ── Command Cooldowns ──
const cooldowns = new Map();
const COOLDOWN_TIME = 5000; // 5 seconds between same command

// ── Session Management ──
const userSessions = new Map();
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: UTILITY & HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

async function getActiveBot() {
  let token = process.env.BOT_TOKEN;
  try {
    const primaryBot = await BotModel.findOne({ status: 'active', isPrimary: true });
    if (primaryBot?.token) token = primaryBot.token;
  } catch (e) { /* use env token */ }
  return token;
}

function checkRateLimit(userId) {
  const now = Date.now();
  const userLimit = rateLimits.get(userId);
  
  if (!userLimit || now - userLimit.resetTime > RATE_LIMIT_WINDOW) {
    rateLimits.set(userId, { count: 1, resetTime: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((userLimit.resetTime + RATE_LIMIT_WINDOW - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  userLimit.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - userLimit.count };
}

function checkCooldown(userId, command) {
  const key = `${userId}:${command}`;
  const lastUsed = cooldowns.get(key);
  const now = Date.now();
  
  if (lastUsed && now - lastUsed < COOLDOWN_TIME) {
    const waitTime = Math.ceil((COOLDOWN_TIME - (now - lastUsed)) / 1000);
    return { onCooldown: true, waitTime };
  }
  
  cooldowns.set(key, now);
  return { onCooldown: false };
}

function getUserSession(userId) {
  const session = userSessions.get(userId);
  if (!session) return null;
  
  if (Date.now() - session.lastActivity > SESSION_TIMEOUT) {
    userSessions.delete(userId);
    return null;
  }
  
  session.lastActivity = Date.now();
  return session;
}

function setUserSession(userId, data) {
  userSessions.set(userId, {
    ...data,
    lastActivity: Date.now()
  });
}

function clearUserSession(userId) {
  userSessions.delete(userId);
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: MESSAGE FORMATTERS & UI BUILDERS
// ═══════════════════════════════════════════════════════════════════════════

const formatCurrency = (amount) => `₹${Number(amount).toFixed(2)}`;
const formatNumber = (num) => Number(num).toLocaleString('en-IN');
const formatDate = (date) => new Date(date).toLocaleDateString('en-IN');

function buildMainMenu(isAdmin = false, isPublisher = false, isAdvertiser = false) {
  const buttons = [
    [Markup.button.callback('📊 My Stats', 'menu_stats')],
    [Markup.button.callback('💰 Earnings', 'menu_earnings')],
    [Markup.button.callback('📢 Campaigns', 'menu_campaigns')]
  ];
  
  if (isAdmin) {
    buttons.push([Markup.button.callback('⚙️ Admin Panel', 'menu_admin')]);
  }
  
  buttons.push([Markup.button.callback('❓ Help', 'menu_help')]);
  
  return Markup.inlineKeyboard(buttons);
}

function buildPaginationButtons(currentPage, totalPages, action) {
  const buttons = [];
  
  if (currentPage > 1) {
    buttons.push(Markup.button.callback('◀️ Prev', `${action}_page_${currentPage - 1}`));
  }
  
  buttons.push(Markup.button.callback(`${currentPage}/${totalPages}`, 'noop'));
  
  if (currentPage < totalPages) {
    buttons.push(Markup.button.callback('Next ▶️', `${action}_page_${currentPage + 1}`));
  }
  
  return buttons;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: DATABASE OPERATIONS & BUSINESS LOGIC
// ═══════════════════════════════════════════════════════════════════════════

async function getOrCreateUser(telegramId, username, firstName, lastName) {
  let user = await User.findOne({ telegramId });
  
  if (!user) {
    user = await User.create({
      telegramId,
      telegramUsername: username,
      firstName,
      lastName,
      email: `${telegramId}@telegram.user`, // placeholder
      password: Math.random().toString(36).slice(2), // random password
      roles: { advertiser: false, publisher: true, isAdmin: false, isSuperAdmin: false }
    });
  } else {
    // Update user info if changed
    if (username && user.telegramUsername !== username) {
      user.telegramUsername = username;
    }
    if (firstName && user.firstName !== firstName) {
      user.firstName = firstName;
    }
    await user.save();
  }
  
  return user;
}

async function getGroupStats(groupId) {
  const group = await Group.findOne({ telegramGroupId: groupId.toString() });
  if (!group) return null;
  
  const stats = await AdPost.aggregate([
    { $match: { group: group._id, status: { $in: ['sent', 'completed'] } } },
    {
      $group: {
        _id: null,
        totalAds: { $sum: 1 },
        totalViews: { $sum: '$impressions' },
        totalEarnings: { $sum: '$publisherEarnings' },
        avgCpm: { $avg: '$cpmUsed' }
      }
    }
  ]);
  
  return {
    group,
    stats: stats[0] || { totalAds: 0, totalViews: 0, totalEarnings: 0, avgCpm: 0 }
  };
}

async function getUserCampaigns(userId, status = 'all', page = 1, limit = 10) {
  const query = { advertiser: userId };
  if (status !== 'all') query.status = status;
  
  const campaigns = await Campaign.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  
  const total = await Campaign.countDocuments(query);
  
  return { campaigns, total, pages: Math.ceil(total / limit) };
}

async function getTopPerformingGroups(limit = 10) {
  return await Group.find({ status: 'approved' })
    .sort({ performanceScore: -1, revenueEarned: -1 })
    .limit(limit)
    .select('name memberCount performanceScore revenueEarned avgViews');
}

async function getNetworkStats() {
  const [
    totalGroups,
    totalCampaigns,
    totalUsers,
    totalAdsPosted,
    totalRevenue
  ] = await Promise.all([
    Group.countDocuments({ status: 'approved' }),
    Campaign.countDocuments({ status: 'active' }),
    User.countDocuments(),
    AdPost.countDocuments({ status: { $in: ['sent', 'completed'] } }),
    Transaction.aggregate([
      { $match: { type: 'earning', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);
  
  return {
    totalGroups,
    totalCampaigns,
    totalUsers,
    totalAdsPosted,
    totalPublisherEarnings: totalRevenue[0]?.total || 0
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: ANTI-FRAUD & SECURITY LOGIC
// ═══════════════════════════════════════════════════════════════════════════

async function performFraudChecks(groupId, userId) {
  const checks = {
    memberCount: false,
    engagementRate: false,
    duplicateAccounts: false,
    suspiciousActivity: false,
    passed: false
  };
  
  try {
    const group = await Group.findOne({ telegramGroupId: groupId.toString() });
    const user = await User.findById(userId);
    
    // Check 1: Minimum member count
    checks.memberCount = group && group.memberCount >= 1000;
    
    // Check 2: Engagement rate (not too high = fake, not too low = dead)
    if (group) {
      const engagementRate = (group.avgViews / group.memberCount) * 100;
      checks.engagementRate = engagementRate >= 5 && engagementRate <= 80;
    }
    
    // Check 3: Duplicate account detection
    const duplicateCheck = await User.findOne({
      _id: { $ne: userId },
      $or: [
        { telegramId: user?.telegramId },
        { phone: user?.phone }
      ]
    });
    checks.duplicateAccounts = !duplicateCheck;
    
    // Check 4: Suspicious activity patterns
    const recentTransactions = await Transaction.countDocuments({
      user: userId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    checks.suspiciousActivity = recentTransactions < 50; // Not too many transactions
    
    checks.passed = Object.values(checks).every(v => v === true || v === 'passed');
    
  } catch (err) {
    console.error('Fraud check error:', err);
  }
  
  return checks;
}

async function logSuspiciousActivity(userId, action, details) {
  console.log(`🚨 Suspicious Activity: User ${userId} | Action: ${action}`, details);
  // Could integrate with external fraud detection service here
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: COMMAND HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

const commands = {
  // Core Commands
  start: async (ctx) => {
    const user = await getOrCreateUser(
      ctx.from.id,
      ctx.from.username,
      ctx.from.first_name,
      ctx.from.last_name
    );
    
    const welcomeText = `
🚀 *Welcome to TeleAds Pro, ${ctx.from.first_name}!*

The most advanced CPM ad network on Telegram.

*What you can do:*
• 📊 View your stats and earnings
• 📢 Create ad campaigns
• 💰 Earn from your groups
• 📈 Track performance in real-time

*Get Started:*
Add me to your group and use /register to start earning!

Need help? Use /help anytime.
    `;
    
    await ctx.replyWithMarkdown(welcomeText, buildMainMenu(
      user.roles?.isAdmin || user.roles?.isSuperAdmin,
      user.roles?.publisher,
      user.roles?.advertiser
    ));
  },

  help: async (ctx) => {
    const helpText = `
📖 *TeleAds Pro — Complete Command Guide*

*Publisher Commands:*
/register — Register your group for ads
/stats — View your group performance
/earnings — Check your revenue
/withdraw — Request payout
/groups — List your registered groups

*Advertiser Commands:*
/campaigns — Manage your campaigns
/create — Start a new ad campaign
/budget — Check campaign budgets
/analytics — View detailed analytics

*General Commands:*
/menu — Show main menu
/leaderboard — Top performing groups
/network — Network-wide statistics
/settings — Bot preferences
/support — Contact support

*Admin Commands:*
/admin — Admin dashboard
/broadcast — Send announcement
/moderate — Review pending groups
/system — System health check

Need more help? Contact @TeleAdsSupport
    `;
    
    await ctx.replyWithMarkdown(helpText);
  },

  menu: async (ctx) => {
    const user = await getOrCreateUser(ctx.from.id, ctx.from.username, ctx.from.first_name, ctx.from.last_name);
    await ctx.replyWithMarkdown('📋 *Main Menu*', buildMainMenu(
      user.roles?.isAdmin || user.roles?.isSuperAdmin,
      user.roles?.publisher,
      user.roles?.advertiser
    ));
  },

  // Publisher Commands
  register: async (ctx) => {
    try {
      if (ctx.chat.type === 'private') {
        return ctx.reply('⚠️ Please run this command inside a group or channel.');
      }
      
      const chatId = ctx.chat.id.toString();
      const userId = ctx.from.id;
      
      // Check if already registered
      const existing = await Group.findOne({ telegramGroupId: chatId });
      if (existing) {
        return ctx.replyWithMarkdown(
          `ℹ️ *Already Registered*\n\n` +
          `Status: *${existing.status.toUpperCase()}*\n` +
          `Score: *${existing.performanceScore}%*\n` +
          `CPM: *₹${existing.dynamicCpm}*`
        );
      }
      
      // Get member count
      const memberCount = await ctx.getChatMembersCount().catch(() => 0);
      
      // Anti-fraud: minimum members
      if (memberCount < 1000) {
        return ctx.reply(
          `❌ *Registration Failed*\n\n` +
          `Minimum 1,000 members required.\n` +
          `Your group has ${memberCount} members.\n\n` +
          `Grow your group and try again!`
        );
      }
      
      // Get chat details
      const chat = await ctx.getChat();
      
      // Create group record
      const newGroup = await Group.create({
        name: chat.title,
        telegramGroupId: chatId,
        telegramGroupUsername: chat.username || null,
        memberCount,
        owner: (await getOrCreateUser(userId, ctx.from.username, ctx.from.first_name, ctx.from.last_name))._id,
        niche: 'general',
        category: 'general',
        status: 'pending',
        performanceScore: 50,
        dynamicCpm: 100,
        avgViews: Math.round(memberCount * 0.15)
      });
      
      // Fraud detection check
      const fraudChecks = await performFraudChecks(chatId, newGroup.owner);
      
      if (!fraudChecks.passed) {
        newGroup.isFlagged = true;
        newGroup.flagReason = 'Failed automated fraud checks';
        await newGroup.save();
      }
      
      await ctx.replyWithMarkdown(
        `✅ *Group Registered Successfully!*\n\n` +
        `*Name:* ${chat.title}\n` +
        `*ID:* \`${chatId}\`\n` +
        `*Members:* ${memberCount}\n` +
        `*Status:* Pending Review\n\n` +
        `Your group is now pending admin approval. ` +
        `Once approved, ads will start appearing automatically.\n\n` +
        `*Estimated Earnings:* ₹${(memberCount * 0.15 / 1000 * 65).toFixed(2)} per ad`,
        Markup.inlineKeyboard([
          [Markup.button.url('📊 View Dashboard', `${process.env.FRONTEND_URL}/groups`)]
        ])
      );
      
    } catch (err) {
      console.error('Register error:', err);
      ctx.reply('❌ An error occurred. Please try again later.');
    }
  },

  stats: async (ctx) => {
    try {
      if (ctx.chat.type === 'private') {
        // Show user stats
        const user = await getOrCreateUser(ctx.from.id, ctx.from.username, ctx.from.first_name, ctx.from.last_name);
        const groups = await Group.find({ owner: user._id });
        
        if (groups.length === 0) {
          return ctx.reply('You don\'t have any registered groups yet. Use /register in a group to start!');
        }
        
        let totalEarnings = 0;
        let totalAds = 0;
        
        for (const group of groups) {
          totalEarnings += group.revenueEarned;
          totalAds += group.totalAdsPosted;
        }
        
        return ctx.replyWithMarkdown(
          `📊 *Your Publisher Stats*\n\n` +
          `*Groups:* ${groups.length}\n` +
          `*Total Ads Posted:* ${totalAds}\n` +
          `*Total Earnings:* ₹${totalEarnings.toFixed(2)}\n` +
          `*Wallet Balance:* ₹${user.publisherWallet.toFixed(2)}\n\n` +
          `Use /groups to see details for each group.`
        );
      }
      
      // Show group stats
      const chatId = ctx.chat.id.toString();
      const data = await getGroupStats(chatId);
      
      if (!data) {
        return ctx.reply('⚠️ This group is not registered. Use /register to join.');
      }
      
      const { group, stats } = data;
      
      await ctx.replyWithMarkdown(
        `📊 *${group.name} — Performance Report*\n\n` +
        `📈 *Metrics*\n` +
        `Status: *${group.status.toUpperCase()}*\n` +
        `Members: *${formatNumber(group.memberCount)}*\n` +
        `Avg Views: *${formatNumber(group.avgViews)}*\n` +
        `Engagement: *${group.performanceScore}%*\n\n` +
        `💰 *Earnings*\n` +
        `CPM Rate: *₹${group.dynamicCpm}*\n` +
        `Total Ads: *${stats.totalAds}*\n` +
        `Total Views: *${formatNumber(stats.totalViews)}*\n` +
        `Revenue: *₹${stats.totalEarnings.toFixed(2)}*`,
        Markup.inlineKeyboard([
          [Markup.button.callback('📈 Detailed Analytics', 'analytics_group')],
          [Markup.button.callback('💸 Withdraw', 'withdraw_request')]
        ])
      );
      
    } catch (err) {
      console.error('Stats error:', err);
      ctx.reply('❌ Error fetching stats.');
    }
  },

  earnings: async (ctx) => {
    try {
      const user = await getOrCreateUser(ctx.from.id, ctx.from.username, ctx.from.first_name, ctx.from.last_name);
      const groups = await Group.find({ owner: user._id });
      
      let totalRevenue = 0;
      let pendingEarnings = 0;
      
      for (const group of groups) {
        totalRevenue += group.revenueEarned;
      }
      
      const transactions = await Transaction.find({
        user: user._id,
        type: 'earning',
        status: 'completed',
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      });
      
      const last30Days = transactions.reduce((sum, t) => sum + t.amount, 0);
      
      await ctx.replyWithMarkdown(
        `💰 *Your Earnings Dashboard*\n\n` +
        `*Publisher Wallet:* ₹${user.publisherWallet.toFixed(2)}\n` +
        `*Total Revenue:* ₹${totalRevenue.toFixed(2)}\n` +
        `*Last 30 Days:* ₹${last30Days.toFixed(2)}\n` +
        `*Active Groups:* ${groups.filter(g => g.status === 'approved').length}\n\n` +
        `Minimum withdrawal: ₹1,000`,
        Markup.inlineKeyboard([
          [Markup.button.url('💸 Withdraw', `${process.env.FRONTEND_URL}/wallet`)],
          [Markup.button.callback('📜 Transaction History', 'tx_history_1')]
        ])
      );
      
    } catch (err) {
      console.error('Earnings error:', err);
      ctx.reply('❌ Error fetching earnings.');
    }
  },

  groups: async (ctx) => {
    try {
      const user = await getOrCreateUser(ctx.from.id, ctx.from.username, ctx.from.first_name, ctx.from.last_name);
      const groups = await Group.find({ owner: user._id }).sort({ revenueEarned: -1 });
      
      if (groups.length === 0) {
        return ctx.reply('You don\'t have any registered groups yet.');
      }
      
      let text = `📢 *Your Groups (${groups.length})*\n\n`;
      
      groups.slice(0, 10).forEach((group, i) => {
        const statusEmoji = group.status === 'approved' ? '✅' : 
                           group.status === 'pending' ? '⏳' : '❌';
        text += `${i + 1}. ${statusEmoji} *${group.name}*\n`;
        text += `   💰 ₹${group.revenueEarned.toFixed(2)} | 👥 ${formatNumber(group.memberCount)}\n\n`;
      });
      
      await ctx.replyWithMarkdown(text);
      
    } catch (err) {
      console.error('Groups error:', err);
      ctx.reply('❌ Error fetching groups.');
    }
  },

  // Advertiser Commands
  campaigns: async (ctx) => {
    try {
      const user = await getOrCreateUser(ctx.from.id, ctx.from.username, ctx.from.first_name, ctx.from.last_name);
      
      if (!user.roles?.advertiser) {
        return ctx.reply(
          'You need advertiser access. Use the dashboard to upgrade your account.',
          Markup.inlineKeyboard([
            [Markup.button.url('🔗 Open Dashboard', process.env.FRONTEND_URL)]
          ])
        );
      }
      
      const { campaigns, total, pages } = await getUserCampaigns(user._id, 'all', 1, 5);
      
      if (campaigns.length === 0) {
        return ctx.replyWithMarkdown(
          `📢 *No Campaigns Yet*\n\n` +
          `Create your first campaign to start advertising!`,
          Markup.inlineKeyboard([
            [Markup.button.url('➕ Create Campaign', `${process.env.FRONTEND_URL}/campaigns`)]
          ])
        );
      }
      
      let text = `📢 *Your Campaigns*\n\n`;
      
      campaigns.forEach((campaign, i) => {
        const statusEmoji = campaign.status === 'active' ? '🟢' :
                           campaign.status === 'pending' ? '🟡' :
                           campaign.status === 'paused' ? '🔵' : '🔴';
        const progress = ((campaign.budgetSpent / campaign.budget) * 100).toFixed(1);
        
        text += `${statusEmoji} *${campaign.name}*\n`;
        text += `   💰 ₹${campaign.budgetSpent.toFixed(0)} / ₹${campaign.budget} (${progress}%)\n`;
        text += `   👁 ${formatNumber(campaign.totalViews)} views\n\n`;
      });
      
      const keyboard = [
        [Markup.button.url('➕ New Campaign', `${process.env.FRONTEND_URL}/campaigns/new`)],
        [Markup.button.url('📊 View All', `${process.env.FRONTEND_URL}/campaigns`)]
      ];
      
      if (pages > 1) {
        keyboard.push([Markup.button.callback('Next Page ▸', 'campaigns_page_2')]);
      }
      
      await ctx.replyWithMarkdown(text, Markup.inlineKeyboard(keyboard));
      
    } catch (err) {
      console.error('Campaigns error:', err);
      ctx.reply('❌ Error fetching campaigns.');
    }
  },

  budget: async (ctx) => {
    try {
      const user = await getOrCreateUser(ctx.from.id, ctx.from.username, ctx.from.first_name, ctx.from.last_name);
      
      const campaigns = await Campaign.find({
        advertiser: user._id,
        status: { $in: ['active', 'paused'] }
      });
      
      let totalBudget = 0;
      let totalSpent = 0;
      
      campaigns.forEach(c => {
        totalBudget += c.budget;
        totalSpent += c.budgetSpent;
      });
      
      await ctx.replyWithMarkdown(
        `💰 *Budget Overview*\n\n` +
        `*Active Campaigns:* ${campaigns.length}\n` +
        `*Total Budget:* ₹${totalBudget.toFixed(2)}\n` +
        `*Total Spent:* ₹${totalSpent.toFixed(2)}\n` +
        `*Remaining:* ₹${(totalBudget - totalSpent).toFixed(2)}\n\n` +
        `*Wallet Balance:* ₹${user.advertiserWallet.toFixed(2)}`,
        Markup.inlineKeyboard([
          [Markup.button.url('💳 Add Funds', `${process.env.FRONTEND_URL}/wallet`)],
          [Markup.button.url('📊 Campaigns', `${process.env.FRONTEND_URL}/campaigns`)]
        ])
      );
      
    } catch (err) {
      console.error('Budget error:', err);
      ctx.reply('❌ Error fetching budget.');
    }
  },

  // Network & Info Commands
  leaderboard: async (ctx) => {
    try {
      const topGroups = await getTopPerformingGroups(10);
      
      let text = `🏆 *Top Performing Groups*\n\n`;
      
      topGroups.forEach((group, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        text += `${medal} *${group.name}*\n`;
        text += `   👥 ${formatNumber(group.memberCount)} | 💰 ₹${group.revenueEarned.toFixed(2)} | 📊 ${group.performanceScore}%\n\n`;
      });
      
      await ctx.replyWithMarkdown(text);
      
    } catch (err) {
      console.error('Leaderboard error:', err);
      ctx.reply('❌ Error fetching leaderboard.');
    }
  },

  network: async (ctx) => {
    try {
      const stats = await getNetworkStats();
      
      await ctx.replyWithMarkdown(
        `🌐 *TeleAds Network Statistics*\n\n` +
        `*Active Groups:* ${formatNumber(stats.totalGroups)}\n` +
        `*Active Campaigns:* ${formatNumber(stats.totalCampaigns)}\n` +
        `*Total Users:* ${formatNumber(stats.totalUsers)}\n` +
        `*Ads Posted:* ${formatNumber(stats.totalAdsPosted)}\n` +
        `*Publisher Earnings:* ₹${stats.totalPublisherEarnings.toFixed(2)}\n\n` +
        `*Bot Status:* 🟢 Online\n` +
        `*Uptime:* ${Math.floor((Date.now() - botStartTime) / 1000 / 60)} minutes`,
        Markup.inlineKeyboard([
          [Markup.button.url('🌐 Visit Website', process.env.FRONTEND_URL)]
        ])
      );
      
    } catch (err) {
      console.error('Network error:', err);
      ctx.reply('❌ Error fetching network stats.');
    }
  },

  support: async (ctx) => {
    await ctx.replyWithMarkdown(
      `📞 *TeleAds Support*\n\n` +
      `Need help? Contact our support team:\n\n` +
      `• @TeleAdsSupport\n` +
      `• support@teleads.com\n\n` +
      `For emergencies, contact @TeleAdsAdmin`,
      Markup.inlineKeyboard([
        [Markup.button.url('📧 Email Support', 'mailto:support@teleads.com')]
      ])
    );
  },

  settings: async (ctx) => {
    const user = await getOrCreateUser(ctx.from.id, ctx.from.username, ctx.from.first_name, ctx.from.last_name);
    
    await ctx.replyWithMarkdown(
      `⚙️ *Bot Settings*\n\n` +
      `*Your ID:* \`${ctx.from.id}\`\n` +
      `*Username:* @${ctx.from.username || 'N/A'}\n` +
      `*Language:* English 🇬🇧\n` +
      `*Notifications:* ✅ Enabled\n\n` +
      `*Account Type:* ${user.roles?.advertiser ? 'Advertiser' : 'Publisher'}`,
      Markup.inlineKeyboard([
        [Markup.button.callback('🔔 Toggle Notifications', 'toggle_notifications')],
        [Markup.button.callback('🌐 Change Language', 'change_language')],
        [Markup.button.callback('🔗 Link Dashboard', 'link_dashboard')]
      ])
    );
  },

  // Admin Commands
  admin: async (ctx) => {
    const user = await getOrCreateUser(ctx.from.id, ctx.from.username, ctx.from.first_name, ctx.from.last_name);
    
    if (!user.roles?.isAdmin && !user.roles?.isSuperAdmin) {
      return ctx.reply('⛔️ Admin access required.');
    }
    
    const pendingGroups = await Group.countDocuments({ status: 'pending' });
    const flaggedGroups = await Group.countDocuments({ isFlagged: true });
    const pendingCampaigns = await Campaign.countDocuments({ status: 'pending' });
    
    await ctx.replyWithMarkdown(
      `⚙️ *Admin Dashboard*\n\n` +
      `*Pending Actions*\n` +
      `⏳ Groups to Review: *${pendingGroups}*\n` +
      `🚩 Flagged Groups: *${flaggedGroups}*\n` +
      `📢 Pending Campaigns: *${pendingCampaigns}*\n\n` +
      `*Quick Actions*`,
      Markup.inlineKeyboard([
        [Markup.button.callback('👥 Review Groups', 'admin_review_groups')],
        [Markup.button.callback('🚩 Review Flagged', 'admin_review_flagged')],
        [Markup.button.callback('📢 Review Campaigns', 'admin_review_campaigns')],
        [Markup.button.callback('📊 System Stats', 'admin_system_stats')],
        [Markup.button.callback('📢 Broadcast', 'admin_broadcast')]
      ])
    );
  },

  broadcast: async (ctx) => {
    const user = await getOrCreateUser(ctx.from.id, ctx.from.username, ctx.from.first_name, ctx.from.last_name);
    
    if (!user.roles?.isSuperAdmin) {
      return ctx.reply('⛔️ Superadmin only.');
    }
    
    setUserSession(ctx.from.id, {
      action: 'awaiting_broadcast_message',
      step: 'enter_message'
    });
    
    await ctx.replyWithMarkdown(
      `📢 *Broadcast Message*\n\n` +
      `Send the message you want to broadcast to all users.\n\n` +
      `You can use Markdown formatting.\n` +
      `Type /cancel to abort.`
    );
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: ACTION HANDLERS (Inline Keyboard Callbacks)
// ═══════════════════════════════════════════════════════════════════════════

const actions = {
  // Menu Navigation
  menu_stats: async (ctx) => commands.stats(ctx),
  menu_earnings: async (ctx) => commands.earnings(ctx),
  menu_campaigns: async (ctx) => commands.campaigns(ctx),
  menu_admin: async (ctx) => commands.admin(ctx),
  menu_help: async (ctx) => commands.help(ctx),
  
  // Pagination
  campaigns_page: async (ctx) => {
    const page = parseInt(ctx.match[1]);
    // Handle campaign pagination
    await ctx.answerCbQuery(`Loading page ${page}...`);
  },
  
  tx_history: async (ctx) => {
    const page = parseInt(ctx.match[1]);
    // Show transaction history
    await ctx.answerCbQuery('Loading transactions...');
  },
  
  // Admin Actions
  admin_review_groups: async (ctx) => {
    await ctx.answerCbQuery();
    const groups = await Group.find({ status: 'pending' }).limit(5);
    
    if (groups.length === 0) {
      return ctx.editMessageText('✅ No pending groups to review.');
    }
    
    for (const group of groups) {
      await ctx.replyWithMarkdown(
        `👥 *Group Review*\n\n` +
        `*Name:* ${group.name}\n` +
        `*Members:* ${group.memberCount}\n` +
        `*Owner ID:* ${group.owner}\n` +
        `*Applied:* ${formatDate(group.createdAt)}`,
        Markup.inlineKeyboard([
          [
            Markup.button.callback('✅ Approve', `approve_group_${group._id}`),
            Markup.button.callback('❌ Reject', `reject_group_${group._id}`)
          ],
          [Markup.button.callback('🚩 Flag', `flag_group_${group._id}`)]
        ])
      );
    }
  },
  
  approve_group: async (ctx) => {
    const groupId = ctx.match[1];
    await Group.findByIdAndUpdate(groupId, { status: 'approved' });
    await ctx.answerCbQuery('✅ Group approved!');
    await ctx.deleteMessage();
  },
  
  reject_group: async (ctx) => {
    const groupId = ctx.match[1];
    await Group.findByIdAndUpdate(groupId, { status: 'rejected' });
    await ctx.answerCbQuery('❌ Group rejected.');
    await ctx.deleteMessage();
  },
  
  flag_group: async (ctx) => {
    const groupId = ctx.match[1];
    await Group.findByIdAndUpdate(groupId, { isFlagged: true });
    await ctx.answerCbQuery('🚩 Group flagged.');
    await ctx.deleteMessage();
  },
  
  // Analytics
  analytics_group: async (ctx) => {
    await ctx.answerCbQuery('📊 Detailed analytics coming soon!');
  },
  
  // Withdrawal
  withdraw_request: async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.replyWithMarkdown(
      `💸 *Withdrawal Request*\n\n` +
      `Minimum withdrawal: ₹1,000\n\n` +
      `Please visit the dashboard to process your withdrawal:`,
      Markup.inlineKeyboard([
        [Markup.button.url('💸 Withdraw Now', `${process.env.FRONTEND_URL}/wallet`)]
      ])
    );
  },
  
  // Settings
  toggle_notifications: async (ctx) => {
    await ctx.answerCbQuery('✅ Notifications toggled!');
  },
  
  change_language: async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('🌐 Select language:', Markup.inlineKeyboard([
      [Markup.button.callback('🇬🇧 English', 'lang_en')],
      [Markup.button.callback('🇮🇳 Hindi', 'lang_hi')]
    ]));
  },
  
  link_dashboard: async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.replyWithMarkdown(
      `🔗 *Link Your Dashboard Account*\n\n` +
      `Use this command format to link:\n` +
      `/link your@email.com`,
      Markup.inlineKeyboard([
        [Markup.button.url('🔗 Open Dashboard', process.env.FRONTEND_URL)]
      ])
    );
  },
  
  noop: async (ctx) => {
    await ctx.answerCbQuery();
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7: MESSAGE HANDLERS & MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════

function setupMiddleware(bot) {
  // Rate limiting middleware
  bot.use(async (ctx, next) => {
    if (ctx.from) {
      const rateCheck = checkRateLimit(ctx.from.id);
      
      if (!rateCheck.allowed) {
        return ctx.reply(`⚠️ Rate limit exceeded. Please wait ${rateCheck.retryAfter}s.`);
      }
    }
    return next();
  });
  
  // User activity logging
  bot.use(async (ctx, next) => {
    if (ctx.from && ctx.message) {
      // Log user activity for analytics
      const user = await getOrCreateUser(
        ctx.from.id,
        ctx.from.username,
        ctx.from.first_name,
        ctx.from.last_name
      );
      
      // Update last activity
      user.lastLogin = new Date();
      await user.save();
    }
    return next();
  });
  
  // Session management
  bot.use(async (ctx, next) => {
    if (ctx.from) {
      const session = getUserSession(ctx.from.id);
      ctx.session = session;
    }
    return next();
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 8: BOT INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

async function initBot() {
  const token = await getActiveBot();
  
  if (!token || token === 'YOUR_TELEGRAM_BOT_TOKEN') {
    console.log('⚠️ No valid BOT_TOKEN. Telegram bot will not start.');
    return null;
  }
  
  bot = new Telegraf(token);
  botStartTime = Date.now();
  
  // Setup middleware
  setupMiddleware(bot);
  
  // Register commands
  Object.entries(commands).forEach(([command, handler]) => {
    bot.command(command, async (ctx) => {
      // Check cooldown
      const cooldown = checkCooldown(ctx.from.id, command);
      if (cooldown.onCooldown) {
        return ctx.reply(`⏳ Please wait ${cooldown.waitTime}s before using this command again.`);
      }
      
      try {
        await handler(ctx);
      } catch (err) {
        console.error(`Command /${command} error:`, err);
        ctx.reply('❌ An error occurred. Please try again.');
      }
    });
  });
  
  // Register action handlers
  Object.entries(actions).forEach(([action, handler]) => {
    if (action.includes('_')) {
      // Dynamic actions with parameters (e.g., campaigns_page_2)
      const baseAction = action.split('_').slice(0, -1).join('_');
      bot.action(new RegExp(`^${baseAction}_(.+)$`), async (ctx) => {
        try {
          await handler(ctx);
        } catch (err) {
          console.error(`Action ${action} error:`, err);
        }
      });
    } else {
      bot.action(action, async (ctx) => {
        try {
          await handler(ctx);
        } catch (err) {
          console.error(`Action ${action} error:`, err);
        }
      });
    }
  });
  
  // Handle text messages (for sessions)
  bot.on(message('text'), async (ctx) => {
    const session = ctx.session;
    
    if (session?.action === 'awaiting_broadcast_message' && session?.step === 'enter_message') {
      // Handle broadcast message input
      const messageText = ctx.message.text;
      
      if (messageText === '/cancel') {
        clearUserSession(ctx.from.id);
        return ctx.reply('❌ Broadcast cancelled.');
      }
      
      // Confirm broadcast
      await ctx.replyWithMarkdown(
        `📢 *Confirm Broadcast*\n\n` +
        `Message preview:\n` +
        `---\n${messageText}\n---\n\n` +
        `Send to all users?`,
        Markup.inlineKeyboard([
          [
            Markup.button.callback('✅ Yes, Send', `confirm_broadcast_${Buffer.from(messageText).toString('base64')}`),
            Markup.button.callback('❌ Cancel', 'cancel_broadcast')
          ]
        ])
      );
      
      clearUserSession(ctx.from.id);
    }
  });
  
  // Error handling
  bot.catch((err, ctx) => {
    console.error('Bot error:', err);
    ctx.reply('❌ An unexpected error occurred.');
  });
  
  // Launch bot
  bot.launch()
    .then(() => console.log('🤖 Telegram Bot started successfully'))
    .catch(err => console.error('Bot launch error:', err));
  
  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
  
  return bot;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 9: AD POSTING & QUEUE PROCESSING
// ═══════════════════════════════════════════════════════════════════════════

async function postAdToGroup(campaign, group) {
  const adSwitch = await GlobalSetting.findOne({ key: 'ads_enabled' });
  if (adSwitch?.value === false) {
    console.log('🚫 Ads globally disabled.');
    return null;
  }
  
  const token = await getActiveBot();
  if (!token && !bot) {
    console.log('⚠️ No active bot token.');
    return null;
  }
  
  const currentBot = bot || new Telegraf(token);
  
  // Anti-fraud checks
  if (group.isFlagged) {
    console.log(`🚩 Skipping flagged group: ${group.name}`);
    return null;
  }
  
  if (group.memberCount < 1000) {
    console.log(`⚠️ Group too small: ${group.name}`);
    return null;
  }
  
  // Check post frequency
  const hoursToWait = group.postFrequency || 4;
  if (group.lastAdPostedAt) {
    const hoursSinceLast = (Date.now() - group.lastAdPostedAt.getTime()) / (1000 * 3600);
    if (hoursSinceLast < hoursToWait) {
      console.log(`⏳ Post frequency limit for ${group.name} (${hoursSinceLast.toFixed(1)}h < ${hoursToWait}h)`);
      return null;
    }
  }
  
  const cpm = campaign.cpm || group.dynamicCpm || 100;
  const estimatedViews = group.avgViews || Math.round(group.memberCount * 0.15);
  const estimatedCost = calcCost(estimatedViews, cpm);
  const publisherShare = calcPublisherEarning(estimatedCost);
  
  // Budget guard
  if (campaign.budgetSpent + estimatedCost > campaign.budget) {
    console.log(`💸 Budget exhausted: ${campaign.name}`);
    return null;
  }
  
  try {
    // Create tracking record
    const adPost = await AdPost.create({
      campaign: campaign._id,
      group: group._id,
      status: 'scheduled',
      cpmUsed: cpm,
      costCharged: estimatedCost,
      publisherEarnings: publisherShare,
    });
    
    const trackingLink = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/tracking/${adPost._id}`;
    
    // Build ad content
    let adText = `📢 *Sponsored Content*\n\n${campaign.adText}`;
    
    if (campaign.targetUrl) {
      adText += `\n\n🔗 [Learn More](${trackingLink})`;
    }
    
    adText += `\n\n_💰 Promote your business on TeleAds_`;
    
    // Send ad
    let message;
    if (campaign.adImageUrl) {
      message = await currentBot.telegram.sendPhoto(group.telegramGroupId, campaign.adImageUrl, {
        caption: adText,
        parse_mode: 'Markdown',
      });
    } else {
      message = await currentBot.telegram.sendMessage(group.telegramGroupId, adText, {
        parse_mode: 'Markdown',
      });
    }
    
    // Update record
    adPost.telegramMessageId = message.message_id.toString();
    adPost.status = 'sent';
    adPost.sentAt = new Date();
    adPost.viewsAtPost = message.views || estimatedViews;
    await adPost.save();
    
    // Update campaign
    campaign.budgetSpent += estimatedCost;
    campaign.totalImpressions += estimatedViews;
    campaign.totalViews += estimatedViews;
    if (campaign.budgetSpent >= campaign.budget) campaign.status = 'completed';
    await campaign.save();
    
    // Update group
    group.revenueEarned += publisherShare;
    group.lastAdPostedAt = new Date();
    group.totalAdsPosted += 1;
    await group.save();
    
    // Create transactions
    await Transaction.create({
      user: group.owner,
      amount: publisherShare,
      type: 'earning',
      status: 'completed',
      reference: `CPM-${campaign.name}`,
      note: `Group: ${group.name}`
    });
    
    await User.findByIdAndUpdate(group.owner, { $inc: { publisherWallet: publisherShare } });
    
    // Notify owner
    const owner = await User.findById(group.owner);
    if (owner?.telegramId) {
      push(owner.telegramId, Notify.adPosted(group.name, campaign.name, cpm, publisherShare));
    }
    
    // Log impression
    await ImpressionsLog.create({
      adPost: adPost._id,
      campaign: campaign._id,
      group: group._id,
      views: adPost.viewsAtPost,
      snapshotType: 'initial',
      impressions: estimatedViews,
      costAtSnapshot: estimatedCost,
    });
    
    console.log(`✅ Ad posted: ${group.name} | ₹${estimatedCost.toFixed(2)} | ${estimatedViews} views`);
    return adPost;
    
  } catch (err) {
    console.error(`❌ Failed to post to ${group.name}:`, err.message);
    return null;
  }
}

async function processAdQueue() {
  console.log('⚙️ Processing ad queue...');
  
  try {
    const now = new Date();
    
    // Find active campaigns
    const campaigns = await Campaign.find({
      status: 'active',
      $expr: { $lt: ['$budgetSpent', '$budget'] },
      $or: [
        { startDate: { $lte: now }, endDate: { $gte: now } },
        { startDate: null, endDate: null }
      ]
    }).populate('advertiser');
    
    for (const campaign of campaigns) {
      // Verify advertiser balance
      if (!campaign.advertiser || campaign.advertiser.advertiserWallet <= 0) {
        campaign.status = 'paused';
        await campaign.save();
        continue;
      }
      
      // Get target groups
      let groups;
      if (campaign.autoPlacement) {
        groups = await Group.find({
          status: 'approved',
          isFlagged: false,
          memberCount: { $gte: 1000 },
          $or: [
            { niche: campaign.niche },
            { category: { $in: campaign.targetCategories || [] } }
          ]
        }).sort({ performanceScore: -1 }).limit(10);
        
        if (groups.length === 0) {
          groups = await Group.find({
            status: 'approved',
            isFlagged: false,
            memberCount: { $gte: 1000 }
          }).sort({ performanceScore: -1 }).limit(5);
        }
      } else {
        groups = await Group.find({
          _id: { $in: campaign.selectedGroups || [] },
          status: 'approved',
          isFlagged: false
        });
      }
      
      // Post to each group
      for (const group of groups) {
        const estimatedCost = calcCost(
          group.avgViews || Math.round(group.memberCount * 0.15),
          campaign.cpm || group.dynamicCpm
        );
        
        if (campaign.budgetSpent + estimatedCost > campaign.budget) break;
        
        await postAdToGroup(campaign, group);
      }
    }
    
    console.log('✅ Ad queue processed');
    
  } catch (err) {
    console.error('❌ Queue error:', err);
  }
}

async function updateAdImpressions() {
  console.log('📊 Updating impressions...');
  
  try {
    const token = await getActiveBot();
    if (!token) return;
    
    const currentBot = bot || new Telegraf(token);
    
    const posts = await AdPost.find({
      status: 'sent',
      sentAt: { $gte: new Date(Date.now() - 25 * 60 * 60 * 1000) },
      viewsAt24h: 0
    }).populate('campaign').populate('group');
    
    for (const post of posts) {
      try {
        const hoursSince = (Date.now() - post.sentAt.getTime()) / (1000 * 3600);
        
        let snapshotType = 'manual';
        if (hoursSince >= 24 && !post.viewsAt24h) snapshotType = '24h';
        else if (hoursSince >= 6 && !post.viewsAt6h) snapshotType = '6h';
        else if (hoursSince >= 1 && !post.viewsAt1h) snapshotType = '1h';
        else continue;
        
        // Estimate views (Telegram doesn't expose views directly)
        const group = post.group;
        const engagementRate = Math.min(hoursSince / 24, 1);
        const views = Math.round((group.avgViews || group.memberCount * 0.15) * engagementRate);
        
        const cpm = post.cpmUsed || 100;
        const cost = calcCost(views, cpm);
        const publisherCut = calcPublisherEarning(cost);
        
        // Update post
        const updates = { lastViewsFetch: new Date() };
        if (snapshotType === '1h') updates.viewsAt1h = views;
        if (snapshotType === '6h') updates.viewsAt6h = views;
        if (snapshotType === '24h') {
          updates.viewsAt24h = views;
          updates.impressions = views;
          updates.costCharged = cost;
          updates.publisherEarnings = publisherCut;
          
          // Reconcile budget
          if (post.campaign) {
            const diff = cost - (post.costCharged || 0);
            await Campaign.findByIdAndUpdate(post.campaign._id, {
              $inc: { budgetSpent: diff }
            });
          }
        }
        
        await AdPost.findByIdAndUpdate(post._id, updates);
        
        // Log snapshot
        await ImpressionsLog.create({
          adPost: post._id,
          campaign: post.campaign?._id,
          group: post.group?._id,
          views,
          snapshotType,
          impressions: views,
          costAtSnapshot: cost
        });
        
      } catch (err) {
        console.error(`Error updating post ${post._id}:`, err);
      }
    }
    
  } catch (err) {
    console.error('Impressions update error:', err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 10: NOTIFICATIONS & ALERTS
// ═══════════════════════════════════════════════════════════════════════════

async function sendNotification(userId, type, data) {
  const token = await getActiveBot();
  if (!token) return;
  
  const currentBot = bot || new Telegraf(token);
  
  const messages = {
    campaign_approved: `✅ *Campaign Approved*\n\nYour campaign "${data.name}" has been approved and is now active!`,
    campaign_completed: `🎉 *Campaign Completed*\n\nYour campaign "${data.name}" has finished.\nTotal spent: ₹${data.spent}\nTotal views: ${data.views}`,
    earnings_update: `💰 *Earnings Update*\n\nYou've earned ₹${data.amount} from group "${data.group}"!`,
    withdrawal_complete: `✅ *Withdrawal Complete*\n\n₹${data.amount} has been sent to your account.`,
    group_approved: `✅ *Group Approved*\n\nYour group "${data.name}" is now approved and ready to earn!`,
    low_budget: `⚠️ *Low Budget Warning*\n\nCampaign "${data.name}" has only ₹${data.remaining} remaining.`,
  };
  
  try {
    await currentBot.telegram.sendMessage(userId, messages[type], { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Notification failed:', err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  initBot,
  postAdToGroup,
  processAdQueue,
  updateAdImpressions,
  sendNotification,
  getActiveBot,
  // Expose for testing/advanced usage
  commands,
  actions,
  helpers: {
    calcCost,
    calcPublisherEarning,
    formatCurrency,
    formatNumber,
    getGroupStats,
    getNetworkStats,
    performFraudChecks
  }
};
