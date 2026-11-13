/**
 * Deletes ALL documents in the audit_logs collection (dev / local only).
 *
 * Safety: runs only when NODE_ENV=development OR ALLOW_AUDIT_PURGE=true,
 * unless you pass --force (still requires MONGO_URI).
 *
 * Env:
 *   MONGO_URI (required)
 *   NODE_ENV=development  OR  ALLOW_AUDIT_PURGE=true
 *
 * Run:
 *   npm run audit:clear
 *   node script/clearAuditLogs.js
 *   node script/clearAuditLogs.js --force
 */
import "dotenv/config";
import mongoose from "mongoose";
import connectMongoDB from "../utils/ConnectDB.js";
import AuditLog from "../models/AuditLogModel.js";

const isDev =
    process.env.NODE_ENV === "development" ||
    process.env.ALLOW_AUDIT_PURGE === "true";
const force = process.argv.includes("--force");

const main = async () => {
    if (!isDev && !force) {
        console.error(
            "Refusing to purge audit logs. Set NODE_ENV=development or ALLOW_AUDIT_PURGE=true, or pass --force.",
        );
        process.exit(1);
    }

    if (force && !isDev) {
        console.warn(
            "WARNING: --force used without dev flags. All audit logs will be deleted.",
        );
    }

    await connectMongoDB();

    const before = await AuditLog.countDocuments();
    const result = await AuditLog.deleteMany({});

    console.log(
        `Deleted ${result.deletedCount ?? 0} audit log(s) (count before: ${before}).`,
    );

    await mongoose.disconnect();
    process.exit(0);
};

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
