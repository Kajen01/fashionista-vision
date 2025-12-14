import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Product from "./models/productModel.js";
import dotenv from "dotenv";

dotenv.config();

const IMAGE_BASE_PATH = "./uploads/mongodb_dataset";

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Expected filename format:
 * gender_color_digits.jpg
 * example: girls_black_001.jpg
 */
function parseImageName(filename) {
  const nameWithoutExt = filename.toLowerCase().split(".")[0];
  const parts = nameWithoutExt.split("_");

  if (parts.length < 3) {
    return { gender: "Unisex", color: "Unknown" };
  }

  const genderRaw = parts[0];
  const colorRaw = parts[1];

  let gender = "Unisex";
  if (genderRaw === "girls") gender = "Girls";
  if (genderRaw === "women") gender = "Women";
  else if (genderRaw === "boys") gender = "Boys";
  else if (genderRaw === "men") gender = "Men";
  else if (genderRaw === "unisex") gender = "Unisex";

  const color =
    colorRaw.charAt(0).toUpperCase() + colorRaw.slice(1);

  return { gender, color };
}

const DESCRIPTIONS = [
  "Elegant and comfortable design.",
  "Perfect for casual and formal occasions.",
  "High-quality fabric with excellent durability.",
  "Trendy style with a modern touch.",
  "Soft and breathable material for all-day comfort.",
  "Unique design that stands out effortlessly.",
  "Lightweight and stylish for daily wear.",
  "Premium stitching with a flawless finish.",
  "Fashionable choice for any wardrobe.",
  "Simple, clean, and always in style."
];

const AVAILABLE_SIZES = ["Free Size", "XS", "S", "M", "L", "XL"];
const AVAILABLE_COLORS = ["Black", "White", "Navy", "Beige"];

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("DB error:", err);
    process.exit(1);
  }
}

async function uploadAllDresses() {
  await connectDB();

  const dressFolders = fs.readdirSync(IMAGE_BASE_PATH);

  for (const folderName of dressFolders) {
    const folderPath = path.join(IMAGE_BASE_PATH, folderName);

    if (!fs.lstatSync(folderPath).isDirectory()) continue;

    // folder → product name
    const cleanedName = folderName.replace(/_/g, " ");

    const imageFiles = fs
      .readdirSync(folderPath)
      .filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file));

    for (const file of imageFiles) {
      const randomDescription = DESCRIPTIONS[randomInt(0, DESCRIPTIONS.length - 1)];
      const randomPrice = randomInt(50, 80) * 100;
      const randomDiscount = randomInt(10, 20);

      const { gender, color } = parseImageName(file);
      const finalAvailableColors = color === "Unknown" ? AVAILABLE_COLORS : [color];

      const product = {
        name: cleanedName,
        description: randomDescription,
        price: randomPrice,
        discount: randomDiscount,
        availableSizes: AVAILABLE_SIZES,
        availableColors: finalAvailableColors,
        gender,
        image: {
          filename: file,
          url: `/uploads/mongodb_dataset/${encodeURIComponent(folderName)}/${file}`
        }
      };

      await Product.create(product);
      console.log(`Created: ${cleanedName} | ${gender} | ${color} => ${file}`);
    }
  }

  console.log("All products uploaded successfully!");
  process.exit();
}

uploadAllDresses();
