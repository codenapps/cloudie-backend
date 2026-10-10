import dns from "node:dns";
dns.setServers(['8.8.8.8', '8.8.4.4']);

import mongoose from "mongoose";

const connectMongoDB = async () => {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not set");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database Connected Successfully");
};

export default connectMongoDB;