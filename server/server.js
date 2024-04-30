const express = require('express')
const cookieParser = require('cookie-parser');
const cors = require('cors')
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const cron = require('node-cron')
const rateLimit = require('express-rate-limit');

const config = require("./config/config");
const connectDB = require('./db/conn');
const userRoutes = require('./routes/userRoutes')
const authRoutes = require('./routes/authRoutes')
const resetRoutes = require('./routes/resetRoutes')

const app = express()
const PORT = config.port

connectDB()

app.use(cors({
    origin: config.clientURL,
    credentials: true,
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});

app.use(limiter);
app.use(helmet());
app.use(express.json());
app.use(xss());
app.use(mongoSanitize());
app.use(cookieParser());

// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
// });

app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reset', resetRoutes);

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    return res.status(statusCode).json({
        success: false,
        message,
        statusCode,
    });
});

const deleteExpiredResetTokens = async () => {
    try {
        const currentTime = new Date();
        const expiredTokens = await User.find({
            resetTokenExpiration: { $lt: currentTime },
        });

        for (const user of expiredTokens) {
            user.resetToken = undefined;
            user.resetTokenExpiration = undefined;
            await user.save();
        }

        console.log('Expired reset tokens deleted successfully.');
    } catch (error) {
        console.error('Error deleting expired reset tokens:', error);
    }
};

cron.schedule('0 0 * * *', deleteExpiredResetTokens);


app.listen(PORT, () => {
    console.log(`running on ${PORT}`);
});