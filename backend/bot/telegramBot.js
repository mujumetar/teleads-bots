const { Telegraf } = require('telegraf');
const Campaign = require('../models/Campaign');
const Group = require('../models/Group');
const AdPost = require('../models/AdPost');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const ImpressionsLog = require('../models/ImpressionsLog');
const BotModel = require('../models/Bot');
const GlobalSetting = require('../models/GlobalSetting');
const SystemConfig = require('../models/SystemConfig');
const { push, Notify } = require('../services/notify');

// ── Utilities & Math ──
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const calcCost = (views, cpm) => (views / 1000) * cpm;
const calcPublisherEarning = (cost, share = 0.60) => cost * share;

async function getActiveBotToken() {
  let token = process.env.BOT_TOKEN;
  try {
    const primaryBot = await BotModel.findOne({ status: 'active', isPrimary: true });
    if (primaryBot?.token) token = primaryBot.token;
  } catch (e) {
    console.error("Token fetch fallback triggered.");
  }
  return token;
}

// ── Core Init ──
// Telegraf polling disabled here to prevent conflict with Python webhook/poller UI.
// Node.js instance solely used as a robust remote client to dispatch ads & fetch updates.
async function initBot() {
  console.log('⚡ Node.js Service operating in API-client mode (Commands managed by Python Core)');
  return null;
}

// ── Safe API Sender with Retry & Fallbacks ──
async function safeSendAd(currentBot, groupId, imageUrl, adText, replyMarkup = null) {
  let attempt = 0;
  const maxAttempts = 3;
  let useImage = !!imageUrl;

  while (attempt < maxAttempts) {
    try {
      if (useImage) {
        return await currentBot.telegram.sendPhoto(groupId, imageUrl, {
          caption: adText,
          parse_mode: 'Markdown',
          reply_markup: replyMarkup
        });
      } else {
        return await currentBot.telegram.sendMessage(groupId, adText, {
          parse_mode: 'Markdown',
          reply_markup: replyMarkup
        });
      }
    } catch (err) {
      // Handle rate limits natively
      if (err.response && err.response.error_code === 429) {
        const retryAfter = err.response.parameters?.retry_after || 5;
        console.warn(`⏳ Telegram API Rate Limit! Waiting ${retryAfter} seconds...`);
        await sleep(retryAfter * 1000);
        attempt++;
      } 
      // Handle invalid image / HTTP errors by falling back to text
      else if (useImage && err.description && (err.description.includes('wrong file identifier') || err.description.includes('HTTP URL'))) {
        console.warn(`⚠️ Invalid Image URL for group ${groupId}. Gracefully downgrading to text-only.`);
        useImage = false; // Next iteration will skip image
      } 
      else {
        throw err;
      }
    }
  }
  throw new Error("Max API retries exceeded for sending ad.");
}

async function fetchMessageViews(groupId, messageId) {
  return 0; // Handled directly in updateAdImpressions via forwarding
}

