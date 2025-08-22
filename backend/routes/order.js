import express from "express";
import { isAuthenticatedUser, authorizeRoles } from "../middlewares/auth.js";
import { allOrders, getOrderDetails, myOrders, newOrder, updateOrder, deleteOrder } from "../controllers/orderControllers.js";

const router = express.Router();

router.route('/orders/new').post(isAuthenticatedUser, newOrder);
router.route('/orders/:id').get(isAuthenticatedUser, getOrderDetails);
router.route('/me/orders').get(isAuthenticatedUser, myOrders);


router
.route('/admin/orders')
.get(isAuthenticatedUser,authorizeRoles("admin") , allOrders);

router
.route('/admin/orders/:id')
.put(isAuthenticatedUser,authorizeRoles("admin") , updateOrder)
.delete(isAuthenticatedUser,authorizeRoles("admin") , deleteOrder);

export default router;