/**
 * Authentication Manager
 * Handles user login, registration, and session management
 */

// API configuration - Use config.js or fallback to relative path
// Only declare if not already declared
if (typeof API_BASE_URL === 'undefined') {
    const API_BASE_URL = (window.APP_CONFIG && window.APP_CONFIG.apiBaseUrl) 
        ? window.APP_CONFIG.apiBaseUrl  // Just use the base URL directly
        : '/api';
    window.API_BASE_URL = API_BASE_URL;
}

class AuthManager {
    constructor() {
        this.googleClientId = null;
        // Use APP_CONFIG directly to build URLs properly
        this.API_BASE_URL = (window.APP_CONFIG && window.APP_CONFIG.apiBaseUrl) 
            ? window.APP_CONFIG.apiBaseUrl 
            : '/api';
        
        // Wait for DOM to be ready before initializing
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
        // Expose methods globally immediately (before DOM ready)
        this.exposeGlobalMethods();
    }

    exposeGlobalMethods() {
        // Expose methods to global scope for HTML onclick handlers
        window.showLoginModal = (view) => this.showLoginModal(view);
        window.logout = () => this.logout();
        window.showSubscriptionModal = () => this.showSubscriptionModal();
        window.closeAuthModal = () => this.closeAuthModal();
        window.handleAuthSubmit = (e, type) => this.handleAuthSubmit(e, type);
        window.handleForgotPassword = (e) => this.handleForgotPassword(e);
        window.handleResetPassword = (e) => this.handleResetPassword(e);
        window.switchAuthTab = (tab) => this.switchTab(tab);
        window.handleGoogleSignIn = (credential) => this.handleGoogleResponse({ credential });
    }

    async init() {
        console.log('[AuthManager] Initializing...');
        console.log('[AuthManager] API Base URL:', this.API_BASE_URL);
        
        // Start loading script immediately
        this.loadGoogleScript();
        
        // Fetch client ID in parallel
        await this.fetchGoogleClientId();
        
        // Final state checks
        this.checkAuthStatus();
        this.handleOAuthCallback();
        this.setupDOMListeners();
        
        // Try rendering again now that we have the client ID
        this.renderGoogleButton();
    }

    async fetchGoogleClientId() {
        try {
            // First render with loading state
            this.renderGoogleButton();
            
            // Build the URL properly
            const url = this.buildApiUrl('/config/google-client-id');
            console.log('[AuthManager] Fetching Google Client ID from:', url);
            
            const response = await fetch(url);
            console.log('[AuthManager] Google Client ID response status:', response.status);
            
            if (!response.ok) throw new Error(`HTTP ${response.status}: Could not fetch Google Client ID`);
            
            const data = await response.json();
            console.log('[AuthManager] Google Client ID received:', data.clientId ? 'Yes' : 'No');
            
            this.googleClientId = data.clientId;
            
            // Re-render now that we have the ID
            this.renderGoogleButton();
        } catch (error) {
            console.error('[AuthManager] Error fetching Google Client ID:', error.message);
            this.googleClientId = null;
            this.renderGoogleButton();
            
            // Retry after 2 seconds if initial fetch failed
            if (this.googleClientId === null) {
                console.log('[AuthManager] Retrying Google Client ID fetch in 2 seconds...');
                setTimeout(() => this.fetchGoogleClientId(), 2000);
            }
        }
    }

    // Helper method to build proper API URLs
    buildApiUrl(endpoint) {
        // Ensure endpoint starts with slash
        const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
        
        // If base URL is empty (development), just return endpoint
        if (!this.API_BASE_URL) {
            return normalizedEndpoint;
        }
        
        // If base URL ends with slash and endpoint starts with slash, remove duplicate slash
        const base = this.API_BASE_URL.endsWith('/') ? this.API_BASE_URL.slice(0, -1) : this.API_BASE_URL;
        const endpointPath = normalizedEndpoint.startsWith('/') ? normalizedEndpoint : '/' + normalizedEndpoint;
        
        return base + endpointPath;
    }

