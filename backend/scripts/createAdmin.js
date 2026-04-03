const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teleads');
    console.log('Connected to MongoDB');

    // Create or update admin user
    const adminEmail = 'muzammilmetar82@gmail.com';
    const adminPassword = 'Muju_3388';

    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      // Update existing user to be admin
      await User.findByIdAndUpdate(existingAdmin._id, {
        roles: {
          advertiser: true,
          publisher: true,
          isAdmin: true,
          isSuperAdmin: true
        },
        permissions: [
          'CREATE_CAMPAIGN',
          'VIEW_ANALYTICS',
          'ADD_GROUP',
          'APPROVE_GROUP',
          'MANAGE_USERS',
          'CONTROL_PAYMENTS',
          'SYSTEM_CONFIG',
          'VIEW_ALL_DATA',
          'MANAGE_CAMPAIGNS',
          'VIEW_REVENUE'
        ]
      });
      console.log('✅ Updated existing user to admin/superadmin');
    } else {
      // Create new admin user
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      const admin = new User({
        email: adminEmail,
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        roles: {
          advertiser: true,
          publisher: true,
          isAdmin: true,
          isSuperAdmin: true
        },
        permissions: [
          'CREATE_CAMPAIGN',
          'VIEW_ANALYTICS',
          'ADD_GROUP',
          'APPROVE_GROUP',
          'MANAGE_USERS',
          'CONTROL_PAYMENTS',
          'SYSTEM_CONFIG',
          'VIEW_ALL_DATA',
          'MANAGE_CAMPAIGNS',
          'VIEW_REVENUE'
        ],
        isActive: true
      });

      await admin.save();
      console.log('✅ Created admin user');
    }

    console.log('\n📋 Admin Credentials:');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('\n🔐 Use these credentials to login as admin/superadmin');

  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

createAdmin();
