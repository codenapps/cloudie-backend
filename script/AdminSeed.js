import env from "dotenv";
env.config();

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const username = process.env.ADMIN_USERNAME || "admin";

if (!email || !password || !username) {
    console.error("ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_USERNAME must be set in the environment variables.");
    process.exit(1);
}

const response = await fetch("http://localhost:5000/api/admin/create-admin", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, email, password, role: "Admin" }),
});