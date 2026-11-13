export const requireAdmin = (req, res, next) => {
    const roles = req.user?.role;
    if (!Array.isArray(roles) || !roles.includes("Admin")) {
        return res.status(403).json({ message: "Admin access only" });
    }
    next();
};
