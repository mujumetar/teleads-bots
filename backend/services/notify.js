/**
 * TeleAds Push Notification Service v2
 * - Resilient HTTP push with retry + exponential backoff
 * - Broadcast to multiple users in one call
 * - Expanded notification templates for all platform events
 */

const axios = require('axios');

const BOT_URL      = process.env.BOT_URL      || 'https://teleads-bots-python.vercel.app';
const ADMIN_SECRET = process.env.ADMIN_SECRET;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Push a formatted HTML Telegram message to one user by telegramId.
 * Retries up to 3 times with exponential backoff on transient failures.
 */
async function push(telegramId, message, retries = 3) {
  if (!telegramId || !message) return;
  
  try {
    const mongoose = require('mongoose');
    let token = process.env.BOT_TOKEN;
    const Bot = mongoose.model('Bot');
    const primaryBot = await Bot.findOne({ status: 'active', isPrimary: true });
    if (primaryBot && primaryBot.token) token = primaryBot.token;

    if (!token) {
      console.warn('[notify] ⚠️ No active bot token found to send push notification.');
      return;
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await axios.post(
          `https://api.telegram.org/bot${token}/sendMessage`,
          {
            chat_id: telegramId,
            text: message,
            parse_mode: 'HTML',
            disable_web_page_preview: true
          },
          { timeout: 9000 }
        );
        return; // success
      } catch (err) {
        const isLast = attempt === retries;
        if (isLast) {
          console.warn(`[notify] ❌ Gave up pushing to ${telegramId} after ${retries} attempts:`, err.response?.data?.description || err.message);
        } else {
          console.warn(`[notify] ⚠️  Push attempt ${attempt} failed for ${telegramId}. Retrying in ${attempt * 1.5}s...`);
          await sleep(attempt * 1500);
        }
      }
    }
  } catch (err) {
    console.warn('[notify] ❌ Error initializing push:', err.message);
  }
}

/**
 * Broadcast the same message to multiple telegramIds concurrently.
 */
async function broadcast(telegramIds, message) {
  if (!telegramIds?.length || !message) return;
  const unique = [...new Set(telegramIds.filter(Boolean))];
  await Promise.allSettled(unique.map(id => push(id, message)));
  console.log(`[notify] 📡 Broadcast sent to ${unique.length} users`);
}

