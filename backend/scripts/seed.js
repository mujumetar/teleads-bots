require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Category = require('../models/Category');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const email = 'superadmin@teleads.com';
    const password = 'superadmin123';

    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`ℹ️  Superadmin already exists: ${email}`);
    } else {
      const hashed = await bcrypt.hash(password, 10);
      await User.create({ email, password: hashed, role: 'superadmin', walletBalance: 0 });
      console.log(`✅ Superadmin created:`);
      console.log(`   Email:    ${email}`);
      console.log(`   Password: ${password}`);
    }

    // Optionally seed a demo admin
    const adminEmail = 'admin@teleads.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const hashed = await bcrypt.hash('admin123', 10);
      await User.create({ email: adminEmail, password: hashed, role: 'admin', walletBalance: 0 });
      console.log(`✅ Admin created:`);
      console.log(`   Email:    ${adminEmail}`);
      console.log(`   Password: admin123`);
    }

    // Seed default categories
    const defaultCategories = [
      { name: 'Technology', slug: 'technology' },
      { name: 'Finance & Crypto', slug: 'finance-crypto' },
      { name: 'Gaming', slug: 'gaming' },
      { name: 'Lifestyle', slug: 'lifestyle' },
      { name: 'News & Media', slug: 'news-media' },
      { name: 'Entertainment', slug: 'entertainment' },
      { name: 'Education', slug: 'education' },
      { name: 'Business', slug: 'business' },
    ];
    for (const cat of defaultCategories) {
      await Category.updateOne({ slug: cat.slug }, { $setOnInsert: cat }, { upsert: true });
    }
    console.log(`✅ ${defaultCategories.length} default categories seeded`);

    console.log('\n🎉 Seed complete. You can now log in to the dashboard.');
  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
