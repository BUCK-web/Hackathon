const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticate, rateLimit } = require('../middleware/auth');
const { profileUpload } = require('../config/cloudinary');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('role')
    .isIn(['buyer', 'seller'])
    .withMessage('Role must be either buyer or seller'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  // Seller-specific validations
  body('businessInfo.businessName')
    .if(body('role').equals('seller'))
    .notEmpty()
    .withMessage('Business name is required for sellers'),
  body('businessInfo.businessType')
    .if(body('role').equals('seller'))
    .isIn(['farm', 'bakery', 'restaurant', 'grocery', 'artisan', 'other'])
    .withMessage('Please select a valid business type')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', rateLimit(5, 15 * 60 * 1000), registerValidation, async (req, res) => {
  try {
    console.log('\n=== REGISTRATION REQUEST DEBUG START ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors found:', JSON.stringify(errors.array(), null, 2));
      console.log('=== REGISTRATION REQUEST DEBUG END (VALIDATION FAILED) ===\n');
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    console.log('Validation passed successfully');

    const {
      firstName,
      lastName,
      email,
      password,
      role,
      phone,
      address,
      businessInfo
    } = req.body;

    // Check if user already exists
    console.log('Checking if user exists with email:', email);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists with this email');
      console.log('=== REGISTRATION REQUEST DEBUG END (USER EXISTS) ===\n');
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    console.log('No existing user found, proceeding with registration');

    // Create user object
    const userData = {
      firstName,
      lastName,
      email,
      password,
      role,
      phone,
      address
    };
    console.log('User data object created:', JSON.stringify(userData, null, 2));

    // Add business info for sellers
    if (role === 'seller' && businessInfo) {
      userData.businessInfo = businessInfo;
      console.log('Added business info for seller');
    }

    // Create new user
    console.log('Creating new user in database...');
    const user = new User(userData);
    await user.save();
    console.log('User saved successfully with ID:', user._id);

    // Generate JWT token
    console.log('Generating JWT token...');
    const token = user.generateAuthToken();
    console.log('JWT token generated successfully');

    // Update last login
    console.log('Updating last login timestamp...');
    user.lastLogin = new Date();
    await user.save();
    console.log('Last login updated successfully');

    console.log('Preparing successful response...');
    const responseData = {
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: user.getPublicProfile()
      }
    };
    console.log('Response data:', JSON.stringify(responseData, null, 2));
    console.log('=== REGISTRATION REQUEST DEBUG END (SUCCESS) ===\n');
    
    res.status(201).json(responseData);

  } catch (error) {
    console.error('\n=== REGISTRATION ERROR DEBUG START ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error('=== REGISTRATION ERROR DEBUG END ===\n');
    
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', rateLimit(10, 15 * 60 * 1000), loginValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = user.generateAuthToken();

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: user.getPublicProfile()
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authenticate, async (req, res) => {
  try {
    // In a JWT-based system, logout is typically handled client-side
    // by removing the token. However, we can log this action.
    
    res.status(200).json({
      success: true,
      message: 'Logout successful. Please remove the token from client storage.'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('products', 'name price images status')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: user.getPublicProfile()
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticate, profileUpload.single('profileImage'), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      address,
      businessInfo
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update basic fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (address) user.address = { ...user.address, ...address };

    // Update profile image if uploaded
    if (req.file) {
      user.profileImage = {
        url: req.file.path,
        publicId: req.file.filename
      };
    }

    // Update business info for sellers
    if (user.role === 'seller' && businessInfo) {
      user.businessInfo = { ...user.businessInfo, ...businessInfo };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.getPublicProfile()
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authenticate, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while changing password'
    });
  }
});

// @route   DELETE /api/auth/account
// @desc    Deactivate user account
// @access  Private
router.delete('/account', authenticate, [
  body('password')
    .notEmpty()
    .withMessage('Password is required to deactivate account')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { password } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // Deactivate account
    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully'
    });

  } catch (error) {
    console.error('Account deactivation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deactivating account'
    });
  }
});

module.exports = router;