A RESTful API for managing and applying different types of discount coupons (cart-wise, product-wise, and BxGy) for an e-commerce platform. The system is designed with extensibility in mind to easily add new coupon types in the future.

## Tech Stack

- **Framework**: Express.js (Node.js)
- **Database**: mongodb (with NoSQL)
- **Language**: JavaScript
- **Validation**: Joi

## Setup & Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd coupon-management-api

# Install dependencies
npm install

# Build the project
npm run build

# Run the application
npm start

# Run in development mode
npm run dev

```

## API Endpoints

### 1. Coupon Management

- `POST /coupons` - Create a new coupon
- `GET /coupons` - Retrieve all coupons
- `GET /coupons/:id` - Retrieve a specific coupon
- `PUT /coupons/:id` - Update a coupon
- `DELETE /coupons/:id` - Delete a coupon

### 2. Coupon Application

- `POST /applicable-coupons` - Fetch applicable coupons for a cart
- `POST /apply-coupon/:id` - Apply a specific coupon to a cart

## Database Schema

### Coupon Model

```tsx
interface Coupon {
  id: string;
  code: string;
  type: 'CART_WISE' | 'PRODUCT_WISE' | 'BXGY';
  discountValue: number;
  minCartValue?: number;
  maxDiscount?: number;
  applicableProducts?: number[]; // For product-wise
  buyProducts?: Array<{productId: number, quantity: number}>; // For BxGy
  getProducts?: Array<{productId: number, quantity: number}>; // For BxGy
  repetitionLimit?: number; // For BxGy
  expirationDate?: Date;
  isActive: boolean;
  usageLimit?: number;
  currentUsage: number;
}

