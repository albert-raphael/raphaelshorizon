/**
 * Library Auto-Login Manager
 * Automatically authenticates users to Audiobookshelf and Calibre-Web
 * when they are logged into raphaelshorizon.com
 */

(function() {
    'use strict';

    const LibraryAuth = {
        // Storage keys
        KEYS: {
            ABS_TOKEN: 'absGuestToken',
            ABS_EXPIRY: 'absTokenExpiry',
            ABS_ERROR_TIME: 'absErrorTime',
            CALIBRE_SESSION: 'calibreGuestSession',
            CALIBRE_EXPIRY: 'calibreSessionExpiry'
        },

        // Check if user is logged into the main site
        isUserLoggedIn: function() {
            return !!(localStorage.getItem('authToken') || localStorage.getItem('adminToken'));
        },

        // Get the auth token for API calls
        getAuthToken: function() {
            return localStorage.getItem('authToken') || localStorage.getItem('adminToken');
        },

        // Get API base URL
        getApiUrl: function() {
            if (window.API_BASE_URL) return window.API_BASE_URL;
            if (window.APP_CONFIG && window.APP_CONFIG.apiBaseUrl) {
                return window.APP_CONFIG.apiBaseUrl + '/api';
            }
            return '/api';
        },

        // Check if cached token is still valid (not expired)
        isTokenValid: function(expiryKey) {
            const expiry = localStorage.getItem(expiryKey);
            if (!expiry) return false;
            return Date.now() < parseInt(expiry, 10);
        },

        // Get Audiobookshelf token (always attempt guest login)
        getAudiobookshelfToken: async function(forceRefresh = false) {
            // Check for recent error to prevent loop
            const lastError = localStorage.getItem(this.KEYS.ABS_ERROR_TIME);
            if (!forceRefresh && lastError && (Date.now() - parseInt(lastError, 10) < 60000)) {
                console.warn('LibraryAuth: Skipping token request due to recent error');
                return null;
            }

            // Check cache first
            if (!forceRefresh && this.isTokenValid(this.KEYS.ABS_EXPIRY)) {
                const cachedToken = localStorage.getItem(this.KEYS.ABS_TOKEN);
                if (cachedToken) {
                    console.log('LibraryAuth: Using cached Audiobookshelf token');
                    return cachedToken;
                }
            }

            // Request new token from backend (guest access doesn't require main site auth)
            try {
                const headers = { 'Content-Type': 'application/json' };
                // Don't require main site auth token for guest access
                // const authToken = this.getAuthToken();
                // if (authToken) headers['Authorization'] = 'Bearer ' + authToken;

                const response = await fetch(this.getApiUrl() + '/library/audiobookshelf-token', {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({ refresh: forceRefresh })
                });

                const data = await response.json();
                
                if (data.success && data.token) {
                    // Cache the token for 23 hours (backend caches for 24)
                    localStorage.setItem(this.KEYS.ABS_TOKEN, data.token);
                    localStorage.setItem(this.KEYS.ABS_EXPIRY, Date.now() + (23 * 60 * 60 * 1000));
                    localStorage.removeItem(this.KEYS.ABS_ERROR_TIME);
                    console.log('LibraryAuth: Got new Audiobookshelf token');
                    return data.token;
                }

                if (data.setup) {
                   localStorage.setItem(this.KEYS.ABS_ERROR_TIME, Date.now());
                }
                console.warn('LibraryAuth: Could not get Audiobookshelf token', data.message);
                return null;

            } catch (error) {
                localStorage.setItem(this.KEYS.ABS_ERROR_TIME, Date.now());
                console.error('LibraryAuth: Error getting Audiobookshelf token', error);
                return null;
            }
        },

        // Get Calibre session info
        getCalibreSession: async function() {
            // Check cache first
            if (this.isTokenValid(this.KEYS.CALIBRE_EXPIRY)) {
                const cachedSession = localStorage.getItem(this.KEYS.CALIBRE_SESSION);
                if (cachedSession) {
                    console.log('LibraryAuth: Using cached Calibre session');
                    return JSON.parse(cachedSession);
                }
            }

            // Request new session from backend
            try {
                const headers = { 'Content-Type': 'application/json' };
                const authToken = this.getAuthToken();
                if (authToken) headers['Authorization'] = 'Bearer ' + authToken;

                const response = await fetch(this.getApiUrl() + '/library/calibre-token', {
                    method: 'POST',
                    headers: headers
                });

                const data = await response.json();
                
                if (data.success) {
                    // Set the cookie in the browser if returned
                    if (data.sessionCookie) {
                        document.cookie = data.sessionCookie + "; SameSite=Lax";
                    }
                    
                    // Cache the session for 23 hours
                    localStorage.setItem(this.KEYS.CALIBRE_SESSION, JSON.stringify(data));
                    localStorage.setItem(this.KEYS.CALIBRE_EXPIRY, Date.now() + (23 * 60 * 60 * 1000));
                    console.log('LibraryAuth: Got Calibre session info');
                    return data;
                }

                console.warn('LibraryAuth: Could not get Calibre session', data.message);
                return null;

            } catch (error) {
                console.error('LibraryAuth: Error getting Calibre session', error);
                return null;
            }
        },

        // Build Audiobookshelf URL with token
        getAudiobookshelfUrl: async function(basePath, forceRefresh = false) {
            const baseUrl = basePath || (window.APP_CONFIG ? window.APP_CONFIG.audiobookshelfUrl : '/audiobookshelf');
            
            const token = await this.getAudiobookshelfToken(forceRefresh);
            if (token) {
                // Audiobookshelf accepts token as query parameter
                const separator = baseUrl.includes('?') ? '&' : '?';
                return baseUrl + separator + 'token=' + encodeURIComponent(token);
            }
            
            return baseUrl;
        },

        // Build Calibre URL (for now, just return base - Calibre uses cookies)
        getCalibreUrl: async function(basePath) {
            const baseUrl = basePath || (window.APP_CONFIG ? window.APP_CONFIG.calibreUrl : '/calibre');
            
            // Try to get session - this primes the cache
            await this.getCalibreSession();
            
            return baseUrl;
        },

        // Initialize iframe with authentication
        initAudiobookshelfIframe: async function(iframeId, forceRefresh = false) {
            const iframe = document.getElementById(iframeId);
            if (!iframe) {
                console.warn('LibraryAuth: Iframe not found:', iframeId);
                return;
            }

            const url = await this.getAudiobookshelfUrl(null, forceRefresh);
            console.log('LibraryAuth: Loading Audiobookshelf with auth URL');
            iframe.src = url;
        },

        // Initialize Calibre iframe
        initCalibreIframe: async function(iframeId) {
            const iframe = document.getElementById(iframeId);
            if (!iframe) {
                console.warn('LibraryAuth: Iframe not found:', iframeId);
                return;
            }

            const url = await this.getCalibreUrl();
            console.log('LibraryAuth: Loading Calibre-Web');
            iframe.src = url;
        },

        // Clear all cached tokens (on logout)
        clearTokens: function() {
            localStorage.removeItem(this.KEYS.ABS_TOKEN);
            localStorage.removeItem(this.KEYS.ABS_EXPIRY);
            localStorage.removeItem(this.KEYS.CALIBRE_SESSION);
            localStorage.removeItem(this.KEYS.CALIBRE_EXPIRY);
            console.log('LibraryAuth: Cleared all cached tokens');
        },

        // Initialize both iframes on page load
        initLibraryPage: async function() {
            if (!this.isUserLoggedIn()) {
                console.log('LibraryAuth: User not logged in, loading iframes without auth');
            }

            // Initialize both iframes
            await Promise.all([
                this.initAudiobookshelfIframe('audiobookshelfFrame'),
                this.initCalibreIframe('calibreFrame')
            ]);
        }
    };

    // Export to window
    window.LibraryAuth = LibraryAuth;

    // Auto-clear tokens when user logs out
    window.addEventListener('storage', function(e) {
        if ((e.key === 'authToken' || e.key === 'adminToken') && e.newValue === null) {
            LibraryAuth.clearTokens();
        }
    });

})();
