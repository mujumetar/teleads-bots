const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function fixUserRoles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teleads');
    console.log('Connected to MongoDB');

    // Find all users without roles or with incomplete roles
    const usersWithoutRoles = await User.find({
      $or: [
        { roles: { $exists: false } },
        { roles: null },
        { 'roles.advertiser': { $exists: false } }
      ]
    });

    console.log(`Found ${usersWithoutRoles.length} users without proper roles`);

    for (const user of usersWithoutRoles) {
      console.log(`Fixing user: ${user.email}`);
      
      // Set default roles
      await User.findByIdAndUpdate(user._id, {
        roles: {
          advertiser: true,
          publisher: false,
          isAdmin: false,
          isSuperAdmin: false
        },
        // Set advertiser wallet if not exists
        advertiserWallet: user.advertiserWallet || user.walletBalance || 0,
        publisherWallet: user.publisherWallet || 0
      });
      
      console.log(`  ✓ Fixed ${user.email}`);
    }

    console.log('\n✅ All users updated with proper roles');

    // Also show admin users
    const adminUsers = await User.find({ 
      $or: [
        { 'roles.isAdmin': true },
        { 'roles.isSuperAdmin': true }
      ]
    });
    
    console.log(`\nFound ${adminUsers.length} admin/superadmin users:`);
    adminUsers.forEach(u => {
      console.log(`  - ${u.email} (Admin: ${u.roles.isAdmin}, SuperAdmin: ${u.roles.isSuperAdmin})`);
    });

  } catch (error) {
    console.error('❌ Error fixing user roles:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

fixUserRoles();
