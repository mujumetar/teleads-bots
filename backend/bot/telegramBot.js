const { Telegraf } = require('telegraf');
const Campaign = require('../models/Campaign');
const Group = require('../models/Group');
const AdPost = require('../models/AdPost');
const User = require('../models/User');

const BotModel = require('../models/Bot');

async function initBot() {
  let token = process.env.BOT_TOKEN;
  
  // Try to find primary bot from DB
  try {
    const primaryBot = await BotModel.findOne({ status: 'active', isPrimary: true });
    if (primaryBot && primaryBot.token) {
      console.log(`ℹ️  Using primary bot from database: ${primaryBot.name}`);
      token = primaryBot.token;
    }
  } catch (err) {
    console.error('Error fetching bot from DB:', err.message);
  }

  if (!token || token === 'YOUR_TELEGRAM_BOT_TOKEN') {
    console.log('⚠️  No valid BOT_TOKEN found in DB or ENV. Telegram bot will not start.');
    return null;
  }

  bot = new Telegraf(token);

  // /start command
  bot.start((ctx) => {
    ctx.reply(
      `🚀 *Welcome to TeleAds Bot!*\n\n` +
      `I help monetize Telegram groups through ads.\n\n` +
      `Commands:\n` +
      `/register - Register this group for ads\n` +
      `/status - Check group status\n` +
      `/earnings - View earnings\n` +
      `/help - Show help\n\n` +
      `Visit our dashboard: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`,
      { parse_mode: 'Markdown' }
    );
  });

  // /register command - registers the group
  bot.command('register', async (ctx) => {
    try {
      const chatId = ctx.chat.id.toString();
      const chatType = ctx.chat.type;

      if (chatType === 'private') {
        return ctx.reply('⚠️ This command only works in groups/channels. Add me to a group first!');
      }

      const existing = await Group.findOne({ telegramGroupId: chatId });
      if (existing) {
        return ctx.reply(`ℹ️ This group is already registered.\nStatus: *${existing.status}*`, { parse_mode: 'Markdown' });
      }

      // Get member count
      let memberCount = 0;
      try {
        memberCount = await ctx.getChatMembersCount();
      } catch (e) {
        // ignore
      }

      ctx.reply(
        `📋 *Group Detected:*\n` +
        `Name: ${ctx.chat.title}\n` +
        `ID: ${chatId}\n` +
        `Members: ${memberCount}\n\n` +
        `To complete registration, please sign up on our dashboard and add this group with ID: \`${chatId}\`\n\n` +
        `Dashboard: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`,
        { parse_mode: 'Markdown' }
      );
    } catch (err) {
      console.error('Register error:', err);
      ctx.reply('❌ An error occurred. Please try again.');
    }
  });

  // /stats command
  bot.command('stats', async (ctx) => {
    try {
      const usersCount = await User.countDocuments();
      const adsCount = await AdPost.countDocuments({ status: 'sent' });
      ctx.reply(
        `📈 *Global Network Stats*\n\n` +
        `👥 Users: ${usersCount}\n` +
        `📢 Ads Sent: ${adsCount}\n` +
        `🌐 Active Groups: ${await Group.countDocuments({ status: 'approved' })}\n\n` +
        `Check your dashboard for detailed analytics.`,
        { parse_mode: 'Markdown' }
      );
    } catch (err) {
      console.error(err);
    }
  });

  // /buy_credits - redirect to wallet
  bot.command('buy_credits', (ctx) => {
    ctx.reply(
      `💸 *Recharge Wallet*\n\n` +
      `Current Credit Price: ₹1 / post\n` +
      `Minimum Deposit: ₹100\n\n` +
      `Add funds via your dashboard to start creating campaigns instantly.`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: "💰 Open Wallet", url: `${process.env.FRONTEND_URL}/wallet` }
          ]]
        }
      }
    );
  });

