import express from "express";
import User from "./routes/User.js";
import cors from "cors";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import fileUpload from "express-fileupload";
import ErrorHandler from "./utils/ErrorHandler.js";
import connectMongoDB from "./utils/ConnectDB.js";
import AdminRoutes from "./routes/AdminRoutes.js";
import StoreOwnerRoutes from "./routes/StoreOwnerRoutes.js";
import CategoryRoutes from "./routes/CategoryRoutes.js";
import ProductRoutes from "./routes/ProductRoutes.js";
import PlanRoutes from "./routes/PlanRoutes.js";
import RiderRoutes from "./routes/RiderRoutes.js";
import NotificationsRoutes from "./routes/NotificationRoutes.js";
import GlobalRoutes from "./routes/GlobalRoutes/GlobalRoutes.js";
import SubscriptionRoutes from "./routes/SubscriptionRoutes.js";
import ConnectionsRoutes from "./routes/ConnectionsRoutes.js";
import CartRoute from "./routes/CartRoute.js";
import AddressRoutes from "./routes/AddressRoutes.js";
import PaymentRoutes from "./routes/PaymentRoutes.js";
import ReviewRoutes from "./routes/ReviewRoutes.js";
import orderRoutes from './routes/OrderRouter.js';
import cookieParser from "cookie-parser";
import PlanExpirationHelper from "./utils/PlanExpirationHelper.js";
import { Server } from "socket.io";
import { createServer } from "http";
import { ChatSocket } from "./sockets/Chat.js";

const app = express();
dotenv.config();
app.use(express.json());
app.use(cookieParser());
connectMongoDB();

PlanExpirationHelper();

const httpServer = createServer(app);

app.use(cors({
    origin: "*",
    credentials: true,
    methods: ["POST", "GET", "PATCH", "DELETE"]
}));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_Cloud,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    api_key: process.env.CLOUDINARY_API_KEY
});

app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/'
}));

app.use("/api/global", GlobalRoutes);
app.use("/api/user", User);
app.use("/api/admin", AdminRoutes);
app.use("/api/plan", PlanRoutes);
app.use("/api/store", StoreOwnerRoutes);
app.use("/api/subsciption", SubscriptionRoutes);
app.use("/api/riders", RiderRoutes);
app.use("/api/connections", ConnectionsRoutes);
app.use("/api/category", CategoryRoutes);
app.use("/api/products", ProductRoutes);
app.use('/api/cart', CartRoute);
app.use('/api/address', AddressRoutes);
app.use('/api/payment', PaymentRoutes);
app.use("/api/notifications", NotificationsRoutes);
app.use('/order/api', orderRoutes);
app.use("/api/review", ReviewRoutes);

app.use(ErrorHandler);


const io = new Server(httpServer, {
    pingTimeout: 60000,
    cors: {
        origin: "*",
        methods: ['GET', "POST", "PUT", "DELETE", "PATCH"],
        credentials: true
    }
});

ChatSocket(io);

app.get('/', (req, res) => {
    res.send("Hello World");
});

httpServer.listen(process.env.PORT, () => {
    console.log(`APP Listening To ${process.env.PORT}`);
});

