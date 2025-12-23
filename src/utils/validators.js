import Joi from 'joi';

// Common product schema for buyProducts and getProducts
const buyGetProductSchema = Joi.object({
  productId: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().positive().required(),
  productName: Joi.string().optional(),
  price: Joi.number().positive().optional()
});

// Base coupon schema with common fields
const baseCouponSchema = Joi.object({
  code: Joi.string().required().trim().uppercase().min(3).max(20),
  type: Joi.string().valid('CART_WISE', 'PRODUCT_WISE', 'BXGY').required(),
  discountValue: Joi.number().min(0),
  minCartValue: Joi.number().min(0).default(0),
  maxDiscount: Joi.number().min(0).allow(null),
  applicableProducts: Joi.array().items(Joi.number().integer().positive()),
  buyProducts: Joi.array().items(buyGetProductSchema),
  getProducts: Joi.array().items(buyGetProductSchema),
  repetitionLimit: Joi.number().integer().min(1).default(1),
  expirationDate: Joi.date().iso().greater('now'),
  isActive: Joi.boolean().default(true),
  usageLimit: Joi.number().integer().positive().allow(null),
  currentUsage: Joi.number().integer().min(0).default(0)
});

// CART_WISE Coupon Schema
const cartWiseSchema = baseCouponSchema.keys({
  type: Joi.string().valid('CART_WISE').required(),
  discountValue: Joi.number()
    .min(1).max(100)
    .required()
    .label('Discount Percentage'),
  discountType: Joi.string()
    .valid('PERCENTAGE')
    .default('PERCENTAGE')
    .label('Discount Type'),
  applicableProducts: Joi.forbidden().messages({
    'any.unknown': 'applicableProducts is not allowed for CART_WISE coupons'
  }),
  buyProducts: Joi.forbidden().messages({
    'any.unknown': 'buyProducts is not allowed for CART_WISE coupons'
  }),
  getProducts: Joi.forbidden().messages({
    'any.unknown': 'getProducts is not allowed for CART_WISE coupons'
  })
});

// PRODUCT_WISE Coupon Schema
const productWiseSchema = baseCouponSchema.keys({
  type: Joi.string().valid('PRODUCT_WISE').required(),
  discountValue: Joi.number()
    .positive()
    .required()
    .label('Discount Value'),
  discountType: Joi.string()
    .valid('PERCENTAGE', 'FIXED_AMOUNT')
    .required()
    .label('Discount Type'),
  applicableProducts: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .required()
    .label('Applicable Products'),
  buyProducts: Joi.forbidden().messages({
    'any.unknown': 'buyProducts is not allowed for PRODUCT_WISE coupons'
  }),
  getProducts: Joi.forbidden().messages({
    'any.unknown': 'getProducts is not allowed for PRODUCT_WISE coupons'
  })
}).custom((value, helpers) => {
  // Additional validation: For percentage discount, limit to 100%
  if (value.discountType === 'PERCENTAGE' && value.discountValue > 100) {
    return helpers.error('any.invalid', {
      message: 'Percentage discount cannot exceed 100%'
    });
  }
  return value;
}, 'Discount value validation');

// BXGY Coupon Schema
const bxgySchema = baseCouponSchema.keys({
  type: Joi.string().valid('BXGY').required(),
  discountValue: Joi.number()
    .min(0)
    .default(0)
    .label('Discount Value'),
  discountType: Joi.forbidden().messages({
    'any.unknown': 'discountType is not applicable for BXGY coupons'
  }),
  applicableProducts: Joi.forbidden().messages({
    'any.unknown': 'applicableProducts is not allowed for BXGY coupons'
  }),
  buyProducts: Joi.array()
    .items(buyGetProductSchema)
    .min(1)
    .required()
    .label('Buy Products'),
  getProducts: Joi.array()
    .items(buyGetProductSchema)
    .min(1)
    .required()
    .label('Get Products')
}).custom((value, helpers) => {
    console.log(value);
  // Custom validation for BXGY
  
  // 1. Ensure buyProducts and getProducts have unique productIds
  const buyProductIds = value.buyProducts.map(p => p.productId);
  const getProductIds = value.getProducts.map(p => p.productId);
  
  // Check for duplicates within each array
  if (new Set(buyProductIds).size !== buyProductIds.length) {
    return helpers.error('any.invalid', {
      message: 'Buy products must have unique product IDs'
    });
  }
  
  if (new Set(getProductIds).size !== getProductIds.length) {
    return helpers.error('any.invalid', {
      message: 'Get products must have unique product IDs'
    });
  }
  
  // 2. Ensure no overlap between buy and get products
  const overlap = buyProductIds.filter(id => getProductIds.includes(id));
  if (overlap.length > 0) {
    return helpers.error('any.invalid', {
      message: 'Product cannot be both in buyProducts and getProducts'
    });
  }
  
  // 3. Validate buy quantities are positive (already done by schema, but double-check)
  const invalidBuy = value.buyProducts.find(p => p.quantity <= 0);
  if (invalidBuy) {
    return helpers.error('any.invalid', {
      message: 'Buy product quantities must be positive'
    });
  }
  
  // 4. Validate get quantities are positive (already done by schema, but double-check)
  const invalidGet = value.getProducts.find(p => p.quantity <= 0);
  if (invalidGet) {
    return helpers.error('any.invalid', {
      message: 'Get product quantities must be positive'
    });
  }
  
  return value;
}, 'BXGY validation');

// Cart validation schema
const cartSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      productId: Joi.number().integer().positive().required(),
      quantity: Joi.number().integer().positive().required(),
      price: Joi.number().positive().required()
    })
  ).required().min(1)
});

// Validate cart data
export function validateCart(data) {
  return cartSchema.validate(data, { abortEarly: false });
}

// Main coupon validation function
export function validateCoupon(data, isUpdate = false) {
  let schema;
  
  // If no type specified and not an update, we can't determine which schema to use
  if (!data.type && !isUpdate) {
    // For creation, type is required
    const genericSchema = baseCouponSchema.fork(['type'], (field) => field.required());
    return genericSchema.validate(data, { abortEarly: false, stripUnknown: true });
  }
  
  // Determine which schema to use based on type
  switch(data.type) {
    case 'CART_WISE':
      schema = cartWiseSchema;
      break;
    case 'PRODUCT_WISE':
      schema = productWiseSchema;
      break;
    case 'BXGY':
      schema = bxgySchema;
      break;
    default:
      // If no type specified (for update), create conditional schema
      schema = Joi.alternatives().try(
        cartWiseSchema,
        productWiseSchema,
        bxgySchema
      ).match('one');
  }
  
  // For updates, make all fields optional
  if (isUpdate) {
    if (data.type) {
      // Create optional version of the specific schema
      schema = schema.fork(Object.keys(schema.describe().keys), (field) => field.optional());
    } else {
      // If updating without specifying type, make a conditional optional schema
      const optionalCartWise = cartWiseSchema.fork(
        Object.keys(cartWiseSchema.describe().keys), 
        (field) => field.optional()
      );
      const optionalProductWise = productWiseSchema.fork(
        Object.keys(productWiseSchema.describe().keys), 
        (field) => field.optional()
      );
      const optionalBxgy = bxgySchema.fork(
        Object.keys(bxgySchema.describe().keys), 
        (field) => field.optional()
      );
      
      schema = Joi.alternatives().try(
        optionalCartWise,
        optionalProductWise,
        optionalBxgy
      ).match('one');
    }
  }
  
  return schema.validate(data, { 
    abortEarly: false,
    stripUnknown: true,
    errors: {
      wrap: {
        label: false
      }
    }
  });
}
