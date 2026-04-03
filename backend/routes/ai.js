const express = require('express');
const Groq = require('groq-sdk');
const { authenticate } = require('../middleware/auth');
const Group = require('../models/Group');
const Campaign = require('../models/Campaign');
const AdPost = require('../models/AdPost');

const router = express.Router();

function getGroq() {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  return new Groq({ apiKey: key });
}

// ── POST /api/ai/suggest-groups ──
// Given a campaign, Groq AI suggests the best group lineup
router.post('/suggest-groups', authenticate, async (req, res) => {
  try {
    const groq = getGroq();
    if (!groq) {
      return res.status(503).json({ message: 'AI is not configured (set GROQ_API_KEY on the server).' });
    }
    const { campaignId } = req.body;
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    // Fetch eligible groups
    const groups = await Group.find({ status: 'approved', isFlagged: false, memberCount: { $gte: 1000 } })
      .select('name niche category memberCount avgViews performanceScore dynamicCpm description')
      .limit(50);

    if (groups.length === 0) {
      return res.json({ suggestions: [], message: 'No approved groups available.' });
    }

    const groupList = groups.map((g, i) =>
      `${i + 1}. ${g.name} | Niche: ${g.niche} | Members: ${g.memberCount} | ` +
      `Avg Views: ${g.avgViews} | Score: ${g.performanceScore}% | CPM: ₹${g.dynamicCpm}`
    ).join('\n');

    const prompt = `You are an expert media buyer for Telegram ad campaigns. 
    
Campaign Details:
- Name: ${campaign.name}
- Ad Copy: ${campaign.adText}
- Target Niche: ${campaign.niche}
- Target Categories: ${campaign.targetCategories?.join(', ') || 'any'}
- Budget: ₹${campaign.budget}
- CPM Target: ₹${campaign.cpm}

Available Telegram Groups:
${groupList}

Task: Select the TOP 5 best-matching groups for this campaign. 
Consider niche alignment, engagement rate (performance score), member count, and CPM efficiency.
Explain WHY each group is selected in 1 sentence.

Return ONLY a JSON array like:
[
  { "rank": 1, "groupName": "...", "reason": "...", "expectedViews": 0, "expectedCost": 0 },
  ...
]`;

    const completion = await groq.chat.completions.create({
      model: 'llama3-70b-8192',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 800,
    });

    const raw = completion.choices[0]?.message?.content || '[]';
    
    // Extract JSON from Groq response
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    // Enrich with actual group IDs
    const enriched = suggestions.map(s => {
      const match = groups.find(g => g.name.toLowerCase().includes(s.groupName?.toLowerCase()) || s.groupName?.toLowerCase().includes(g.name.toLowerCase()));
      return { ...s, groupId: match?._id, dynamicCpm: match?.dynamicCpm };
    });

    res.json({ suggestions: enriched, prompt_tokens: completion.usage?.prompt_tokens });
  } catch (err) {
    console.error('Groq AI error:', err.message);
    res.status(500).json({ message: 'AI service error: ' + err.message });
  }
});

