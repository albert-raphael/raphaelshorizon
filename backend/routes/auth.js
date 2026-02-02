const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// File-based storage paths
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
const findUser = (email) => {
    const users = readData(USERS_FILE);
    return users.find(u => u.email === email);
};

// Helper: Create user
const createUser = (userData) => {
    const users = readData(USERS_FILE);
    const newUser = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        role: 'user',
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
        
        if (findUser(email)) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = createUser({ name, email, password: hashedPassword, avatar: 'default-avatar.jpg' });

        const token = jwt.sign({ id: user._id || user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        
        const { password: _, ...userWithoutPassword } = user;
        res.json({ success: true, token, user: { ...userWithoutPassword, id: user._id || user.id } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Login (regular users only - admins must use /admin-login)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = findUser(email);

        if (!user || !user.password) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
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
        
        const { password: _, ...userWithoutPassword } = user;
        res.json({ success: true, token, user: { ...userWithoutPassword, id: user._id || user.id } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Admin Login (admins only)
router.post('/admin-login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = findUser(email);

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
        
        const { password: _, ...userWithoutPassword } = user;
        res.json({ success: true, token, user: { ...userWithoutPassword, id: user._id || user.id } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Google Login
router.post('/google', async (req, res) => {
    try {
        const { token } = req.body;
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID,
        });
        const { email, name, picture } = ticket.getPayload();

        let user = findUser(email);
        
        if (!user) {
            user = createUser({ 
                name, 
                email, 
                avatar: picture, 
                googleId: ticket.getUserId() 
            });
        } else if (!user.googleId) {
            // Link existing account
            const users = readData(USERS_FILE);
            const index = users.findIndex(u => u.email === email);
            users[index].googleId = ticket.getUserId();
            users[index].avatar = picture || users[index].avatar;
            writeData(USERS_FILE, users);
            user = users[index];
        }

        const authToken = jwt.sign({ id: user._id || user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        
        const { password: _, ...userWithoutPassword } = user;
        res.json({ success: true, token: authToken, user: { ...userWithoutPassword, id: user._id || user.id } });
    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(401).json({ success: false, message: 'Invalid Google Token' });
    }
});

// Get Current User
router.get('/me', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = findUser(decoded.email);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const { password: _, ...userWithoutPassword } = user;
        res.json({ success: true, data: userWithoutPassword });
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    const user = findUser(email);

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
    const users = readData(USERS_FILE);
    const userIndex = users.findIndex(u => u.email === tokenRecord.email);
    
    if (userIndex === -1) {
        return res.status(400).json({ success: false, message: 'User not found' });
    }

    users[userIndex].password = await bcrypt.hash(password, 10);
    writeData(USERS_FILE, users);

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