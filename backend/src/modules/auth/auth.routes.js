const express = require('express');
const { signup, login, getMe } = require('./auth.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authMiddleware.protect, getMe);

module.exports = router;
