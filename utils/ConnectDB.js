import dns from "node:dns";
dns.setServers(['8.8.8.8', '8.8.4.4']);

import mongoose from "mongoose";

const connectMongoDB = async (req, res) => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`Database Connected Successfully`)
    } catch (error) {
        console.log(error);
    }
}

export default connectMongoDB;