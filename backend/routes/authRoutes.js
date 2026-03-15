const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passport = require('passport');
const jwt = require('jsonwebtoken')
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/me', protect, authController.getMe);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email']}))

router.get('/google/callback', passport.authenticate('google', { session: false }),
async(req, res) => {
    const token = jwt.sign(
        {userId: req.user._id},
        process.env.JWT_SECRET,
        {expiresIn: '1h'}
    )

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/admin/dashboard?token=${token}`)
})

module.exports = router;