const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const Product = require('../models/Product');
const { authenticate, authorize, requireSeller, requireBuyer } = require('../middleware/auth');
const { profileUpload } = require('../config/cloudinary');
const router = express.Router();

// Validation rules
const updateProfileValidation = [
  body('firstName').optional().trim().isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone').optional().isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('businessName').optional().trim().isLength({ min: 2, max: 100 })
    .withMessage('Business name must be between 2 and 100 characters'),
  body('businessDescription').optional().trim().isLength({ max: 500 })
    .withMessage('Business description must not exceed 500 characters'),
  body('businessAddress.street').optional().trim().isLength({ min: 5, max: 100 })
    .withMessage('Street address must be between 5 and 100 characters'),
  body('businessAddress.city').optional().trim().isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  body('businessAddress.state').optional().trim().isLength({ min: 2, max: 50 })
    .withMessage('State must be between 2 and 50 characters'),
  body('businessAddress.zipCode').optional().trim().isLength({ min: 5, max: 10 })
    .withMessage('Zip code must be between 5 and 10 characters')
];

const searchValidation = [
  query('q').optional().trim().isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  query('category').optional().trim().isLength({ min: 1, max: 50 })
    .withMessage('Category must be between 1 and 50 characters'),
  query('location').optional().trim().isLength({ min: 1, max: 100 })
    .withMessage('Location must be between 1 and 100 characters'),
  query('minRating').optional().isFloat({ min: 0, max: 5 })
    .withMessage('Minimum rating must be between 0 and 5'),
  query('page').optional().isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

// Get all vendors/sellers with pagination and filtering
router.get('/vendors', searchValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      q,
      category,
      location,
      minRating = 0,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build search query
    const searchQuery = {
      role: 'seller',
      isActive: true,
      isVerified: true
    };

    if (q) {
      searchQuery.$or = [
        { businessName: { $regex: q, $options: 'i' } },
        { businessDescription: { $regex: q, $options: 'i' } },
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } }
      ];
    }

    if (location) {
      searchQuery.$or = searchQuery.$or || [];
      searchQuery.$or.push(
        { 'businessAddress.city': { $regex: location, $options: 'i' } },
        { 'businessAddress.state': { $regex: location, $options: 'i' } }
      );
    }

    if (minRating > 0) {
      searchQuery.averageRating = { $gte: parseFloat(minRating) };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const vendors = await User.find(searchQuery)
      .select('-password -refreshToken')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalVendors = await User.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalVendors / parseInt(limit));

    // Get product counts for each vendor
    const vendorIds = vendors.map(vendor => vendor._id);
    const productCounts = await Product.aggregate([
      {
        $match: {
          seller: { $in: vendorIds },
          status: 'active',
          isAvailable: true
        }
      },
      {
        $group: {
          _id: '$seller',
          productCount: { $sum: 1 }
        }
      }
    ]);

    // Map product counts to vendors
    const productCountMap = {};
    productCounts.forEach(item => {
      productCountMap[item._id.toString()] = item.productCount;
    });

    const vendorsWithProductCount = vendors.map(vendor => ({
      ...vendor,
      productCount: productCountMap[vendor._id.toString()] || 0
    }));

    res.json({
      success: true,
      data: {
        vendors: vendorsWithProductCount,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalVendors,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching vendors'
    });
  }
});

// Get vendor profile by ID
router.get('/vendors/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await User.findOne({
      _id: id,
      role: 'seller',
      isActive: true
    }).select('-password -refreshToken');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Get vendor's products
    const products = await Product.find({
      seller: id,
      status: 'active',
      isAvailable: true
    })
      .select('name price images category stock averageRating totalReviews')
      .sort({ createdAt: -1 })
      .limit(20);

    // Get product statistics
    const productStats = await Product.aggregate([
      {
        $match: {
          seller: vendor._id,
          status: 'active'
        }
      },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          averagePrice: { $avg: '$price' },
          totalStock: { $sum: '$stock' },
          categories: { $addToSet: '$category' }
        }
      }
    ]);

    const stats = productStats[0] || {
      totalProducts: 0,
      averagePrice: 0,
      totalStock: 0,
      categories: []
    };

    res.json({
      success: true,
      data: {
        vendor,
        products,
        stats
      }
    });
  } catch (error) {
    console.error('Get vendor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching vendor profile'
    });
  }
});

