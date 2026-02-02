/**
 * Authentication Guard Utility
 * 
 * This utility provides page-level authentication protection.
 * Include this script on any page that requires authentication.
 * 
 * Usage:
 *   <script src="/js/auth-guard.js" data-require-auth="true"></script>
 *   <script src="/js/auth-guard.js" data-require-auth="true" data-require-role="admin"></script>
 *   <script src="/js/auth-guard.js" data-require-auth="true" data-require-subscription="true"></script>
 */

(function() {
    'use strict';

    // API configuration - Use config.js or fallback to relative path
    const API_BASE_URL = (window.APP_CONFIG && window.APP_CONFIG.apiBaseUrl) 
        ? window.APP_CONFIG.apiBaseUrl + '/api' 
        : '/api';

    // Get configuration from script tag - find by src attribute if currentScript is null
    let scriptTag = document.currentScript;
    if (!scriptTag) {
        // Fallback: find the auth-guard script tag
        scriptTag = document.querySelector('script[src*="auth-guard"]');
    }
    
    const requireAuth = scriptTag?.getAttribute('data-require-auth') === 'true';
    const requireRole = scriptTag?.getAttribute('data-require-role');
    const requireSubscription = scriptTag?.getAttribute('data-require-subscription') === 'true';
    const loginPage = scriptTag?.getAttribute('data-login-page') || '/pages/profile/login.html';
    const adminLoginPage = scriptTag?.getAttribute('data-admin-login-page') || '/pages/admin/login_admin.html';

    // If no auth required, exit early and ensure page is visible
    if (!requireAuth) {
        document.documentElement.style.visibility = 'visible';
        return;
    }

    /**
     * AuthGuard class for handling page protection
     */
    class AuthGuard {
        constructor() {
            // Check for both regular and admin tokens for compatibility
            this.token = localStorage.getItem('authToken') || localStorage.getItem('adminToken');
            this.user = null;
            
            try {
                // Check for both regular and admin user data
                const userStr = localStorage.getItem('user') || localStorage.getItem('adminUser');
                if (userStr) {
                    this.user = JSON.parse(userStr);
                }
            } catch (e) {
                console.error('Failed to parse user data:', e);
            }
        }

        /**
         * Check if user is authenticated
         */
        isAuthenticated() {
            return !!(this.token && this.user);
        }

        /**
         * Check if user has required role
         */
        hasRole(role) {
            if (!this.user) return false;
            if (role === 'admin') {
                return this.user.role === 'admin';
            }
            return this.user.role === role || this.user.role === 'admin';
        }

        /**
         * Check if user has active subscription
         */
        hasSubscription() {
            if (!this.user) return false;
            // Admins always have access
            if (this.user.role === 'admin') return true;
            return this.user.subscriptionActive === true;
        }

        /**
         * Verify token with backend
         */
        async verifyToken() {
            if (!this.token) return false;

            try {
                const response = await fetch(`${API_BASE_URL}/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });

                if (!response.ok) {
                    // Token is invalid, clear storage
                    this.clearAuth();
                    return false;
                }

                const result = await response.json();
                if (result.success && result.data) {
                    // Update user data
                    this.user = result.data;
                    localStorage.setItem('user', JSON.stringify(result.data));
                    return true;
                }

                return false;
            } catch (error) {
                console.error('Token verification failed:', error);
                return false;
            }
        }

        /**
         * Clear authentication data
         */
        clearAuth() {
            // Clear both regular and admin tokens
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            this.token = null;
            this.user = null;
        }

        /**
         * Redirect to login page
         */
        redirectToLogin(isAdmin = false) {
            // Save current URL for return after login
            sessionStorage.setItem('returnTo', window.location.href);
            
            const targetPage = isAdmin ? adminLoginPage : loginPage;
            window.location.href = targetPage;
        }

        /**
         * Show access denied message
         */
        showAccessDenied(message = 'Access Denied') {
            document.body.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f7f6; padding: 20px; text-align: center;">
                    <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 25px rgba(0,0,0,0.1); max-width: 500px;">
                        <div style="font-size: 4rem; margin-bottom: 20px;">🔒</div>
                        <h1 style="color: #e74c3c; margin-bottom: 15px;">${message}</h1>
                        <p style="color: #666; margin-bottom: 25px; line-height: 1.6;">
                            You need to be logged in to access this content. 
                            Please sign in or create an account to continue.
                        </p>
                        <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                            <a href="${loginPage}" style="background: #3498db; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">Sign In</a>
                            <a href="${loginPage}#register" style="background: #2c3e50; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">Create Account</a>
                        </div>
                        <p style="margin-top: 25px;">
                            <a href="/homepage.html" style="color: #3498db; text-decoration: none;">← Back to Home</a>
                        </p>
                    </div>
                </div>
            `;
        }

        /**
         * Show subscription required message
         */
        showSubscriptionRequired() {
            document.body.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f7f6; padding: 20px; text-align: center;">
                    <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 25px rgba(0,0,0,0.1); max-width: 500px;">
                        <div style="font-size: 4rem; margin-bottom: 20px;">⭐</div>
                        <h1 style="color: #f39c12; margin-bottom: 15px;">Subscription Required</h1>
                        <p style="color: #666; margin-bottom: 25px; line-height: 1.6;">
                            This content is available exclusively to our subscribers. 
                            Upgrade your account to access our premium library.
                        </p>
                        <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                            <a href="/pages/profile/subscription.html" style="background: #f39c12; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">View Plans</a>
                            <a href="/homepage.html" style="background: #2c3e50; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">Go Home</a>
                        </div>
                    </div>
                </div>
            `;
        }

        /**
         * Main guard check - runs on page load
         */
        async guard() {
            // If no auth required, just return
            if (!requireAuth) return;

            // Quick client-side check first
            if (!this.isAuthenticated()) {
                this.showAccessDenied('Please Sign In');
                setTimeout(() => this.redirectToLogin(requireRole === 'admin'), 2000);
                return;
            }

            // Check role if required
            if (requireRole && !this.hasRole(requireRole)) {
                this.showAccessDenied('Admin Access Only');
                setTimeout(() => this.redirectToLogin(true), 2000);
                return;
            }

            // Verify token with backend (async, non-blocking for better UX)
            this.verifyToken().then(valid => {
                if (!valid) {
                    this.showAccessDenied('Session Expired');
                    setTimeout(() => this.redirectToLogin(requireRole === 'admin'), 2000);
                }
            });

            // Check subscription if required
            if (requireSubscription && !this.hasSubscription()) {
                this.showSubscriptionRequired();
                return;
            }
        }
    }

    // Create instance and run guard
    const guard = new AuthGuard();

    // Helper function to show access denied (waits for DOM)
    function showDeniedWhenReady(message, isAdmin = false) {
        const show = () => {
            guard.showAccessDenied(message);
            document.documentElement.style.visibility = 'visible';
            setTimeout(() => guard.redirectToLogin(isAdmin), 2000);
        };
        
        if (document.body) {
            show();
        } else {
            // Wait for DOM to be ready
            document.addEventListener('DOMContentLoaded', show);
        }
    }

    // Run guard immediately to block page content
    if (requireAuth) {
        try {
            // Hide page until check completes
            document.documentElement.style.visibility = 'hidden';
            
            // Quick check
            if (!guard.isAuthenticated()) {
                showDeniedWhenReady('Please Sign In', requireRole === 'admin');
            } else if (requireRole && !guard.hasRole(requireRole)) {
                showDeniedWhenReady('Admin Access Only', true);
            } else {
                // User appears authenticated, show page and verify in background
                document.documentElement.style.visibility = 'visible';
                guard.verifyToken().then(valid => {
                    if (!valid) {
                        showDeniedWhenReady('Session Expired', requireRole === 'admin');
                    }
                }).catch(err => {
                    console.error('Token verification error:', err);
                    // Show page anyway - let backend handle auth
                    document.documentElement.style.visibility = 'visible';
                });
            }
        } catch (error) {
            console.error('Auth guard error:', error);
            // On any error, show the page (fail-open for better UX)
            document.documentElement.style.visibility = 'visible';
        }
    }

    // Export for use in other scripts
    window.AuthGuard = AuthGuard;
    window.authGuard = guard;
})();