// ── POST /api/ai/fraud-check ──
// Analyze a group for fake engagement patterns
router.post('/fraud-check', authenticate, async (req, res) => {
  try {
    const groq = getGroq();
    if (!groq) {
      return res.status(503).json({ message: 'AI is not configured (set GROQ_API_KEY on the server).' });
    }
    const { groupId } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const recentPosts = await AdPost.find({ group: groupId })
      .sort({ createdAt: -1 }).limit(10);

    const avgCTR = recentPosts.length > 0
      ? recentPosts.reduce((acc, p) => acc + (p.ctr || 0), 0) / recentPosts.length
      : 0;

    const prompt = `You are an anti-fraud specialist for Telegram ad networks.

Analyze this Telegram group for fake engagement:

Group Stats:
- Name: ${group.name}
- Members: ${group.memberCount}
- Avg Views: ${group.avgViews}
- View-to-Member Ratio: ${group.viewToMemberRatio?.toFixed(3) || 'unknown'}
- Performance Score: ${group.performanceScore}%
- Total Ads Posted: ${group.totalAdsPosted}
- Avg CTR on Ads: ${avgCTR.toFixed(2)}%

Rules for suspicion:
1. View-to-member ratio > 0.8 is unusually high (bot views)
2. View-to-member ratio < 0.02 is too low (inactive group)
3. CTR < 0.1% is suspiciously low
4. CTR > 15% is unusually high (click farms)

Respond ONLY with JSON:
{
  "fraudScore": 0-100,
  "riskLevel": "low|medium|high",
  "flags": ["..."],
  "recommendation": "approve|flag|suspend",
  "reasoning": "..."
}`;

    const completion = await groq.chat.completions.create({
      model: 'llama3-70b-8192',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 400,
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { fraudScore: 0, riskLevel: 'unknown' };

    // Auto-flag if Groq recommends it
    if (result.recommendation === 'flag' && !group.isFlagged) {
      await Group.findByIdAndUpdate(groupId, {
        isFlagged: true,
        flagReason: result.reasoning,
      });
    }

    res.json({ groupId, groupName: group.name, ...result });
  } catch (err) {
    res.status(500).json({ message: 'AI fraud check error: ' + err.message });
  }
});

// ── POST /api/ai/optimize-ad ──
// Groq rewrites ad copy for better CTR
router.post('/optimize-ad', authenticate, async (req, res) => {
  try {
    const groq = getGroq();
    if (!groq) {
      return res.status(503).json({ message: 'AI is not configured (set GROQ_API_KEY on the server).' });
    }
    const { adText, niche, targetAudience } = req.body;

    const prompt = `You are an expert Telegram ad copywriter. 
Rewrite this ad for a ${niche} audience to maximize CTR.

Original Ad:
"${adText}"

Target Audience: ${targetAudience || niche}

Rules:
- Keep it under 200 characters for main punch
- Use 1-2 relevant emojis
- Add a strong CTA
- Make it sound authentic, not spammy

Return ONLY the rewritten ad text, nothing else.`;

    const completion = await groq.chat.completions.create({
      model: 'llama3-70b-8192',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 300,
    });

    const optimized = completion.choices[0]?.message?.content?.trim() || adText;
    res.json({ original: adText, optimized });
  } catch (err) {
    res.status(500).json({ message: 'Ad optimization error: ' + err.message });
  }
});

// ── GET /api/ai/performance-insights/:campaignId ──
// AI analysis of campaign performance
router.get('/performance-insights/:campaignId', authenticate, async (req, res) => {
  try {
    const groq = getGroq();
    if (!groq) {
      return res.status(503).json({ message: 'AI is not configured (set GROQ_API_KEY on the server).' });
    }
    const campaign = await Campaign.findById(req.params.campaignId);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    const adPosts = await AdPost.find({ campaign: campaign._id })
      .populate('group', 'name performanceScore');

    const totalViews = adPosts.reduce((a, p) => a + (p.viewsAt24h || p.impressions || 0), 0);
    const totalClicks = adPosts.reduce((a, p) => a + (p.clicks || 0), 0);
    const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : 0;
    const actualCpm = totalViews > 0 ? ((campaign.budgetSpent / totalViews) * 1000).toFixed(2) : 0;

    const prompt = `You are a Telegram advertising strategist. Analyze this campaign and give 3 actionable insights.

Campaign: ${campaign.name}
- Budget: ₹${campaign.budget} | Spent: ₹${campaign.budgetSpent.toFixed(2)}
- Total Views: ${totalViews.toLocaleString()}
- Total Clicks: ${totalClicks}
- CTR: ${ctr}%
- Effective CPM: ₹${actualCpm}
- Ads Posted: ${adPosts.length}
- Status: ${campaign.status}

Return ONLY a JSON array of 3 insights:
[
  { "type": "success|warning|tip", "title": "...", "detail": "..." },
  { "type": "success|warning|tip", "title": "...", "detail": "..." },
  { "type": "success|warning|tip", "title": "...", "detail": "..." }
]`;

    const completion = await groq.chat.completions.create({
      model: 'llama3-70b-8192',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 500,
    });

    const raw = completion.choices[0]?.message?.content || '[]';
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    const insights = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    res.json({ insights, metrics: { totalViews, totalClicks, ctr, actualCpm } });
  } catch (err) {
    res.status(500).json({ message: 'Insights error: ' + err.message });
  }
});

module.exports = router;
