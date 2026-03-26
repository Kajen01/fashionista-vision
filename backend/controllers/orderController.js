import mongoose from "mongoose";
import Order from "../models/orderModel.js";

const VALID_ORDER_STATUSES = ["placed", "processing", "shipped", "delivered", "cancelled"];
const ALLOWED_STATUS_TRANSITIONS = {
  placed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

function normalizeString(value = "") {
  const trimmed = String(value || "").trim();
  return trimmed || null;
}

function buildTrackingNumber(source) {
  return String(source || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-12)
    .toUpperCase();
}

function normalizeTrackingNumber(value) {
  const normalized = normalizeString(value);

  if (!normalized) {
    return null;
  }

  const trackingNumber = buildTrackingNumber(normalized);

  if (trackingNumber.length !== 12) {
    const error = new Error("Tracking number must be exactly 12 characters.");
    error.statusCode = 400;
    throw error;
  }

  return trackingNumber;
}

function isAdmin(user) {
  return (user?.role || (user?.isAdmin ? "admin" : "user")) === "admin";
}

function canAccessOrder(user, owner) {
  if (isAdmin(user)) {
    return true;
  }

  const ownerId = owner?._id || owner;
  return String(ownerId) === String(user?._id);
}

function resolveProductReference(value) {
  const candidate = value && typeof value === "object"
    ? value._id || value.id || value.product || null
    : value;

  if (candidate && mongoose.Types.ObjectId.isValid(String(candidate))) {
    return candidate;
  }

  return null;
}

function normalizeImageSnapshot(image) {
  if (!image) {
    return {
      filename: null,
      url: null,
    };
  }

  if (typeof image === "string") {
    return {
      filename: null,
      url: image.trim() || null,
    };
  }

  return {
    filename: normalizeString(image.filename),
    url: normalizeString(image.url),
  };
}

function normalizeOrderItem(item = {}) {
  const name = normalizeString(item.name);
  const price = Number(item.price);
  const quantity = Number(item.quantity);

  if (!name) {
    const error = new Error("Each order item must include a product name.");
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isFinite(price) || price <= 0) {
    const error = new Error(`Item "${name}" must include a valid paid unit price.`);
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    const error = new Error(`Item "${name}" must include a quantity greater than zero.`);
    error.statusCode = 400;
    throw error;
  }

  return {
    product: resolveProductReference(item.id || item.product || null),
    name,
    price,
    quantity,
    size: normalizeString(item.size),
    color: normalizeString(item.color),
    image: normalizeImageSnapshot(item.image),
  };
}

function mapOrder(order) {
  return {
    _id: order._id,
    id: order._id,
    user: order.user?._id
      ? {
          _id: order.user._id,
          id: order.user._id,
          name: order.user.name,
          email: order.user.email,
        }
      : order.user,
    items: (order.items || []).map((item) => ({
      product: item.product || null,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      size: item.size || null,
      color: item.color || null,
      image: item.image || { filename: null, url: null },
    })),
    totalAmount: order.totalAmount,
    currency: order.currency,
    paymentMethod: order.paymentMethod,
    paymentIntentId: order.paymentIntentId,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    trackingNumber: order.trackingNumber || null,
    placedAt: order.placedAt,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
    cancelledAt: order.cancelledAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

async function loadOrderOrThrow(orderId) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    const error = new Error("Order not found.");
    error.statusCode = 404;
    throw error;
  }

  const order = await Order.findById(orderId).populate("user", "name email");

  if (!order) {
    const error = new Error("Order not found.");
    error.statusCode = 404;
    throw error;
  }

  return order;
}

export const createOrderFromSuccessfulPayment = async (req, res) => {
  try {
    const paymentIntentId = normalizeString(req.body.paymentIntentId);
    const currency = normalizeString(req.body.currency)?.toLowerCase() || "usd";
    const totalAmount = Number(req.body.totalAmount);
    const rawItems = Array.isArray(req.body.items) ? req.body.items : [];

    if (!paymentIntentId) {
      return res.status(400).json({ message: "Payment intent id is required." });
    }

    if (rawItems.length === 0) {
      return res.status(400).json({ message: "Order must contain at least one item." });
    }

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({ message: "Total amount must be greater than zero." });
    }

    const existingOrder = await Order.findOne({ paymentIntentId });
    if (existingOrder) {
      return res.status(409).json({ message: "An order for this payment already exists." });
    }

    const items = rawItems.map(normalizeOrderItem);

    const order = new Order({
      user: req.user._id,
      items,
      totalAmount,
      currency,
      paymentMethod: "stripe",
      paymentIntentId,
      paymentStatus: "paid",
      orderStatus: "processing",
    });
    order.trackingNumber = buildTrackingNumber(order._id);
    await order.save();

    const populatedOrder = await Order.findById(order._id).populate("user", "name email");

    res.status(201).json({
      message: "Order created successfully.",
      order: mapOrder(populatedOrder || order),
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "An order for this payment already exists." });
    }

    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ placedAt: -1, createdAt: -1 });

    res.json({
      orders: orders.map(mapOrder),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await loadOrderOrThrow(req.params.id);

    if (!canAccessOrder(req.user, order.user)) {
      return res.status(403).json({ message: "You do not have permission to view this order." });
    }

    res.json({
      order: mapOrder(order),
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ placedAt: -1, createdAt: -1 });

    res.json({
      orders: orders.map(mapOrder),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const order = await loadOrderOrThrow(req.params.id);
    const nextStatus = req.body.orderStatus === undefined
      ? undefined
      : normalizeString(req.body.orderStatus)?.toLowerCase() || "";
    const nextTrackingNumber = req.body.trackingNumber === undefined
      ? undefined
      : normalizeString(req.body.trackingNumber);

    if (nextStatus === undefined && nextTrackingNumber === undefined) {
      return res.status(400).json({ message: "Order status or tracking number is required." });
    }

    if (nextStatus !== undefined) {
      if (!VALID_ORDER_STATUSES.includes(nextStatus)) {
        return res.status(400).json({ message: "Order status is invalid." });
      }

      const currentStatus = order.orderStatus;
      const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];

      if (nextStatus !== currentStatus && !allowedTransitions.includes(nextStatus)) {
        return res.status(400).json({
          message: `Cannot change order status from ${currentStatus} to ${nextStatus}.`,
        });
      }

      order.orderStatus = nextStatus;

      if (nextStatus === "shipped" && !order.shippedAt) {
        order.shippedAt = new Date();
      }

      if (nextStatus === "delivered" && !order.deliveredAt) {
        order.deliveredAt = new Date();
      }

      if (nextStatus === "cancelled" && !order.cancelledAt) {
        order.cancelledAt = new Date();
      }
    }

    if (nextTrackingNumber !== undefined) {
      order.trackingNumber = nextTrackingNumber === null
        ? buildTrackingNumber(order._id)
        : normalizeTrackingNumber(nextTrackingNumber);
    }

    const updatedOrder = await order.save();
    const populatedOrder = await Order.findById(updatedOrder._id).populate("user", "name email");

    res.json({
      message: "Order updated successfully.",
      order: mapOrder(populatedOrder || updatedOrder),
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const order = await loadOrderOrThrow(req.params.id);
    await order.deleteOne();

    res.json({
      message: "Order deleted successfully.",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};
