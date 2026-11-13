import AuditLog from "../models/AuditLogModel.js";

const HandleGetAuditLogs = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const skip = (page - 1) * limit;

        const filter = {};

        if (req.query.category) {
            filter.category = req.query.category;
        }
        if (req.query.action) {
            filter.action = { $regex: req.query.action, $options: "i" };
        }
        if (req.query.actorId) {
            filter["actor._id"] = req.query.actorId;
        }
        if (req.query.email) {
            filter["actor.email"] = { $regex: req.query.email, $options: "i" };
        }
        if (req.query.success === "true") {
            filter.success = true;
        }
        if (req.query.success === "false") {
            filter.success = false;
        }
        if (req.query.from || req.query.to) {
            filter.createdAt = {};
            if (req.query.from) {
                filter.createdAt.$gte = new Date(req.query.from);
            }
            if (req.query.to) {
                filter.createdAt.$lte = new Date(req.query.to);
            }
        }

        const [logs, total] = await Promise.all([
            AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            AuditLog.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(total / limit) || 1;

        res.status(200).json({
            logs,
            total,
            page,
            limit,
            totalPages,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export { HandleGetAuditLogs };
