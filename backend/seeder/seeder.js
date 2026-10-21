import mongoose from "mongoose";
import products from "./data.js";
import Product from "../models/product.js";
import User from "../models/user.js";

const seedProducts = async () => {
    try {
        await mongoose.connect("mongodb://localhost:27017/shopit-v2");

        const admin = await User.findOne({ role: "admin" }).select("_id");
        if (!admin) {
            throw new Error("Create an admin user before running the sample data seeder");
        }

        await Product.deleteMany();
        console.log("Products are deleted");

        await Product.insertMany(products.map((product) => ({ ...product, user: admin._id })));
        console.log("Products are added");

        process.exit();
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
};

seedProducts();
