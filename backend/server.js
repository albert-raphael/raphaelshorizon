const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const cookieParser = require('cookie-parser');

// Load environment variables
require('dotenv').config();

// const passport = require('./config/passport');

const app = express();

// Basic middleware
app.use(cors());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Session middleware for Passport
// app.use(session({
//   secret: process.env.JWT_SECRET || 'raphaels_horizon_jwt_secret_2024_secure_key_change_this_in_production',
//   resave: false,
//   saveUninitialized: false,
//   cookie: {
//     secure: process.env.NODE_ENV === 'production',
//     httpOnly: true,
//     maxAge: 24 * 60 * 60 * 1000 // 24 hours
//   }
// }));

// Initialize Passport
// app.use(passport.initialize());
// app.use(passport.session());

// CORS configuration for audiobooks
app.use('/api/audiobooks', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range');
    next();
});

// Force embedded mode for testing (can be overridden by environment variable)
const MONGO_URI = process.env.MONGO_URI;
const EMBEDDED_MODE = process.env.EMBEDDED_MODE === 'true' || !MONGO_URI;

if (!EMBEDDED_MODE && MONGO_URI) {
  const connectDB = require('./config/database');
  connectDB();
}

const embeddedStore = EMBEDDED_MODE ? require('./embeddedStore') : null;

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    mode: EMBEDDED_MODE ? 'embedded' : 'database'
  });
});

// Root Health check (for Nginx/Proxy debugging)
app.get('/health', (req, res) => {
  res.status(200).send('alive');
});

// Config route for frontend
app.get('/api/config/google-client-id', (req, res) => {
  console.log('[Config] Request for Google Client ID from:', req.ip);
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn('[Config] GOOGLE_CLIENT_ID is missing from environment');
    }
    res.json({ success: true, clientId: clientId });
  } catch (error) {
    console.error('[Config] Error returning Google Client ID:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Auth routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Donation routes (PayPal & Stripe)
const donationRoutes = require('./routes/donations');
app.use('/api/donate', donationRoutes);

// Payment routes (for subscriptions)
const paymentRoutes = require('./routes/payments');
app.use('/api/payments', paymentRoutes);

// Admin routes
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// Library auth routes (auto-login for Audiobookshelf & Calibre-Web)
const libraryAuthRoutes = require('./routes/library-auth');
app.use('/api/library', libraryAuthRoutes);

// Contact routes
const contactRoutes = require('./routes/contact');
app.use('/api/contact', contactRoutes);

// Google OAuth routes
// app.get('/api/auth/google',
//   passport.authenticate('google', { scope: ['profile', 'email'] })
// );

// app.get('/api/auth/google/callback',
//   passport.authenticate('google', { failureRedirect: '/login' }),
//   (req, res) => {
//     // Successful authentication, redirect to frontend
//     res.redirect(process.env.FRONTEND_URL || 'http://localhost:80');
//   }
// );

// Home route - redirect to homepage.html if not an API request
app.get('/', (req, res) => {
  if (req.accepts('html')) {
    return res.sendFile(path.join(__dirname, '../frontend/homepage.html'));
  }
  res.json({
    message: 'Welcome to Raphael\'s Horizon API',
    version: '1.0.0',
    mode: EMBEDDED_MODE ? 'embedded' : 'database'
  });
});

// Embedded mode routes
if (EMBEDDED_MODE) {
  // Books routes
  app.get('/api/books', (req, res) => {
    res.json({ success: true, data: embeddedStore.books });
  });

  app.get('/api/books/:id', (req, res) => {
    const book = embeddedStore.books.find(b => b.id === req.params.id);
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
    res.json({ success: true, data: book });
  });

  // Blog routes
  app.get('/api/blog/posts', (req, res) => {
    res.json({ success: true, data: embeddedStore.posts });
  });

  app.get('/api/blog/posts/:id', (req, res) => {
    const post = embeddedStore.posts.find(p => p.id === req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, data: post });
  });

  // Admin routes for embedded mode
  app.get('/api/admin/stats', (req, res) => {
    res.json({
      success: true,
      data: {
        totalBooks: embeddedStore.books.length,
        totalPosts: embeddedStore.posts.length,
        totalUsers: 0 // Not implemented in embedded mode
      }
    });
  });

  app.get('/api/admin/books', (req, res) => {
    res.json({ success: true, data: embeddedStore.books });
  });

  app.post('/api/admin/books', (req, res) => {
    const newBook = { id: Date.now().toString(), ...req.body, createdAt: new Date() };
    embeddedStore.books.push(newBook);

    // Save to file
    try {
      fs.writeFileSync(path.join(__dirname, 'embedded-data', 'books.json'), JSON.stringify(embeddedStore.books, null, 2));
      res.json({ success: true, data: newBook });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to save book' });
    }
  });

  // Mock routes for iframes in embedded mode (Placeholders)
  app.get('/books/*', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Calibre-Web Library</title></head>
        <body style="background:#f8f9fa;display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;margin:0;font-family:-apple-system,sans-serif;color:#2c3e50;">
            <div style="background:white;padding:40px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.1);text-align:center;max-width:500px;">
                <h2 style="margin-top:0;color:#2c3e50;">Calibre-Web Library</h2>
                <p style="color:#546e7a;line-height:1.6;">The library service is currently in <strong>Embedded Mode</strong>.</p>
                <p style="color:#546e7a;">To see the full library, please connect the backend to a running Calibre-Web instance.</p>
                <div style="margin-top:20px;padding:15px;background:#e3f2fd;border-radius:8px;color:#0d47a1;font-size:0.9rem;">Simulated Content Loaded</div>
            </div>
        </body>
        </html>
      `);
  });
  
  app.get('/audiobooks/*', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Audiobookshelf</title></head>
        <body style="background:#1a202c;display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;margin:0;font-family:-apple-system,sans-serif;color:white;">
            <div style="background:#2d3748;padding:40px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.3);text-align:center;max-width:500px;border:1px solid #4a5568;">
                <h2 style="margin-top:0;color:#63b3ed;">Audiobookshelf</h2>
                <p style="color:#a0aec0;line-height:1.6;">The audio service is currently in <strong>Embedded Mode</strong>.</p>
                <div style="margin-top:20px;padding:15px;background:#2c5282;border-radius:8px;color:#bee3f8;font-size:0.9rem;">Simulated Player Loaded</div>
            </div>
        </body>
        </html>
      `);
  });
}

// Handle undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Health check: http://0.0.0.0:${PORT}/api/health`);
  console.log('Embedded mode:', EMBEDDED_MODE ? 'ENABLED' : 'DISABLED');
});

module.exports = { app };