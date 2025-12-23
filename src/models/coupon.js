import { Schema, model } from 'mongoose';

const buyProductSchema = new Schema({
  productId: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  }
});

const getProductSchema = new Schema({
  productId: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  }
});

const couponSchema = new Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },
  type: {
    type: String,
    enum: ['CART_WISE', 'PRODUCT_WISE', 'BXGY'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(value) {
        if (this.type === 'CART_WISE') {
          return value > 0 && value <= 100; // Percentage
        }
        if (this.type === 'PRODUCT_WISE') {
          return value > 0; // Fixed amount or percentage
        }
        return true; // BXGY can have 0 discountValue
      },
      message: 'Invalid discount value for coupon type'
    }
  },
  minCartValue: {
    type: Number,
    default: 0,
    min: 0
  },
  maxDiscount: {
    type: Number,
    min: 0
  },
  applicableProducts: [{
    type: Number
  }],
  buyProducts: [buyProductSchema],
  getProducts: [getProductSchema],
  repetitionLimit: {
    type: Number,
    min: 1,
    default: 1
  },
  expirationDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageLimit: {
    type: Number,
    min: 1
  },
  currentUsage: {
    type: Number,
    default: 0,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

couponSchema.index({ type: 1 });
couponSchema.index({ isActive: 1 });
couponSchema.index({ expirationDate: 1 });
couponSchema.index({ createdAt: -1 });

// Method to check if coupon is expired
couponSchema.methods.isExpired = function() {
  if (!this.expirationDate) return false;
  return new Date() > this.expirationDate;
};

// Method to check if coupon usage limit is reached
couponSchema.methods.isUsageLimitReached = function() {
  if (!this.usageLimit) return false;
  return this.currentUsage >= this.usageLimit;
};

// Method to check if coupon is applicable
couponSchema.methods.isApplicable = function() {
  return this.isActive && !this.isExpired() && !this.isUsageLimitReached();
};

// Static method to validate coupon data based on type
couponSchema.statics.validateCouponData = function(couponData) {
  const errors = [];
  
  switch(couponData.type) {
    case 'CART_WISE':
      if (couponData.discountValue <= 0 || couponData.discountValue > 100) {
        errors.push('Discount value must be between 1 and 100 for cart-wise coupons');
      }
      if (couponData.applicableProducts && couponData.applicableProducts.length > 0) {
        errors.push('Cart-wise coupons should not have applicableProducts');
      }
      if (couponData.buyProducts || couponData.getProducts) {
        errors.push('Cart-wise coupons should not have buyProducts or getProducts');
      }
      break;
      
    case 'PRODUCT_WISE':
      if (!couponData.applicableProducts || couponData.applicableProducts.length === 0) {
        errors.push('Product-wise coupons require applicableProducts');
      }
      if (couponData.buyProducts || couponData.getProducts) {
        errors.push('Product-wise coupons should not have buyProducts or getProducts');
      }
      break;
      
    case 'BXGY':
      if (!couponData.buyProducts || couponData.buyProducts.length === 0) {
        errors.push('BxGy coupons require buyProducts');
      }
      if (!couponData.getProducts || couponData.getProducts.length === 0) {
        errors.push('BxGy coupons require getProducts');
      }
      if (couponData.applicableProducts && couponData.applicableProducts.length > 0) {
        errors.push('BxGy coupons should not have applicableProducts');
      }
      break;
  }
  
  return errors;
};

const Coupon = model('Coupon', couponSchema);

export default Coupon;