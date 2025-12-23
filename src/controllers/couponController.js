import Coupon from '../models/coupon.js';
import {CouponService} from '../services/couponService.js';
import { validateCoupon, validateCart } from '../utils/validators.js';

export const couponController = {
  
  async createCoupon(req, res) {
    const { error, value } = validateCoupon(req.body);
    if (error) {
        console.log(error.details[0].message)
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const validationErrors = Coupon.validateCouponData(value);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join(', ') });
    }
    
    const existingCoupon = await Coupon.findOne({ code: value.code });
    if (existingCoupon) {
      return res.status(400).json({ error: 'Coupon code already exists' });
    }
    
    const coupon = new Coupon(value);
    await coupon.save();
    
    res.status(201).json({
      message: 'Coupon created successfully',
      coupon: coupon.toJSON()
    });
  },
  
  // Get all coupons
  async getAllCoupons(req, res) {
    const { type, active } = req.query;
    const filter = {};
    
    if (type) {
      filter.type = type;
    }
    
    if (active !== undefined) {
      filter.isActive = active === 'true';
    }
    
    const coupons = await Coupon.find(filter).sort({ createdAt: -1 });
    
    res.json({
      count: coupons.length,
      coupons: coupons.map(coupon => coupon.toJSON())
    });
  },
  
  // Get coupon by ID
  async getCouponById(req, res) {
    const code = req.params.id; 
    const coupon = await Coupon.find({code : code});
    console.log("coupon ::", coupon)
    
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    res.json(coupon);
  },
  
  // Update coupon
async updateCoupon(req, res) {
  try {
    // 1. Validate the input
    const { error, value } = validateCoupon(req.body, true);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details.map(d => d.message).join(', ')
      });
    }
    const id = req.params.id;
    const existingCoupon = await Coupon.findOne({ code: id }); 
    if (!existingCoupon) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found'
      });
    }
    if (value.code) {
      const normalizedNewCode = value.code.toUpperCase().trim();
      // Only check for duplicates if the code is actually changing
      if (normalizedNewCode !== existingCoupon.code) {
        const duplicateCoupon = await Coupon.findOne({ code: normalizedNewCode });
        
        if (duplicateCoupon) {
          return res.status(400).json({ 
            success: false,
            error: `Coupon code '${normalizedNewCode}' already exists` 
          });
        }
      }
      // Apply the normalized code to the value object
      value.code = normalizedNewCode;
    }
    Object.assign(existingCoupon, value);
    const savedCoupon = await existingCoupon.save();

    res.json({
      success: true,
      message: 'Coupon updated successfully',
      data: savedCoupon 
    });

  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error'
    });
  }
},
  
  // Delete coupon
  async deleteCoupon(req, res) {
    const coupon = await Coupon.findOne({code : req.params.id});
    
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    
    await coupon.deleteOne();
    
    res.json({ message: 'Coupon deleted successfully' });
  },
  
  // Get applicable coupons for a cart
  async getApplicableCoupons(req, res) {
    // Validate cart
    const { error, value } = validateCart(req.body.cart);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const applicableCoupons = await CouponService.getApplicableCoupons(value, Coupon);
    
    res.json({
      cart: value,
      applicableCoupons,
      totalApplicable: applicableCoupons.length
    });
  },
  
  // Apply a specific coupon to cart
  async applyCoupon(req, res) {
    // Validate cart
    const { error, value } = validateCart(req.body.cart);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    // Get coupon
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    
    try {
      // Apply coupon to cart
      const result = CouponService.applyCouponToCart(coupon, value);
      
      // Increment coupon usage
      coupon.currentUsage += 1;
      await coupon.save();
      
      res.json({
        message: 'Coupon applied successfully',
        coupon: {
          id: coupon._id,
          code: coupon.code,
          type: coupon.type
        },
        ...result
      });
      
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};
