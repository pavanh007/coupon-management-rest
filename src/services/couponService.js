export class CouponService {
  
  static isCouponApplicable(coupon, cart) {
    if (!coupon.isApplicable()) {
      return { applicable: false, reason: 'Coupon is not active, expired, or usage limit reached' };
    }
    
    const cartTotal = this.calculateCartTotal(cart);
    
    if (coupon.minCartValue && cartTotal < coupon.minCartValue) {
      return { 
        applicable: false, 
        reason: `Cart total (${cartTotal}) is less than minimum required (${coupon.minCartValue})` 
      };
    }
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
  static calculateCartTotal(cart) {
    if (!cart || !cart.items) return 0;
    
    return cart.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }
  
  static checkCartWiseApplicability(coupon, cart, cartTotal) {
    return { applicable: true, cartTotal };
  }
  
  static checkProductWiseApplicability(coupon, cart) {
    if (!coupon.applicableProducts || coupon.applicableProducts.length === 0) {
      return { applicable: false, reason: 'No applicable products defined' };
    }
    const applicableItems = cart.items.filter(item => 
      coupon.applicableProducts.includes(item.productId)
    );
    
    if (applicableItems.length === 0) {
      return { applicable: false, reason: 'No applicable products in cart' };
    }
    const applicableTotal = applicableItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
    
    return { 
      applicable: true, 
      applicableItems, 
      applicableTotal 
    };
  }
  static checkBxGyApplicability(coupon, cart) {
    if (!coupon.buyProducts || coupon.buyProducts.length === 0 ||
        !coupon.getProducts || coupon.getProducts.length === 0) {
      return { applicable: false, reason: 'Invalid BxGy configuration' };
    }
    const cartProducts = {};
    cart.items.forEach(item => {
      cartProducts[item.productId] = item.quantity;
    });
    let maxApplications = 0;
    
    for (const buyReq of coupon.buyProducts) {
      const cartQuantity = cartProducts[buyReq.productId] || 0;
      const possibleApplications = Math.floor(cartQuantity / buyReq.quantity);
      
      if (maxApplications === 0 || possibleApplications < maxApplications) {
        maxApplications = possibleApplications;
      }
    }
    const repetitionLimit = coupon.repetitionLimit || 1;
    maxApplications = Math.min(maxApplications, repetitionLimit);
    
    if (maxApplications === 0) {
      return { 
        applicable: false, 
        reason: 'Insufficient quantity of buy products' 
      };
    }
    return { 
      applicable: true, 
      maxApplications,
      cartProducts 
    };
  }

  static calculateDiscount(coupon, cart) {
    const applicability = this.isCouponApplicable(coupon, cart);
    
    if (!applicability.applicable) {
      return { discount: 0, ...applicability };
    }
    
    switch(coupon.type) {
      case 'CART_WISE':
         return this.calculateCartWiseDiscount(coupon, cart);
        
      case 'PRODUCT_WISE':
        return this.calculateProductWiseDiscount(coupon, cart);
        
      case 'BXGY':
        return this.calculateBXGYDiscountComplex(coupon, cart);
        
      default:
        return { discount: 0, reason: 'Unknown coupon type' };
    }
  }
  

  static calculateCartWiseDiscount(coupon, cartItems) {
    const cartTotal = cartItems.reduce(
        (sum, item) => sum + (item.price * item.quantity), 
        0
    );
    
    if (coupon.minCartValue && cartTotal < coupon.minCartValue) {
        return 0;
    }
    
    let discount = (cartTotal * coupon.discountValue) / 100;
    
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
    }
    return {
      discount,
      cartTotal,
      discountType: coupon.discountValue <= 100 ? 'percentage' : 'fixed'
    };
  }

  static calculateProductWiseDiscount(coupon, cartItems) {
    let eligibleItems = cartItems.filter(item => 
        coupon.applicableProducts.includes(item.productId)
    );
    
    if (eligibleItems.length === 0) return 0;
    
    let totalDiscount = 0;
    
    eligibleItems.forEach(item => {
        let itemDiscount = 0;
        
        if (coupon.discountType === 'PERCENTAGE') {
        itemDiscount = (item.price * item.quantity * coupon.discountValue) / 100;
        } else {
        itemDiscount = coupon.discountValue * item.quantity;
        }
        
        totalDiscount += itemDiscount;
    });
    
    if (coupon.maxDiscount && totalDiscount > coupon.maxDiscount) {
        totalDiscount = coupon.maxDiscount;
    }
      itemDiscounts.push({
        productId: item.productId,
        quantity: item.quantity,
        itemDiscount
      });
    
    return {
      discount: totalDiscount,
      itemDiscounts,
      discountType: coupon.discountValue <= 100 ? 'percentage' : 'fixed'
    };
  }
  
  static calculateBXGYDiscountComplex(coupon, cartItems) {
    if (coupon.type !== 'BXGY') return 0;
    
    const cartItemMap = new Map();
    cartItems.forEach(item => {
        cartItemMap.set(item.productId, item);
    });
    
    const hasBuyProducts = coupon.buyProducts.some(bp => 
        cartItemMap.has(bp.productId)
    );
    
    if (!hasBuyProducts) return 0;
    let totalBuyQuantity = 0;
    coupon.buyProducts.forEach(buyProduct => {
        const cartItem = cartItemMap.get(buyProduct.productId);
        if (cartItem) {
        totalBuyQuantity += cartItem.quantity;
        }
    });
    
    const requiredBuyPerSet = coupon.buyProducts.reduce(
        (sum, item) => sum + item.quantity, 
        0
    );
    
    let possibleSets = Math.floor(totalBuyQuantity / requiredBuyPerSet);
    
    coupon.buyProducts.forEach(buyProduct => {
        const cartItem = cartItemMap.get(buyProduct.productId);
        if (cartItem) {
        const individualSets = Math.floor(cartItem.quantity / buyProduct.quantity);
        possibleSets = Math.min(possibleSets, individualSets);
        } else {
        possibleSets = 0;
        }
    });
  
    if (possibleSets === 0) return 0;
    
    const repetitionLimit = coupon.repetitionLimit || 1;
    const applicableSets = Math.min(possibleSets, repetitionLimit);
    
    let totalDiscount = 0;
    let totalFreeItemsToGive = 0;
    
    coupon.getProducts.forEach(getProduct => {
        const freeItemsCount = getProduct.quantity * applicableSets;
        totalFreeItemsToGive += freeItemsCount;
        
        const cartItem = cartItemMap.get(getProduct.productId);
        if (cartItem) {
        const actualFree = Math.min(freeItemsCount, cartItem.quantity);
        totalDiscount += actualFree * cartItem.price;
        }
    });
    
    return {
      discount: totalDiscount,
      totalFreeItemsToGive,
      discountType: 'free_items'
    };
  }
  
  static applyCouponToCart(coupon, cart) {
    const discountResult = this.calculateDiscount(coupon, cart);
    
    if (discountResult.discount === 0) {
      throw new Error('Cannot apply coupon: ' + (discountResult.reason || 'Invalid coupon'));
    }
    
    const updatedCart = JSON.parse(JSON.stringify(cart));
    const cartTotal = this.calculateCartTotal(cart);
    switch(coupon.type) {
      case 'CART_WISE':
        // Update cart totals
        updatedCart.totalPrice = cartTotal;
        updatedCart.totalDiscount = discountResult.discount;
        updatedCart.finalPrice = cartTotal - discountResult.discount;
        break;
        
      case 'PRODUCT_WISE':
        discountResult.itemDiscounts.forEach(itemDiscount => {
          const item = updatedCart.items.find(i => i.productId === itemDiscount.productId);
          if (item) {
            item.totalDiscount = (item.totalDiscount || 0) + itemDiscount.itemDiscount;
            item.discountedPrice = (item.price * item.quantity) - item.totalDiscount;
          }
        });
        
        updatedCart.totalPrice = cartTotal;
        updatedCart.totalDiscount = discountResult.discount;
        updatedCart.finalPrice = cartTotal - discountResult.discount;
        break;
        
      case 'BXGY':
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
    
    applicableCoupons.sort((a, b) => b.discount - a.discount);    
    return applicableCoupons;
  }
}
