// Cookie Consent Manager
class CookieConsent {
    constructor() {
        this.banner = document.getElementById('cookie-banner');
        this.modal = document.getElementById('cookie-modal');
        this.cookieName = 'rh_cookie_consent';
        this.consentGiven = false;
        
        this.init();
    }

    init() {
        this.checkExistingConsent();
        this.setupEventListeners();
    }

    checkExistingConsent() {
        const consent = this.getCookie(this.cookieName);
        
        if (consent) {
            this.consentGiven = true;
            const preferences = JSON.parse(consent);
            this.applyPreferences(preferences);
        } else {
            // Show banner after a short delay
            setTimeout(() => {
                this.showBanner();
            }, 1000);
        }
    }

    setupEventListeners() {
        // Banner buttons
        const acceptCookiesBtn = document.getElementById('accept-cookies');
        const cookiePreferencesBtn = document.getElementById('cookie-preferences');
        const modalCloseBtn = document.querySelector('.modal-close');
        const savePreferencesBtn = document.getElementById('save-preferences');

        if (acceptCookiesBtn) {
            acceptCookiesBtn.addEventListener('click', () => {
                this.acceptAll();
            });
        }

        if (cookiePreferencesBtn) {
            cookiePreferencesBtn.addEventListener('click', () => {
                this.showModal();
            });
        }

        // Modal buttons
        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', () => {
                this.hideModal();
            });
        }

        if (savePreferencesBtn) {
            savePreferencesBtn.addEventListener('click', () => {
                this.savePreferences();
            });
        }

        // Close modal when clicking outside
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.hideModal();
                }
            });
        }
    }

    showBanner() {
        if (this.banner && !this.consentGiven) {
            this.banner.classList.add('show');
        }
    }

    hideBanner() {
        if (this.banner) {
            this.banner.classList.remove('show');
            setTimeout(() => {
                this.banner.classList.add('hide');
            }, 300);
        }
    }

    showModal() {
        if (this.modal) {
            this.loadCurrentPreferences();
            this.modal.classList.add('show');
        }
    }

    hideModal() {
        if (this.modal) {
            this.modal.classList.remove('show');
        }
    }

    loadCurrentPreferences() {
        const consent = this.getCookie(this.cookieName);
        const preferences = consent ? JSON.parse(consent) : this.getDefaultPreferences();

        const analyticsToggle = document.getElementById('analytics-toggle');
        const functionalToggle = document.getElementById('functional-toggle');

        if (analyticsToggle) analyticsToggle.checked = preferences.analytics;
        if (functionalToggle) functionalToggle.checked = preferences.functional;
    }

    getDefaultPreferences() {
        return {
            essential: true,
            analytics: true,
            functional: true,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
    }

    acceptAll() {
        const preferences = {
            essential: true,
            analytics: true,
            functional: true,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };

        this.setConsent(preferences);
        this.hideBanner();
    }

    savePreferences() {
        const analyticsToggle = document.getElementById('analytics-toggle');
        const functionalToggle = document.getElementById('functional-toggle');

        const preferences = {
            essential: true,
            analytics: analyticsToggle ? analyticsToggle.checked : true,
            functional: functionalToggle ? functionalToggle.checked : true,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };

        this.setConsent(preferences);
        this.hideModal();
        this.hideBanner();
    }

    setConsent(preferences) {
        this.setCookie(this.cookieName, JSON.stringify(preferences), 365);
        this.applyPreferences(preferences);
        this.consentGiven = true;
        
        // Track consent event
        this.trackConsent(preferences);
    }

    applyPreferences(preferences) {
        // Apply analytics preferences
        if (preferences.analytics) {
            this.enableAnalytics();
        } else {
            this.disableAnalytics();
        }

        // Apply functional preferences
        if (preferences.functional) {
            this.enableFunctional();
        } else {
            this.disableFunctional();
        }

        console.log('Cookie preferences applied:', preferences);
    }

    enableAnalytics() {
        // Initialize analytics tools here
        // Example: Google Analytics, Facebook Pixel, etc.
        console.log('Analytics cookies enabled');
        
        // Example: gtag('config', 'GA_MEASUREMENT_ID');
    }

    disableAnalytics() {
        // Disable analytics tracking
        console.log('Analytics cookies disabled');
    }

    enableFunctional() {
        // Enable functional features
        console.log('Functional cookies enabled');
    }

    disableFunctional() {
        // Disable functional features
        console.log('Functional cookies disabled');
    }

    trackConsent(preferences) {
        // Track consent action
        console.log('Cookie consent given:', preferences);
        
        // Example: Send to analytics if enabled
        if (preferences.analytics) {
            // gtag('event', 'cookie_consent', { preferences: preferences });
        }
    }

    // Cookie utility functions
    setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "expires=" + date.toUTCString();
        document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/;SameSite=Lax";
    }

    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
        return null;
    }

    deleteCookie(name) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.cookieConsent = new CookieConsent();
});

// Function to check if specific cookie category is allowed
function isCookieAllowed(category) {
    const consent = window.cookieConsent?.getCookie('rh_cookie_consent');
    if (!consent) return false;
    
    const preferences = JSON.parse(consent);
    return preferences[category] === true;
}

// Function to show preferences modal from anywhere on the site
function showCookiePreferences() {
    if (window.cookieConsent) {
        window.cookieConsent.showModal();
    }
}