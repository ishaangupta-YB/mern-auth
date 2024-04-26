const express = require('express')
const cookieParser = require('cookie-parser');
const cors = require('cors')
const rateLimit = require('express-rate-limit');
const path = require('path')
const jwt = require('jsonwebtoken');

const config = require("./config/config");
const connectDB = require('./db/conn');
const userRoutes = require('./routes/authRoutes')
const authRoutes = require('./routes/userRoutes')

const app = express()
const PORT = config.port

connectDB()

app.use(cors())
app.use(express.json());
app.use(cookieParser());

// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
// });

app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    return res.status(statusCode).json({
        success: false,
        message,
        statusCode,
    });
});


app.listen(PORT, () => {
    console.log(`running on ${PORT}`);
});