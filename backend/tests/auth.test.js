const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

describe('Authentication Endpoints', () => {
  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/teleads-test';
    await mongoose.connect(mongoUri);
  });

  beforeEach(async () => {
    // Clean up database before each test
    await User.deleteMany({});
  });

  afterAll(async () => {
    // Close database connection
    await mongoose.connection.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', userData.email);
      expect(response.body.user).toHaveProperty('firstName', userData.firstName);
      expect(response.body.user).toHaveProperty('lastName', userData.lastName);
      expect(response.body.user.roles).toHaveProperty('advertiser', true);
      expect(response.body.user.roles).toHaveProperty('publisher', false);
    });

    it('should not register user with existing email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      // Create first user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to create second user with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body).toHaveProperty('message', 'Email already registered');
    });

    it('should not register user with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com'
          // Missing password
        })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Email and password required');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);
    });

    it('should login user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', loginData.email);
    });

    it('should not login user with invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should not login non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    let token;
    let userId;

    beforeEach(async () => {
      // Create and login a test user
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      token = registerResponse.body.token;
      userId = registerResponse.body.user.id;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('email', 'test@example.com');
      expect(response.body).toHaveProperty('firstName', 'Test');
      expect(response.body).toHaveProperty('lastName', 'User');
      expect(response.body).toHaveProperty('roles');
      expect(response.body).toHaveProperty('permissions');
    });

    it('should not get profile without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('message', 'No token provided');
    });

    it('should not get profile with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Invalid token');
    });
  });

  describe('PUT /api/auth/profile', () => {
    let token;

    beforeEach(async () => {
      // Create and login a test user
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      token = registerResponse.body.token;
    });

    it('should update user profile successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        phone: '+1234567890'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Profile updated successfully');
      expect(response.body.user).toHaveProperty('firstName', updateData.firstName);
      expect(response.body.user).toHaveProperty('lastName', updateData.lastName);
      expect(response.body.user).toHaveProperty('phone', updateData.phone);
    });

    it('should not update profile without token', async () => {
      const updateData = {
        firstName: 'Updated'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .send(updateData)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'No token provided');
    });
  });

  describe('POST /api/auth/enable-publisher', () => {
    let token;

    beforeEach(async () => {
      // Create and login a test user
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      token = registerResponse.body.token;
    });

    it('should enable publisher role successfully', async () => {
      const response = await request(app)
        .post('/api/auth/enable-publisher')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Publisher role enabled successfully');
      expect(response.body.roles).toHaveProperty('publisher', true);
    });

    it('should not enable publisher role twice', async () => {
      // Enable publisher role first time
      await request(app)
        .post('/api/auth/enable-publisher')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Try to enable again
      const response = await request(app)
        .post('/api/auth/enable-publisher')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Publisher role already enabled');
    });
  });
});
