import { readFile } from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "../models/product.js";
import User from "../models/user.js";

dotenv.config({ path: "backend/config/config.env" });

const usage = "Usage: node backend/seeder/importProducts.js <file.json|file.csv> [--dry-run]";
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const fileArgs = args.filter((arg) => arg !== "--dry-run");

if (fileArgs.length !== 1) {
  console.error(usage);
  process.exit(1);
}

const filePath = path.resolve(process.cwd(), fileArgs[0]);
const fileExtension = path.extname(filePath).toLowerCase();
if (!['.json', '.csv'].includes(fileExtension)) {
  console.error("Product files must use .json or .csv format.");
  process.exit(1);
}

function parseCsv(source) {
  const records = [];
  let cells = [];
  let value = "";
  let quoted = false;
  let line = 1;
  let recordLine = 1;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        value += character;
        if (character === "\n") line += 1;
      }
      continue;
    }

    if (character === '"' && value.length === 0) {
      quoted = true;
    } else if (character === ",") {
      cells.push(value);
      value = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      cells.push(value);
      if (cells.some((cell) => cell.trim() !== "")) records.push({ line: recordLine, cells });
      cells = [];
      value = "";
      line += 1;
      recordLine = line;
    } else {
      value += character;
    }
  }

  if (quoted) throw new Error(`Unclosed quoted value near CSV line ${recordLine}.`);
  if (value.length || cells.length) {
    cells.push(value);
    if (cells.some((cell) => cell.trim() !== "")) records.push({ line: recordLine, cells });
  }
  if (!records.length) throw new Error("The CSV file is empty.");

  const headers = records[0].cells.map((header, index) =>
    index === 0 ? header.replace(/^\uFEFF/, "").trim() : header.trim(),
  );
  if (headers.some((header) => !header)) throw new Error("CSV headers cannot be empty.");
  if (new Set(headers).size !== headers.length) throw new Error("CSV headers must be unique.");

  return records.slice(1).map(({ line: rowNumber, cells: row }) => {
    if (row.length !== headers.length) {
      return { rowNumber, values: null, error: `Expected ${headers.length} columns, found ${row.length}.` };
    }
    return {
      rowNumber,
      values: Object.fromEntries(headers.map((header, index) => [header, row[index].trim()])),
    };
  });
}

function parseRows(contents) {
  if (fileExtension === ".json") {
    const items = JSON.parse(contents);
    if (!Array.isArray(items)) throw new Error("JSON product imports must be an array of objects.");
    return items.map((values, index) => ({ rowNumber: index + 1, values }));
  }
  return parseCsv(contents);
}

function prepareRow(values, adminId) {
  if (!values || typeof values !== "object" || Array.isArray(values)) {
    throw new Error("Each product row must be an object.");
  }

  const product = { ...values, user: adminId };
  for (const field of ["price", "ratings", "stock", "numOfReviews"]) {
    if (typeof product[field] === "string" && product[field].trim() !== "") {
      product[field] = Number(product[field]);
    }
  }
  for (const field of ["images", "reviews"]) {
    if (typeof product[field] === "string" && product[field].trim() !== "") {
      product[field] = JSON.parse(product[field]);
    }
  }
  return product;
}

function canonical(value) {
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value.toHexString === "function") return value.toHexString();
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}

async function main() {
  const contents = await readFile(filePath, "utf8");
  const rows = parseRows(contents);
  const databaseUri = process.env.NODE_ENV === "PRODUCTION"
    ? process.env.DB_URI
    : process.env.DB_LOCAL_URI;
  if (!databaseUri) {
    throw new Error("Set DB_LOCAL_URI (development) or DB_URI (production) in backend/config/config.env.");
  }

  await mongoose.connect(databaseUri, { autoIndex: !dryRun });
  const admin = await User.findOne({ role: "admin" }).select("_id");
  if (!admin) throw new Error("No admin user exists. Create an admin account before importing products.");

  const validRows = [];
  const invalidRows = [];
  const seenSkus = new Set();

  for (const row of rows) {
    if (row.error) {
      invalidRows.push({ rowNumber: row.rowNumber, reason: row.error });
      continue;
    }

    try {
      const document = new Product(prepareRow(row.values, admin._id));
      await document.validate();
      if (seenSkus.has(document.sku)) {
        throw new Error(`Duplicate SKU "${document.sku}" in this import file.`);
      }
      seenSkus.add(document.sku);
      validRows.push({ rowNumber: row.rowNumber, document });
    } catch (error) {
      invalidRows.push({ rowNumber: row.rowNumber, reason: error.message });
    }
  }

  const skus = validRows.map(({ document }) => document.sku);
  const existing = await Product.find({ sku: { $in: skus } }).lean();
  const existingBySku = new Map(existing.map((product) => [product.sku, product]));
  const operations = [];
  let unchanged = 0;
  let insertCount = 0;
  let updateCount = 0;

  for (const { rowNumber, document } of validRows) {
    const payload = document.toObject({ depopulate: true, versionKey: false });
    delete payload._id;
    delete payload.createdAt;
    delete payload.updatedAt;

    const stored = existingBySku.get(document.sku);
    if (stored) {
      const currentPayload = Object.fromEntries(
        Object.keys(payload).map((key) => [key, stored[key]]),
      );
      if (JSON.stringify(canonical(payload)) === JSON.stringify(canonical(currentPayload))) {
        unchanged += 1;
        continue;
      }
      updateCount += 1;
    } else {
      insertCount += 1;
    }

    operations.push({
      rowNumber,
      operation: {
        updateOne: {
          filter: { sku: document.sku },
          update: { $set: payload },
          upsert: true,
        },
      },
    });
  }

  if (dryRun) {
    console.log(`Dry run: ${insertCount} would insert, ${updateCount} would update, ${invalidRows.length} invalid, ${unchanged} unchanged.`);
  } else if (operations.length) {
    try {
      const result = await Product.bulkWrite(operations.map(({ operation }) => operation), { ordered: false });
      console.log(`Import complete: ${result.upsertedCount || 0} inserted, ${result.matchedCount || 0} updated, ${invalidRows.length} invalid, ${unchanged} unchanged.`);
    } catch (error) {
      const writeErrors = error.writeErrors || error.result?.getWriteErrors?.() || [];
      for (const writeError of writeErrors) {
        const failedOperation = operations[writeError.index];
        invalidRows.push({ rowNumber: failedOperation?.rowNumber || "?", reason: writeError.errmsg || writeError.message });
      }
      const result = error.result;
      console.log(`Import partial: ${result?.upsertedCount || 0} inserted, ${result?.matchedCount || 0} updated, ${invalidRows.length} invalid, ${unchanged} unchanged.`);
    }
  } else {
    console.log(`Import complete: 0 inserted, 0 updated, ${invalidRows.length} invalid, ${unchanged} unchanged.`);
  }

  for (const invalid of invalidRows) {
    console.error(`Row ${invalid.rowNumber}: ${invalid.reason}`);
  }
}

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
