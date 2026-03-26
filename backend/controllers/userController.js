import User from "../models/userModel.js";

// @desc    Get all users (admin)
// @route   GET /api/users
// @access  Admin
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    const nonAdminUsers = users.filter((user) => {
      const role = user.role || (user.isAdmin ? 'admin' : 'user');
      return role !== 'admin';
    });

    res.json(nonAdminUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single user by ID (admin)
// @route   GET /api/users/:id
// @access  Admin
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (user) res.json(user);
    else res.status(404).json({ message: "User not found" });
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

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      if (req.body.password) user.password = req.body.password; // hashed by pre-save
      if (req.body.role) {
        user.role = req.body.role;
      } else if (req.body.isAdmin !== undefined) {
        user.role = req.body.isAdmin ? 'admin' : 'user';
      }

      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isAdmin: updatedUser.isAdmin
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
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
    if (user) {
      await user.deleteOne();
      res.json({ message: "User removed" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
