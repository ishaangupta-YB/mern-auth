require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    apiURL:process.env.API_URL,
    clientURL: process.env.CLIENT_URL,
    mongodbURI: process.env.MONGODB_URI + 'auth-app?retryWrites=true&w=majority' || 'mongodb://localhost:27017/auth-app',
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    isProduction: process.env.NODE_ENV === 'production',
};