// ── Post ONE ad to ONE group ──
async function postAdToGroup(campaign, group) {
  const adSwitch = await GlobalSetting.findOne({ key: 'ads_enabled' });
  if (adSwitch?.value === false) {
    console.log('🚫 Ads globally disabled by Superadmin.');
    return null;
  }

  const token = await getActiveBotToken();
  if (!token) {
    console.log('⚠️ No active bot token detected in network.');
    return null;
  }
  const currentBot = new Telegraf(token);

  // Anti-fraud: verify group health
  if (group.isFlagged) {
    console.log(`🚩 Skipping flagged group ID ${group._id}: ${group.name}`);
    return null;
  }
  
  const minMemberSetting = await GlobalSetting.findOne({ key: 'min_group_members' });
  const minMembers = minMemberSetting ? parseInt(minMemberSetting.value) : 100;
  
  if (group.memberCount < minMembers) {
    console.log(`⚠️ Network rule triggered. Group too small: ${group.name} (${group.memberCount} < ${minMembers})`);
    return null;
  }

  // Dynamic CPM routing
  const isFiller = campaign.isFiller || campaign.advertiser?.roles?.isSuperAdmin;
  const cpm = campaign.cpm || group.dynamicCpm || 100;
  const estimatedViews = group.avgViews || Math.round(group.memberCount * 0.15);
  const estimatedCost = isFiller ? 0 : calcCost(estimatedViews, cpm);
  
  // Filler ads use campaign.fillerCpm or a fallback rate
  let publisherShare;
  if (isFiller) {
    const fCpm = campaign.fillerCpm || 24;
    publisherShare = calcCost(estimatedViews, fCpm);
  } else {
    publisherShare = calcPublisherEarning(estimatedCost);
  }

  if (campaign.budgetSpent + estimatedCost > campaign.budget) {
    console.log(`💸 Budget exhausted for Campaign: ${campaign.name}`);
    return null;
  }

  try {
    // Stage the entity
    const adPost = await AdPost.create({
      campaign: campaign._id,
      group: group._id,
      status: 'scheduled',
      cpmUsed: cpm,
      costCharged: estimatedCost,
      publisherEarnings: publisherShare,
    });

    const trackingLink = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/tracking/${adPost._id}`;
    
    // Build CTA
    let ctaText = '';
    let replyMarkup = null;

    if (campaign.buttonText && campaign.buttonUrl) {
      // Use Custom Telegram Button
      replyMarkup = {
        inline_keyboard: [[
          { text: campaign.buttonText, url: campaign.buttonUrl }
        ]]
      };
      // We still include a tiny tracking link at the bottom just in case
      ctaText = `\n\n[🔗 Tracking](${trackingLink})`;
    } else {
      // Fallback to text-based CTA
      ctaText = campaign.targetUrl
        ? `\n\n🔗 [Learn More & Get Details](${trackingLink})`
        : `\n\n🔗 [View Campaign](${trackingLink})`;
    }
      
    const adText = `${campaign.adText}${ctaText}`;

    // Execute safe send with failure tolerance
    const message = await safeSendAd(currentBot, group.telegramGroupId, campaign.adImageUrl, adText, replyMarkup);

    // Lifecycle commit
    // Lifecycle commit
    adPost.telegramMessageId = message.message_id.toString();
    adPost.status = 'sent';
    adPost.sentAt = new Date();
    adPost.viewsAtPost = message.views || 0;
    adPost.paidImpressions = 0; // No impressions paid yet
    await adPost.save();

    campaign.totalAdsPosted = (campaign.totalAdsPosted || 0) + 1;
    await campaign.save();

    group.lastAdPostedAt = new Date();
    group.totalAdsPosted += 1;
    await group.save();

    BotModel.findOneAndUpdate(
      { status: 'active', isPrimary: true }, 
      { $inc: { totalAdsSent: 1 } }
    ).exec();

    console.log(`📢 Ad Dispatched: ${group.name} | CPM: ₹${cpm} | Waiting for impressions...`);
    return adPost;
  } catch (err) {
    console.error(`❌ Process Exception for ${group.name}:`, err.message);
    return null;
  }
}

// ── Concurrent Impression Re-Sync ──
async function updateAdImpressions() {
  console.log('📊 Synchronizing global ad network impressions...');
  const token = await getActiveBotToken();
  if (!token) return;

  const currentBot = new Telegraf(token);
  
  // Scope: Active posts dispatched within the last 25h pending closure
  const activePosts = await AdPost.find({
    status: 'sent',
    sentAt: { $gte: new Date(Date.now() - 25 * 60 * 60 * 1000) },
    viewsAt24h: 0,
  }).populate('campaign').populate('group');

  // Process concurrently but bounded to respect API caps
  const batches = [];
  const batchSize = 10;
  for (let i = 0; i < activePosts.length; i += batchSize) {
    batches.push(activePosts.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    await Promise.all(batch.map(async (adPost) => {
      try {
        let views = 0;
        let snapshotType = 'manual';
        const hoursSincePost = (Date.now() - adPost.sentAt.getTime()) / (3600000);

        if (hoursSincePost >= 24 && !adPost.viewsAt24h) snapshotType = '24h';
        else if (hoursSincePost >= 6 && !adPost.viewsAt6h) snapshotType = '6h';
        else if (hoursSincePost >= 1 && !adPost.viewsAt1h) snapshotType = '1h';
        else return; // Skip if no milestone reached

        // Forward lookup approach to scrape raw channel views
        try {
          if (!adPost.group) throw new Error('Group associated with AdPost no longer exists');
          const msg = await currentBot.telegram.forwardMessage(
            process.env.LOG_CHANNEL_ID || adPost.group.telegramGroupId,
            adPost.group.telegramGroupId,
            parseInt(adPost.telegramMessageId)
          );
          views = msg.views || 0;
        } catch (e) {
          // Fallback heuristic modeling if lookup fails (e.g. strict privacy setting)
          if (!adPost.group) {
             console.log(`⚠️ Record ${adPost._id} is orphaned (No Group). Skipping sync.`);
             return;
          }
          const engagementMultiplier = Math.min(hoursSincePost / 24, 1);
          views = Math.round((adPost.group.avgViews || adPost.group.memberCount * 0.15) * engagementMultiplier);
        }

        const cpm = adPost.cpmUsed || 100;
        const currentPaidViews = adPost.paidImpressions || 0;
        const newViews = views - currentPaidViews;

        const updateFields = { 
          lastViewsFetch: new Date(),
          impressions: views
        };
        
        if (snapshotType === '1h') updateFields.viewsAt1h = views;
        if (snapshotType === '6h') updateFields.viewsAt6h = views;
        if (snapshotType === '24h') updateFields.viewsAt24h = views;

        if (newViews > 0) {
          const isFiller = adPost.campaign?.isFiller;
          const newCost = isFiller ? 0 : calcCost(newViews, cpm);
          
          let newPublisherCut;
          if (isFiller) {
            const fCpm = adPost.campaign?.fillerCpm || 24;
            newPublisherCut = calcCost(newViews, fCpm);
          } else {
            newPublisherCut = calcPublisherEarning(newCost);
          }

          // 1. Update Advertiser
          if (adPost.campaign && !isFiller) {
            await User.findByIdAndUpdate(adPost.campaign.advertiser, { 
              $inc: { advertiserWallet: -newCost } 
            });
            await Campaign.findByIdAndUpdate(adPost.campaign._id, {
              $inc: { budgetSpent: newCost, totalViews: newViews, totalImpressions: newViews }
            });
          }

          // 2. Update Publisher
          if (adPost.group) {
            const publisher = await User.findById(adPost.group.owner);
            if (publisher) {
              publisher.publisherWallet += newPublisherCut;
              await publisher.save();

              // --- REFERRAL REWARD (Publisher Side) ---
              if (publisher.referredBy) {
                const config = await SystemConfig.findOne();
                if (config?.enableReferrals) {
                  const rewardPct = config.referralRewardPublisherPct || 0.05;
                  const rewardAmount = newPublisherCut * rewardPct;
                  
                  if (rewardAmount > 0) {
                    const referrer = await User.findById(publisher.referredBy);
                    if (referrer) {
                      referrer.publisherWallet += rewardAmount;
                      referrer.referralEarnings += rewardAmount;
                      await referrer.save();

                      // Record referral transaction (silent/internal)
                      await Transaction.create({
                        user: referrer._id,
                        amount: rewardAmount,
                        type: 'earning',
                        status: 'completed',
                        reference: 'REFERRAL_EARNING',
                        note: `5% Commission from ${publisher.email}'s earnings`
                      });
                    }
                  }
                }
              }
              // ----------------------------------------

              await Group.findByIdAndUpdate(adPost.group._id, {
                $inc: { revenueEarned: newPublisherCut },
                $set: { avgViews: views, lastViewsFetch: new Date() }
              });
            }
          }

          // 3. Log Transactions
          await Transaction.create([{
            user: adPost.group.owner,
            amount: newPublisherCut,
            type: 'earning',
            status: 'completed',
            reference: `Impression Sync (${snapshotType})`,
            note: `Group: ${adPost.group.name} | New Views: ${newViews} | CPM: ₹${cpm}`
          }, {
            user: adPost.campaign.advertiser,
            amount: newCost,
            type: 'spend',
            status: 'completed',
            reference: `Impression Sync (${snapshotType})`,
            note: `Group: ${adPost.group.name} | New Views: ${newViews} | CPM: ₹${cpm}`
          }]);

          updateFields.paidImpressions = views;
          updateFields.costCharged = (adPost.costCharged || 0) + newCost;
          updateFields.publisherEarnings = (adPost.publisherEarnings || 0) + newPublisherCut;
        }

        await AdPost.findByIdAndUpdate(adPost._id, updateFields);

        await ImpressionsLog.create({
          adPost: adPost._id,
          campaign: adPost.campaign?._id,
          group: adPost.group?._id,
          views,
          snapshotType,
          impressions: newViews,
          costAtSnapshot: calcCost(newViews, cpm),
        });
        console.log(`📸 View Sync [${snapshotType}]: Record ${adPost._id} → Total: ${views} (+${newViews} new) → Billed: ₹${calcCost(newViews, cpm).toFixed(2)}`);
      } catch (err) {
        console.error(`Sync Failure (Record ${adPost._id}):`, err.message);
      }
    }));
    await sleep(400); // 400ms delay between batch chunks to avoid flood errors
  }
}

