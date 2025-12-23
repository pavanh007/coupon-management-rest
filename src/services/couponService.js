export class CouponService {
  
  /**
   * Check if coupon is applicable to cart
   */
  static isCouponApplicable(coupon, cart) {
    // Basic checks
    if (!coupon.isApplicable()) {
      return { applicable: false, reason: 'Coupon is not active, expired, or usage limit reached' };
    }
    
    // Calculate cart total
    const cartTotal = this.calculateCartTotal(cart);
    
    // Check minimum cart value
    if (coupon.minCartValue && cartTotal < coupon.minCartValue) {
      return { 
        applicable: false, 
        reason: `Cart total (${cartTotal}) is less than minimum required (${coupon.minCartValue})` 
      };
    }
    
    // Type-specific checks
    switch(coupon.type) {
      case 'CART_WISE':
        return this.checkCartWiseApplicability(coupon, cart, cartTotal);
        
      case 'PRODUCT_WISE':
        return this.checkProductWiseApplicability(coupon, cart);
        
      case 'BXGY':
        return this.checkBxGyApplicability(coupon, cart);
        
      default:
        return { applicable: false, reason: 'Unknown coupon type' };
    }
  }
  
  /**
   * Calculate cart total
   */
  static calculateCartTotal(cart) {
    if (!cart || !cart.items) return 0;
    
    return cart.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }
  
  /**
   * Check cart-wise coupon applicability
   */
  static checkCartWiseApplicability(coupon, cart, cartTotal) {
    // Cart-wise coupons are always applicable if cart meets minimum value
    return { applicable: true, cartTotal };
  }
  
  /**
   * Check product-wise coupon applicability
   */
  static checkProductWiseApplicability(coupon, cart) {
    if (!coupon.applicableProducts || coupon.applicableProducts.length === 0) {
      return { applicable: false, reason: 'No applicable products defined' };
    }
    
    // Check if any applicable product is in cart
    const applicableItems = cart.items.filter(item => 
      coupon.applicableProducts.includes(item.productId)
    );
    
    if (applicableItems.length === 0) {
      return { applicable: false, reason: 'No applicable products in cart' };
    }
    
    // Calculate total from applicable items
    const applicableTotal = applicableItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
    
    return { 
      applicable: true, 
      applicableItems, 
      applicableTotal 
    };
  }
  
  /**
   * Check BxGy coupon applicability
   */
  static checkBxGyApplicability(coupon, cart) {
    if (!coupon.buyProducts || coupon.buyProducts.length === 0 ||
        !coupon.getProducts || coupon.getProducts.length === 0) {
      return { applicable: false, reason: 'Invalid BxGy configuration' };
    }
    
    // Calculate total quantity of each product in cart
    const cartProducts = {};
    cart.items.forEach(item => {
      cartProducts[item.productId] = item.quantity;
    });
    
    // Check if we have enough buy products
    let maxApplications = 0;
    
    // For each buy product requirement
    for (const buyReq of coupon.buyProducts) {
      const cartQuantity = cartProducts[buyReq.productId] || 0;
      const possibleApplications = Math.floor(cartQuantity / buyReq.quantity);
      
      if (maxApplications === 0 || possibleApplications < maxApplications) {
        maxApplications = possibleApplications;
      }
    }
    
    // Apply repetition limit
    const repetitionLimit = coupon.repetitionLimit || 1;
    maxApplications = Math.min(maxApplications, repetitionLimit);
    
    if (maxApplications === 0) {
      return { 
        applicable: false, 
        reason: 'Insufficient quantity of buy products' 
      };
    }
    
    // Check if we have enough get products (optional, depends on business logic)
    // Some businesses allow free items even if not in cart
    
    return { 
      applicable: true, 
      maxApplications,
      cartProducts 
    };
  }
  
  /**
   * Calculate discount for a coupon
   */
  static calculateDiscount(coupon, cart) {
    const applicability = this.isCouponApplicable(coupon, cart);
    
    if (!applicability.applicable) {
      return { discount: 0, ...applicability };
    }
    
    switch(coupon.type) {
      case 'CART_WISE':
        return this.calculateCartWiseDiscount(coupon, cart, applicability);
        
      case 'PRODUCT_WISE':
        return this.calculateProductWiseDiscount(coupon, cart, applicability);
        
      case 'BXGY':
        return this.calculateBxGyDiscount(coupon, cart, applicability);
        
      default:
        return { discount: 0, reason: 'Unknown coupon type' };
    }
  }
  
  /**
   * Calculate cart-wise discount
   */
  static calculateCartWiseDiscount(coupon, cart, applicability) {
    const cartTotal = applicability.cartTotal;
    let discount = 0;
    
    // Percentage discount
    if (coupon.discountValue <= 100) {
      discount = (cartTotal * coupon.discountValue) / 100;
    } 
    // Fixed amount discount
    else {
      discount = coupon.discountValue;
    }
    
    // Apply max discount cap
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
    
    // Ensure discount doesn't exceed cart total
    discount = Math.min(discount, cartTotal);
    
    return {
      discount,
      cartTotal,
      discountType: coupon.discountValue <= 100 ? 'percentage' : 'fixed'
    };
  }
  
  /**
   * Calculate product-wise discount
   */
  static calculateProductWiseDiscount(coupon, cart, applicability) {
    let totalDiscount = 0;
    const itemDiscounts = [];
    
    applicability.applicableItems.forEach(item => {
      let itemDiscount = 0;
      
      // Percentage discount
      if (coupon.discountValue <= 100) {
        itemDiscount = (item.price * item.quantity * coupon.discountValue) / 100;
      } 
      // Fixed amount discount per item
      else {
        itemDiscount = coupon.discountValue * item.quantity;
      }
      
      // Apply max discount per item (if specified)
      if (coupon.maxDiscount) {
        itemDiscount = Math.min(itemDiscount, coupon.maxDiscount);
      }
      
      // Ensure discount doesn't exceed item total
      const itemTotal = item.price * item.quantity;
      itemDiscount = Math.min(itemDiscount, itemTotal);
      
      totalDiscount += itemDiscount;
      itemDiscounts.push({
        productId: item.productId,
        quantity: item.quantity,
        itemDiscount
      });
    });
    
    return {
      discount: totalDiscount,
      applicableTotal: applicability.applicableTotal,
      itemDiscounts,
      discountType: coupon.discountValue <= 100 ? 'percentage' : 'fixed'
    };
  }
  
  /**
   * Calculate BxGy discount
   */
  static calculateBxGyDiscount(coupon, cart, applicability) {
    const maxApplications = applicability.maxApplications;
    let totalDiscount = 0;
    const freeItems = [];
    
    // Calculate discount from free items
    coupon.getProducts.forEach(getReq => {
      // Find the item in cart
      const cartItem = cart.items.find(item => item.productId === getReq.productId);
      
      if (cartItem) {
        // Calculate how many items we can make free based on applications
        const freeQuantity = getReq.quantity * maxApplications;
        const actualFreeQuantity = Math.min(freeQuantity, cartItem.quantity);
        
        const itemDiscount = cartItem.price * actualFreeQuantity;
        totalDiscount += itemDiscount;
        
        freeItems.push({
          productId: getReq.productId,
          freeQuantity: actualFreeQuantity,
          itemDiscount
        });
      } else {
        // Item not in cart - might be free item that needs to be added
        // This depends on business logic
        freeItems.push({
          productId: getReq.productId,
          freeQuantity: getReq.quantity * maxApplications,
          itemDiscount: 0,
          note: 'Item not in cart'
        });
      }
    });
    
    return {
      discount: totalDiscount,
      maxApplications,
      freeItems,
      discountType: 'free_items'
    };
  }
  
  /**
   * Apply coupon to cart and return updated cart
   */
  static applyCouponToCart(coupon, cart) {
    const discountResult = this.calculateDiscount(coupon, cart);
    
    if (discountResult.discount === 0) {
      throw new Error('Cannot apply coupon: ' + (discountResult.reason || 'Invalid coupon'));
    }
    
    // Create a deep copy of cart
    const updatedCart = JSON.parse(JSON.stringify(cart));
    
    // Calculate cart total
    const cartTotal = this.calculateCartTotal(cart);
    
    // Apply discounts based on coupon type
    switch(coupon.type) {
      case 'CART_WISE':
        // Update cart totals
        updatedCart.totalPrice = cartTotal;
        updatedCart.totalDiscount = discountResult.discount;
        updatedCart.finalPrice = cartTotal - discountResult.discount;
        break;
        
      case 'PRODUCT_WISE':
        // Apply discounts to individual items
        discountResult.itemDiscounts.forEach(itemDiscount => {
          const item = updatedCart.items.find(i => i.productId === itemDiscount.productId);
          if (item) {
            item.totalDiscount = (item.totalDiscount || 0) + itemDiscount.itemDiscount;
            item.discountedPrice = (item.price * item.quantity) - item.totalDiscount;
          }
        });
        
        // Update cart totals
        updatedCart.totalPrice = cartTotal;
        updatedCart.totalDiscount = discountResult.discount;
        updatedCart.finalPrice = cartTotal - discountResult.discount;
        break;
        
      case 'BXGY':
        // Mark free items
        discountResult.freeItems.forEach(freeItem => {
          const item = updatedCart.items.find(i => i.productId === freeItem.productId);
          if (item && freeItem.itemDiscount > 0) {
            item.totalDiscount = (item.totalDiscount || 0) + freeItem.itemDiscount;
            item.discountedPrice = (item.price * item.quantity) - item.totalDiscount;
            item.freeQuantity = freeItem.freeQuantity;
          }
        });
        
        // Update cart totals
        updatedCart.totalPrice = cartTotal;
        updatedCart.totalDiscount = discountResult.discount;
        updatedCart.finalPrice = cartTotal - discountResult.discount;
        break;
    }
    
    // Add coupon info to cart
    updatedCart.appliedCoupon = {
      couponId: coupon._id,
      code: coupon.code,
      type: coupon.type,
      discountValue: discountResult.discount
    };
    
    return {
      updatedCart,
      discountResult
    };
  }
  
  /**
   * Get all applicable coupons for a cart
   */
  static async getApplicableCoupons(cart, couponModel) {
    // Get all active coupons
    const coupons = await couponModel.find({
      isActive: true,
      $or: [
        { expirationDate: { $gt: new Date() } },
        { expirationDate: null }
      ]
    });
    
    const applicableCoupons = [];
    
    for (const coupon of coupons) {
      const discountResult = this.calculateDiscount(coupon, cart);
      
      if (discountResult.discount > 0) {
        applicableCoupons.push({
          couponId: coupon._id,
          code: coupon.code,
          type: coupon.type,
          discount: discountResult.discount,
          details: discountResult
        });
      }
    }
    
    // Sort by discount amount (highest first)
    applicableCoupons.sort((a, b) => b.discount - a.discount);
    
    return applicableCoupons;
  }
}
