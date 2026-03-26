import Product from "../models/productModel.js";
import path from "path";

const ALLOWED_GENDERS = ["Girls", "Boys", "Men", "Women", "Unisex"];

function parseNumberField(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsedValue = Number(value);

  if (Number.isNaN(parsedValue)) {
    const error = new Error(`${fieldName} must be a valid number.`);
    error.statusCode = 400;
    throw error;
  }

  return parsedValue;
}

function parseArrayField(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return [];
    }

    if (trimmedValue.startsWith("[")) {
      try {
        const parsedJson = JSON.parse(trimmedValue);

        if (Array.isArray(parsedJson)) {
          return parsedJson.map((item) => String(item).trim()).filter(Boolean);
        }
      } catch (error) {
        // Fall back to comma-separated parsing below.
      }
    }

    return trimmedValue.split(",").map((item) => item.trim()).filter(Boolean);
  }

  return undefined;
}

function buildImagePayload(file) {
  if (!file) {
    return undefined;
  }

  return {
    filename: file.filename,
    url: `/uploads/${file.filename}`,
  };
}

function parseProductPayload(body) {
  const name = typeof body.name === "string" ? body.name.trim() : undefined;
  const description = typeof body.description === "string" ? body.description.trim() : undefined;
  const gender = typeof body.gender === "string" ? body.gender.trim() : undefined;
  const price = parseNumberField(body.price, "Price");
  const discount = parseNumberField(body.discount, "Discount");
  const availableSizes = parseArrayField(body.availableSizes);
  const availableColors = parseArrayField(body.availableColors);

  if (gender !== undefined && !ALLOWED_GENDERS.includes(gender)) {
    const error = new Error("Gender must be one of Girls, Boys, Men, Women, or Unisex.");
    error.statusCode = 400;
    throw error;
  }

  return {
    name,
    description,
    gender,
    price,
    discount,
    availableSizes,
    availableColors,
  };
}

// Create a new product (with optional image upload)
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      discount,
      availableSizes,
      availableColors,
      gender,
    } = parseProductPayload(req.body);

    if (!name || !description || price === undefined || discount === undefined || !gender) {
      return res.status(400).json({
        message: "Name, description, price, discount, gender, and one image are required.",
      });
    }

    const image = buildImagePayload(req.file);

    if (!image) {
      return res.status(400).json({ message: "A product image is required." });
    }

    const product = await Product.create({
      name,
      description,
      price,
      discount,
      availableSizes,
      availableColors,
      gender,
      image,
      createdBy: req.user._id
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// Get all products
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("createdBy", "name email");
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single product by ID
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("createdBy", "name email");
    if (product) res.json(product);
    else res.status(404).json({ message: "Product not found" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update product (with optional new image)
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const {
      name,
      description,
      price,
      discount,
      availableSizes,
      availableColors,
      gender,
    } = parseProductPayload(req.body);

    if (name !== undefined) {
      if (!name) {
        return res.status(400).json({ message: "Name cannot be empty." });
      }

      product.name = name;
    }

    if (description !== undefined) {
      if (!description) {
        return res.status(400).json({ message: "Description cannot be empty." });
      }

      product.description = description;
    }

    if (price !== undefined) {
      product.price = price;
    }

    if (discount !== undefined) {
      product.discount = discount;
    }

    if (availableSizes !== undefined) {
      product.availableSizes = availableSizes;
    }

    if (availableColors !== undefined) {
      product.availableColors = availableColors;
    }

    if (gender !== undefined) {
      product.gender = gender;
    }

    // Replace image if uploaded
    if (req.file) {
      product.image = buildImagePayload(req.file);
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    await product.deleteOne();
    res.json({ message: "Product removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload ONE image ONLY
export const uploadImages = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (!req.file)
      return res.status(400).json({ message: "No file uploaded" });

    const image = {
      filename: req.file.filename,
      url: `/uploads/${req.file.filename}`
    };

    product.images.push(image);
    await product.save();

    res.json({ message: "Image uploaded", images: product.images });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
