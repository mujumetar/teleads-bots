const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getUserPermissions } = require('../models/Permission');

// Authentication middleware
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token - user not found' });
    }

    if (!user.isActive || user.isBanned) {
      return res.status(401).json({ 
        message: 'Account is not active',
        reason: user.isBanned ? user.banReason : 'Account deactivated'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Attach user and permissions to request
    req.user = user;
    req.userPermissions = getUserPermissions(user);
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    req.userPermissions = [];
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (user && user.isActive && !user.isBanned) {
      req.user = user;
      req.userPermissions = getUserPermissions(user);
    } else {
      req.user = null;
      req.userPermissions = [];
    }
  } catch (error) {
    req.user = null;
    req.userPermissions = [];
  }

  next();
};

// Role-based middleware - supports single role or array of roles
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Map role names to actual database field names
    const roleMap = {
      'admin': 'isAdmin',
      'superadmin': 'isSuperAdmin',
      'advertiser': 'advertiser',
      'publisher': 'publisher'
    };
    
    // Check if user has any of the required roles
    const hasRole = roles.some(role => {
      const actualRole = roleMap[role] || role;
      return req.user.roles[actualRole] === true;
    });
    
    if (!hasRole) {
      return res.status(403).json({ 
        message: `${roles.join(' or ')} role required`,
        userRoles: req.user.roles
      });
    }
    
    next();
  };
};

// Permission-based middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!req.userPermissions.includes(permission)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        required: permission,
        userPermissions: req.userPermissions
      });
    }
    
    next();
  };
};

// Superadmin only middleware
const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (!req.user.roles.isSuperAdmin) {
    return res.status(403).json({ 
      message: 'Superadmin access required',
      userRoles: req.user.roles
    });
  }
  
  next();
};

// Admin or Superadmin middleware
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (!req.user.roles.isAdmin && !req.user.roles.isSuperAdmin) {
    return res.status(403).json({ 
      message: 'Admin access required',
      userRoles: req.user.roles
    });
  }
  
  next();
};

// Legacy support for old role system
const requireRoleLegacy = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // Map old roles to new roles
  const hasRole = roles.some(role => {
    switch(role) {
      case 'user': return req.user.roles.advertiser || req.user.roles.publisher;
      case 'admin': return req.user.roles.isAdmin;
      case 'superadmin': return req.user.roles.isSuperAdmin;
      default: return req.user.roles[role];
    }
  });
  
  if (!hasRole) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

module.exports = { 
  authenticate, 
  optionalAuth,
  requireRole, 
  requirePermission,
  requireSuperAdmin,
  requireAdmin,
  requireRoleLegacy 
};