const Transaction = require('../models/Transaction');

  // /earnings command
  bot.command('earnings', async (ctx) => {
    try {
      const chatId = ctx.chat.id.toString();
      const group = await Group.findOne({ telegramGroupId: chatId });
      if (!group) {
        return ctx.reply('⚠️ This group is not registered.');
      }
      const owner = await User.findById(group.owner);
      ctx.reply(
        `💰 *Earnings Report*\n\n` +
        `Group: ${group.name}\n` +
        `Total Earned: ₹${group.revenueEarned.toFixed(2)}\n` +
        `Wallet Balance: ₹${owner ? owner.walletBalance.toFixed(2) : '0.00'}\n\n` +
        `Visit the dashboard for detailed analytics.`,
        { parse_mode: 'Markdown' }
      );
    } catch (err) {
      ctx.reply('❌ An error occurred.');
    }
  });

  // /help command
  bot.help((ctx) => {
    ctx.reply(
      `📖 *TeleAds Bot Help*\n\n` +
      `*For Group Admins (Publishers):*\n` +
      `• Add this bot to your group\n` +
      `• Use /register to register the group\n\n` +
      `*Dashboard:* ${process.env.FRONTEND_URL || 'http://localhost:5173'}`,
      { parse_mode: 'Markdown' }
    );
  });

  return bot;
}

const GlobalSetting = require('../models/GlobalSetting');

// Post an ad to a Telegram group
async function postAdToGroup(campaign, group) {
  // Check if system-wide ads are enabled
  const adSwitch = await GlobalSetting.findOne({ key: 'ads_enabled' });
  if (adSwitch && adSwitch.value === false) {
    console.log('🚫 Ads are globally disabled by admin.');
    return null;
  }

  // Check for an active bot in DB if process.env.BOT_TOKEN is not used or to track stats
  const activeBot = await BotModel.findOne({ status: 'active', isPrimary: true });
  
  if (!bot && (!activeBot || !activeBot.token)) {
    console.log('⚠️ No active bot token found for posting.');
    return null;
  }

  // Use DB bot if needed (logic for multi-bot would expand here)
  const currentBot = bot || new Telegraf(activeBot.token);

  try {
    // Create initial ad post record to get ID for tracking
    const publisherShare = campaign.costPerPost * 0.7;
    const adPost = await AdPost.create({
      campaign: campaign._id,
      group: group._id,
      status: 'pending',
      costCharged: campaign.costPerPost,
      publisherEarnings: publisherShare,
    });

    const trackingLink = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/tracking/${adPost._id}`;
    const adText = `📢 *Sponsored*\n\n${campaign.adText}\n\n🔗 [Learn More](${trackingLink})`;

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

    // Update with message ID and status
    adPost.telegramMessageId = message.message_id.toString();
    adPost.status = 'sent';
    adPost.sentAt = new Date();
    await adPost.save();

    // Create Transaction Record for Publisher Transparency
    await Transaction.create({
      user: group.owner,
      amount: publisherShare,
      type: 'earning',
      status: 'completed',
      reference: `Ad Revenue: ${campaign.name}`,
      note: `Earned from group: ${group.name}`
    });

    // Create Transaction Record for Advertiser Transparency (Spend)
    await Transaction.create({
      user: campaign.advertiser,
      amount: campaign.costPerPost,
      type: 'spend',
      status: 'completed',
      reference: `Ad Spend: ${campaign.name}`,
      note: `Ad posted to group: ${group.name}`
    });

    // Update campaign spend
    campaign.budgetSpent += campaign.costPerPost;
    campaign.totalImpressions += 1;
    if (campaign.budgetSpent >= campaign.budget) campaign.status = 'completed';
    await campaign.save();

    // Update group stats
    group.revenueEarned += publisherShare;
    group.lastAdPostedAt = new Date();
    await group.save();

    await User.findByIdAndUpdate(group.owner, { $inc: { walletBalance: publisherShare } });
    if (activeBot) {
      activeBot.totalAdsSent += 1;
      await activeBot.save();
    }

    return adPost;
  } catch (err) {
    console.error(`Failed to post ad:`, err.message);
    return null;
  }
}

// Scheduler: run ads for active campaigns
async function processAdQueue() {
  try {
    const activeCampaigns = await Campaign.find({
      status: 'active',
      $expr: { $lt: ['$budgetSpent', '$budget'] },
    });

    for (const campaign of activeCampaigns) {
      // Find groups that match campaign niche
      const targetGroups = await Group.find({ 
        status: 'approved',
        niche: campaign.niche 
      });

      for (const group of targetGroups) {
        // Frequency check
        const hoursToWait = group.postFrequency || 4;
        if (group.lastAdPostedAt) {
          const diff = (Date.now() - group.lastAdPostedAt.getTime()) / (1000 * 3600);
          if (diff < hoursToWait) continue;
        }

        // Budget check
        if (campaign.budgetSpent + campaign.costPerPost > campaign.budget) break;

        await postAdToGroup(campaign, group);
      }
    }
  } catch (err) {
    console.error('Queue error:', err);
  }
}

module.exports = { initBot, postAdToGroup, processAdQueue };
