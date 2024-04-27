const express = require('express')
const authController = require('../controllers/authController')

const router = express.Router();

router.post('/signup', authController.register);
router.post('/signin', authController.login);
router.post('/google', authController.google);
router.get('/signout', authController.logout);

module.exports = router