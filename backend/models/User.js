const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  
  // User Role
  role: {
    type: String,
    enum: ['buyer', 'seller'],
    required: [true, 'User role is required'],
    default: 'buyer'
  },
  
  // Profile Information
  profileImage: {
    url: String,
    publicId: String
  },
  phone: {
    type: String,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  
  // Address Information
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'USA'
    }
  },
  
  // Seller-specific fields
  businessInfo: {
    businessName: {
      type: String,
      required: function() { return this.role === 'seller'; }
    },
    businessDescription: String,
    businessType: {
      type: String,
      enum: ['farm', 'bakery', 'restaurant', 'grocery', 'artisan', 'other']
    },
    businessLicense: String,
    taxId: String
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Verification
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  
  // Ratings and Reviews (for sellers)
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  
  // Timestamps
  lastLogin: Date,
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

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for products (for sellers)
userSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'seller',
  justOne: false
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update updatedAt
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      email: this.email,
      role: this.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Method to get public profile
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.emailVerificationToken;
  delete userObject.emailVerificationExpire;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpire;
  return userObject;
};

// Static method to find seller by business name
userSchema.statics.findSellerByBusinessName = function(businessName) {
  return this.findOne({
    role: 'seller',
    'businessInfo.businessName': new RegExp(businessName, 'i'),
    isActive: true
  });
};

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'businessInfo.businessName': 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);