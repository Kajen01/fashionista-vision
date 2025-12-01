import Product from "../models/productModel.js";
import path from "path";

// Create a new product (with optional image upload)
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, discount, availableSizes, availableColors } = req.body;

    // Only one image
    let image = null;
    if (req.file) {
      image = {
        filename: req.file.filename,
        url: `/uploads/${req.file.filename}`
      };
    }

    const product = await Product.create({
      name,
      description,
      price,
      discount,
      availableSizes,
      availableColors,
      image,
      createdBy: req.user._id
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    product.name = req.body.name || product.name;
    product.description = req.body.description || product.description;
    product.price = req.body.price || product.price;
    product.discount = req.body.discount || product.discount;
    product.availableSizes = req.body.availableSizes || product.availableSizes;
    product.availableColors = req.body.availableColors || product.availableColors;

    // Replace image if uploaded
    if (req.file) {
      product.image = {
        filename: req.file.filename,
        url: `/uploads/${req.file.filename}`
      };
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
