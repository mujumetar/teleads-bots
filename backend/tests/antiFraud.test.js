const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Group = require('../models/Group');
const Campaign = require('../models/Campaign');
const AntiFraudService = require('../services/antiFraud');

describe('Anti-Fraud System', () => {
  let adminToken;
  let userId;
  let groupId;
  let campaignId;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/teleads-test';
    await mongoose.connect(mongoUri);
  });

  beforeEach(async () => {
    // Clean up database before each test
    await User.deleteMany({});
    await Group.deleteMany({});
    await Campaign.deleteMany({});

    // Create test admin
    const adminData = {
      email: 'admin@test.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'Admin'
    };

    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send(adminData);

    // Make user admin
    await User.findByIdAndUpdate(adminResponse.body.user.id, {
      roles: { isAdmin: true }
    });

    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123'
      });

    adminToken = adminLoginResponse.body.token;
    userId = adminLoginResponse.body.user.id;

    // Create test group
    const groupData = {
      name: 'Test Group',
      telegramGroupId: '123456789',
      telegramGroupUsername: 'testgroup',
      memberCount: 5000,
      category: 'general',
      niche: 'general',
      owner: userId,
      status: 'approved',
      avgViews: 2500,
      performanceScore: 50
    };

    const group = await Group.create(groupData);
    groupId = group._id;

    // Create test campaign
    const campaignData = {
      name: 'Test Campaign',
      adText: 'This is a test ad',
      budget: 1000,
      advertiser: userId,
      status: 'active',
      cpm: 100
    };

    const campaign = await Campaign.create(campaignData);
    campaignId = campaign._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('AntiFraudService', () => {
    describe('checkGroupFraud', () => {
      it('should detect normal group as non-fraudulent', async () => {
        const result = await AntiFraudService.checkGroupFraud(groupId);

        expect(result.isFraud).toBe(false);
        expect(result.fraudScore).toBeLessThan(30);
        expect(result.reasons).toBeInstanceOf(Array);
      });

      it('should detect group with impossible metrics as fraudulent', async () => {
        // Create group with suspicious metrics
        const suspiciousGroup = await Group.create({
          name: 'Suspicious Group',
          telegramGroupId: '987654321',
          memberCount: 1000,
          avgViews: 1500, // More views than members
          performanceScore: 80,
          owner: userId,
          status: 'approved'
        });

        const result = await AntiFraudService.checkGroupFraud(suspiciousGroup._id);

        expect(result.isFraud).toBe(true);
        expect(result.fraudScore).toBeGreaterThan(30);
        expect(result.reasons).toContain('Views exceed member count - impossible metrics');
      });

      it('should detect group with extremely low engagement', async () => {
        // Create group with very low engagement
        const lowEngagementGroup = await Group.create({
          name: 'Low Engagement Group',
          telegramGroupId: '555666777',
          memberCount: 10000,
          avgViews: 50, // Very low view-to-member ratio
          performanceScore: 0.5,
          owner: userId,
          status: 'approved'
        });

        const result = await AntiFraudService.checkGroupFraud(lowEngagementGroup._id);

        expect(result.isFraud).toBe(true);
        expect(result.reasons).toContain('Extremely low engagement rate');
      });
    });

    describe('checkCampaignFraud', () => {
      it('should detect normal campaign as non-fraudulent', async () => {
        const result = await AntiFraudService.checkCampaignFraud(campaignId);

        expect(result.isFraud).toBe(false);
        expect(result.fraudScore).toBeLessThan(30);
        expect(result.reasons).toBeInstanceOf(Array);
      });

      it('should detect campaign with suspicious keywords as fraudulent', async () => {
        // Create campaign with suspicious keywords
        const suspiciousCampaign = await Campaign.create({
          name: 'Suspicious Campaign',
          adText: 'Get rich quick with bitcoin investment guaranteed free money',
          budget: 1000,
          advertiser: userId,
          status: 'active',
          cpm: 100
        });

        const result = await AntiFraudService.checkCampaignFraud(suspiciousCampaign._id);

        expect(result.isFraud).toBe(true);
        expect(result.fraudScore).toBeGreaterThan(30);
        expect(result.reasons.some(reason => reason.includes('Suspicious keywords'))).toBe(true);
      });

      it('should detect campaign with unusually high budget', async () => {
        // Create campaign with very high budget
        const highBudgetCampaign = await Campaign.create({
          name: 'High Budget Campaign',
          adText: 'Normal ad text',
          budget: 200000, // Unusually high
          advertiser: userId,
          status: 'active',
          cpm: 100
        });

        const result = await AntiFraudService.checkCampaignFraud(highBudgetCampaign._id);

        expect(result.isFraud).toBe(true);
        expect(result.reasons).toContain('Unusually high campaign budget');
      });
    });

    describe('detectImpressionFraud', () => {
      it('should detect normal view increase as non-fraudulent', async () => {
        const AdPost = require('../models/AdPost');
        const ImpressionsLog = require('../models/ImpressionsLog');

        // Create test ad post
        const adPost = await AdPost.create({
          campaign: campaignId,
          group: groupId,
          status: 'sent',
          viewsAt24h: 100
        });

        const result = await AntiFraudService.detectImpressionFraud(adPost._id, 150);

        expect(result.isFraud).toBe(false);
        expect(result.action).toBe('allow');
      });

      it('should detect suspicious view velocity as fraudulent', async () => {
        const AdPost = require('../models/AdPost');
        const ImpressionsLog = require('../models/ImpressionsLog');

        // Create test ad post
        const adPost = await AdPost.create({
          campaign: campaignId,
          group: groupId,
          status: 'sent',
          viewsAt24h: 100
        });

        // Simulate very high view increase (more than half of group members in 1 hour)
        const result = await AntiFraudService.detectImpressionFraud(adPost._id, 3000);

        expect(result.isFraud).toBe(true);
        expect(result.action).toBe('review' || 'block');
        expect(result.reasons).toContain('View velocity exceeds half of group members in 1 hour');
      });
    });
  });

  describe('Anti-Fraud API Endpoints', () => {
    describe('POST /api/anti-fraud/check/group', () => {
      it('should check group for fraud successfully', async () => {
        const response = await request(app)
          .post('/api/anti-fraud/check/group')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ groupId })
          .expect(200);

        expect(response.body).toHaveProperty('groupId', groupId.toString());
        expect(response.body).toHaveProperty('isFraud');
        expect(response.body).toHaveProperty('fraudScore');
        expect(response.body).toHaveProperty('reasons');
        expect(response.body).toHaveProperty('recommendations');
      });

      it('should not check group without admin permissions', async () => {
        // Create regular user token
        const userResponse = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'user@test.com',
            password: 'password123',
            firstName: 'Test',
            lastName: 'User'
          });

        const userToken = userResponse.body.token;

        const response = await request(app)
          .post('/api/anti-fraud/check/group')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ groupId })
          .expect(403);

        expect(response.body).toHaveProperty('message');
      });

      it('should return error for missing group ID', async () => {
        const response = await request(app)
          .post('/api/anti-fraud/check/group')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({})
          .expect(400);

        expect(response.body).toHaveProperty('message', 'Group ID is required');
      });
    });

    describe('POST /api/anti-fraud/check/campaign', () => {
      it('should check campaign for fraud successfully', async () => {
        const response = await request(app)
          .post('/api/anti-fraud/check/campaign')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ campaignId })
          .expect(200);

        expect(response.body).toHaveProperty('campaignId', campaignId.toString());
        expect(response.body).toHaveProperty('isFraud');
        expect(response.body).toHaveProperty('fraudScore');
        expect(response.body).toHaveProperty('reasons');
      });

      it('should return error for missing campaign ID', async () => {
        const response = await request(app)
          .post('/api/anti-fraud/check/campaign')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({})
          .expect(400);

        expect(response.body).toHaveProperty('message', 'Campaign ID is required');
      });
    });

    describe('GET /api/anti-fraud/dashboard', () => {
      it('should get fraud dashboard data successfully', async () => {
        const response = await request(app)
          .get('/api/anti-fraud/dashboard')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('overview');
        expect(response.body.overview).toHaveProperty('totalGroups');
        expect(response.body.overview).toHaveProperty('flaggedGroups');
        expect(response.body.overview).toHaveProperty('totalCampaigns');
        expect(response.body.overview).toHaveProperty('rejectedCampaigns');
        expect(response.body.overview).toHaveProperty('totalUsers');
        expect(response.body.overview).toHaveProperty('bannedUsers');
        expect(response.body).toHaveProperty('recentActivity');
        expect(response.body).toHaveProperty('alerts');
      });

      it('should not get dashboard without admin permissions', async () => {
        // Create regular user token
        const userResponse = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'user@test.com',
            password: 'password123',
            firstName: 'Test',
            lastName: 'User'
          });

        const userToken = userResponse.body.token;

        const response = await request(app)
          .get('/api/anti-fraud/dashboard')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403);

        expect(response.body).toHaveProperty('message');
      });
    });

    describe('GET /api/anti-fraud/flagged', () => {
      beforeEach(async () => {
        // Create some flagged entities
        await Group.findByIdAndUpdate(groupId, { isFlagged: true, flagReason: 'Test flag' });
        await Campaign.findByIdAndUpdate(campaignId, { status: 'rejected', rejectionReason: 'Test rejection' });
      });

      it('should get flagged groups successfully', async () => {
        const response = await request(app)
          .get('/api/anti-fraud/flagged?type=groups')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('type', 'groups');
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('count');
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should get all flagged entities', async () => {
        const response = await request(app)
          .get('/api/anti-fraud/flagged')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('type', 'all');
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('groups');
        expect(response.body.data).toHaveProperty('campaigns');
        expect(response.body.data).toHaveProperty('users');
      });
    });

    describe('POST /api/anti-fraud/execute', () => {
      it('should execute fraud action successfully', async () => {
        const response = await request(app)
          .post('/api/anti-fraud/execute')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            entityType: 'group',
            entityId: groupId,
            action: 'flag',
            reason: 'Test fraud action'
          })
          .expect(200);

        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('entityType', 'group');
        expect(response.body).toHaveProperty('entityId');
        expect(response.body).toHaveProperty('action', 'flag');
        expect(response.body).toHaveProperty('reason');
      });

      it('should return error for missing parameters', async () => {
        const response = await request(app)
          .post('/api/anti-fraud/execute')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            entityType: 'group'
            // Missing entityId and action
          })
          .expect(400);

        expect(response.body).toHaveProperty('message', 'Entity type, entity ID, and action are required');
      });
    });
  });
});
