import jwt from 'jsonwebtoken';

const generateToken = (user) => {
  const payload = {
    id: user._id || user.id || user,
    role: user.role || (user.isAdmin ? 'admin' : 'user'),
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.TOKEN_EXPIRES_IN || "1d"
  });
};

export default generateToken;
