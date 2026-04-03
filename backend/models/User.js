const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // Multi-role system - user can have multiple feature roles
  roles: {
    advertiser: { type: Boolean, default: false },
    publisher: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    isSuperAdmin: { type: Boolean, default: false }
  },
  
  // Permissions array for fine-grained access control
  permissions: [{
    type: String,
    enum: [
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
  }],
  
  // Wallets - separate for advertiser and publisher
  advertiserWallet: { type: Number, default: 0 }, // For funding campaigns
  publisherWallet: { type: Number, default: 0 },  // For earnings
  totalSpent: { type: Number, default: 0 },      // Total spent on ads
  totalEarned: { type: Number, default: 0 },     // Total earned from groups
  
  telegramId: { type: String }, // Linked telegram account
  telegramUsername: { type: String },
  
  // Profile
  firstName: { type: String },
  lastName: { type: String },
  phone: { type: String },
  
  // Status
  isActive: { type: Boolean, default: true },
  isBanned: { type: Boolean, default: false },
  banReason: { type: String },
  
  // Refer & Earn
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referralCode: { type: String, unique: true },
  referralEarnings: { type: Number, default: 0 },
  
  // Last activity
  lastLogin: { type: Date },
  currentMode: { type: String, enum: ['advertiser', 'publisher'], default: 'advertiser' }
}, { timestamps: true });

// Generate referral code before saving new user
UserSchema.pre('save', async function() {
  if (this.isNew && !this.referralCode) {
    this.referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
});

module.exports = mongoose.model('User', UserSchema);
