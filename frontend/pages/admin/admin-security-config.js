// Simple Admin Security Configuration
const AdminSecurityConfig = {
    // Basic settings only
    sessionTimeout: 3600000, // 1 hour
    maxLoginAttempts: 5,
    enableLogging: false, // Disable complex logging that causes issues
    securityLevel: 'basic',

    // Access control
    accessControl: {
        ipWhitelist: [],
        ipBlacklist: [],
        countryRestrictions: [],
        timeRestrictions: {
            start: '00:00',
            end: '23:59',
            timezone: 'UTC'
        },
        deviceRestrictions: true
    },
    
    // Monitoring settings
    monitoring: {
        logAllActions: true,
        logFailedAttempts: true,
        logSuccessfulLogins: true,
        alertOnSuspicious: true,
        realtimeMonitoring: true,
        retentionDays: 90
    },
    
    // Encryption settings
    encryption: {
        sessionEncryption: true,
        dataEncryption: true,
        keyRotation: 86400000 // 24 hours
    },
    
    // API security
    apiSecurity: {
        rateLimiting: true,
        maxRequestsPerMinute: 60,
        requireApiKey: true,
        corsOrigins: [],
        requestValidation: true
    },
    
    // Update configuration
    updateConfig: function(newConfig) {
        const merge = (target, source) => {
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (!target[key]) target[key] = {};
                    merge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
            return target;
        };
        
        merge(this, newConfig);
        return this;
    },
    
    // Get security level configuration
    getSecurityLevelConfig: function(level) {
        const levels = {
            low: {
                authentication: {
                    requireTwoFactor: false,
                    sessionTimeout: 86400000, // 24 hours
                    idleTimeout: 1800000 // 30 minutes
                },
                monitoring: {
                    logAllActions: false,
                    alertOnSuspicious: false
                }
            },
            medium: {
                authentication: {
                    requireTwoFactor: true,
                    sessionTimeout: 7200000, // 2 hours
                    idleTimeout: 900000 // 15 minutes
                },
                monitoring: {
                    logAllActions: true,
                    alertOnSuspicious: true
                }
            },
            high: {
                authentication: {
                    requireTwoFactor: true,
                    sessionTimeout: 3600000, // 1 hour
                    idleTimeout: 600000 // 10 minutes
                },
                monitoring: {
                    logAllActions: true,
                    alertOnSuspicious: true,
                    realtimeMonitoring: true
                }
            },
            maximum: {
                authentication: {
                    requireTwoFactor: true,
                    sessionTimeout: 1800000, // 30 minutes
                    idleTimeout: 300000, // 5 minutes
                    maxSessions: 1
                },
                accessControl: {
                    deviceRestrictions: true,
                    timeRestrictions: {
                        start: '06:00',
                        end: '22:00'
                    }
                },
                monitoring: {
                    logAllActions: true,
                    logFailedAttempts: true,
                    logSuccessfulLogins: true,
                    alertOnSuspicious: true,
                    realtimeMonitoring: true
                },
                encryption: {
                    sessionEncryption: true,
                    dataEncryption: true,
                    keyRotation: 43200000 // 12 hours
                }
            }
        };
        
        return levels[level] || levels.high;
    },
    
    // Set security level
    setSecurityLevel: function(level) {
        const levelConfig = this.getSecurityLevelConfig(level);
        this.updateConfig(levelConfig);
        this.securityLevel = level;
        return this;
    },
    
    // Validate configuration
    validateConfig: function() {
        const errors = [];
        
        if (this.authentication.passwordPolicy.minLength < 8) {
            errors.push('Password minimum length must be at least 8 characters');
        }
        
        if (this.authentication.sessionTimeout < 300000) {
            errors.push('Session timeout must be at least 5 minutes');
        }
        
        if (this.monitoring.retentionDays < 30) {
            errors.push('Log retention must be at least 30 days');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
};

// Initialize with maximum security (only if not already set)
// AdminSecurityConfig.setSecurityLevel('maximum');