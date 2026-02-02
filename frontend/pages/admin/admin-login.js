// Admin Login System
const AdminLogin = {
    
    // Configuration
    config: {
        maxAttempts: 5,
        lockoutDuration: 300000, // 5 minutes
        twoFactorRequired: true,
        sessionTimeout: 3600000, // 1 hour
        enableCaptcha: false,
        enableDeviceRemember: true
    },
    
    // State
    state: {
        loginAttempts: 0,
        isLocked: false,
        lockUntil: null,
        twoFactorActive: false,
        currentSession: null,
        deviceToken: null
    },
    
    // DOM Elements
    elements: {
        loginForm: null,
        usernameInput: null,
        passwordInput: null,
        twoFactorInput: null,
        twoFactorSection: null,
        loginBtn: null,
        loginBtnText: null,
        attemptsDisplay: null,
        attemptsRemaining: null
    },
    
    // Initialize
    init: function() {
        this.setupElements();
        this.loadState();
        this.setupEventListeners();
        this.checkLockout();
        
        console.log('Admin Login initialized');
    },
    
    setupElements: function() {
        this.elements = {
            loginForm: document.getElementById('admin-login-form'),
            usernameInput: document.getElementById('username'),
            passwordInput: document.getElementById('password'),
            twoFactorInput: document.getElementById('two-factor-code'),
            twoFactorSection: document.getElementById('two-factor-section'),
            loginBtn: document.getElementById('login-btn'),
            loginBtnText: document.getElementById('login-btn-text'),
            attemptsDisplay: document.getElementById('login-attempts'),
            attemptsRemaining: document.getElementById('attempts-remaining')
        };
    },
    
    loadState: function() {
        try {
            const savedState = localStorage.getItem('admin_login_state');
            if (savedState) {
                const state = JSON.parse(savedState);
                this.state.loginAttempts = state.loginAttempts || 0;
                this.state.isLocked = state.isLocked || false;
                this.state.lockUntil = state.lockUntil || null;
                this.state.deviceToken = state.deviceToken || null;
            }
        } catch (error) {
            console.warn('Failed to load login state:', error);
        }
        
        this.updateUI();
    },
    
    saveState: function() {
        try {
            localStorage.setItem('admin_login_state', JSON.stringify({
                loginAttempts: this.state.loginAttempts,
                isLocked: this.state.isLocked,
                lockUntil: this.state.lockUntil,
                deviceToken: this.state.deviceToken
            }));
        } catch (error) {
            console.warn('Failed to save login state:', error);
        }
    },
    
    setupEventListeners: function() {
        if (this.elements.loginForm) {
            this.elements.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        // Auto-focus username on page load
        if (this.elements.usernameInput) {
            this.elements.usernameInput.focus();
        }
        
        // Enter key navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (this.state.twoFactorActive && this.elements.twoFactorInput) {
                    this.elements.loginForm.dispatchEvent(new Event('submit'));
                }
            }
        });
    },
    
    handleLogin: async function(e) {
        e.preventDefault();
        
        if (this.state.isLocked) {
            this.showError('Account is locked. Please try again later.');
            return;
        }
        
        const email = this.elements.usernameInput.value.trim();
        const password = this.elements.passwordInput.value;
        
        if (!email || !password) {
            this.showError('Please enter both email and password.');
            return;
        }
        
        // Show loading
        this.setLoading(true);
        
        // Simulate API call (replace with real authentication)
        await this.authenticateUser(email, password);
    },
    
    authenticateUser: async function(email, password) {
        try {
            // Security delay to prevent brute force
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Check if two-factor is needed
            if (!this.state.twoFactorActive) {
                // First stage authentication
                const isValid = await this.validateCredentials(email, password);
                
                if (isValid) {
                    if (this.config.twoFactorRequired) {
                        // Require two-factor
                        this.showTwoFactor();
                    } else {
                        // Login successful
                        await this.completeLogin();
                    }
                } else {
                    // Invalid credentials - error already shown by validateCredentials
                    this.handleInvalidLogin();
                }
            } else {
                // Second stage: Two-factor authentication
                const code = this.elements.twoFactorInput.value;
                const isValid = await this.validateTwoFactor(code);
                
                if (isValid) {
                    await this.completeLogin();
                } else {
                    this.showError('Invalid two-factor code.');
                    this.setLoading(false);
                }
            }
            
        } catch (error) {
            console.error('Authentication error:', error);
            this.showError('Authentication failed. Please try again.');
            this.setLoading(false);
        }
    },
    
    validateCredentials: async function(email, password) {
        try {
            const API_BASE = window.location.hostname === 'localhost' 
                ? 'http://localhost:5002/api' 
                : '/api';
            
            const response = await fetch(`${API_BASE}/auth/admin/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: username, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Store the token for later use
                this.adminToken = data.token;
                return true;
            } else {
                // Show specific error message from API
                this.showError(data.message || 'Invalid credentials');
                return false;
            }
        } catch (error) {
            console.error('Admin login API error:', error);
            this.showError('Network error. Please try again.');
            return false;
        }
    },
    
    validateTwoFactor: async function(code) {
        // In production, validate against your 2FA service
        // For demo, accept any 6-digit code
        return /^\d{6}$/.test(code);
    },
    
    showTwoFactor: function() {
        this.state.twoFactorActive = true;
        this.elements.twoFactorSection.style.display = 'block';
        this.elements.twoFactorInput.focus();
        this.setLoading(false);
        
        // Animate appearance
        this.elements.twoFactorSection.style.animation = 'fadeIn 0.3s ease';
    },
    
    completeLogin: async function() {
        // Use the token from API response
        const sessionToken = this.adminToken;
        
        // Store session
        this.state.currentSession = {
            token: sessionToken,
            username: this.elements.usernameInput.value.trim(),
            loginTime: new Date().toISOString(),
            expiry: Date.now() + this.config.sessionTimeout
        };
        
        // Save to localStorage
        try {
            localStorage.setItem('admin_session', JSON.stringify(this.state.currentSession));
            
            // Log security event
            if (typeof AdminSecurity !== 'undefined') {
                AdminSecurity.logEvent('admin_login_success', {
                    username: this.state.currentSession.username,
                    timestamp: this.state.currentSession.loginTime
                });
            }
            
            // Reset login attempts
            this.state.loginAttempts = 0;
            this.saveState();
            
            // Redirect to dashboard
            this.redirectToDashboard();
            
        } catch (error) {
            console.error('Failed to save session:', error);
            this.showError('Login failed. Please try again.');
            this.setLoading(false);
        }
    },
    
    redirectToDashboard: function() {
        // Show success message
        this.showMessage('Login successful! Redirecting to dashboard...', 'success');
        
        // Redirect after delay
        setTimeout(() => {
            window.location.href = 'admin-dashboard.html';
        }, 1500);
    },
    
    handleInvalidLogin: function() {
        this.state.loginAttempts++;
        this.saveState();
        
        const remainingAttempts = this.config.maxAttempts - this.state.loginAttempts;
        
        if (remainingAttempts <= 0) {
            this.lockAccount();
            this.showError('Account locked due to too many failed attempts. Please try again in 5 minutes.');
        } else {
            this.showError(`Invalid credentials. ${remainingAttempts} attempt(s) remaining.`);
            
            // Update UI
            this.updateUI();
        }
        
        this.setLoading(false);
        
        // Log security event
        if (typeof AdminSecurity !== 'undefined') {
            AdminSecurity.logEvent('admin_login_failed', {
                username: this.elements.usernameInput.value.trim(),
                attempt: this.state.loginAttempts,
                remainingAttempts: remainingAttempts
            });
        }
    },
    
    lockAccount: function() {
        this.state.isLocked = true;
        this.state.lockUntil = Date.now() + this.config.lockoutDuration;
        this.saveState();
        
        // Auto-unlock after duration
        setTimeout(() => {
            this.state.isLocked = false;
            this.state.lockUntil = null;
            this.state.loginAttempts = 0;
            this.saveState();
            this.updateUI();
        }, this.config.lockoutDuration);
    },
    
    checkLockout: function() {
        if (this.state.isLocked && this.state.lockUntil) {
            const timeLeft = this.state.lockUntil - Date.now();
            
            if (timeLeft > 0) {
                // Still locked
                const minutes = Math.ceil(timeLeft / 60000);
                this.showError(`Account locked. Try again in ${minutes} minute(s).`);
            } else {
                // Lock expired
                this.state.isLocked = false;
                this.state.lockUntil = null;
                this.state.loginAttempts = 0;
                this.saveState();
                this.updateUI();
            }
        }
    },
    
    updateUI: function() {
        if (this.elements.attemptsRemaining) {
            const remaining = this.config.maxAttempts - this.state.loginAttempts;
            this.elements.attemptsRemaining.textContent = remaining;
            
            // Update styles based on attempts
            if (remaining <= 2) {
                this.elements.attemptsDisplay.classList.add('attempts-danger');
            } else if (remaining <= 3) {
                this.elements.attemptsDisplay.classList.add('attempts-warning');
            }
        }
        
        // Disable form if locked
        if (this.state.isLocked) {
            this.elements.usernameInput.disabled = true;
            this.elements.passwordInput.disabled = true;
            this.elements.loginBtn.disabled = true;
        }
    },
    
    setLoading: function(isLoading) {
        if (isLoading) {
            this.elements.loginBtn.disabled = true;
            this.elements.loginBtnText.textContent = 'Authenticating...';
            this.elements.loginBtn.innerHTML = '<div class="loading-spinner"></div>';
        } else {
            this.elements.loginBtn.disabled = false;
            this.elements.loginBtnText.textContent = this.state.twoFactorActive ? 'Verify & Login' : 'Login to Dashboard';
            this.elements.loginBtn.innerHTML = `<i class="fas fa-sign-in-alt"></i><span id="login-btn-text">${this.elements.loginBtnText.textContent}</span>`;
        }
    },
    
    showError: function(message) {
        // Clear existing errors
        this.clearErrors();
        
        // Show error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            background: rgba(231, 76, 60, 0.1);
            color: #e74c3c;
            padding: 12px;
            border-radius: 8px;
            margin-top: 1rem;
            border-left: 4px solid #e74c3c;
        `;
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        
        this.elements.loginForm.insertBefore(errorDiv, this.elements.loginBtn);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    },
    
    showMessage: function(message, type = 'success') {
        const colors = {
            success: '#2ecc71',
            info: '#3498db',
            warning: '#f39c12'
        };
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'error-message';
        messageDiv.style.cssText = `
            background: rgba(${type === 'success' ? '46, 204, 113' : '52, 152, 219'}, 0.1);
            color: ${colors[type] || colors.success};
            padding: 12px;
            border-radius: 8px;
            margin-top: 1rem;
            border-left: 4px solid ${colors[type] || colors.success};
        `;
        messageDiv.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i> ${message}`;
        
        this.elements.loginForm.insertBefore(messageDiv, this.elements.loginBtn);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    },
    
    clearErrors: function() {
        const errors = this.elements.loginForm.querySelectorAll('.error-message');
        errors.forEach(error => error.remove());
    },
    
    // Public API
    getLoginState: function() {
        return {
            attempts: this.state.loginAttempts,
            isLocked: this.state.isLocked,
            lockUntil: this.state.lockUntil,
            twoFactorActive: this.state.twoFactorActive
        };
    },
    
    resetLogin: function() {
        this.state.loginAttempts = 0;
        this.state.isLocked = false;
        this.state.lockUntil = null;
        this.state.twoFactorActive = false;
        this.saveState();
        this.updateUI();
        this.clearErrors();
        
        // Reset form
        this.elements.loginForm.reset();
        this.elements.twoFactorSection.style.display = 'none';
        
        console.log('Login reset');
    }
};