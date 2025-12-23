import express from 'express';
import {couponController} from '../controllers/couponController.js';
const router = express.Router();

// Coupon CRUD operations
router.post('/coupons', couponController.createCoupon);
router.get('/coupons', couponController.getAllCoupons);
router.get('/coupons/:id', couponController.getCouponById);
router.put('/coupons/:id', couponController.updateCoupon);
router.delete('/coupons/:id', couponController.deleteCoupon);

// Coupon application
router.post('/applicable-coupons', couponController.getApplicableCoupons);
router.post('/apply-coupon/:id', couponController.applyCoupon);

export default router;