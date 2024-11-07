import CartModel from '../models/CartModel.js';

export const getUserOrders = async (req, res) => {
    const { userId } = req.params;
    const { status } = req.query;

    try {
        const query = { userId };
        if (status) query.status = status;

        const orders = await CartModel.find(query).populate('items.productId', 'title price');
        res.status(200).json(orders);
    } catch (error) {
        console.error('Error retrieving orders:', error);
        res.status(500).json({ message: 'Error retrieving orders', error });
    }
};
