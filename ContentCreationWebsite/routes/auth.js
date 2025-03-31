const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();
const bcrypt = require('bcryptjs');
const config = require('../config/env-config');
// Import DynamoDB module
const dynamoDB = require('../db/dynamodb');

// Helper function to generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || config.sessionSecret,
        { expiresIn: '24h' }
    );
};

// Google OAuth routes
router.get('/google',
    passport.authenticate('google', {
        scope: ['profile', 'email']
    })
);

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login.html' }),
    (req, res) => {
        const token = generateToken(req.user);
        res.redirect(`/auth-success.html?token=${token}&userId=${req.user.id}`);
    }
);

// Facebook OAuth routes
router.get('/facebook',
    passport.authenticate('facebook', {
        scope: ['email']
    })
);

router.get('/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/login.html' }),
    (req, res) => {
        const token = generateToken(req.user);
        res.redirect(`/auth-success.html?token=${token}&userId=${req.user.id}`);
    }
);

// Twitter OAuth routes
router.get('/twitter',
    passport.authenticate('twitter')
);

router.get('/twitter/callback',
    passport.authenticate('twitter', { failureRedirect: '/login.html' }),
    (req, res) => {
        const token = generateToken(req.user);
        res.redirect(`/auth-success.html?token=${token}&userId=${req.user.id}`);
    }
);

// Regular login route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }
    
    try {
        // Find user in database
        const user = await dynamoDB.getUserByEmail(email);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        // Check password with bcrypt
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        // Generate token
        const token = generateToken(user);
        
        // Return user info and token
        return res.json({
            success: true,
            token,
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred during login'
        });
    }
});

// Sign up route
router.post('/signup', async (req, res) => {
    const { firstName, lastName, email, password, company } = req.body;
    
    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Required fields missing'
        });
    }
    
    try {
        // Check if user already exists
        const existing = await dynamoDB.getUserByEmail(email);
        
        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user
        const newUser = await dynamoDB.createUser({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            company: company || '',
            provider: 'local'
        });
        
        // Generate token
        const token = generateToken(newUser);
        
        return res.json({
            success: true,
            user: {
                id: newUser.id,
                firstName,
                lastName,
                email,
                company: company || ''
            },
            token
        });
    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred during registration'
        });
    }
});

// Get current user info
router.get('/user', async (req, res) => {
    if (req.isAuthenticated()) {
        return res.json({
            success: true,
            user: {
                id: req.user.id,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                email: req.user.email,
                provider: req.user.provider
            }
        });
    }
    
    // If using token authentication
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || config.sessionSecret);
            
            // Get user from database
            const user = await dynamoDB.getUserById(decoded.userId);
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            return res.json({
                success: true,
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    provider: user.provider || 'local'
                }
            });
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
    } else {
        res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
});

// Logout route
router.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error during logout'
            });
        }
        
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    });
});

module.exports = router;