import StoreOwnerModel from '../models/StoreOwnerModel.js';

const STALE_MS = 3 * 60 * 1000;

export const closeStaleStores = async () => {
    const cutoff = new Date(Date.now() - STALE_MS);
    await StoreOwnerModel.updateMany(
        {
            storeStatus: { $in: ['Open'] },
            lastSeenAt: { $lt: cutoff },
        },
        { $set: { storeStatus: ['Close'] } },
    );
};

export const startStorePresenceMonitor = () => {
    closeStaleStores().catch(err => console.error('storePresence:', err));
    setInterval(() => {
        closeStaleStores().catch(err => console.error('storePresence:', err));
    }, 60 * 1000);
};
