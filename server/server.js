const express = require('express')
const cookieParser = require('cookie-parser');
const cors = require('cors')
const rateLimit = require('express-rate-limit'); 

const config = require("./config/config");
const connectDB = require('./db/conn');
const userRoutes = require('./routes/userRoutes')
const authRoutes = require('./routes/authRoutes')

const app = express()
const PORT = config.port

connectDB()

app.use(cors({
    origin:  config.clientURL,
    credentials: true,
}));
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