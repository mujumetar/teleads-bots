# TeleAds - Telegram CPM Ad Network

A production-grade Telegram advertising platform that connects advertisers with Telegram group/channel owners through a CPM-based model.

## 🚀 Features

### 👥 Multi-Role System
- **Advertiser**: Create and manage ad campaigns
- **Publisher**: Monetize Telegram groups/channels
- **Admin**: Operational control and content moderation
- **Superadmin**: Complete system control and revenue management

### 💰 Revenue Model
- **CPM-Based**: Cost per 1000 impressions
- **Publisher Share**: 65% to publishers, 35% platform margin
- **Dynamic Pricing**: Smart CPM adjustment based on group performance
- **Minimums**: ₹1000 minimum deposit, ₹1000 minimum withdrawal

### 🤖 Telegram Integration
- **Bot Commands**: `/register`, `/status`, `/earnings`, `/help`
- **Auto Posting**: Intelligent ad placement system
- **View Tracking**: Real-time impression monitoring
- **Group Verification**: Anti-fraud member validation

### 🛡️ Anti-Fraud System
- **View Validation**: Detects impossible view-to-member ratios
- **Engagement Analysis**: Identifies bot-like activity patterns
- **Performance Scoring**: Dynamic group quality assessment
- **Automated Actions**: Real-time fraud detection and response

### 📊 Analytics Dashboard
- **Real-time Metrics**: Live campaign and group performance
- **Revenue Analytics**: Complete financial overview
- **User Insights**: Advertiser and publisher behavior analysis
- **Export Capabilities**: CSV/JSON data export

### 💳 Payment System
- **Razorpay Integration**: Secure payment processing
- **Dual Wallets**: Separate advertiser and publisher balances
- **Withdrawal Management**: Admin approval workflow
- **Transaction History**: Complete audit trail

## 🏗️ Architecture

### Backend (Node.js + Express)
```
├── models/           # MongoDB schemas
├── routes/           # API endpoints
├── middleware/       # Authentication & authorization
├── services/         # Business logic (analytics, anti-fraud)
├── bot/            # Telegram bot integration
└── tests/          # Comprehensive test suite
```

### Frontend (React + Vite)
```
├── src/
│   ├── components/   # Reusable UI components
│   ├── pages/       # Route-based page components
│   ├── context/     # React context (auth, state)
│   └── api/        # API client
```

### Database (MongoDB)
- **Users**: Multi-role user management
- **Campaigns**: Ad campaign data
- **Groups**: Telegram group/channel information
- **Transactions**: Financial records
- **Analytics**: Performance metrics
- **SystemConfig**: Platform configuration

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- MongoDB 5.0+
- Telegram Bot Token
- Razorpay API Keys

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd teleads-bots
```

2. **Install dependencies**
```bash
npm run install-all
```

3. **Environment Setup**
```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your credentials

# Frontend
cd ../frontend
cp .env.example .env
# Edit .env with your API URLs
```

4. **Start Development Servers**
```bash
# Backend (Port 5000)
cd backend
npm run dev

# Frontend (Port 5173)
cd ../frontend
npm run dev
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
MONGODB_URI=mongodb://localhost:27017/teleads

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Telegram Bot
BOT_TOKEN=your-telegram-bot-token

# Razorpay
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Application
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=your-razorpay-key-id
```

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Campaigns
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/:id` - Get campaign details
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign

### Groups
- `GET /api/groups` - List groups
- `POST /api/groups` - Create group
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group

### Wallet
- `GET /api/wallet/balance` - Get wallet balances
- `GET /api/wallet/transactions` - Get transaction history
- `POST /api/wallet/withdraw` - Request withdrawal

### Analytics
- `GET /api/analytics/user` - User analytics
- `GET /api/analytics/platform` - Platform analytics (admin)
- `GET /api/analytics/realtime` - Real-time metrics

### Anti-Fraud
- `POST /api/anti-fraud/check/group` - Check group fraud
- `GET /api/anti-fraud/dashboard` - Fraud dashboard
- `POST /api/anti-fraud/execute` - Execute fraud action

## 🧪 Testing

### Run Tests
```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Coverage
- Authentication flows
- Campaign management
- Group operations
- Anti-fraud detection
- API permissions
- Wallet transactions

## 🤖 Telegram Bot Commands

### Available Commands
- `/start` - Welcome message and help
- `/register` - Register group for ads (run in group)
- `/status` - Check group performance and earnings
- `/earnings` - View revenue and wallet balance
- `/help` - Show all commands

### Group Registration
1. Add bot to your Telegram group/channel
2. Make bot an administrator
3. Run `/register` in the group
4. Complete registration on dashboard

## 📊 Analytics & Monitoring

### Key Metrics
- **Platform Revenue**: Total earnings across all campaigns
- **Active Campaigns**: Currently running advertisements
- **Group Performance**: Engagement rates and quality scores
- **User Activity**: Registration and engagement trends
- **Fraud Detection**: Suspicious activity alerts

### Real-time Monitoring
- Live impression tracking
- Campaign budget monitoring
- Group performance scoring
- Automated fraud alerts

## 🔒 Security Features

### Anti-Fraud Measures
- **View Validation**: Detects impossible view counts
- **Engagement Analysis**: Identifies suspicious patterns
- **IP Tracking**: Monitors for duplicate accounts
- **Behavioral Analysis**: Detects bot-like activity

### Access Control
- **Role-Based Permissions**: Granular access control
- **JWT Authentication**: Secure token-based auth
- **API Rate Limiting**: Prevents abuse
- **Input Validation**: Comprehensive input sanitization

## 🚀 Deployment

### Production Deployment

#### Backend (Vercel)
```bash
cd backend
npm install
vercel --prod
```

#### Frontend (Vercel)
```bash
cd frontend
npm install
npm run build
vercel --prod
```

### Environment Setup
- Configure MongoDB Atlas for production
- Set up Razorpay production keys
- Configure Telegram bot webhook
- Set up monitoring and logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Development Guidelines
- Follow existing code style
- Write comprehensive tests
- Update documentation
- Use meaningful commit messages

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the FAQ section

## 🗺️ Roadmap

### Upcoming Features
- [ ] Advanced AI-powered ad targeting
- [ ] Mobile app for publishers
- [ ] Advanced analytics with ML insights
- [ ] Multi-language support
- [ ] White-label solution for resellers

### Performance Improvements
- [ ] Redis caching for better performance
- [ ] CDN integration for faster load times
- [ ] Database optimization
- [ ] API response optimization

---

**Built with ❤️ for the Telegram advertising ecosystem**