```

## Implemented Features

### ✅ Fully Implemented Cases

### 1. Cart-wise Coupons

- **Percentage Discount**: `X% off on cart above ₹Y`
    - Example: 10% off on carts over ₹1000
    - Condition: Cart total > ₹1000
    - Discount: 10% of cart total
    - Max discount cap support
- **Fixed Amount Discount**: `₹X off on cart above ₹Y`
    - Example: ₹200 off on carts over ₹1500
    - Condition: Cart total > ₹1500
    - Discount: Fixed ₹200

### 2. Product-wise Coupons

- **Percentage Discount on Specific Products**
    - Example: 20% off on Product A
    - Condition: Product A must be in cart
    - Discount: 20% off on Product A only
- **Fixed Amount Discount on Specific Products**
    - Example: ₹50 off on Product B
    - Condition: Product B must be in cart
    - Discount: Fixed ₹50 off Product B price
- **Multiple Product Discounts**
    - Apply discount to multiple specific products
    - Different discounts for different products

### 3. BxGy (Buy X Get Y) Coupons

- **Basic BxGy**: Buy X items, get Y items free
    - Example: Buy 2 of [A,B,C], get 1 of [X,Y] free
    - Repetition limit support
    - Partial application support
- **Quantity-based BxGy**:
    - Example: Buy 3 units of Product X, get 1 unit of Product Y free
    - Different quantities for buy and get products
- **Complex BxGy Combinations**:
    - Multiple products in buy array
    - Multiple products in get array
    - Different quantity requirements

### 4. Validation & Constraints

- **Coupon Expiration**: Valid from/to dates
- **Usage Limits**: Per coupon and per user limits
- **Minimum Cart Value**: Required cart total
- **Product Availability**: Products must exist in cart
- **Active/Inactive Status**: Coupon activation control
- **Stacking Rules**: Cannot combine with other coupons (basic)

### 5. Business Logic

- **Discount Calculation**: Proper rounding and precision
- **Maximum Discount Cap**: Prevent excessive discounts
- **No Negative Totals**: Ensure final price ≥ 0
- **Partial Application**: Apply only to eligible items
- **Repetition Limits**: For BxGy coupons

### ⚠️ Partially Implemented Cases

### 1. Advanced BxGy Scenarios

- [~] **Tiered BxGy**: Buy more, get more free
    - Example: Buy 2 get 1 free, Buy 4 get 2 free
- [~] **Cross-category BxGy**: Buy from category X, get from category Y
- [~] **BxGy with Percentage**: Buy X get Y% off instead of free

### 2. Complex Constraints

- [~] **User-specific Coupons**: New users only, loyal customers only
- [~] **Time-based Constraints**: Valid only on weekends/holidays
- [~] **First Purchase Coupons**: Only for first order

### ❌ Identified but Not Implemented Cases

### 1. Advanced Coupon Types

- **Bundle Discounts**: Buy A+B together get discount
- **Tiered Discounts**: Spend more, save more (10% off ₹1000, 15% off ₹2000)
- **Loyalty Point Redemption**: Use points as discount
- **Cashback Coupons**: Get cashback on next purchase
- **Referral Coupons**: Friend referral discounts

### 2. Complex Business Rules

- **Coupon Stacking**: Multiple coupons on same cart
- **Priority Rules**: Which coupon applies first
- **Exclusive Coupons**: Cannot use with any other offer
- **Category-wide Discounts**: All electronics 10% off
- **Brand-specific Discounts**: Nike products 15% off

### 3. User-specific Features

- **Personalized Coupons**: Based on user behavior
- **Birthday Coupons**: Auto-generated on birthdays
- **Abandoned Cart Coupons**: Win-back discounts
- **VIP Coupons**: For premium customers

### 4. Advanced BxGy Variations

- **Buy X Get Different Y**: Buy shampoo get conditioner free
- **Mix & Match**: Buy any 3 from category get 1 free
- **Upgrade Coupons**: Buy regular get premium at discount
- **Service Coupons**: Buy product get free installation

### 5. Administrative Features

- **Bulk Coupon Generation**: Create 1000 coupons at once
- **Coupon Campaigns**: Scheduled campaigns
- **A/B Testing**: Test coupon effectiveness
- **Analytics Dashboard**: Coupon performance metrics
- **Geographic Restrictions**: Only valid in certain regions

### 6. Edge Cases & Validation

- **Partial Refunds**: How to handle when coupon was used
- **Price Changes**: Coupon applied before price change
- **Out of Stock**: Product goes out of stock after coupon application
- **Cart Modifications**: Adding/removing items after coupon
- **Currency Conversion**: Multi-currency support

### 7. Performance & Scale

- **High Volume**: Handling thousands of concurrent coupon checks
- **Caching**: Frequently used coupons
- **Database Optimization**: Indexing for coupon queries
- **Distributed Systems**: Multiple API instances

### 8. Integration Features

- **Webhook Notifications**: When coupon is used
- **Real-time Updates**: Live coupon status
- **External System Sync**: With CRM/ERP systems
- **Mobile SDK**: For mobile app integration

### 9. Security Considerations

- **Coupon Guessing Prevention**: Secure coupon codes
- **Fraud Detection**: Abnormal usage patterns
- **Rate Limiting**: Prevent brute force attacks
- **Audit Logs**: Who applied which coupon when

### 10. Advanced Analytics

- **ROI Calculation**: Revenue vs discount given
- **Customer Segmentation**: Who uses which coupons
- **Effectiveness Metrics**: Conversion rate with/without coupons
- **Cannibalization Analysis**: Are coupons reducing regular sales?

## Assumptions Made

### 1. Business Logic Assumptions

- All prices are in the same currency (₹)
- Products have fixed prices (no dynamic pricing)
- Tax calculation happens after discount application
- One active coupon can be applied at a time (for simplicity)
- Coupon codes are unique and case-sensitive
- Cart items cannot have zero or negative quantities
- Products in cart are always available (no stock validation)

### 2. Technical Assumptions

- Database is SQLite for development simplicity
- No authentication/authorization implemented
- Single server instance (no clustering)
- In-memory cart storage (not persisted)
- No real-time updates to clients
- Basic error handling without detailed logging

### 3. Coupon Application Assumptions

- Coupons are applied to cart subtotal (excluding tax/shipping)
- Discounts are calculated per line item where applicable
- BxGy free items show as 100% discount on those items
- Percentage discounts are rounded to 2 decimal places
- If multiple BxGy patterns match, first match is applied

## Limitations

### 1. Current Implementation Limitations

- **No User Management**: No user authentication/authorization
- **No Persistence**: Carts are stored in memory (lost on restart)
- **Single Currency**: Only supports one currency
- **Basic Error Handling**: Limited error messages
- **No Caching**: Every request hits the database
- **No Rate Limiting**: Could be abused
- **Simple Validation**: No complex business rule validation

### 2. Performance Limitations

- **No Indexing**: Database queries could be slow with large data
- **No Caching**: Frequently accessed data not cached
- **Synchronous Processing**: No async job processing
- **No Load Balancing**: Single instance bottleneck

### 3. Feature Limitations

- **No Coupon Stacking**: Cannot apply multiple coupons
- **No Partial Application**: Cannot partially apply some coupons
- **No Schedule**: Cannot schedule coupon activation
- **No Bulk Operations**: Single coupon operations only
- **No Export/Import**: Manual data management

### 4. Scalability Limitations

- **Single Database**: No read replicas
- **No Sharding**: All data in one database
- **Memory Limits**: In-memory cart storage
- **No Queue System**: Synchronous processing

## Example Requests & Responses

### 1. Create Cart-wise Coupon

```json
POST /coupons
{
  "code": "SAVE10",
  "type": "CART_WISE",
  "discountValue": 10,
  "minCartValue": 1000,
  "maxDiscount": 500,
  "expirationDate": "2025-12-31",
  "usageLimit": 1000
}

