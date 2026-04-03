const mongoose = require('mongoose');

// Permission definitions for the system
const PERMISSIONS = {
  // User permissions
  CREATE_CAMPAIGN: 'CREATE_CAMPAIGN',
  VIEW_ANALYTICS: 'VIEW_ANALYTICS',
  ADD_GROUP: 'ADD_GROUP',
  
  // Admin permissions
  APPROVE_GROUP: 'APPROVE_GROUP',
  MANAGE_USERS: 'MANAGE_USERS',
  VIEW_ALL_DATA: 'VIEW_ALL_DATA',
  MANAGE_CAMPAIGNS: 'MANAGE_CAMPAIGNS',
  
  // Superadmin permissions
  CONTROL_PAYMENTS: 'CONTROL_PAYMENTS',
  SYSTEM_CONFIG: 'SYSTEM_CONFIG',
  VIEW_REVENUE: 'VIEW_REVENUE'
};

// Role to permissions mapping
const ROLE_PERMISSIONS = {
  advertiser: [
    PERMISSIONS.CREATE_CAMPAIGN,
    PERMISSIONS.VIEW_ANALYTICS
  ],
  publisher: [
    PERMISSIONS.ADD_GROUP,
    PERMISSIONS.VIEW_ANALYTICS
  ],
  admin: [
    PERMISSIONS.APPROVE_GROUP,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_ALL_DATA,
    PERMISSIONS.MANAGE_CAMPAIGNS
  ],
  superadmin: Object.values(PERMISSIONS)
};

// Helper function to get permissions for a user
const getUserPermissions = (user) => {
  const permissions = new Set();
  
  if (user.roles.advertiser) {
    ROLE_PERMISSIONS.advertiser.forEach(p => permissions.add(p));
  }
  
  if (user.roles.publisher) {
    ROLE_PERMISSIONS.publisher.forEach(p => permissions.add(p));
  }
  
  if (user.roles.isAdmin) {
    ROLE_PERMISSIONS.admin.forEach(p => permissions.add(p));
  }
  
  if (user.roles.isSuperAdmin) {
    ROLE_PERMISSIONS.superadmin.forEach(p => permissions.add(p));
  }
  
  // Add any custom permissions
  user.permissions.forEach(p => permissions.add(p));
  
  return Array.from(permissions);
};

// Middleware to check permissions
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const userPermissions = getUserPermissions(req.user);
    
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        required: permission,
        userPermissions
      });
    }
    
    next();
  };
};

// Middleware to check role
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!req.user.roles[role]) {
      return res.status(403).json({ 
        message: `${role} role required`,
        userRoles: req.user.roles
      });
    }
    
    next();
  };
};

module.exports = {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  getUserPermissions,
  requirePermission,
  requireRole
};