// ─── Notification Templates ───────────────────────────────────────────────
const Notify = {

  // ── Publisher: new ad posted to group
  adPosted: (groupName, campaignName, cpm, earnedINR) => `
📢 <b>New Ad Posted to Your Group!</b>
────────────────────────
📡 Group: <b>${groupName}</b>
🎯 Campaign: <b>${campaignName}</b>
💰 CPM Rate: <b>₹${cpm}</b>
💸 Estimated Earnings: <b>₹${parseFloat(earnedINR).toFixed(2)}</b>

<i>Final earnings are settled after 24h views are captured. Use /report in your group for live stats.</i>`.trim(),

  // ── Publisher: withdrawal approved
  withdrawalApproved: (amount, method) => `
✅ <b>Withdrawal Approved!</b>
────────────────────────
💸 Amount: <b>₹${parseFloat(amount).toFixed(2)}</b>
📲 Method: <b>${method}</b>
🕐 ETA: <b>24–48 business hours</b>

Your payment is being processed. Contact support if not received within 72h.`.trim(),

  // ── Publisher: withdrawal rejected
  withdrawalRejected: (amount, reason) => `
❌ <b>Withdrawal Rejected</b>
────────────────────────
💸 Amount: <b>₹${parseFloat(amount).toFixed(2)}</b>
📋 Reason: <i>${reason || 'Payment details could not be verified'}</i>

Please update your payment details on the dashboard and re-request.`.trim(),

  // ── Publisher: group approved
  groupApproved: (groupName, dynamicCpm) => `
🎉 <b>Group Approved — Welcome to the Network!</b>
────────────────────────
📡 <b>${groupName}</b> is now live on TeleAds Pro.

🏷 Your CPM: <b>₹${dynamicCpm}</b>
💰 Revenue Share: <b>65%</b>
📈 Impressions tracked at 1h, 6h, and 24h

Ads will start flowing automatically based on your niche and performance score.
Use /status in your group to monitor live metrics.`.trim(),

  // ── Publisher: group rejected
  groupRejected: (groupName, reason) => `
❌ <b>Group Registration Rejected</b>
────────────────────────
📛 Group: <b>${groupName}</b>
📋 Reason: <i>${reason || 'Does not meet minimum network standards'}</i>

<b>How to requalify:</b>
• Maintain ≥ 1,000 active members
• Ensure posting activity (≥ 5 posts/week)
• Avoid spam or fraudulent engagement

You can reapply once the issues are resolved.`.trim(),

  // ── Advertiser: campaign approved and live
  campaignApproved: (campaignName, budget, cpm) => `
🚀 <b>Campaign is Now Live!</b>
────────────────────────
🎯 <b>${campaignName}</b>
💰 Budget: <b>₹${parseFloat(budget).toFixed(2)}</b>
📊 CPM Rate: <b>₹${cpm}</b>

Ads are actively being distributed to matching publisher groups.
Check your Analytics dashboard for real-time impression and CTR data.`.trim(),

  // ── Advertiser: campaign budget exhausted
  campaignCompleted: (campaignName, totalViews, totalSpent) => `
✅ <b>Campaign Completed</b>
────────────────────────
🎯 <b>${campaignName}</b>
👁 Total Views: <b>${parseInt(totalViews).toLocaleString()}</b>
💸 Total Spent: <b>₹${parseFloat(totalSpent).toFixed(2)}</b>
📊 Effective CPM: <b>₹${totalViews > 0 ? ((parseFloat(totalSpent) / totalViews) * 1000).toFixed(2) : 'N/A'}</b>

View full performance breakdown on your Analytics dashboard.`.trim(),

  // ── Publisher: 24h daily group report
  dailyReport: (groupName, impressions, clicks, ctr, revenue) => `
📊 <b>Daily Group Performance Report</b>
────────────────────────
📛 <b>${groupName}</b>

👁 Impressions: <b>${parseInt(impressions).toLocaleString()}</b>
🖱 Clicks: <b>${parseInt(clicks).toLocaleString()}</b>
📈 CTR: <b>${parseFloat(ctr).toFixed(2)}%</b>
💰 Earned Today: <b>₹${parseFloat(revenue).toFixed(2)}</b>

Use /report in your group for a full breakdown.`.trim(),

  // ── Publisher: wallet balance low warning
  lowBalance: (currentBalance, minimumPayout) => `
⚠️ <b>Low Publisher Wallet Balance</b>
────────────────────────
💳 Current Balance: <b>₹${parseFloat(currentBalance).toFixed(2)}</b>
💸 Minimum Payout: <b>₹${minimumPayout}</b>

You need <b>₹${(minimumPayout - currentBalance).toFixed(2)}</b> more to request a withdrawal.
Keep your groups active to earn faster!`.trim(),

  // ── Publisher: group flagged for fraud
  groupFlagged: (groupName, reason) => `
🚩 <b>Network Alert: Group Under Review</b>
────────────────────────
📡 Group: <b>${groupName}</b>
📋 Issue: <i>${reason || 'Suspicious engagement patterns detected'}</i>

Ad delivery has been <b>temporarily paused</b> for this group.
Our team will review within 24h. No action needed if your engagement is organic.

Contact support if you believe this is a mistake.`.trim(),

  // ── Advertiser: new impression milestone hit
  impressionMilestone: (campaignName, milestone, totalSpent) => `
🏆 <b>Impression Milestone Reached!</b>
────────────────────────
🎯 <b>${campaignName}</b>
👁 Milestone: <b>${parseInt(milestone).toLocaleString()} views</b>
💸 Spent So Far: <b>₹${parseFloat(totalSpent).toFixed(2)}</b>

Great traction! Consider increasing your budget to maximize reach.`.trim(),

  // ── System: general platform announcement
  announcement: (title, body) => `
📣 <b>${title}</b>
────────────────────────
${body}

— TeleAds Pro Team`.trim(),
};

module.exports = { push, broadcast, Notify };