```

### 2. Create Product-wise Coupon

```json
POST /coupons
{
  "code": "PROD20",
  "type": "PRODUCT_WISE",
  "discountValue": 20,
  "applicableProducts": [101, 102, 103],
  "expirationDate": "2025-12-31"
}

```

### 3. Create BxGy Coupon

```json
POST /coupons
{
  "code": "BUY2GET1",
  "type": "BXGY",
  "buyProducts": [
    {"productId": 101, "quantity": 2},
    {"productId": 102, "quantity": 2}
  ],
  "getProducts": [
    {"productId": 201, "quantity": 1}
  ],
  "repetitionLimit": 3,
  "expirationDate": "2025-12-31"
}

```

### 4. Check Applicable Coupons

```json
POST /applicable-coupons
{
  "cart": {
    "items": [
      {"productId": 101, "quantity": 3, "price": 500},
      {"productId": 102, "quantity": 2, "price": 300},
      {"productId": 201, "quantity": 1, "price": 200}
    ]
  }
}

```

## Future Extensibility

### 1. Adding New Coupon Types

1. Create new class implementing `CouponStrategy`
2. Add to `CouponFactory`
3. Update validation schemas
4. Add to API documentation

### 2. Adding New Constraints

1. Extend constraint validation system
2. Add new constraint types
3. Update coupon validation logic

### 3. Performance Improvements

1. Add Redis caching
2. Implement database indexing
3. Add query optimization
4. Implement connection pooling

## Testing Strategy

### Unit Tests

- Coupon validation logic
- Discount calculation algorithms
- Business rule validation

### Integration Tests

- API endpoint testing
- Database operations
- End-to-end coupon application

### Edge Case Tests

- Empty cart scenarios
- Maximum discount scenarios
- Expired coupon handling
- Usage limit scenarios

### CURL for each 

- for CART_WISE

```
curl --location 'http://localhost:3000/api/coupons' \
--header 'Content-Type: application/json' \
--data '{
    "code": "SAVE120",
    "type": "CART_WISE",
    "discountValue": 10,
    "minCartValue": 1000,
    "maxDiscount": 500,
    "expirationDate": "2025-12-31",
    "usageLimit": 1000,
    "isActive": true
  }'

```

- PRODUCT_WISE

```
curl --location 'http://localhost:3000/api/coupons' \
--header 'Content-Type: application/json' \
--data '{
    "code": "PROD21",
    "type": "PRODUCT_WISE",
    "discountValue": 20,
    "discountType" : "PERCENTAGE",
    "applicableProducts": [101, 102, 103],
    "expirationDate": "2025-12-31",
    "isActive": true
  }'

```

- BUY10GET2

```
curl --location 'http://localhost:3000/api/coupons' \
--header 'Content-Type: application/json' \
--data '{
  "code": "BUY10GET2",
  "type": "BXGY",
  "buyProducts": [
    {"productName": "101", "price": 2, "productId": 101, "quantity": 10},
    {"productName": "102", "price": 2, "productId": 102, "quantity": 10}
  ],
  "getProducts": [
    {"productName": "201", "price": 1, "productId": 201, "quantity": 1},
    {"productName": "202", "price": 2, "productId": 202, "quantity": 1}
  ],
  "repetitionLimit": 3,
  "expirationDate": "2025-12-31",
  "isActive": true
}'

```

- GET ALL

```
curl --location 'http://localhost:3000/api/coupons'

```

- GET BASED ON CODE

```
curl --location 'http://localhost:3000/api/coupons/BUY10GET2'

```

- PUT OPERATION

```
curl --location --request PUT 'http://localhost:3000/api/coupons/SAVE120' \
--header 'Content-Type: application/json' \
--data '{
    "code": "SAVE131",
    "type": "CART_WISE",
    "discountValue": 15,
    "minCartValue": 100,
    "expirationDate": "2026-12-31",
    "isActive": false
  }'

```

- DELETE COUPON

```
curl --location --request DELETE 'http://localhost:3000/api/coupons/SAVE131'

```