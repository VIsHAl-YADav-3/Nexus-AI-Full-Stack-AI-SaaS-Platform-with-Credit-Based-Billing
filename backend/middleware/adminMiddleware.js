/**
 * Restricts a route to users with role "admin". Must run after `protect`
 * so that req.user is already populated.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403);
    return next(new Error('Not authorized. Admin access required.'));
  }
  next();
};

module.exports = { requireAdmin };
