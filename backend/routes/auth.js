const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const User = require('../models/User');

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Mode logic
const MONGO_URI = process.env.MONGO_URI;
const EMBEDDED_MODE = process.env.EMBEDDED_MODE === 'true' || !MONGO_URI;

// File-based storage paths (for fallback/embedded mode)
const DATA_DIR = path.join(__dirname, '../embedded-data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TOKENS_FILE = path.join(DATA_DIR, 'reset-tokens.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper: Read data
const readData = (file) => {
    if (!fs.existsSync(file)) return [];
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
        return [];
    }
};

// Helper: Write data
const writeData = (file, data) => {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

// Helper: Find user
const findUser = async (email) => {
    if (!EMBEDDED_MODE) {
        try {
            return await User.findOne({ email }).select('+password');
        } catch (e) {
            console.error('DB Find User Error:', e);
            // Fallback to file for safety or during transition
        }
    }
    const users = readData(USERS_FILE);
    return users.find(u => u.email === email);
};

// Helper: Create user
const createUser = async (userData) => {
    if (!EMBEDDED_MODE) {
        try {
            const newUser = new User(userData);
            await newUser.save();
            return newUser;
        } catch (e) {
            console.error('DB Create User Error:', e);
        }
    }
    
    // File fallback
    const users = readData(USERS_FILE);
    const newUser = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        role: 'subscriber',
        ...userData
    };
    users.push(newUser);
    writeData(USERS_FILE, users);
    return newUser;
};

// --- ROUTES ---

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        const existingUser = await findUser(email);
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await createUser({ 
            name, 
            email, 
            password: hashedPassword, 
            avatar: 'default-avatar.jpg',
            authProvider: 'local'
        });

        const token = jwt.sign({ id: user._id || user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        
        const userJson = user.toObject ? user.toObject() : { ...user };
        delete userJson.password;
        
        res.json({ success: true, token, user: { ...userJson, id: user._id || user.id } });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Login (regular users only - admins must use /admin-login)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await findUser(email);

        if (!user || (!user.password && user.authProvider === 'local')) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if this is a Google-only account
        if (!user.password && user.authProvider === 'google') {
            return res.status(400).json({ 
                success: false, 
                message: 'This account uses Google Sign-In. Please use the "Sign in with Google" button.'
            });
        }

        // Block admin login through regular login page
        if (user.role === 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Admin accounts must use the admin login page',
                redirectTo: '/pages/admin/login_admin.html'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id || user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        
        const userJson = user.toObject ? user.toObject() : { ...user };
        delete userJson.password;

        res.json({ success: true, token, user: { ...userJson, id: user._id || user.id } });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Admin Login (admins only)
router.post('/admin-login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await findUser(email);

        if (!user || !user.password) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Only allow admin users
        if (user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied. Admin credentials required.'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id || user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        
        const userJson = user.toObject ? user.toObject() : { ...user };
        delete userJson.password;
        
        res.json({ success: true, token, user: { ...userJson, id: user._id || user.id } });
    } catch (error) {
        console.error('Admin Login Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Google Login
router.post('/google', async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({ success: false, message: 'Google token is required' });
        }

        if (!GOOGLE_CLIENT_ID) {
            console.error('[Google Auth] GOOGLE_CLIENT_ID is not configured in the backend');
            return res.status(500).json({ success: false, message: 'Google Auth is not configured on the server' });
        }

        console.log('[Google Auth] Verifying token...');
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID,
        });
        const { email, name, picture } = ticket.getPayload();
        console.log(`[Google Auth] Token verified for: ${email}`);

        let user = await findUser(email);
        
        if (!user) {
            user = await createUser({ 
                name, 
                email, 
                avatar: picture, 
                googleId: ticket.getUserId(),
                authProvider: 'google'
            });
        } else if (!user.googleId) {
            // Link existing account
            if (!EMBEDDED_MODE) {
                user.googleId = ticket.getUserId();
                user.avatar = picture || user.avatar;
                user.authProvider = 'google'; // Mark as google as well
                await user.save();
            } else {
                const users = readData(USERS_FILE);
                const index = users.findIndex(u => u.email === email);
                users[index].googleId = ticket.getUserId();
                users[index].avatar = picture || users[index].avatar;
                users[index].authProvider = 'google';
                writeData(USERS_FILE, users);
                user = users[index];
            }
        }

        const authToken = jwt.sign({ id: user._id || user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        
        const userJson = user.toObject ? user.toObject() : { ...user };
        delete userJson.password;
        
        res.json({ success: true, token: authToken, user: { ...userJson, id: user._id || user.id } });
    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(401).json({ success: false, message: 'Invalid Google Token' });
    }
});

// Get Current User
router.get('/me', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await findUser(decoded.email);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const userJson = user.toObject ? user.toObject() : { ...user };
        delete userJson.password;
        res.json({ success: true, user: { ...userJson, id: user._id || user.id } });
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    const user = await findUser(email);

    if (!user) {
        // Always return success to prevent email enumeration
        return res.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 3600000; // 1 hour

    // Save token
    let tokens = readData(TOKENS_FILE);
    // Remove old tokens for this email
    tokens = tokens.filter(t => t.email !== email);
    tokens.push({ email, token: resetToken, expires });
    writeData(TOKENS_FILE, tokens);

    // Send Email
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5500'}/pages/profile/reset-password.html?token=${resetToken}`;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset - Raphael\'s Horizon',
            html: `
                <h3>Reset Your Password</h3>
                <p>Click the link below to reset your password. This link expires in 1 hour.</p>
                <a href="${resetLink}">Reset Password</a>
            `
        });
        res.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ success: false, message: 'Failed to send email' });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;
    
    let tokens = readData(TOKENS_FILE);
    const tokenRecord = tokens.find(t => t.token === token);

    if (!tokenRecord || tokenRecord.expires < Date.now()) {
        return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    // Update user password
    if (!EMBEDDED_MODE) {
        try {
            const user = await User.findOne({ email: tokenRecord.email });
            if (user) {
                user.password = await bcrypt.hash(password, 10);
                await user.save();
            }
        } catch (e) {
            console.error('DB Reset Password Error:', e);
        }
    }

    // Always update file as fallback or if in embedded mode
    const users = readData(USERS_FILE);
    const userIndex = users.findIndex(u => u.email === tokenRecord.email);
    
    if (userIndex !== -1) {
        users[userIndex].password = await bcrypt.hash(password, 10);
        writeData(USERS_FILE, users);
    }

    // Remove used token
    tokens = tokens.filter(t => t.token !== token);
    writeData(TOKENS_FILE, tokens);

    res.json({ success: true, message: 'Password reset successfully' });
});

// GET Google Client ID for frontend
router.get('/config/google-client-id', (req, res) => {
    if (!GOOGLE_CLIENT_ID) {
        return res.status(500).json({ success: false, message: 'Google Client ID not configured' });
    }
    res.json({ success: true, clientId: GOOGLE_CLIENT_ID });
});

module.exports = router;