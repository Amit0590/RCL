require('dotenv').config(); // Load environment variables
// Enhanced Express server with secure authentication and payment handling
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const passport = require('passport'); 

// Import DynamoDB client
const dynamoDB = require('./db/dynamodb');

// Import passport configuration
require('./config/passport-setup');
const app = express();
const port = process.env.PORT || 8080;

// Import configuration
const config = {
    sessionSecret: process.env.SESSION_SECRET || 'your-super-secure-session-secret-key',
    jwtSecret: process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key',
    baseUrl: process.env.BASE_URL || `http://localhost:${port}`
};

// Import auth routes
const authRoutes = require('./routes/auth');

// Initialize DynamoDB tables
(async () => {
    try {
        // Determine if using local or cloud DynamoDB
        const dbEndpoint = process.env.DYNAMODB_ENDPOINT ? 
            process.env.DYNAMODB_ENDPOINT : 
            `https://dynamodb.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`;
        
        const isLocalDynamoDB = process.env.DYNAMODB_ENDPOINT && 
            (process.env.DYNAMODB_ENDPOINT.includes('localhost') || 
             process.env.DYNAMODB_ENDPOINT.includes('dynamodb-local'));
        
        console.log(`Starting with DynamoDB ${isLocalDynamoDB ? 'local' : 'cloud'} endpoint at ${dbEndpoint}`);
        
        console.log('Initializing DynamoDB tables...');
        await dynamoDB.initializeTables();
        console.log('DynamoDB tables initialized successfully');
    } catch (error) {
        console.error('Error initializing DynamoDB tables:', error);
    }
})();

// Middleware
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:8080'
    ],
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Session configuration - use the same secret for all auth
app.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        sameSite: 'lax' // Changed from 'strict' to 'lax' for OAuth redirects
    }
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Use auth routes
app.use('/auth', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// In-memory storage for content requests and payments
// TODO: Move these to DynamoDB in future updates
let contentRequests = [];
let payments = [];

// Authentication middleware
const requireAuth = (req, res, next) => {
    // First check if user is authenticated via Passport
    if (req.isAuthenticated()) {
        return next();
    }
    
    // Then try JWT authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        req.userId = decoded.userId;
        // Store userId in session for compatibility
        req.session.userId = decoded.userId;
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

// Routes
app.post('/api/request', requireAuth, (req, res) => {
    const requestData = req.body;
    
    // Add an ID and timestamp
    requestData.id = `CR-${contentRequests.length + 1}`.padStart(6, '0');
    requestData.timestamp = new Date().toISOString();
    requestData.status = 'pending';
    
    // Store the request
    contentRequests.push(requestData);
    
    // Send response
    res.status(201).json({
        success: true,
        message: 'Content request submitted successfully',
        requestId: requestData.id
    });
});

app.get('/api/requests', (req, res) => {
    res.json(contentRequests);
});

// Profile routes
app.get('/api/profile', requireAuth, async (req, res) => {
    const userId = req.userId || req.user.id; // Use userId from JWT token or passport
    console.log(`GET /api/profile - Fetching profile for user ID: ${userId}`);
    
    try {
        const user = await dynamoDB.getUserById(userId);
        
        if (!user) {
            console.error(`User not found with ID: ${userId}`);
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Only return necessary user data
        const profileData = {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            company: user.company,
            profilePicture: user.profilePicture
        };
        
        console.log('Profile data retrieved successfully');
        res.json({
            success: true,
            ...profileData
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching profile data'
        });
    }
});

app.put('/api/profile', requireAuth, async (req, res) => {
    const userId = req.userId; // Use userId from JWT token
    const { firstName, lastName, email, company } = req.body;
    let profilePicture = req.body.profilePicture || null;
    
    try {
        const updates = {
            firstName,
            lastName,
            email,
            company,
            profilePicture
        };
        
        await dynamoDB.updateUser(userId, updates);
        
        res.json({
            success: true,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating profile'
        });
    }
});

// Authentication routes
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        // Query the database
        const user = await dynamoDB.getUserByEmail(email);
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        
        // Compare password
        const match = await bcrypt.compare(password, user.password);
        
        if (!match) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id },
            config.jwtSecret,
            { expiresIn: '24h' }
        );
        
        // Send success response with token
        res.json({
            success: true,
            token: token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.post('/api/signup', async (req, res) => {
    try {
        const { email, password, firstName, lastName, company } = req.body;
        
        // Validate input
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }
        
        // Validate password strength
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }
        
        // Check if user already exists
        const existingUser = await dynamoDB.getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({
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
            company: company || null
        });
        
        // Set session
        req.session.userId = newUser.id;
        req.session.email = email;
        
        // Send success response
        res.status(201).json({
            success: true,
            user: {
                id: newUser.id,
                firstName,
                lastName,
                email
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred during registration'
        });
    }
});

// Payment handling route
app.post('/api/payment', requireAuth, (req, res) => {
    const { amount, requestId } = req.body;
    
    // Create payment record
    const payment = {
        id: payments.length + 1,
        userId: req.session.userId,
        requestId,
        amount,
        status: 'pending',
        timestamp: new Date().toISOString()
    };
    
    payments.push(payment);
    
    // In a real app, integrate with a payment processor here
    
    res.status(201).json({
        success: true,
        message: 'Payment initiated',
        paymentId: payment.id
    });
});

// Logout route
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// Check authentication status
app.get('/api/auth/status', (req, res) => {
    if (req.isAuthenticated() || req.session.userId) {
        res.json({ 
            authenticated: true, 
            user: req.user || { id: req.session.userId } 
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Expose config to client (only non-sensitive)
app.get('/api/config', (req, res) => {
    res.json({
        baseUrl: config.baseUrl
    });
});

// Start server
app.listen(port, '0.0.0.0', () => {
    const dbType = process.env.DYNAMODB_ENDPOINT ? 'Local DynamoDB' : 'AWS Cloud DynamoDB';
    const region = process.env.AWS_REGION || 'us-east-1';
    
    console.log(`Content Creation Website server running at http://0.0.0.0:${port}`);
    console.log(`Using ${dbType} in region ${region}`);
    console.log('Available endpoints:');
    console.log('  POST /api/request - Submit a content request');
    console.log('  GET /api/requests - Get all content requests');
    console.log('  POST /api/login - User login');
    console.log('  POST /api/signup - User registration');
    console.log('  GET /auth/google - Google OAuth login');
    console.log('  GET /auth/facebook - Facebook OAuth login');
    console.log('  GET /auth/twitter - Twitter OAuth login');
});

// Export app for testing
module.exports = app;