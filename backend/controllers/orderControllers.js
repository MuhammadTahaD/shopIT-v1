import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import Order from "../models/order.js";
import Product from "../models/product.js";
import ErrorHandler from "../utils/ErrorHandler.js";

// Create new Order => /api/v1/orders/new
export const newOrder = catchAsyncErrors(async (req, res, next) => {
    const {
        orderItems,
        shippingInfo,
        itemPrice,
        taxAmount,
        shippingAmount,
        totalAmount,
        paymentMethod,
        paymentInfo,
    } = req.body;

    if (!req.user || !req.user._id) {
        return next(new ErrorHandler("User not authenticated", 401));
    }

    const order = await Order.create({
        orderItems,
        shippingInfo,
        itemPrice,
        taxAmount,
        shippingAmount,
        totalAmount,
        paymentMethod,
        paymentInfo,
        user: req.user._id,
    });

    res.status(201).json({
        success: true,
        order,
    });
});

// Current User Orders => /api/v1/me/orders
export const myOrders = catchAsyncErrors(async (req, res, next) => {
    const orders = await Order.find({ user: req.user._id })
        .populate("user", "name email"); // Populate user info if needed

    res.status(200).json({
        success: true,
        orders,
    });
});

// Get Order Details => /api/v1/orders/:id
export const getOrderDetails = catchAsyncErrors(async (req, res, next) => {
    const order = await Order.findById(req.params.id)
        .populate("user", "name email");

    if (!order) {
        return next(new ErrorHandler("No Order found with this ID", 404));
    }

    res.status(200).json({
        success: true,
        order,
    });
});

// Get All Orders => /api/v1/admin/orders
export const allOrders = catchAsyncErrors(async (req, res, next) => {
    const orders = await Order.find()
        .populate("user", "name email");

    res.status(200).json({
        success: true,
        orders,
    });
});

// Update Orders - Admin => /api/v1/admin/orders/:id
export const updateOrder = catchAsyncErrors(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new ErrorHandler("No Order found with this ID", 404));
    }

    if (order.orderStatus === "Delivered") {
        return next(new ErrorHandler("You have already delivered this order", 400));
    }

    for (const item of order.orderItems) {
        const product = await Product.findById(item.product.toString());
        if (!product) {
            throw new ErrorHandler(`Product not found for ID: ${item.product}`, 404);
        }

        // Ensure quantity field matches your schema (use item.quantity or item.Quantity)
        product.stock = product.stock - item.quantity;
        await product.save({ validateBeforeSave: false });
    }

    order.orderStatus = req.body.status;
    order.deliveredAt = Date.now();
    await order.save();

    res.status(200).json({
        success: true,
        message: "Order updated successfully",
    });
});


// Delete Order => /api/v1/orders/:id
export const deleteOrder = catchAsyncErrors(async (req, res, next) => {
    const order = await Order.findById(req.params.id)

    if (!order) {
        return next(new ErrorHandler("No Order found with this ID", 404));
    }

    await order.deleteOne();
    res.status(200).json({
        success: true,
        order,
    });
});

