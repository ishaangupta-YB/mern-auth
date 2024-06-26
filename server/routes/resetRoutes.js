const express = require('express');
const router = express.Router();
const resetController = require('../controllers/resetController');

router.post('/reset-password', resetController.resetPassword);
router.post('/forgot-password', resetController.forgotPassword); 
router.get('/validate-reset-token/:resetToken',resetController.validateResetToken)

module.exports = router;