const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// GET /auth/register - Show registration page
router.get('/register', (req, res) => {
    res.render('register', {
        title: 'Register',
        error: null,
        user: null
    });
});

// POST /auth/register - Handle user registration
router.post('/register', async (req, res) => {
    try {
        const { email, password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.render('register', { 
                title: 'Register', 
                error: 'Passwords do not match', 
                user: null 
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('register', { 
                title: 'Register', 
                error: 'Email already registered', 
                user: null 
            });
        }

        const user = new User({ email, password });
        await user.save();
        res.redirect('/auth/login');
    } catch (err) {
        res.render('register', { 
            title: 'Register', 
            error: 'Registration failed. Try again.', 
            user: null 
        });
    }
});

// GET /auth/login - Show login page (This fixes your 404 error)
router.get('/login', (req, res) => {
    res.render('login', {
        title: 'Login',
        error: null,
        user: null
    });
});

// POST /auth/login - Handle login logic
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.render('login', { 
                title: 'Login', 
                error: 'Invalid email or password', 
                user: null 
            });
        }

        // Generate JWT Token using the secret from .env 
        const token = jwt.sign(
            { id: user._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );

        // Store token in cookie
        res.cookie('token', token, { httpOnly: true });
        res.redirect('/expenses');
    } catch (err) {
        res.render('login', { 
            title: 'Login', 
            error: 'An error occurred during login', 
            user: null 
        });
    }
});

// GET /auth/logout - Clear cookie and redirect
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/auth/login');
});

module.exports = router;