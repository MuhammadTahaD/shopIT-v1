import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    shippingInfo: {
        address: { type: String, required: true },
        city: { type: String, required: true },
        phoneNo: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, required: true },
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    orderItems: [
        {
            name: { type: String, required: true },
            Quantity: { type: String, required: true },
            image: { type: String, required: true },
            price: { type: String, required: true },
            product: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: "Product",
            },
        },
    ],
    paymentMethod: {
        type: String,
        required: [true, 'Please select payment method'],
        enum: ["COD", "Card"]
    },
    paymentInfo: {
        id: String,
        status: String,
    },
    itemPrice: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    shippingAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    orderStatus: {
        type: String,
        enum: ["Processing", "Shipping", "Delivered"],
        default: "Processing",
    },
    deliveredAt: Date,
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
