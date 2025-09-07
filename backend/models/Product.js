const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Basic Product Information
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // Category and Type
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: [
      'fruits',
      'vegetables',
      'dairy',
      'meat',
      'seafood',
      'bakery',
      'beverages',
      'spices',
      'grains',
      'nuts',
      'herbs',
      'honey',
      'preserves',
      'other'
    ]
  },
  subcategory: {
    type: String,
    trim: true
  },
  
  // Pricing
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  unit: {
    type: String,
    required: [true, 'Price unit is required'],
    enum: ['per_piece', 'per_pound', 'per_kg', 'per_dozen', 'per_liter', 'per_gallon', 'per_pack']
  },
  
  // Inventory
  stock: {
    quantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    unit: {
      type: String,
      required: [true, 'Stock unit is required'],
      enum: ['pieces', 'pounds', 'kg', 'dozens', 'liters', 'gallons', 'packs']
    }
  },
  
  // Images
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  
  // Seller Information
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Seller is required']
  },
  
  // Product Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'out_of_stock', 'discontinued'],
    default: 'active'
  },
  
  // Product Details
  details: {
    origin: String, // Farm/location where produced
    harvestDate: Date,
    expiryDate: Date,
    organic: {
      type: Boolean,
      default: false
    },
    locallyGrown: {
      type: Boolean,
      default: true
    },
    seasonality: [{
      type: String,
      enum: ['spring', 'summer', 'fall', 'winter', 'year_round']
    }]
  },
  
  // Nutritional Information (optional)
  nutrition: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number,
    sugar: Number,
    sodium: Number
  },
  
  // Tags for better searchability
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  
  // Reviews and Ratings
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: [500, 'Review comment cannot exceed 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Calculated fields
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  
  // Availability
  availability: {
    isAvailable: {
      type: Boolean,
      default: true
    },
    availableFrom: Date,
    availableTo: Date,
    deliveryOptions: [{
      type: String,
      enum: ['pickup', 'local_delivery', 'shipping']
    }]
  },
  
  // SEO and Search
  slug: {
    type: String,
    unique: true
  },
  
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
  const primaryImg = this.images.find(img => img.isPrimary);
  return primaryImg || this.images[0] || null;
});

// Virtual for seller info
productSchema.virtual('sellerInfo', {
  ref: 'User',
  localField: 'seller',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to generate slug
productSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '-' + this._id;
  }
  
  this.updatedAt = Date.now();
  next();
});

// Pre-save middleware to calculate average rating
productSchema.pre('save', function(next) {
  if (this.reviews && this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.averageRating = totalRating / this.reviews.length;
    this.totalReviews = this.reviews.length;
  } else {
    this.averageRating = 0;
    this.totalReviews = 0;
  }
  next();
});

// Pre-save middleware to update stock status
productSchema.pre('save', function(next) {
  if (this.stock.quantity === 0 && this.status === 'active') {
    this.status = 'out_of_stock';
  } else if (this.stock.quantity > 0 && this.status === 'out_of_stock') {
    this.status = 'active';
  }
  next();
});

// Method to add review
productSchema.methods.addReview = function(userId, rating, comment) {
  // Check if user already reviewed
  const existingReview = this.reviews.find(review => 
    review.user.toString() === userId.toString()
  );
  
  if (existingReview) {
    existingReview.rating = rating;
    existingReview.comment = comment;
    existingReview.createdAt = Date.now();
  } else {
    this.reviews.push({
      user: userId,
      rating,
      comment
    });
  }
  
  return this.save();
};

// Method to update stock
productSchema.methods.updateStock = function(quantity, operation = 'set') {
  if (operation === 'add') {
    this.stock.quantity += quantity;
  } else if (operation === 'subtract') {
    this.stock.quantity = Math.max(0, this.stock.quantity - quantity);
  } else {
    this.stock.quantity = Math.max(0, quantity);
  }
  
  return this.save();
};

// Static method to find products by seller
productSchema.statics.findBySeller = function(sellerId, options = {}) {
  const query = { seller: sellerId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .populate('seller', 'firstName lastName businessInfo.businessName')
    .sort(options.sort || { createdAt: -1 });
};

// Static method to search products
productSchema.statics.searchProducts = function(searchTerm, filters = {}) {
  const query = {
    $and: [
      {
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { tags: { $in: [new RegExp(searchTerm, 'i')] } }
        ]
      }
    ]
  };
  
  if (filters.category) {
    query.$and.push({ category: filters.category });
  }
  
  if (filters.minPrice || filters.maxPrice) {
    const priceQuery = {};
    if (filters.minPrice) priceQuery.$gte = filters.minPrice;
    if (filters.maxPrice) priceQuery.$lte = filters.maxPrice;
    query.$and.push({ price: priceQuery });
  }
  
  if (filters.organic) {
    query.$and.push({ 'details.organic': true });
  }
  
  if (filters.locallyGrown) {
    query.$and.push({ 'details.locallyGrown': true });
  }
  
  query.$and.push({ status: 'active' });
  
  return this.find(query)
    .populate('seller', 'firstName lastName businessInfo.businessName profileImage')
    .sort(filters.sort || { createdAt: -1 });
};

// Indexes for better query performance
productSchema.index({ seller: 1 });
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ price: 1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ slug: 1 });

module.exports = mongoose.model('Product', productSchema);