const express = require('express');
const router = express.Router();
const { registerStore, register, login, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register-store', registerStore);
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
