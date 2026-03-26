export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role || (req.user?.isAdmin ? 'admin' : 'user');

    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'You do not have permission to access this resource.' });
    }

    next();
  };
};

export const requireAdmin = requireRole('admin');

