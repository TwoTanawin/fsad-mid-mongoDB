const mongoose = require('mongoose');
const express = require('express');

const app = express();
app.use(express.json());

const mongoURI = "mongodb://rootuser:rootpass@localhost:27017/twoise?authSource=admin";
const PORT = 8000;

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: String,
    age: Number,
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }]
});

const orderSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true
    },
    totalPrice: Number,
    createdAt: {
        type: Date,
        default: Date.now
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

const User = mongoose.model('User', userSchema);
const Order = mongoose.model('Order', orderSchema);

// POST to create user and their orders
app.post('/create-user', async (req, res) => {
    try {
        const { username, email, age, orders } = req.body;

        const user = new User({
            username,
            email,
            age
        });
        await user.save();

        if (orders && orders.length > 0) {
            const orderDocuments = orders.map(order => {
                return new Order({
                    ...order,
                    userId: user._id
                });
            });
            await Order.insertMany(orderDocuments);

            user.orders = orderDocuments.map(order => order._id);
            await user.save();
        }

        res.json({ user });
    } catch (error) {
        console.log('Server Fail', error);
        res.status(400).json({
            message: error.message
        });
    }
});

// GET users by userId
app.get('/users', async (req, res) => {
    try {
        const userId = req.query.id;
        const user = await User.findById(userId).populate('orders');
        res.json(user);
    } catch (error) {
        console.log('Server Fail', error);
        res.status(400).json({
            message: error.message
        });
    }
});

// GET orders by orderId
app.get('/orders', async (req, res) => {
    try {
        const orderId = req.query.id;

        // Check if the orderId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({
                message: "Invalid order ID format."
            });
        }

        const order = await Order.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(orderId) // match order by _id
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userDetails"
                }
            }
        ]);
        
        res.json(order);
    } catch (error) {
        console.log('Server Fail', error);
        res.status(400).json({
            message: error.message
        });
    }
});


app.listen(PORT, async () => {
    try {
        await mongoose.connect(mongoURI);
        console.log(`Server is running on port ${PORT}`);
    } catch (error) {
        console.log('Server Fail', error);
    }
});
