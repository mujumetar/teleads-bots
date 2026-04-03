const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Group = require('../models/Group');

describe('Campaigns Endpoints', () => {
  let advertiserToken;
  let adminToken;
  let advertiserId;
  let groupId;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/teleads-test';
    await mongoose.connect(mongoUri);
  });

  beforeEach(async () => {
    // Clean up database before each test
    await User.deleteMany({});
    await Campaign.deleteMany({});
    await Group.deleteMany({});

    // Create test advertiser
    const advertiserData = {
      email: 'advertiser@test.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'Advertiser'
    };

    const advertiserResponse = await request(app)
      .post('/api/auth/register')
      .send(advertiserData);

    advertiserToken = advertiserResponse.body.token;
    advertiserId = advertiserResponse.body.user.id;

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

    // Make user admin (bypass normal flow for testing)
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

    // Create test group
    const groupData = {
      name: 'Test Group',
      telegramGroupId: '123456789',
      telegramGroupUsername: 'testgroup',
      memberCount: 5000,
      category: 'general',
      niche: 'general',
      owner: advertiserId,
      status: 'approved'
    };

    const group = await Group.create(groupData);
    groupId = group._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/campaigns', () => {
    it('should create a new campaign successfully', async () => {
      const campaignData = {
        name: 'Test Campaign',
        adText: 'This is a test ad',
        adImageUrl: 'https://example.com/ad.jpg',
        targetUrl: 'https://example.com',
        niche: 'general',
        targetCategories: ['general'],
        budgetType: 'total_budget',
        budget: 5000,
        cpm: 100,
        autoPlacement: true
      };

      const response = await request(app)
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${advertiserToken}`)
        .send(campaignData)
        .expect(201);

      expect(response.body).toHaveProperty('name', campaignData.name);
      expect(response.body).toHaveProperty('adText', campaignData.adText);
      expect(response.body).toHaveProperty('budget', campaignData.budget);
      expect(response.body).toHaveProperty('status', 'pending');
      expect(response.body.advertiser).toBe(advertiserId);
    });

    it('should not create campaign without authentication', async () => {
      const campaignData = {
        name: 'Test Campaign',
        adText: 'This is a test ad',
        budget: 5000
      };

      const response = await request(app)
        .post('/api/campaigns')
        .send(campaignData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should not create campaign with missing required fields', async () => {
      const campaignData = {
        name: 'Test Campaign'
        // Missing other required fields
      };

      const response = await request(app)
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${advertiserToken}`)
        .send(campaignData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/campaigns', () => {
    beforeEach(async () => {
      // Create test campaigns
      const campaign1 = {
        name: 'Campaign 1',
        adText: 'Test ad 1',
        budget: 1000,
        advertiser: advertiserId,
        status: 'active'
      };

      const campaign2 = {
        name: 'Campaign 2',
        adText: 'Test ad 2',
        budget: 2000,
        advertiser: advertiserId,
        status: 'pending'
      };

      await Campaign.create(campaign1);
      await Campaign.create(campaign2);
    });

    it('should get user campaigns successfully', async () => {
      const response = await request(app)
        .get('/api/campaigns')
        .set('Authorization', `Bearer ${advertiserToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('campaigns');
      expect(Array.isArray(response.body.campaigns)).toBe(true);
      expect(response.body.campaigns.length).toBe(2);
      expect(response.body).toHaveProperty('pagination');
    });

    it('should not get campaigns without authentication', async () => {
      const response = await request(app)
        .get('/api/campaigns')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/campaigns/:id', () => {
    let campaignId;

    beforeEach(async () => {
      const campaign = await Campaign.create({
        name: 'Test Campaign',
        adText: 'Test ad',
        budget: 1000,
        advertiser: advertiserId,
        status: 'active'
      });

      campaignId = campaign._id;
    });

    it('should get campaign details successfully', async () => {
      const response = await request(app)
        .get(`/api/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${advertiserToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Test Campaign');
      expect(response.body).toHaveProperty('adText', 'Test ad');
      expect(response.body).toHaveProperty('budget', 1000);
    });

    it('should not get campaign with invalid ID', async () => {
      const response = await request(app)
        .get('/api/campaigns/invalidid')
        .set('Authorization', `Bearer ${advertiserToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should not get campaign without authentication', async () => {
      const response = await request(app)
        .get(`/api/campaigns/${campaignId}`)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PUT /api/campaigns/:id', () => {
    let campaignId;

    beforeEach(async () => {
      const campaign = await Campaign.create({
        name: 'Test Campaign',
        adText: 'Test ad',
        budget: 1000,
        advertiser: advertiserId,
        status: 'draft'
      });

      campaignId = campaign._id;
    });

    it('should update campaign successfully', async () => {
      const updateData = {
        name: 'Updated Campaign',
        adText: 'Updated ad text',
        budget: 2000
      };

      const response = await request(app)
        .put(`/api/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${advertiserToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('name', updateData.name);
      expect(response.body).toHaveProperty('adText', updateData.adText);
      expect(response.body).toHaveProperty('budget', updateData.budget);
    });

    it('should not update campaign without authentication', async () => {
      const updateData = {
        name: 'Updated Campaign'
      };

      const response = await request(app)
        .put(`/api/campaigns/${campaignId}`)
        .send(updateData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('DELETE /api/campaigns/:id', () => {
    let campaignId;

    beforeEach(async () => {
      const campaign = await Campaign.create({
        name: 'Test Campaign',
        adText: 'Test ad',
        budget: 1000,
        advertiser: advertiserId,
        status: 'draft'
      });

      campaignId = campaign._id;
    });

    it('should delete campaign successfully', async () => {
      const response = await request(app)
        .delete(`/api/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${advertiserToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Campaign deleted successfully');

      // Verify campaign is deleted
      const deletedCampaign = await Campaign.findById(campaignId);
      expect(deletedCampaign).toBeNull();
    });

    it('should not delete campaign without authentication', async () => {
      const response = await request(app)
        .delete(`/api/campaigns/${campaignId}`)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Admin Campaign Management', () => {
    let campaignId;

    beforeEach(async () => {
      const campaign = await Campaign.create({
        name: 'Test Campaign',
        adText: 'Test ad',
        budget: 1000,
        advertiser: advertiserId,
        status: 'pending'
      });

      campaignId = campaign._id;
    });

    it('should approve campaign as admin', async () => {
      const response = await request(app)
        .put(`/api/campaigns/${campaignId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'active' })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Campaign status updated successfully');
      expect(response.body.campaign).toHaveProperty('status', 'active');
    });

    it('should reject campaign as admin', async () => {
      const response = await request(app)
        .put(`/api/campaigns/${campaignId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'rejected', rejectionReason: 'Inappropriate content' })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Campaign status updated successfully');
      expect(response.body.campaign).toHaveProperty('status', 'rejected');
      expect(response.body.campaign).toHaveProperty('rejectionReason', 'Inappropriate content');
    });

    it('should not update campaign status as regular user', async () => {
      const response = await request(app)
        .put(`/api/campaigns/${campaignId}/status`)
        .set('Authorization', `Bearer ${advertiserToken}`)
        .send({ status: 'active' })
        .expect(403);

      expect(response.body).toHaveProperty('message');
    });
  });
});
