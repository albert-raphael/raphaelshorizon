/**
 * Environment Configuration for Raphael's Horizon
 * 
 * This file handles the switching between local development and production environments.
 * The frontend on Vercel will use the production API on DigitalOcean.
 */

// Environment configurations - declare globally
if (typeof ENV_CONFIG === 'undefined') {
    window.ENV_CONFIG = {
        // Development (localhost)
        development: {
            API_BASE_URL: 'http://localhost:5002/api',
            AUDIOBOOKSHELF_URL: '/audiobookshelf/',
            CALIBRE_URL: '/calibre/',
            ASSETS_URL: '',
            GOOGLE_CLIENT_ID: '890457459901-tpah6030evi6btmtsq9q8s7f3mr19uor.apps.googleusercontent.com'
        },
        
        // Production (Vercel frontend + DigitalOcean backend)
        production: {
            // Use relative path /api so requests go through Vercel Rewrite -> DigitalOcean
            // This avoids mixed content (HTTPS -> HTTP) issues since Vercel handles the SSL
            API_BASE_URL: '/api',
            // Use same-origin paths - Vercel rewrites will proxy to DigitalOcean
            // This avoids mixed content (HTTPS -> HTTP) issues with iframes
            AUDIOBOOKSHELF_URL: '/audiobookshelf/',
            CALIBRE_URL: '/calibre/',
            ASSETS_URL: '',
            GOOGLE_CLIENT_ID: '890457459901-tpah6030evi6btmtsq9q8s7f3mr19uor.apps.googleusercontent.com'
        }
    };
}

// Auto-detect environment based on hostname
function getEnvironment() {
    const hostname = window.location.hostname;
    
    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
        return 'development';
    }
    
    // Production (Vercel or custom domain)
    return 'production';
}

// Get current config
const currentEnv = getEnvironment();
const config = window.ENV_CONFIG[currentEnv];

// Export configuration
window.APP_CONFIG = {
    env: currentEnv,
    apiBaseUrl: config.API_BASE_URL,
    audiobookshelfUrl: config.AUDIOBOOKSHELF_URL,
    calibreUrl: config.CALIBRE_URL,
    assetsUrl: config.ASSETS_URL,
    googleClientId: config.GOOGLE_CLIENT_ID,
    
    // Helper to build API URLs
    apiUrl: function(path) {
        // Ensure path starts with slash
        const normalizedPath = path.startsWith('/') ? path : '/' + path;
        return this.apiBaseUrl + normalizedPath;
    },
    
    // Helper to build full URLs
    fullUrl: function(path) {
        return window.location.origin + this.apiUrl(path);
    },
    
    // Check if we're in production
    isProduction: function() {
        return this.env === 'production';
    },
    
    // Check if we're in development
    isDevelopment: function() {
        return this.env === 'development';
    }
};

console.log(`[Config] Environment: ${currentEnv}`);
console.log(`[Config] API Base: ${config.API_BASE_URL || '(same origin)'}`);
console.log(`[Config] Audiobookshelf URL: ${config.AUDIOBOOKSHELF_URL}`);
console.log(`[Config] Calibre URL: ${config.CALIBRE_URL}`);

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.APP_CONFIG;
}