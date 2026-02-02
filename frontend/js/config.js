/**
 * Environment Configuration for Raphael's Horizon
 * 
 * This file handles the switching between local development and production environments.
 * The frontend on Vercel will use the production API on DigitalOcean.
 */

const ENV_CONFIG = {
    // Development (localhost)
    development: {
        API_BASE_URL: '',  // Same origin
        AUDIOBOOKSHELF_URL: '/audiobookshelf/',
        CALIBRE_URL: '/calibre/',
        ASSETS_URL: ''
    },
    
    // Production (Vercel frontend + DigitalOcean backend)
    production: {
        // DigitalOcean Droplet - use IP until SSL is set up, then switch to api.raphaelshorizon.com
        API_BASE_URL: 'http://159.223.27.101',
        // Use same-origin paths - Vercel rewrites will proxy to DigitalOcean
        // This avoids mixed content (HTTPS -> HTTP) issues with iframes
        AUDIOBOOKSHELF_URL: '/audiobookshelf',
        CALIBRE_URL: '/calibre',
        ASSETS_URL: ''
    }
};

// Auto-detect environment based on hostname
function getEnvironment() {
    const hostname = window.location.hostname;
    
    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'development';
    }
    
    // Production (Vercel or custom domain)
    return 'production';
}

// Get current config
const currentEnv = getEnvironment();
const config = ENV_CONFIG[currentEnv];

// Export configuration
window.APP_CONFIG = {
    env: currentEnv,
    apiBaseUrl: config.API_BASE_URL,
    audiobookshelfUrl: config.AUDIOBOOKSHELF_URL,
    calibreUrl: config.CALIBRE_URL,
    assetsUrl: config.ASSETS_URL,
    
    // Helper to build API URLs
    apiUrl: function(path) {
        return this.apiBaseUrl + path;
    },
    
    // Check if we're in production
    isProduction: function() {
        return this.env === 'production';
    }
};

console.log(`[Config] Environment: ${currentEnv}`);
console.log(`[Config] API Base: ${config.API_BASE_URL || '(same origin)'}`);
