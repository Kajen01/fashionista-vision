import User from "../models/userModel.js";

function normalizeEmail(email = "") {
  return email.trim().toLowerCase();
}

function isSameUser(left, right) {
  return String(left) === String(right);
}

// @desc    Get all users (admin)
// @route   GET /api/users
// @access  Admin
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users.map((user) => user.toSafeObject()));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single user by ID (admin)
// @route   GET /api/users/:id
// @access  Admin
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      res.json(user.toSafeObject());
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user (admin)
// @route   PUT /api/users/:id
// @access  Admin
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const nextName = typeof req.body.name === "string" ? req.body.name.trim() : undefined;
    const nextEmail = typeof req.body.email === "string" ? normalizeEmail(req.body.email) : undefined;
    const nextRole = req.body.role;
    const nextIsVerified = req.body.isVerified;

    if (nextName !== undefined) {
      if (!nextName) {
        return res.status(400).json({ message: "Name is required." });
      }

      user.name = nextName;
    }

    if (nextEmail !== undefined) {
      if (!nextEmail) {
        return res.status(400).json({ message: "Email is required." });
      }

      const duplicateUser = await User.findOne({
        email: nextEmail,
        _id: { $ne: user._id },
      });

      if (duplicateUser) {
        return res.status(400).json({ message: "Email is already in use." });
      }

      user.email = nextEmail;
    }

    if (nextRole !== undefined) {
      if (!["user", "admin"].includes(nextRole)) {
        return res.status(400).json({ message: "Role must be either user or admin." });
      }

      if (isSameUser(req.user._id, user._id) && nextRole !== "admin") {
        return res.status(400).json({ message: "You cannot remove your own admin access." });
      }

      user.role = nextRole;
    }

    if (nextIsVerified !== undefined) {
      user.isVerified = Boolean(nextIsVerified);
    }

    const updatedUser = await user.save();
    res.json(updatedUser.toSafeObject());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user (admin)
// @route   DELETE /api/users/:id
// @access  Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (isSameUser(req.user._id, user._id)) {
      return res.status(400).json({ message: "You cannot delete your own admin account." });
    }

    await user.deleteOne();
    res.json({ message: "User removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
