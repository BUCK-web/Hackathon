const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['upi', 'card', 'wallet', 'cod', 'netbanking'],
    required: true
  },
  paymentDetails: {
    transactionId: String,
    paymentGateway: String,
    upiId: String,
    cardLast4: String
  },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String
  },
  deliveryType: {
    type: String,
    enum: ['pickup', 'delivery'],
    default: 'pickup'
  },
  estimatedDeliveryTime: {
    type: Date
  },
  actualDeliveryTime: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: 500
  },
  rating: {
    value: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: 500
    },
    createdAt: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Generate order number
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD${Date.now()}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Calculate total amount
orderSchema.pre('save', function(next) {
  if (this.isModified('quantity') || this.isModified('unitPrice')) {
    this.totalAmount = this.quantity * this.unitPrice;
  }
  next();
});

// Virtual for formatted order number
orderSchema.virtual('formattedOrderNumber').get(function() {
  return `#${this.orderNumber}`;
});

// Virtual for order age
orderSchema.virtual('orderAge').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
});

// Instance method to update status
orderSchema.methods.updateStatus = function(newStatus, notes = '') {
  this.status = newStatus;
  if (notes) this.notes = notes;
  
  // Set delivery time for completed orders
  if (newStatus === 'delivered' && !this.actualDeliveryTime) {
    this.actualDeliveryTime = new Date();
  }
  
  return this.save();
};

// Instance method to process payment
orderSchema.methods.processPayment = function(paymentDetails) {
  this.paymentStatus = 'completed';
  this.paymentDetails = {
    ...this.paymentDetails,
    ...paymentDetails
  };
  
  // Auto-confirm order after successful payment
  if (this.status === 'pending') {
    this.status = 'confirmed';
  }
  
  return this.save();
};

// Static method to get orders by buyer
orderSchema.statics.findByBuyer = function(buyerId, options = {}) {
  const { status, limit = 20, page = 1 } = options;
  const skip = (page - 1) * limit;
  
  let query = { buyer: buyerId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('product', 'name images price category')
    .populate('seller', 'firstName lastName businessInfo.businessName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get orders by seller
orderSchema.statics.findBySeller = function(sellerId, options = {}) {
  const { status, limit = 20, page = 1 } = options;
  const skip = (page - 1) * limit;
  
  let query = { seller: sellerId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('product', 'name images price category')
    .populate('buyer', 'firstName lastName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Ensure virtual fields are serialized
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);