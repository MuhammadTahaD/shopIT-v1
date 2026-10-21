import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "../models/product.js";
import User from "../models/user.js";
import sustainableCatalog from "./sustainableCatalog.js";

dotenv.config({ path: "backend/config/config.env" });

const databaseUri = process.env.NODE_ENV === "PRODUCTION"
  ? process.env.DB_URI
  : process.env.DB_LOCAL_URI;

if (!databaseUri) {
  console.error("Set DB_LOCAL_URI (development) or DB_URI (production) in backend/config/config.env.");
  process.exit(1);
}

try {
  await mongoose.connect(databaseUri);
  const admin = await User.findOne({ role: "admin" }).select("_id");
  if (!admin) {
    throw new Error("Create an admin account before adding the demo catalog.");
  }

  for (const item of sustainableCatalog) {
    const { asin, image, amazonUrl, sku, ...fields } = item;
    const legacyProduct = await Product.findOne({
      sku: { $exists: false },
      "images.public_id": `amazon-${asin}`,
    }).select("_id").lean();

    if (legacyProduct) {
      await Product.updateOne({ _id: legacyProduct._id }, { $set: { sku } });
      console.log(`Updated catalog SKU: ${fields.name} (${amazonUrl})`);
      continue;
    }

    const result = await Product.updateOne(
      { sku },
      {
        $setOnInsert: {
          sku,
          ...fields,
          images: [{ public_id: `amazon-${asin}`, url: image }],
          user: admin._id,
        },
      },
      { upsert: true, runValidators: true },
    );
    console.log(`${result.upsertedCount ? "Added" : "Already present"}: ${fields.name} (${amazonUrl})`);
  }

  console.log(`Added missing sustainable catalog items; existing items were left untouched.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