// Get vendor's products with pagination
router.get('/vendors/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      category,
      minPrice,
      maxPrice,
      inStock = true,
      page = 1,
      limit = 12,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Verify vendor exists
    const vendor = await User.findOne({
      _id: id,
      role: 'seller',
      isActive: true
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Build product query
    const productQuery = {
      seller: id,
      status: 'active'
    };

    if (category) {
      productQuery.category = { $regex: category, $options: 'i' };
    }

    if (minPrice || maxPrice) {
      productQuery.price = {};
      if (minPrice) productQuery.price.$gte = parseFloat(minPrice);
      if (maxPrice) productQuery.price.$lte = parseFloat(maxPrice);
    }

    if (inStock === 'true') {
      productQuery.stock = { $gt: 0 };
      productQuery.isAvailable = true;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const products = await Product.find(productQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('seller', 'businessName averageRating')
      .lean();

    const totalProducts = await Product.countDocuments(productQuery);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    res.json({
      success: true,
      data: {
        products,
        vendor: {
          _id: vendor._id,
          businessName: vendor.businessName,
          averageRating: vendor.averageRating,
          totalReviews: vendor.totalReviews
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalProducts,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get vendor products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching vendor products'
    });
  }
});

// Update vendor profile (seller only)
router.put('/profile', authenticate, requireSeller, profileUpload.single('profileImage'), updateProfileValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const updateData = { ...req.body };

    // Handle profile image upload
    if (req.file) {
      updateData.profileImage = req.file.path;
    }

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
});

// Get user's own profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If seller, get additional statistics
    let stats = null;
    if (user.role === 'seller') {
      const productStats = await Product.aggregate([
        {
          $match: {
            seller: user._id
          }
        },
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            activeProducts: {
              $sum: {
                $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
              }
            },
            totalStock: { $sum: '$stock' },
            totalViews: { $sum: '$views' },
            averagePrice: { $avg: '$price' }
          }
        }
      ]);

      stats = productStats[0] || {
        totalProducts: 0,
        activeProducts: 0,
        totalStock: 0,
        totalViews: 0,
        averagePrice: 0
      };
    }

    res.json({
      success: true,
      data: {
        user,
        stats
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

// Search vendors by business name
router.get('/search/vendors', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const vendors = await User.findByBusinessName(q.trim(), parseInt(limit));

    res.json({
      success: true,
      data: { vendors }
    });
  } catch (error) {
    console.error('Search vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching vendors'
    });
  }
});

// Get featured vendors (top rated)
router.get('/featured/vendors', async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const vendors = await User.find({
      role: 'seller',
      isActive: true,
      isVerified: true,
      averageRating: { $gte: 4.0 }
    })
      .select('-password -refreshToken')
      .sort({ averageRating: -1, totalReviews: -1 })
      .limit(parseInt(limit))
      .lean();

    // Get product counts for featured vendors
    const vendorIds = vendors.map(vendor => vendor._id);
    const productCounts = await Product.aggregate([
      {
        $match: {
          seller: { $in: vendorIds },
          status: 'active',
          isAvailable: true
        }
      },
      {
        $group: {
          _id: '$seller',
          productCount: { $sum: 1 }
        }
      }
    ]);

    const productCountMap = {};
    productCounts.forEach(item => {
      productCountMap[item._id.toString()] = item.productCount;
    });

    const featuredVendors = vendors.map(vendor => ({
      ...vendor,
      productCount: productCountMap[vendor._id.toString()] || 0
    }));

    res.json({
      success: true,
      data: { vendors: featuredVendors }
    });
  } catch (error) {
    console.error('Get featured vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching featured vendors'
    });
  }
});

module.exports = router;