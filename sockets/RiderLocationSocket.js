export const RiderLocationSocket = (io) => {
    const connectedRiders = {};
    const orderLocations = {};

    io.on("connection", (socket)=>{
        const queryUserID = socket.handshake.query.userID;
        console.log("[RiderLocation] connected:", socket.id, "userID:", queryUserID);

        socket.on("rider:setup",(payload = {}) => {
            const riderID = payload.riderID || queryUserID;
            if (!riderID) return;

            if (connectedRiders[riderID] && connectedRiders[riderID] !== socket.id) {
                const oldSocket = io.sockets.sockets.get(connectedRiders[riderID]);
                if (oldSocket) oldSocket.disconnect(true);
            }

            connectedRiders[riderID] = socket.id;
            socket.join(`rider:${riderID}`);
            socket.data.riderID = riderID;

            socket.emit("rider:connected", { socketId: socket.id });
            console.log(`[RiderLocation] rider ${riderID} registered -> ${socket.id}`);
        })

        socket.on("rider:joinOrder", (payload = {}) => {
            const { orderID, role } = payload;
            if (!orderID) return;

            socket.join(`order:${orderID}`);
            socket.data.orderID = orderID;
            socket.data.role = role || "customer";

            const cached = orderLocations[orderID];
            if (cached) {
                socket.emit("rider:location", cached);
            }

            console.log(`[RiderLocation] socket ${socket.id} joined order:${orderID} as ${role}`);
        });

        socket.on("rider:leaveOrder", ({ orderID }) => {
            if (!orderID) return;
            socket.leave(`order:${orderID}`);
            delete orderLocations[orderID];
            console.log(`[RiderLocation] socket ${socket.id} left order:${orderID}`);
        });

        socket.on("rider:location", async (payload = {}) => {
            const { orderID, riderID, lat, lng, heading, speed, accuracy, timestamp } = payload;

            if (!orderID || typeof lat !== "number" || typeof lng !== "number") {
                return;
            }

            const location = {
                orderID,
                riderID: riderID || socket.data.riderID,
                lat,
                lng,
                heading: heading ?? null,
                speed: speed ?? null,
                accuracy: accuracy ?? null,
                timestamp: timestamp || Date.now(),
                updatedAt: new Date().toISOString(),
            };

            orderLocations[orderID] = location;

            socket.to(`order:${orderID}`).emit("rider:location", location);
        });

        socket.on("rider:location:get", ({ orderID }) => {
            if (!orderID) return;
            const cached = orderLocations[orderID];
            if (cached) {
                socket.emit("rider:location", cached);
            } else {
                socket.emit("rider:location:unavailable", { orderID });
            }
        });

        socket.on("rider:status", ({ riderID, status }) => {
            if (!riderID || !status) return;
            io.emit("rider:status", { riderID, status, at: Date.now() });
        });

        socket.on("rider:manualDisconnect", (riderID) => {
            if (connectedRiders[riderID]) {
                delete connectedRiders[riderID];
            }
            if (socket.data.orderID) delete orderLocations[socket.data.orderID];
        });

        socket.on("disconnect", () => {
            const riderID = socket.data.riderID;
            if (riderID && connectedRiders[riderID] === socket.id) {
                delete connectedRiders[riderID];
            }
            if (socket.data.orderID && socket.data.role === "rider") {
                socket.to(`order:${socket.data.orderID}`).emit("rider:disconnected", {
                    orderID: socket.data.orderID,
                });
                delete orderLocations[socket.data.orderID];
            }
            console.log("[RiderLocation] disconnected:", socket.id);
        });
    })
}

export { RiderLocationSocket };