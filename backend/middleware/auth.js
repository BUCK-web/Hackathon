const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticate = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies (if using cookie-based auth)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token is valid but user not found'
        });
      }
      
      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account has been deactivated'
        });
      }
      
      // Add user to request object
      req.user = user;
      next();
      
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

// Middleware to check if user has required role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please authenticate first.'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
      });
    }
    
    next();
  };
};

// Middleware to check if user is a seller
const requireSeller = authorize('seller');

// Middleware to check if user is a buyer
const requireBuyer = authorize('buyer');

// Middleware to check if user is either seller or buyer (authenticated user)
const requireAuth = authenticate;

// Middleware to check if user owns the resource (for sellers)
const checkOwnership = (Model, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      
      // Find the resource
      const resource = await Model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }
      
      // Check if user owns the resource
      if (resource.seller && resource.seller.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own resources.'
        });
      }
      
      // For user resources, check if it's the same user
      if (resource._id && resource._id.toString() !== req.user._id.toString() && !resource.seller) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own profile.'
        });
      }
      
      // Add resource to request for use in route handler
      req.resource = resource;
      next();
      
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during ownership verification'
      });
    }
  };
};

// Middleware for optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    // If no token, continue without authentication
    if (!token) {
      return next();
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
      
    } catch (tokenError) {
      // Invalid token, but continue without authentication
      console.log('Invalid token in optional auth:', tokenError.message);
    }
    
    next();
    
  } catch (error) {
    console.error('Optional authentication error:', error);
    next(); // Continue even if there's an error
  }
};

// Middleware to validate user account status
const requireVerifiedAccount = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address to access this feature'
    });
  }
  next();
};

// Rate limiting middleware (basic implementation)
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const identifier = req.user ? req.user._id.toString() : req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    if (requests.has(identifier)) {
      const userRequests = requests.get(identifier).filter(time => time > windowStart);
      requests.set(identifier, userRequests);
    }
    
    // Check current request count
    const currentRequests = requests.get(identifier) || [];
    
    if (currentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    // Add current request
    currentRequests.push(now);
    requests.set(identifier, currentRequests);
    
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  requireSeller,
  requireBuyer,
  requireAuth,
  checkOwnership,
  optionalAuth,
  requireVerifiedAccount,
  rateLimit
};