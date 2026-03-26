import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isAdmin: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String, default: null },
  verificationTokenExpires: { type: Date, default: null },
  lastLoginAt: { type: Date, default: null },
}, { timestamps: true });

userSchema.pre('validate', function syncRoleFields(next) {
  if (this.role === 'admin') {
    this.isAdmin = true;
  } else if (this.isAdmin) {
    this.role = 'admin';
  } else {
    this.role = 'user';
    this.isAdmin = false;
  }

  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toSafeObject = function() {
  const derivedRole = this.role || (this.isAdmin ? 'admin' : 'user');

  return {
    _id: this._id,
    id: this._id,
    name: this.name,
    email: this.email,
    role: derivedRole,
    isAdmin: this.isAdmin,
    isVerified: Boolean(this.isVerified),
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const User = mongoose.model('User', userSchema);
export default User;