    setupDOMListeners() {
        // Attach event listeners to DOM elements by ID (fixes header buttons)
        const loginBtn = document.getElementById('show-login-btn');
        if (loginBtn) loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // redirect to standalone login page
            window.location.href = '/pages/profile/login.html';
        });

        const registerBtn = document.getElementById('show-register-btn');
        if (registerBtn) registerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // redirect to standalone login page with register view
            window.location.href = '/pages/profile/login.html#register';
        });

        const subBtn = document.getElementById('show-subscription-btn');
        if (subBtn) subBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSubscriptionModal();
        });

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });
    }

    loadGoogleScript() {
        // Check if script is already present (e.g. in login.html head)
        const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
        
        if (!existingScript) {
            const script = document.createElement('script');
            script.src = "https://accounts.google.com/gsi/client";
            script.async = true;
            script.defer = true;
            script.onload = () => {
                console.log("[AuthManager] Google script loaded via injection");
                this.renderGoogleButton();
            };
            script.onerror = () => {
                console.error("[AuthManager] Failed to load Google script");
                this.renderGoogleFallback(document.getElementById("google-signin-button"));
            };
            document.head.appendChild(script);
        } else {
            // Script exists, check if loaded or wait
            if (window.google && window.google.accounts) {
                this.renderGoogleButton();
            } else {
                this.waitForGoogle();
            }
        }
    }

    waitForGoogle() {
        let attempts = 0;
        const checkGoogle = setInterval(() => {
            attempts++;
            if (window.google && window.google.accounts) {
                clearInterval(checkGoogle);
                this.renderGoogleButton();
            } else if (attempts > 50) { // 5 seconds
                clearInterval(checkGoogle);
                console.warn("[AuthManager] Google GSI script failed to initialize after 5s");
                this.renderGoogleFallback(document.getElementById("google-signin-button"));
            }
        }, 100);
    }

    checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        const userStr = localStorage.getItem('user');
        
        const guestMenus = document.querySelectorAll('.auth-menu-guest');
        const userMenus = document.querySelectorAll('.user-menu-container');
        const userNames = document.querySelectorAll('.user-name');
        const userAvatars = document.querySelectorAll('.user-avatar');

        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                guestMenus.forEach(el => el.style.display = 'none');
                userMenus.forEach(el => el.style.display = 'flex');
                userNames.forEach(el => el.textContent = user.name || 'User');
                
                // Handle avatar display
                userAvatars.forEach(el => {
                    if (user.avatar && user.avatar !== 'default-avatar.jpg') {
                        // If avatar is a URL (Google profile picture), display as image
                        if (user.avatar.startsWith('http')) {
                            el.innerHTML = `<img src="${user.avatar}" alt="${user.name}" class="avatar-image" referrerpolicy="no-referrer" crossorigin="anonymous">`;
                        } else {
                            // Local avatar
                            el.innerHTML = `<img src="/uploads/${user.avatar}" alt="${user.name}" class="avatar-image">`;
                        }
                    } else {
                        // Fallback to initial
                        el.textContent = (user.name || 'U').charAt(0).toUpperCase();
                    }
                });
            } catch (e) {
                console.error('[AuthManager] Error parsing user data:', e);
                this.logout();
            }
        } else {
            guestMenus.forEach(el => el.style.display = 'block');
            userMenus.forEach(el => el.style.display = 'none');
            userAvatars.forEach(el => {
                el.textContent = 'U';
            });
        }
    }

    handleOAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (token) {
            localStorage.setItem('authToken', token);
            this.fetchUserProfile(token);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    async fetchUserProfile(token) {
        try {
            const url = this.buildApiUrl('/auth/me');
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                // The backend returns { success: true, data: user }
                const result = await response.json();
                if (result.success && result.data) {
                    localStorage.setItem('user', JSON.stringify(result.data));
                }
                this.checkAuthStatus();
            } else {
                // If token is invalid (e.g., expired), log the user out
                this.logout();
            }
        } catch (error) {
            console.error('[AuthManager] Failed to fetch profile', error);
            this.logout();
        }
    }

    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        this.checkAuthStatus();
        window.location.href = '/homepage.html';
    }

    showLoginModal(view = 'login') {
        // Redirect to standalone login page (no more in-page modals)
        if (view === 'register') {
          window.location.href = '/pages/profile/login.html#register';
        } else {
          window.location.href = '/pages/profile/login.html';
        }
    }

    // Legacy method - no longer needed but kept for compatibility
    closeAuthModal() {
        // No modal to close - redirects handle everything now
    }

    // Legacy method - kept for compatibility
    switchTab(tab) {
        // Handle tab switching on login.html page
        const loginForm = document.getElementById('page-login-form');
        const registerForm = document.getElementById('page-register-form');
        const loginTab = document.querySelector('[data-tab="login"]');
        const registerTab = document.querySelector('[data-tab="register"]');
        
        if (!loginForm || !registerForm) return;
        
        if (tab === 'register') {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            if (loginTab) loginTab.classList.remove('active');
            if (registerTab) registerTab.classList.add('active');
        } else {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            if (loginTab) loginTab.classList.add('active');
            if (registerTab) registerTab.classList.remove('active');
        }
    }

    renderGoogleButton() {
        const container = document.getElementById("google-signin-button");
        if (!container) {
            console.warn("[AuthManager] Google sign-in button container not found");
            return;
        }

        // Ensure container is always visible
        container.style.display = 'block';
        container.style.minHeight = '44px';
        container.style.opacity = '1';
        container.style.visibility = 'visible';

        if (!this.googleClientId) {
            const isInitial = this.googleClientId === null;
            const msg = isInitial ? "Loading Google Sign-In..." : "Google Sign-In temporarily unavailable. Please refresh the page.";
            
            container.innerHTML = `
                <div class="google-loading-placeholder" style="
                    width: 100%; 
                    display: flex; 
                    flex-direction: column;
                    align-items: center; 
                    justify-content: center; 
                    gap: 10px; 
                    background: white; 
                    border: 1px solid #dadce0; 
                    border-radius: 4px; 
                    padding: 12px;
                    opacity: 1;
                    min-height: 40px;
                ">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width: 18px; height: 18px;">
                        <span style="color: #757575; font-family: system-ui, -apple-system, sans-serif; font-weight: 500; font-size: 14px;">
                            ${msg}
                        </span>
                    </div>
                    ${isInitial ? `
                    <div class="shimmer-loader" style="
                        width: 50%; height: 2px; background: #f0f0f0; position: relative; overflow: hidden; margin-top: 5px;
                    ">
                        <div style="
                            position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
                            background: linear-gradient(90deg, transparent, #4285f4, transparent);
                            animation: shimmer 1.5s infinite;
                        "></div>
                    </div>
                    <style>
                        @keyframes shimmer { 0% { left: -100%; } 100% { left: 100%; } }
                    </style>
                    ` : ''}
                </div>
            `;
            return;
        }

        if (window.google && window.google.accounts) {
            try {
                // Clear the container before rendering to avoid duplicates
                container.innerHTML = '';
                
                google.accounts.id.initialize({
                    client_id: this.googleClientId,
                    callback: this.handleGoogleResponse.bind(this),
                    cancel_on_tap_outside: false,
                    ux_mode: 'popup'
                });
                
                google.accounts.id.renderButton(
                    container,
                    { 
                        theme: "outline", 
                        size: "large", 
                        width: container.offsetWidth || 400,
                        text: "signin_with",
                        shape: "rectangular",
                        logo_alignment: "left"
                    }
                );
                console.log("[AuthManager] Google button rendered successfully");
            } catch (e) {
                console.error("[AuthManager] Google Sign-In Render Error:", e);
                this.renderGoogleFallback(container);
            }
        } else {
            // Keep the loading state if window.google isn't ready yet
            // waitForGoogle will call this again once ready
            console.log("[AuthManager] Waiting for window.google to render button...");
        }
    }

    renderGoogleFallback(container) {
        if (!container) return;
        container.innerHTML = `
            <button onclick="window.location.href='${this.buildApiUrl('/auth/google/init')}'" 
                    style="width:100%; height:44px; background:#fff; border:1px solid #ddd; border-radius:4px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px;">
                <img src="https://www.google.com/favicon.ico" alt="Google" width="18" height="18">
                <span>Sign in with Google</span>
            </button>
        `;
    }

    async handleGoogleResponse(response) {
        try {
            const url = this.buildApiUrl('/auth/google');
            console.log('[AuthManager] Sending Google token to:', url);
            
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: response.credential })
            });
            
            const result = await res.json();
            
            if (!res.ok) throw new Error(result.message || 'Google authentication failed');
            
            await this.handleLoginSuccess(result);
        } catch (error) {
            console.error('[AuthManager] Google Sign-In Error:', error);
            alert('Google Sign-In failed: ' + error.message);
        }
    }

    showSubscriptionModal() {
        window.location.href = '/pages/profile/subscription.html';
    }

    async handleAuthSubmit(event, type) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        const submitBtn = form.querySelector('button[type="submit"]');
        
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Processing...';
        submitBtn.disabled = true;
        
        const endpoint = type === 'login' ? '/auth/login' : '/auth/register';
        
        try {
            const url = this.buildApiUrl(endpoint);
            console.log('[AuthManager] Sending auth request to:', url);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                // Handle admin redirect
                if (result.redirectTo) {
                    alert(result.message);
                    window.location.href = result.redirectTo;
                    return;
                }
                throw new Error(result.message || 'Authentication failed');
            }
            
            await this.handleLoginSuccess(result);
            
        } catch (error) {
            console.error('[AuthManager] Auth error:', error);
            alert(error.message);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    async handleForgotPassword(event) {
        event.preventDefault();
        const form = event.target;
        const email = form.querySelector('#forgot-email').value;
        const submitBtn = form.querySelector('button[type="submit"]');
        const messageDiv = document.getElementById('response-message');

        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        messageDiv.style.display = 'none';

        try {
            const url = this.buildApiUrl('/auth/forgot-password');
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.message || 'Failed to send reset link.');

            messageDiv.className = 'success';
            messageDiv.textContent = result.message || 'If an account with that email exists, a password reset link has been sent.';
            messageDiv.style.display = 'block';
            form.reset();

        } catch (error) {
            messageDiv.className = 'error';
            messageDiv.textContent = error.message;
            messageDiv.style.display = 'block';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Reset Link';
        }
    }

    async handleResetPassword(event) {
        event.preventDefault();
        const form = event.target;
        const password = form.querySelector('#reset-password').value;
        const confirmPassword = form.querySelector('#confirm-password').value;
        const submitBtn = form.querySelector('button[type="submit"]');
        const messageDiv = document.getElementById('response-message');

        if (password !== confirmPassword) {
            messageDiv.className = 'error';
            messageDiv.textContent = 'Passwords do not match.';
            messageDiv.style.display = 'block';
            return;
        }

        const token = new URLSearchParams(window.location.search).get('token');
        if (!token) {
            messageDiv.className = 'error';
            messageDiv.textContent = 'Invalid or missing reset token.';
            messageDiv.style.display = 'block';
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Resetting...';
        messageDiv.style.display = 'none';

        try {
            const url = this.buildApiUrl('/auth/reset-password');
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.message || 'Failed to reset password.');

            messageDiv.className = 'success';
            messageDiv.textContent = result.message || 'Password has been reset successfully! You can now log in.';
            messageDiv.style.display = 'block';
            form.reset();
            
            setTimeout(() => {
                window.location.href = '/pages/profile/login.html';
            }, 3000);

        } catch (error) {
            messageDiv.className = 'error';
            messageDiv.textContent = error.message;
            messageDiv.style.display = 'block';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Reset Password';
        }
    }

    handleLoginSuccess(result) {
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        
        this.checkAuthStatus();
        this.closeAuthModal();
        
        // If a return path was saved, redirect back
        const returnTo = sessionStorage.getItem('returnTo') || new URLSearchParams(window.location.search).get('returnTo');
        if (returnTo) {
            try { sessionStorage.removeItem('returnTo'); } catch(e) {}
            window.location.href = returnTo;
            return;
        }

        // Redirect based on role
        if (result.user.role === 'admin') {
            window.location.href = '/pages/admin/admin-dashboard.html';
        } else {
            window.location.href = '/pages/profile/index.html';
        }
    }
}

// Initialize and expose globally
window.authManager = new AuthManager();