// ── Global Ad Queue Governor ──
async function processAdQueue(force = false) {
  console.log('⚙️  Auditing Global Ad Queue...');
  try {
    const now = new Date();
    
    // 1. Check Global Interval Setting
    if (!force) {
      const intervalSetting = await GlobalSetting.findOne({ key: 'ad_posting_interval' });
      const lastRunSetting = await GlobalSetting.findOne({ key: 'last_ad_run' });
      const intervalMins = intervalSetting ? parseInt(intervalSetting.value) : 30;
      
      if (lastRunSetting) {
        const lastRun = new Date(lastRunSetting.value);
        const diffMins = (now - lastRun) / 60000;
        if (diffMins < intervalMins - 0.1) {
          console.log(`⏳ Skipping cycle: Next run in ${Math.ceil(intervalMins - diffMins)} mins.`);
          return;
        }
      }
    } else {
      console.log('⚡ Force-triggering ad cycle...');
    }

    // 2. Fetch Eligible Campaigns
    const activeCampaigns = await Campaign.find({
      status: 'active',
      $expr: { $lt: ['$budgetSpent', '$budget'] },
      $or: [
        { startDate: { $lte: now }, endDate: { $gte: now } },
        { startDate: null, endDate: null },
      ]
    }).populate('advertiser');

    let campaignsToProcess = activeCampaigns;

    if (activeCampaigns.length === 0) {
      console.log('🛌 No paid campaigns. Fetching Superadmin Filler Ads...');
      campaignsToProcess = await Campaign.find({
        status: 'active',
        isFiller: true
      }).populate('advertiser');

      if (campaignsToProcess.length === 0) {
        // Ultimate fallback: check for any campaign by superadmin
        const superadmins = await User.find({ 'roles.isSuperAdmin': true });
        campaignsToProcess = await Campaign.find({
          advertiser: { $in: superadmins.map(s => s._id) },
          status: 'active'
        }).populate('advertiser').limit(3);
      }
    }

    if (campaignsToProcess.length === 0) {
      console.log('🛌 No campaigns (paid or filler) to process.');
      return;
    }

    const minMemberSetting = await GlobalSetting.findOne({ key: 'min_group_members' });
    const minMembers = minMemberSetting ? parseInt(minMemberSetting.value) : 100;

    for (const campaign of campaignsToProcess) {
      const isFiller = campaign.isFiller || campaign.advertiser?.roles?.isSuperAdmin;
      
      // 3. User Balance Check (Skip for Filler Ads)
      if (!isFiller && (!campaign.advertiser || (campaign.advertiser.advertiserWallet || 0) <= 0)) {
        console.log(`⚠️ Low balance for ${campaign.name}. Pausing to protect advertiser.`);
        campaign.status = 'paused';
        await campaign.save();
        
        if (campaign.advertiser?.telegramId) {
          push(campaign.advertiser.telegramId, `🔴 <b>Campaign Paused:</b> <code>${campaign.name}</code> halted due to low wallet balance. Please add funds to resume.`);
        }
        continue;
      }

      let groups;
      if (campaign.autoPlacement) {
        groups = await Group.find({
          status: 'approved',
          isFlagged: false,
          memberCount: { $gte: minMembers },
          $or: [{ niche: campaign.niche }, { category: { $in: campaign.targetCategories } }]
        }).sort({ performanceScore: -1 }).limit(10);
        
        console.log(`🔍 Auto: Niche "${campaign.niche}" / Cats [${campaign.targetCategories}]. Match: ${groups.length}`);

        if (groups.length === 0) {
          groups = await Group.find({
            status: 'approved',
            isFlagged: false,
            memberCount: { $gte: minMembers }
          }).sort({ performanceScore: -1 }).limit(5);
          
          if (groups.length === 0) {
            const total = await Group.countDocuments();
            const approved = await Group.countDocuments({ status: 'approved' });
            const tooSmall = await Group.countDocuments({ status: 'approved', memberCount: { $lt: minMembers } });
            console.log(`❌ BLOCKER: 0 approved groups eligible for niche "${niche}".`);
            console.log(`📊 Stats: Total Groups: ${total} | Approved: ${approved} | Approved but too small (<${minMembers}): ${tooSmall}`);
            console.log(`💡 TIP: Check "min_group_members" setting or approve more groups in Dashboard.`);
          } else {
            console.log(`🔍 Fallback: Found ${groups.length} general approved groups.`);
          }
        }
      } else {
        const selectedIds = campaign.selectedGroups || [];
        groups = await Group.find({
          _id: { $in: selectedIds },
          status: 'approved',
          isFlagged: false,
        });
        console.log(`🔍 Manual: Checking ${selectedIds.length} selected groups. Approved & Ready: ${groups.length}`);
      }

      if (groups.length === 0) {
        // Log skip to console only
      }

      // 3. Fetch Frequency Setting
      const freqSetting = await GlobalSetting.findOne({ key: 'ad_frequency_limit_mins' });
      const globalFreqMins = freqSetting ? parseFloat(freqSetting.value) : 240; // Default 4h

      for (const group of groups) {
        // Frequency check
        const minsToWait = group.postFrequency ? group.postFrequency * 60 : globalFreqMins;
        if (group.lastAdPostedAt) {
          const diffMins = (Date.now() - group.lastAdPostedAt.getTime()) / 60000;
          if (diffMins < minsToWait) {
            console.log(`⏳ Skipping ${group.name}: Frequency cooldown (${diffMins.toFixed(1)}m / ${minsToWait}m)`);
            continue;
          }
        }

        // --- NEW: DUPLICATE AD CHECK ---
        const alreadyPosted = await AdPost.findOne({ 
          campaign: campaign._id, 
          group: group._id,
          status: { $in: ['sent', 'scheduled'] } 
        });
        if (alreadyPosted) {
          console.log(`🚫 Skipping ${group.name}: Ad already exists for this campaign.`);
          continue;
        }
        // ------------------------------

        // Min members check (secondary check during group iteration)
        if (group.memberCount < minMembers) {
          console.log(`⚠️ Skipping ${group.name}: Only ${group.memberCount} members (Min: ${minMembers})`);
          continue;
        }

        const advertiser = await User.findById(campaign.advertiser);
        const estimatedCost = calcCost(group.avgViews || group.memberCount * 0.15, campaign.cpm || group.dynamicCpm);
        
        if (!isFiller) {
          if (!advertiser || advertiser.advertiserWallet < estimatedCost) {
            console.log(`❌ Skipping ${group.name}: Advertiser has insufficient wallet balance (₹${advertiser?.advertiserWallet || 0})`);
            break; 
          }

          if (campaign.budgetSpent + estimatedCost > campaign.budget) {
            console.log(`💸 Skipping ${group.name}: Campaign budget remaining ₹${(campaign.budget - campaign.budgetSpent).toFixed(2)} is too low.`);
            break;
          }
        }

        try {
          await postAdToGroup(campaign, group);
        } catch (postErr) {
          console.error(`Post error for ${group.name}:`, postErr.message);
          // Don't throw, just log and continue to next campaign/group if possible?
          // Actually throw to let the outer loop handle it if it's a critical error (like bot token)
          throw postErr;
        }
        await sleep(500); 
      }
    }
    
    // 4. Update Last Run
    await GlobalSetting.findOneAndUpdate(
      { key: 'last_ad_run' },
      { value: now.toISOString(), description: 'Last time the ad queue was processed' },
      { upsert: true }
    );

    // Auto-trigger sync lifecycle hook
    await updateAdImpressions();
    
  } catch (err) {
    console.error('❌ Scheduler Core Exception:', err.message);
  }
}

module.exports = { initBot, postAdToGroup, processAdQueue, updateAdImpressions };
