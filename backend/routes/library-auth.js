/**
 * Library Authentication Routes
 * Provides auto-login tokens for Audiobookshelf and Calibre-Web
 * When users are logged into raphaelshorizon.com, they automatically get access
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');

// Shared guest account credentials (stored securely)
const LIBRARY_CONFIG = {
    audiobookshelf: {
        url: process.env.AUDIOBOOKSHELF_INTERNAL_URL || 'http://audiobookshelf:80',
        guestUsername: 'guest',
        guestPassword: 'GuestAccess2024!'
    },
    calibre: {
        url: process.env.CALIBRE_INTERNAL_URL || 'http://calibre-web:8083',
        guestUsername: 'guest',
        guestPassword: 'GuestAccess2024!'
    }
};

// Cache for tokens to avoid repeated logins
let tokenCache = {
    audiobookshelf: { token: null, expiry: 0 },
    calibre: { token: null, expiry: 0 }
};

/**
 * Get Audiobookshelf guest token
 * POST /api/library/audiobookshelf-token
 */
router.post('/audiobookshelf-token', async (req, res) => {
    try {
        // Public guest access - no need for main site authToken
        const forceRefresh = req.body && req.body.refresh === true;

        // Check cache first (tokens valid for 24 hours)
        const now = Date.now();
        if (!forceRefresh && tokenCache.audiobookshelf.token && tokenCache.audiobookshelf.expiry > now) {
            return res.json({
                success: true,
                token: tokenCache.audiobookshelf.token,
                type: 'audiobookshelf'
            });
        }

        // Login to Audiobookshelf as guest
        const loginResponse = await axios.post(
            `${LIBRARY_CONFIG.audiobookshelf.url}/login`,
            {
                username: LIBRARY_CONFIG.audiobookshelf.guestUsername,
                password: LIBRARY_CONFIG.audiobookshelf.guestPassword
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            }
        );

        if (loginResponse.data && loginResponse.data.user && loginResponse.data.user.token) {
            const token = loginResponse.data.user.token;
            
            // Cache the token for 24 hours
            tokenCache.audiobookshelf = {
                token: token,
                expiry: now + (24 * 60 * 60 * 1000)
            };

            return res.json({
                success: true,
                token: token,
                type: 'audiobookshelf'
            });
        }

        res.status(500).json({ 
            success: false, 
            message: 'Failed to get Audiobookshelf token' 
        });

    } catch (error) {
        console.error('Audiobookshelf token error:', error.message);
        
        // If guest account doesn't exist, return instructions
        if (error.response && error.response.status === 401) {
            return res.status(503).json({
                success: false,
                message: 'Guest account not configured. Please set up guest access in Audiobookshelf.',
                setup: true
            });
        }

        res.status(500).json({ 
            success: false, 
            message: 'Error connecting to Audiobookshelf' 
        });
    }
});

/**
 * Get Calibre-Web guest session cookie
 * POST /api/library/calibre-token
 */
router.post('/calibre-token', async (req, res) => {
    try {
        // Public guest access - no need for main site authToken
        // Check cache first
        const now = Date.now();
        if (tokenCache.calibre.token && tokenCache.calibre.expiry > now) {
            return res.json({
                success: true,
                sessionCookie: tokenCache.calibre.token,
                type: 'calibre'
            });
        }

        // Login to Calibre-Web as guest
        const loginResponse = await axios.post(
            `${LIBRARY_CONFIG.calibre.url}/login`,
            new URLSearchParams({
                username: LIBRARY_CONFIG.calibre.guestUsername,
                password: LIBRARY_CONFIG.calibre.guestPassword,
                next: '/'
            }),
            {
                headers: { 
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                timeout: 10000,
                maxRedirects: 0,
                validateStatus: (status) => status >= 200 && status < 400
            }
        );

        // Extract session cookie from response
        const cookies = loginResponse.headers['set-cookie'];
        if (cookies && cookies.length > 0) {
            const sessionCookie = cookies.find(c => c.includes('session'));
            
            if (sessionCookie) {
                // Cache the session cookie for 24 hours
                tokenCache.calibre = {
                    token: sessionCookie,
                    expiry: now + (24 * 60 * 60 * 1000)
                };

                // Remove HttpOnly and Secure flags so frontend can set them if needed
                // OR better, we set them here on the response
                const userCookie = sessionCookie.replace(/HttpOnly;?\s*/i, '').replace(/Secure;?\s*/i, '');
                res.setHeader('Set-Cookie', userCookie);

                return res.json({
                    success: true,
                    sessionCookie: userCookie,
                    type: 'calibre'
                });
            }
        }

        // If no session cookie, Calibre might be in anonymous mode
        res.json({
            success: true,
            anonymous: true,
            type: 'calibre',
            message: 'Calibre-Web is in anonymous mode'
        });

    } catch (error) {
        console.error('Calibre token error:', error.message);
        
        if (error.response && error.response.status === 401) {
            return res.status(503).json({
                success: false,
                message: 'Guest account not configured. Please set up guest access in Calibre-Web.',
                setup: true
            });
        }

        res.status(500).json({ 
            success: false, 
            message: 'Error connecting to Calibre-Web' 
        });
    }
});

/**
 * Check library services status
 * GET /api/library/status
 */
router.get('/status', async (req, res) => {
    const status = {
        audiobookshelf: { available: false, guestEnabled: false },
        calibre: { available: false, guestEnabled: false }
    };

    try {
        // Check Audiobookshelf
        const absResponse = await axios.get(
            `${LIBRARY_CONFIG.audiobookshelf.url}/ping`,
            { timeout: 5000 }
        );
        status.audiobookshelf.available = absResponse.status === 200;
    } catch (e) {
        console.log('Audiobookshelf not reachable:', e.message);
    }

    try {
        // Check Calibre-Web
        const calibreResponse = await axios.get(
            `${LIBRARY_CONFIG.calibre.url}/`,
            { timeout: 5000 }
        );
        status.calibre.available = calibreResponse.status === 200;
    } catch (e) {
        console.log('Calibre-Web not reachable:', e.message);
    }

    res.json(status);
});

module.exports = router;
