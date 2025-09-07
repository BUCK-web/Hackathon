const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const createOrderValidation = [
  body('productId')
    .isMongoId()
    .withMessage('Valid product ID is required'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('paymentMethod')
    .isIn(['upi', 'card', 'wallet', 'cod', 'netbanking'])
    .withMessage('Valid payment method is required'),
  body('deliveryAddress.street')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Street address must be between 5 and 200 characters'),
  body('deliveryAddress.city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  body('deliveryAddress.state')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('State must be between 2 and 50 characters'),
  body('deliveryAddress.pincode')
    .optional()
    .matches(/^[1-9][0-9]{5}$/)
    .withMessage('Valid Indian pincode is required'),
  body('deliveryType')
    .optional()
    .isIn(['pickup', 'delivery'])
    .withMessage('Delivery type must be pickup or delivery'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

const updateOrderValidation = [
  body('status')
    .optional()
    .isIn(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'])
    .withMessage('Invalid order status'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

const paymentValidation = [
  body('transactionId')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Valid transaction ID is required'),
  body('paymentGateway')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Payment gateway name too long'),
  body('upiId')
    .optional()
    .matches(/^[\w.-]+@[\w.-]+$/)
    .withMessage('Valid UPI ID format required'),
  body('cardLast4')
    .optional()
    .matches(/^\d{4}$/)
    .withMessage('Card last 4 digits must be 4 numbers')
];

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', authenticate, createOrderValidation, async (req, res) => {
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

    const {
      productId,
      quantity,
      paymentMethod,
      deliveryAddress,
      deliveryType = 'pickup',
      notes
    } = req.body;

    // Get product details
    const product = await Product.findById(productId).populate('seller', 'firstName lastName businessInfo');
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if product is available
    if (product.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Product is not available for order'
      });
    }

    // Check stock availability
    if (product.stock.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock.quantity} items available in stock`
      });
    }

    // Prevent self-ordering
    if (product.seller._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot order your own product'
      });
    }

    // Calculate estimated delivery time (30 minutes for pickup, 2 hours for delivery)
    const estimatedDeliveryTime = new Date();
    if (deliveryType === 'pickup') {
      estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + 30);
    } else {
      estimatedDeliveryTime.setHours(estimatedDeliveryTime.getHours() + 2);
    }

    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Calculate total amount
    const totalAmount = product.price * quantity;

    // Create order
    const order = new Order({
      orderNumber,
      buyer: req.user._id,
      seller: product.seller._id,
      product: productId,
      quantity,
      unitPrice: product.price,
      totalAmount,
      paymentMethod,
      deliveryAddress: deliveryType === 'delivery' ? deliveryAddress : undefined,
      deliveryType,
      estimatedDeliveryTime,
      notes
    });

    await order.save();

    // Populate order details for response
    await order.populate([
      { path: 'product', select: 'name images price category unit' },
      { path: 'seller', select: 'firstName lastName businessInfo.businessName' },
      { path: 'buyer', select: 'firstName lastName' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order
      }
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating order'
    });
  }
});

// @route   GET /api/orders
// @desc    Get user's orders (buyer or seller based on role)
// @access  Private
router.get('/', authenticate, [
  query('status').optional().isIn(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const options = { status, page: parseInt(page), limit: parseInt(limit) };

    let orders;
    if (req.user.role === 'seller') {
      orders = await Order.findBySeller(req.user._id, options);
    } else {
      orders = await Order.findByBuyer(req.user._id, options);
    }

    // Get total count for pagination
    const totalQuery = req.user.role === 'seller' 
      ? { seller: req.user._id }
      : { buyer: req.user._id };
    
    if (status) totalQuery.status = status;
    const totalOrders = await Order.countDocuments(totalQuery);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalOrders,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders'
    });
  }
});

// @route   GET /api/orders/:orderId
// @desc    Get single order details
// @access  Private
router.get('/:orderId', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('product', 'name images price category unit')
      .populate('seller', 'firstName lastName businessInfo.businessName')
      .populate('buyer', 'firstName lastName');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user has access to this order
    const isOwner = order.buyer._id.toString() === req.user._id.toString() ||
                   order.seller._id.toString() === req.user._id.toString();
    
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        order
      }
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching order'
    });
  }
});

// @route   PUT /api/orders/:orderId/status
// @desc    Update order status (seller only)
// @access  Private
router.put('/:orderId/status', authenticate, updateOrderValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { orderId } = req.params;
    const { status, notes } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Only seller can update order status
    if (order.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the seller can update order status'
      });
    }

    // Update order status
    await order.updateStatus(status, notes);

    // Populate for response
    await order.populate([
      { path: 'product', select: 'name images price category' },
      { path: 'buyer', select: 'firstName lastName' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        order
      }
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating order status'
    });
  }
});

// @route   POST /api/orders/:orderId/payment
// @desc    Process payment for order
// @access  Private
router.post('/:orderId/payment', authenticate, paymentValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { orderId } = req.params;
    const paymentDetails = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Only buyer can process payment
    if (order.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the buyer can process payment'
      });
    }

    // Check if payment is already completed
    if (order.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed for this order'
      });
    }

    // Process payment
    await order.processPayment(paymentDetails);

    // Update product stock
    const product = await Product.findById(order.product);
    if (product) {
      product.stock.quantity = Math.max(0, product.stock.quantity - order.quantity);
      await product.save();
    }

    // Populate for response
    await order.populate([
      { path: 'product', select: 'name images price category' },
      { path: 'seller', select: 'firstName lastName businessInfo.businessName' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        order
      }
    });

  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing payment'
    });
  }
});

// @route   POST /api/orders/:orderId/cancel
// @desc    Cancel order
// @access  Private
router.post('/:orderId/cancel', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user can cancel this order
    const canCancel = order.buyer.toString() === req.user._id.toString() ||
                     order.seller.toString() === req.user._id.toString();
    
    if (!canCancel) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if order can be cancelled
    if (['delivered', 'cancelled'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled'
      });
    }

    // Cancel order
    await order.updateStatus('cancelled', reason || 'Order cancelled by user');

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        order
      }
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling order'
    });
  }
});

module.exports = router;