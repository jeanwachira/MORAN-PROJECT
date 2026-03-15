const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ error: 'Not authorized, no token provided' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // FIX: Use decoded.userId instead of decoded.id
            const user = await User.findById(decoded.userId).select('-password');

            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }

            req.user = user;
            next();
        } catch (error) {
            console.error('Token verification error:', error);
            return res.status(401).json({ error: 'Not authorized, token failed' });
        }
    } catch (error) {
        console.error('Error in auth middleware:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};