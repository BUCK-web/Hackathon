const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Product = require('../models/Product');
const { authenticate, requireSeller, checkOwnership, optionalAuth } = require('../middleware/auth');
const { upload, deleteImage } = require('../config/cloudinary');

const router = express.Router();

// Validation rules
const productValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('category')
    .isIn(['fruits', 'vegetables', 'dairy', 'meat', 'seafood', 'bakery', 'beverages', 'spices', 'grains', 'nuts', 'herbs', 'honey', 'preserves', 'other'])
    .withMessage('Please select a valid category'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('unit')
    .isIn(['per_piece', 'per_pound', 'per_kg', 'per_dozen', 'per_liter', 'per_gallon', 'per_pack'])
    .withMessage('Please select a valid price unit'),
  body('stock.quantity')
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),
  body('stock.unit')
    .isIn(['pieces', 'pounds', 'kg', 'dozens', 'liters', 'gallons', 'packs'])
    .withMessage('Please select a valid stock unit')
];

const reviewValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters')
];

// @route   GET /api/products
// @desc    Get all products with filtering and pagination
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('category').optional().isIn(['fruits', 'vegetables', 'dairy', 'meat', 'seafood', 'bakery', 'beverages', 'spices', 'grains', 'nuts', 'herbs', 'honey', 'preserves', 'other']),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('sort').optional().isIn(['price_asc', 'price_desc', 'rating_desc', 'newest', 'oldest', 'name_asc'])
], optionalAuth, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 12,
      category,
      minPrice,
      maxPrice,
      sort = 'newest',
      search,
      organic,
      locallyGrown,
      seller
    } = req.query;

    // Build filter object
    const filters = { status: 'active' };

    if (category) filters.category = category;
    if (seller) filters.seller = seller;
    if (organic === 'true') filters['details.organic'] = true;
    if (locallyGrown === 'true') filters['details.locallyGrown'] = true;

    // Price range filter
    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) filters.price.$gte = parseFloat(minPrice);
      if (maxPrice) filters.price.$lte = parseFloat(maxPrice);
    }

    // Search filter
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Sort options
    let sortOption = {};
    switch (sort) {
      case 'price_asc':
        sortOption = { price: 1 };
        break;
      case 'price_desc':
        sortOption = { price: -1 };
        break;
      case 'rating_desc':
        sortOption = { averageRating: -1, totalReviews: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'name_asc':
        sortOption = { name: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const products = await Product.find(filters)
      .populate('seller', 'firstName lastName businessInfo.businessName profileImage rating')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(filters);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        products,
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
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching products'
    });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'firstName lastName businessInfo.businessName profileImage rating address')
      .populate('reviews.user', 'firstName lastName profileImage');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Increment view count
    product.views += 1;
    await product.save();

    res.status(200).json({
      success: true,
      data: {
        product
      }
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching product'
    });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private (Sellers only)
