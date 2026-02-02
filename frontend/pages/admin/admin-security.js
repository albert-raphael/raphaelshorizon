// Simple Admin Security System
const AdminSecurity = {

    
    // Configuration (will be set in init)
    config: null,
    
    // State
    state: {
        sessionActive: false,
        currentSession: null,
        lastActivity: (typeof Date !== 'undefined' && Date.now) ? Date.now() : new Date().getTime()
    },

    // Initialize
    init: function() {

        console.log('Initializing Admin Security System...');
        
        // Check if configuration is available
        if (typeof AdminSecurityConfig === 'undefined') {
            console.error('AdminSecurityConfig not found. Make sure admin-security-config.js is loaded first.');
            return this;
        }
        
        // Set configuration
        this.config = AdminSecurityConfig;
        
        this.generateFingerprint();
        this.loadSession();

        console.log('Admin Security ready');
        return this;
    },

    // Load session from localStorage
    loadSession: function() {
        try {
            if (typeof Storage !== 'undefined' && localStorage) {
                const sessionData = localStorage.getItem('admin_session');
                if (sessionData) {
                    const session = JSON.parse(sessionData);
                    if (session && session.expiry && session.expiry > Date.now()) {
                        this.state.currentSession = session;
                        this.state.sessionActive = true;
                        console.log('Session restored');
                    } else {
                        localStorage.removeItem('admin_session');
                        console.log('Session expired');
                    }
                }
            }
        } catch (error) {
            console.warn('Error loading session:', error);
        }
    },

    // Get session status
    getStatus: function() {
        return {
            sessionActive: this.state.sessionActive,
            currentSession: this.state.currentSession,
            lastActivity: this.state.lastActivity
        };
    },

    // Logout
    logout: function() {
        try {
            if (typeof Storage !== 'undefined' && localStorage) {
                localStorage.removeItem('admin_session');
            }
            this.state.sessionActive = false;
            this.state.currentSession = null;
            console.log('Logged out');
        } catch (error) {
            console.warn('Error during logout:', error);
        }
    }
};
        try {
            // Get timezone safely
            let timezone = 'unknown';
            try {
                timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            } catch (e) {
                timezone = 'unknown';
            }
            
            const fingerprint = {
                userAgent: navigator ? navigator.userAgent : 'unknown',
                language: navigator ? navigator.language : 'unknown',
                platform: navigator ? navigator.platform : 'unknown',
                screen: (screen ? `${screen.width}x${screen.height}` : 'unknown'),
                timezone: timezone,
                cookies: (navigator ? navigator.cookieEnabled : false),
                doNotTrack: (navigator ? (navigator.doNotTrack || 'unspecified') : 'unspecified'),
                hardwareConcurrency: (navigator ? (navigator.hardwareConcurrency || 'unknown') : 'unknown')
            };
            
            const fingerprintString = JSON.stringify(fingerprint);
            let hash = 0;
            for (let i = 0; i < fingerprintString.length; i++) {
                const char = fingerprintString.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            
            this.state.userFingerprint = hash.toString(36);
            
        } catch (error) {
            this.state.userFingerprint = 'admin_fp_' + Date.now();
        }
    },
    
    // Load session
    loadSession: function() {
        try {
            // Check if localStorage is available
            if (typeof Storage === 'undefined' || !localStorage) {
                console.warn('localStorage not available');
                return;
            }
            
            const sessionData = localStorage.getItem('admin_session');
            if (sessionData) {
                const session = JSON.parse(sessionData);
                
                // Check if session is expired
                if (session.expiry && session.expiry > Date.now()) {
                    this.state.currentSession = session;
                    this.state.sessionActive = true;
                    this.state.lastActivity = Date.now();
                    
                    this.logEvent('session_restored', {
                        username: session.username,
                        restoredAt: new Date().toISOString()
                    });
                } else {
                    // Session expired
                    localStorage.removeItem('admin_session');
                    this.logEvent('session_expired', {
                        username: session.username,
                        expiredAt: new Date().toISOString()
                    });
                }
            }
        } catch (error) {
            console.error('Failed to load session:', error);
            localStorage.removeItem('admin_session');
        }
    },
    
    // Save session
    saveSession: function(session) {
        try {
            localStorage.setItem('admin_session', JSON.stringify(session));
            this.state.currentSession = session;
            this.state.sessionActive = true;
        } catch (error) {
            console.error('Failed to save session:', error);
        }
    },
    
    // Start monitoring
    startMonitoring: function() {
        if (!this.config || !this.config.monitoring || !this.config.monitoring.realtimeMonitoring) return;
        
        this.state.monitoringActive = true;
        
        // Activity monitoring
        this.monitorActivity();
        
        // Network monitoring
        this.monitorNetwork();
        
        // Console monitoring
        this.monitorConsole();
        
        // Performance monitoring
        this.monitorPerformance();
        
        console.log('Security monitoring started');
    },
    
    // Monitor user activity
    monitorActivity: function() {
        // Update last activity on user interaction
        const updateActivity = () => {
            this.state.lastActivity = Date.now();
        };
        
        ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, updateActivity);
        });
        
        // Check for idle timeout
        setInterval(() => {
            if (this.state.sessionActive) {
                const idleTime = Date.now() - this.state.lastActivity;
                
                if (idleTime > this.config.authentication.idleTimeout) {
                    this.handleIdleTimeout();
                }
                
                // Check session expiry
                if (this.state.currentSession && this.state.currentSession.expiry) {
                    if (Date.now() > this.state.currentSession.expiry) {
                        this.handleSessionExpiry();
                    }
                }
            }
        }, 60000); // Check every minute
    },
    
    // Monitor network
    monitorNetwork: function() {
        // Monitor fetch requests
        const originalFetch = window.fetch;
        window.fetch = function() {
            const url = arguments[0];
            AdminSecurity.logEvent('fetch_request', {
                url: typeof url === 'string' ? url : 'unknown',
                timestamp: new Date().toISOString()
            });
            return originalFetch.apply(this, arguments);
        };
        
        // Monitor XHR requests
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function() {
            const url = arguments[1];
            AdminSecurity.logEvent('xhr_request', {
                url: typeof url === 'string' ? url : 'unknown',
                method: arguments[0],
                timestamp: new Date().toISOString()
            });
            return originalOpen.apply(this, arguments);
        };
    },
    
    // Monitor console
    monitorConsole: function() {
        const consoleMethods = ['log', 'info', 'warn', 'error', 'debug'];
        
        consoleMethods.forEach(method => {
            const original = console[method];
            console[method] = function() {
                AdminSecurity.logEvent('console_access', {
                    method: method,
                    arguments: Array.from(arguments).slice(0, 3), // Limit arguments
                    timestamp: new Date().toISOString()
                });
                return original.apply(console, arguments);
            };
        });
    },
    
    // Monitor performance
    monitorPerformance: function() {
        // Monitor memory usage (if supported)
        if (performance.memory) {
            setInterval(() => {
                const memory = performance.memory;
                this.logEvent('memory_usage', {
                    usedJSHeapSize: memory.usedJSHeapSize,
                    totalJSHeapSize: memory.totalJSHeapSize,
                    jsHeapSizeLimit: memory.jsHeapSizeLimit
                });
            }, 300000); // Every 5 minutes
        }
        
        // Monitor navigation timing
        window.addEventListener('load', () => {
            const timing = performance.timing;
            this.logEvent('page_load_timing', {
                loadTime: timing.loadEventEnd - timing.navigationStart,
                domReadyTime: timing.domContentLoadedEventEnd - timing.navigationStart,
                connectTime: timing.connectEnd - timing.connectStart
            });
        });
    },
    
    // Apply security measures
    applySecurityMeasures: function() {
        // Disable right-click in admin areas
        this.disableRightClick();
        
        // Disable text selection in sensitive areas
        this.disableTextSelection();
        
        // Disable keyboard shortcuts
        this.disableKeyboardShortcuts();
        
        // Prevent iframe embedding
        this.preventIframeEmbedding();
        
        // Disable dev tools
        this.disableDevTools();
        
        // Apply encryption
        if (this.config.encryption.sessionEncryption) {
            this.setupEncryption();
        }
    },
    
    // Disable right-click
    disableRightClick: function() {
        const preventContextMenu = (e) => {
            if (window.location.pathname.includes('admin')) {
                e.preventDefault();
                this.logEvent('right_click_blocked', {
                    element: e.target.tagName,
                    timestamp: new Date().toISOString()
                });
                return false;
            }
        };
        
        document.addEventListener('contextmenu', preventContextMenu);
    },
    
    // Disable text selection
    disableTextSelection: function() {
        const style = document.createElement('style');
        style.id = 'admin-no-selection';
        style.textContent = `
            .admin-content * {
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                -ms-user-select: none !important;
                user-select: none !important;
            }
        `;
        document.head.appendChild(style);
    },
    
    // Disable keyboard shortcuts
    disableKeyboardShortcuts: function() {
        const preventShortcuts = (e) => {
            if (window.location.pathname.includes('admin')) {
                // Disable save shortcuts
                if ((e.ctrlKey || e.metaKey) && 
                    (e.key === 's' || e.key === 'S')) {
                    e.preventDefault();
                    this.logEvent('save_shortcut_blocked', { key: e.key });
                    return false;
                }
                
                // Disable print shortcuts
                if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                    e.preventDefault();
                    this.logEvent('print_shortcut_blocked', { key: e.key });
                    return false;
                }
                
                // Disable refresh shortcuts
                if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
                    e.preventDefault();
                    this.logEvent('refresh_shortcut_blocked', { key: e.key });
                    return false;
                }
            }
        };
        
        document.addEventListener('keydown', preventShortcuts);
    },
    
    // Prevent iframe embedding
    preventIframeEmbedding: function() {
        if (window.self !== window.top) {
            this.logEvent('iframe_embedding_detected', {
                referrer: document.referrer,
                timestamp: new Date().toISOString()
            });
            
            // Try to break out
            if (window.top.location !== window.self.location) {
                window.top.location = window.self.location;
            }
        }
        
        // Set X-Frame-Options via meta tag
        const meta = document.createElement('meta');
        meta.httpEquiv = 'X-Frame-Options';
        meta.content = 'DENY';
        document.head.appendChild(meta);
    },
    
    // Disable dev tools
    disableDevTools: function() {
        const preventDevTools = (e) => {
            if (window.location.pathname.includes('admin')) {
                if (e.key === 'F12' || 
                    (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C'))) {
                    e.preventDefault();
                    this.logEvent('devtools_attempt', { key: e.key });
                    return false;
                }
            }
        };
        
        document.addEventListener('keydown', preventDevTools);
        
        // Monitor for dev tools
        setInterval(() => {
            if (window.location.pathname.includes('admin')) {
                const widthThreshold = window.outerWidth - window.innerWidth > 160;
                const heightThreshold = window.outerHeight - window.innerHeight > 160;
                
                if (widthThreshold || heightThreshold) {
                    this.logEvent('devtools_detected', {
                        method: 'window_size_check',
                        timestamp: new Date().toISOString()
                    });
                }
            }
        }, 1000);
    },
    
    // Setup encryption
    setupEncryption: function() {
        // Generate encryption keys
        this.state.encryptionKeys = {
            sessionKey: this.generateEncryptionKey(),
            dataKey: this.generateEncryptionKey()
        };
        
        // Store keys securely (in production, this would be server-side)
        try {
            sessionStorage.setItem('admin_encryption_keys', 
                JSON.stringify(this.state.encryptionKeys));
        } catch (error) {
            console.warn('Failed to store encryption keys:', error);
        }
        
        // Rotate keys periodically
        if (this.config.encryption.keyRotation) {
            setInterval(() => {
                this.rotateEncryptionKeys();
            }, this.config.encryption.keyRotation);
        }
    },
    
    // Generate encryption key
    generateEncryptionKey: function() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
        let key = '';
        for (let i = 0; i < 32; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return key;
    },
    
    // Rotate encryption keys
    rotateEncryptionKeys: function() {
        const oldKeys = { ...this.state.encryptionKeys };
        
        this.state.encryptionKeys = {
            sessionKey: this.generateEncryptionKey(),
            dataKey: this.generateEncryptionKey()
        };
        
        this.logEvent('encryption_keys_rotated', {
            oldKeys: Object.keys(oldKeys),
            newKeys: Object.keys(this.state.encryptionKeys),
            timestamp: new Date().toISOString()
        });
        
        // Update stored keys
        try {
            sessionStorage.setItem('admin_encryption_keys', 
                JSON.stringify(this.state.encryptionKeys));
        } catch (error) {
            console.warn('Failed to update encryption keys:', error);
        }
    },
    
    // Setup event listeners
    setupEventListeners: function() {
        // Log page visibility changes
        document.addEventListener('visibilitychange', () => {
            this.logEvent('page_visibility_change', {
                hidden: document.hidden,
                timestamp: new Date().toISOString()
            });
        });
        
        // Log page unload
        window.addEventListener('beforeunload', () => {
            this.logEvent('page_unload', {
                timestamp: new Date().toISOString(),
                sessionActive: this.state.sessionActive
            });
        });
        
        // Log errors
        window.addEventListener('error', (e) => {
            this.logEvent('javascript_error', {
                message: e.message,
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno,
                timestamp: new Date().toISOString()
            });
        });
    },
    
    // Handle idle timeout
    handleIdleTimeout: function() {
        this.logEvent('idle_timeout_detected', {
            idleTime: Date.now() - this.state.lastActivity,
            timestamp: new Date().toISOString()
        });
        
        // Show warning
        this.showSecurityAlert('Session inactive. You will be logged out soon.');
        
        // Auto-logout after additional time
        setTimeout(() => {
            if (this.state.sessionActive && 
                (Date.now() - this.state.lastActivity > this.config.authentication.idleTimeout + 60000)) {
                this.logout();
            }
        }, 60000); // 1 minute grace period
    },
    
    // Handle session expiry
    handleSessionExpiry: function() {
        this.logEvent('session_expiry_detected', {
            username: this.state.currentSession?.username,
            timestamp: new Date().toISOString()
        });
        
        this.logout();
    },
    
    // Logout
    logout: function() {
        this.logEvent('admin_logout', {
            username: this.state.currentSession?.username,
            timestamp: new Date().toISOString(),
            reason: this.state.currentSession?.expiry ? 'session_expired' : 'manual'
        });
        
        // Clear session
        localStorage.removeItem('admin_session');
        sessionStorage.removeItem('admin_encryption_keys');
        
        this.state.sessionActive = false;
        this.state.currentSession = null;
        
        // Redirect to login
        window.location.href = 'login_admin.html';
    },
    
    // Log event
    logEvent: function(eventType, data) {
        // Check if config is available
        if (!this.config || !this.config.monitoring || !this.config.monitoring.logAllActions) {
            // If config not available or logging disabled, skip logging
            return null;
        }
        
        const event = {
            type: eventType,
            data: data,
            timestamp: new Date().toISOString(),
            sessionId: this.state.currentSession?.token,
            fingerprint: this.state.userFingerprint,
            securityLevel: this.state.securityLevel,
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        // Store in localStorage
        try {
            const logs = JSON.parse(localStorage.getItem('admin_security_logs') || '[]');
            logs.push(event);
            
            // Keep only last 1000 logs
            if (logs.length > 1000) {
                logs.splice(0, logs.length - 1000);
            }
            
            localStorage.setItem('admin_security_logs', JSON.stringify(logs));
            
            // Send to server (in production)
            this.sendToServer(event);
            
        } catch (error) {
            console.warn('Failed to log security event:', error);
        }
        
        // Console log for debugging
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log(`[ADMIN SECURITY] ${eventType}:`, data);
        }
        
        return event;
    },
    
    // Send to server (placeholder)
    sendToServer: function(event) {
        // In production, send to your logging server
        // fetch('/api/security-logs', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(event)
        // });
    },
    
    // Show security alert
    showSecurityAlert: function(message, type = 'warning') {
        const alert = document.createElement('div');
        alert.className = 'security-alert';
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'warning' ? '#f39c12' : '#e74c3c'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 9999;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
            font-size: 14px;
        `;
        
        alert.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-${type === 'warning' ? 'exclamation-triangle' : 'shield-alt'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(alert);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.style.animation = 'slideInRight 0.3s ease reverse';
                setTimeout(() => alert.remove(), 300);
            }
        }, 5000);
    },
    
    // Get security status
    getStatus: function() {
        return {
            sessionActive: this.state.sessionActive,
            securityLevel: this.state.securityLevel,
            monitoringActive: this.state.monitoringActive,
            lastActivity: this.state.lastActivity,
            violationCount: this.state.violationCount,
            sessionExpiry: this.state.currentSession?.expiry || null
        };
    },
    
    // Update configuration
    updateConfig: function(newConfig) {
        this.config = { ...this.config, ...newConfig };
        return this;
    },
    
    // Export logs
    exportLogs: function() {
        try {
            const logs = JSON.parse(localStorage.getItem('admin_security_logs') || '[]');
            const data = {
                logs: logs,
                summary: {
                    totalLogs: logs.length,
                    exportDate: new Date().toISOString(),
                    sessionId: this.state.currentSession?.token
                }
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `admin-security-logs-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return true;
            
        } catch (error) {
            console.error('Error exporting security logs:', error);
            return false;
        }
    },
    
    // Clear logs
    clearLogs: function() {
        localStorage.removeItem('admin_security_logs');
        console.log('Admin security logs cleared');
    },
    
    // Check access permissions
    checkPermission: function(permission) {
        if (!this.state.currentSession) return false;
        
        const permissions = {
            'admin': ['all'],
            'superadmin': ['all'],
            'manager': ['view', 'edit', 'delete_own'],
            'viewer': ['view']
        };
        
        const userRole = this.state.currentSession.username === 'admin' ? 'admin' : 
                       this.state.currentSession.username === 'superadmin' ? 'superadmin' : 'manager';
        
        const userPermissions = permissions[userRole] || permissions.viewer;
        
        return userPermissions.includes('all') || userPermissions.includes(permission);
    }
};