const User = require('../models/User')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

exports.signup = async(req, res) => {
    try {
        const { name, email, password} = req.body
        if(!name || !email || !password) {
            return res.status(400).json({message: "Fill in the required fields"})
        }

        const existingUser = await User.findOne({email})
        if(existingUser) {
            return res.status(400).json({message: "User with this email already exists"})
        }

        // Pass plain password — User model's pre('save') hook handles hashing
        const newUser = await User.create({ name, email, password })
        
        const token = jwt.sign(
            {userId: newUser._id},
            process.env.JWT_SECRET,
            {expiresIn: '1h'}
        )

        res.status(201).json({
            message: "Signup Successful",
            token: token
        })
    } catch (error) {
        console.error("Failed to create user: ", error)
        res.status(500).json({message: "Server error"})
    }
}

exports.login = async(req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.status(400).json({message: "Fill in all the fields"})
        }

        const existingUser = await User.findOne({email})
        if(!existingUser) {
            return res.status(400).json({message: "Enter correct email"})
        }

        const comparePass = await bcrypt.compare(password, existingUser.password)
        if(!comparePass) {
            return res.status(400).json({message: "Enter correct password"})
        }

        const token = jwt.sign(
            {userId: existingUser._id},
            process.env.JWT_SECRET,
            {expiresIn: '1h'}
        )

        res.status(200).json({
            message: "Login successful",
            token: token
        })
    } catch (error) {
        console.error("Failed to login: ", error)
        res.status(500).json({message: "Server error"})
    }
}

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Server error" });
    }
};