router.post('/', authenticate, requireSeller, upload.array('images', 5), productValidation, async (req, res) => {
  console.log('=== ADD PRODUCT REQUEST START ===');
  console.log('Request body:', req.body);
  console.log('Request files:', req.files);
  console.log('User:', req.user);
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

    // Check if images were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one product image is required'
      });
    }

    const {
      name,
      description,
      category,
      subcategory,
      price,
      unit,
      'stock.quantity': stockQuantity,
      'stock.unit': stockUnit,
      details,
      nutrition,
      tags,
      availability
    } = req.body;

    // Reconstruct stock object from FormData fields
    const stock = {
      quantity: stockQuantity,
      unit: stockUnit
    };

    // Process uploaded images
    const images = req.files.map((file, index) => ({
      url: file.path,
      publicId: file.filename,
      isPrimary: index === 0 // First image is primary
    }));

    // Create product
    const product = new Product({
      name,
      description,
      category,
      subcategory,
      price: parseFloat(price),
      unit,
      stock: {
        quantity: parseInt(stock.quantity),
        unit: stock.unit
      },
      images,
      seller: req.user._id,
      details: details ? JSON.parse(details) : {},
      nutrition: nutrition ? JSON.parse(nutrition) : {},
      tags: tags ? JSON.parse(tags) : [],
      availability: availability ? JSON.parse(availability) : {}
    });

    await product.save();

    // Populate seller info
    await product.populate('seller', 'firstName lastName businessInfo.businessName');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        product
      }
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating product'
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Product owner only)
router.put('/:id', authenticate, requireSeller, checkOwnership(Product), upload.array('newImages', 5), async (req, res) => {
  try {
    const product = req.resource; // From checkOwnership middleware

    const {
      name,
      description,
      category,
      subcategory,
      price,
      unit,
      stock,
      details,
      nutrition,
      tags,
      availability,
      status,
      removeImages
    } = req.body;

    // Update basic fields
    if (name) product.name = name;
    if (description) product.description = description;
    if (category) product.category = category;
    if (subcategory) product.subcategory = subcategory;
    if (price) product.price = parseFloat(price);
    if (unit) product.unit = unit;
    if (status) product.status = status;

    // Update stock
    if (stock) {
      if (stock.quantity !== undefined) product.stock.quantity = parseInt(stock.quantity);
      if (stock.unit) product.stock.unit = stock.unit;
    }

    // Update complex fields
    if (details) product.details = { ...product.details, ...JSON.parse(details) };
    if (nutrition) product.nutrition = { ...product.nutrition, ...JSON.parse(nutrition) };
    if (tags) product.tags = JSON.parse(tags);
    if (availability) product.availability = { ...product.availability, ...JSON.parse(availability) };

    // Handle image removal
    if (removeImages) {
      const imagesToRemove = JSON.parse(removeImages);
      for (const publicId of imagesToRemove) {
        // Remove from Cloudinary
        await deleteImage(publicId);
        // Remove from product
        product.images = product.images.filter(img => img.publicId !== publicId);
      }
    }

    // Add new images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: file.path,
        publicId: file.filename,
        isPrimary: product.images.length === 0 // First image is primary if no existing images
      }));
      product.images.push(...newImages);
    }

    // Ensure at least one image exists
    if (product.images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product must have at least one image'
      });
    }

    // Ensure one primary image
    const hasPrimary = product.images.some(img => img.isPrimary);
    if (!hasPrimary) {
      product.images[0].isPrimary = true;
    }

    await product.save();
    await product.populate('seller', 'firstName lastName businessInfo.businessName');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: {
        product
      }
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating product'
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private (Product owner only)
router.delete('/:id', authenticate, requireSeller, checkOwnership(Product), async (req, res) => {
  try {
    const product = req.resource;

    // Delete images from Cloudinary
    for (const image of product.images) {
      await deleteImage(image.publicId);
    }

    // Delete product
    await Product.findByIdAndDelete(product._id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting product'
    });
  }
});

// @route   POST /api/products/:id/reviews
// @desc    Add product review
// @access  Private (Buyers only)
router.post('/:id/reviews', authenticate, reviewValidation, async (req, res) => {
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

    const { rating, comment } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user is trying to review their own product
    if (product.seller.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot review your own product'
      });
    }

    // Add review
    await product.addReview(req.user._id, rating, comment);
    await product.populate('reviews.user', 'firstName lastName profileImage');

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: {
        product
      }
    });

  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding review'
    });
  }
});

// @route   PUT /api/products/:id/stock
// @desc    Update product stock
// @access  Private (Product owner only)
router.put('/:id/stock', authenticate, requireSeller, checkOwnership(Product), [
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  body('operation').optional().isIn(['set', 'add', 'subtract']).withMessage('Operation must be set, add, or subtract')
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

    const { quantity, operation = 'set' } = req.body;
    const product = req.resource;

    await product.updateStock(parseInt(quantity), operation);

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        product: {
          _id: product._id,
          name: product.name,
          stock: product.stock,
          status: product.status
        }
      }
    });

  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating stock'
    });
  }
});

// @route   GET /api/products/seller/:sellerId
// @desc    Get products by seller
// @access  Public
router.get('/seller/:sellerId', [
  query('status').optional().isIn(['active', 'inactive', 'out_of_stock', 'discontinued'])
], async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { status = 'active' } = req.query;

    const products = await Product.findBySeller(sellerId, { status })
      .populate('seller', 'firstName lastName businessInfo.businessName profileImage');

    res.status(200).json({
      success: true,
      data: {
        products
      }
    });

  } catch (error) {
    console.error('Get seller products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching seller products'
    });
  }
});

// @route   GET /api/products/categories
// @desc    Get all available product categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    
    res.status(200).json({
      success: true,
      data: {
        categories: categories.filter(cat => cat) // Remove any null/undefined values
      }
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories'
    });
  }
});

module.exports = router;