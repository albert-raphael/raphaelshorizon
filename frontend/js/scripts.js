// ===== POLYFILLS =====
window.process = window.process || { env: { NODE_ENV: 'development' } };

// ===== GLOBAL VARIABLES & CONFIGURATION =====
const CONFIG = {
    carousel: {
        autoplay: true,
        interval: 5000,
        transition: 500
    },
    animations: {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    },
    navigation: {
        scrollOffset: 80,
        scrollBehavior: 'smooth'
    }
};

// ===== DOM ELEMENTS =====
const elements = {
    header: document.querySelector('.main-header'),
    mobileToggle: document.querySelector('.mobile-menu-toggle'),
    navMenu: document.querySelector('.nav-menu'),
    carousels: document.querySelectorAll('.quotes-carousel'),
    videoItems: document.querySelectorAll('.video-item'),
    bookCards: document.querySelectorAll('.book-card'),
    socialCards: document.querySelectorAll('.social-card'),
    buttons: document.querySelectorAll('.btn'),
    forms: document.querySelectorAll('form')
};

// ===== UTILITY FUNCTIONS =====
class Utils {
    // Debounce function for performance
    static debounce(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    // Throttle function for scroll events
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Check if element is in viewport
    static isInViewport(element, threshold = 0) {
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        return (
            rect.top <= windowHeight * (1 - threshold) &&
            rect.bottom >= 0
        );
    }

    // Add loading state to element
    static setLoadingState(element, isLoading) {
        if (isLoading) {
            element.setAttribute('data-loading', 'true');
            element.style.pointerEvents = 'none';
        } else {
            element.removeAttribute('data-loading');
            element.style.pointerEvents = '';
        }
    }

    // Format duration for video items
    static formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// ===== NAVIGATION MANAGER =====
class NavigationManager {
    constructor() {
        this.currentSection = '';
        this.init();
    }

    init() {
        this.setupMobileNavigation();
        this.setupSmoothScrolling();
        this.setupActiveNavigation();
        this.setupDropdowns();
    }

    setupMobileNavigation() {
        // Query elements when method is called to ensure DOM is ready
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (!mobileToggle || !navMenu) return;

        // Ensure accessible attributes are present
        mobileToggle.setAttribute('aria-expanded', 'false');
        navMenu.setAttribute('aria-hidden', 'true');

        const handleToggle = (e) => {
            // Allow both click and touch/pointer events; avoid preventing default on pointer/touchstart unless needed
            if (e && e.type === 'click') e.preventDefault();
            this.toggleMobileMenu();
            // Ensure ARIA state is updated after the toggle
            const isActive = navMenu.classList.contains('active');
            mobileToggle.setAttribute('aria-expanded', String(isActive));
            navMenu.setAttribute('aria-hidden', String(!isActive));
        };

        // Support click, pointerdown and touchstart for better mobile responsiveness
        mobileToggle.addEventListener('click', handleToggle);
        mobileToggle.addEventListener('pointerdown', handleToggle, { passive: true });
        mobileToggle.addEventListener('touchstart', handleToggle, { passive: true });

        // Close mobile menu when clicking on links (but not dropdown toggles)
        navMenu.addEventListener('click', (e) => {
            if ((e.target.closest('.nav-link') && !e.target.closest('.dropdown-toggle')) || e.target.closest('.dropdown-link')) {
                this.closeMobileMenu();
            }
        });

        // Close mobile menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMobileMenu();
            }
        });
    }

    toggleMobileMenu() {
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (!mobileToggle || !navMenu) return;
        
        navMenu.classList.toggle('active');
        mobileToggle.classList.toggle('active');
        document.body.classList.toggle('menu-open');

        // Animate hamburger icon
        const spans = mobileToggle.querySelectorAll('span');
        spans.forEach((span, index) => {
            span.style.transform = navMenu.classList.contains('active') 
                ? this.getHamburgerTransform(index)
                : 'none';
        });
    }

    getHamburgerTransform(index) {
        const transforms = [
            'rotate(45deg) translate(6px, 6px)',
            'opacity(0)',
            'rotate(-45deg) translate(6px, -6px)'
        ];
        return transforms[index] || 'none';
    }

    closeMobileMenu() {
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (!mobileToggle || !navMenu) return;
        
        navMenu.classList.remove('active');
        mobileToggle.classList.remove('active');
        document.body.classList.remove('menu-open');

        // Update ARIA attributes for accessibility
        mobileToggle.setAttribute('aria-expanded', 'false');
        navMenu.setAttribute('aria-hidden', 'true');

        if (window && window.location && window.location.hostname && window.location.hostname.includes('vercel')) {
            console.debug('[Navigation] Mobile menu closed');
        }
    }

    setupSmoothScrolling() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (!link) return;

            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                this.scrollToElement(targetElement);
            }
        });
    }

    scrollToElement(element) {
        const headerHeight = elements.header?.offsetHeight || 0;
        const targetPosition = element.offsetTop - headerHeight - 20;

        window.scrollTo({
            top: targetPosition,
            behavior: CONFIG.navigation.scrollBehavior
        });
    }

    setupActiveNavigation() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.currentSection = entry.target.id;
                    this.updateActiveNavLinks();
                }
            });
        }, {
            threshold: 0.5,
            rootMargin: `-${elements.header?.offsetHeight || 0}px 0px 0px 0px`
        });

        sections.forEach(section => observer.observe(section));
    }

    updateActiveNavLinks() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === `#${this.currentSection}` || 
                (href === 'index.html' && !this.currentSection)) {
                link.classList.add('active');
            }
        });
    }

    setupDropdowns() {
        const dropdowns = document.querySelectorAll('.nav-dropdown, .user-menu-container');
        
        // Helper to check for mobile view based on width
        const isMobileView = () => window.innerWidth <= 1024;
        
        dropdowns.forEach(dropdown => {
            const toggle = dropdown.querySelector('.dropdown-toggle');
            
            // Desktop hover
            dropdown.addEventListener('mouseenter', () => {
                if (!isMobileView()) {
                    dropdown.classList.add('open');
                }
            });

            dropdown.addEventListener('mouseleave', () => {
                if (!isMobileView()) {
                    dropdown.classList.remove('open');
                }
            });

            // Click handling
            if (toggle) {
                const handleDropdownToggle = (e) => {
                    if (isMobileView()) {
                        // On mobile, menus are always visible. Allow default link behavior.
                        return;
                    } else {
                        e.preventDefault();
                        e.stopPropagation();
                        dropdown.classList.toggle('open');
                    }
                };

                toggle.addEventListener('click', handleDropdownToggle);
            }
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-dropdown, .user-menu-container')) {
                dropdowns.forEach(dropdown => {
                    dropdown.classList.remove('open');
                    if (isMobileView()) {
                        dropdown.classList.remove('active');
                    }
                });
            }
        });
    }
}

// ===== CAROUSEL MANAGER =====
class CarouselManager {
    constructor() {
        this.carousels = new Map();
        this.init();
    }

    init() {
        elements.carousels.forEach((carousel, index) => {
            this.initializeCarousel(carousel, index);
        });
    }

    initializeCarousel(carousel, index) {
        const track = carousel.querySelector('.carousel-track');
        const slides = carousel.querySelectorAll('.quote-slide');
        const prevBtn = carousel.querySelector('.prev-btn');
        const nextBtn = carousel.querySelector('.next-btn');
        const indicatorsContainer = carousel.querySelector('.carousel-indicators');

        if (!track || !slides.length) return;

        const carouselData = {
            track,
            slides,
            currentIndex: 0,
            isAnimating: false,
            autoplayInterval: null
        };

        this.carousels.set(index, carouselData);
        this.createIndicators(indicatorsContainer, slides.length, index);
        this.setupCarouselControls(carouselData, prevBtn, nextBtn, indicatorsContainer, index);

        if (CONFIG.carousel.autoplay) {
            this.startAutoplay(carouselData, index);
        }

        // Pause autoplay on hover
        carousel.addEventListener('mouseenter', () => {
            this.pauseAutoplay(carouselData);
        });

        carousel.addEventListener('mouseleave', () => {
            if (CONFIG.carousel.autoplay) {
                this.startAutoplay(carouselData, index);
            }
        });

        // Touch support
        this.setupTouchEvents(track, carouselData, index);
    }

    createIndicators(container, count, carouselIndex) {
        if (!container) return;

        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const indicator = document.createElement('button');
            indicator.className = 'carousel-indicator';
            indicator.setAttribute('aria-label', `Go to slide ${i + 1}`);
            indicator.addEventListener('click', () => {
                this.goToSlide(carouselIndex, i);
            });
            container.appendChild(indicator);
        }

        this.updateIndicators(carouselIndex);
    }

    setupCarouselControls(carouselData, prevBtn, nextBtn, indicatorsContainer, carouselIndex) {
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.prevSlide(carouselIndex);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.nextSlide(carouselIndex);
            });
        }

        // Keyboard navigation
        carouselData.track.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.prevSlide(carouselIndex);
            } else if (e.key === 'ArrowRight') {
                this.nextSlide(carouselIndex);
            }
        });
    }

    setupTouchEvents(track, carouselData, carouselIndex) {
        let startX = 0;
        let currentX = 0;
        let isDragging = false;

        track.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
            this.pauseAutoplay(carouselData);
        });

        track.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            currentX = e.touches[0].clientX;
        });

        track.addEventListener('touchend', () => {
            if (!isDragging) return;
            isDragging = false;

            const diff = startX - currentX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    this.nextSlide(carouselIndex);
                } else {
                    this.prevSlide(carouselIndex);
                }
            }

            if (CONFIG.carousel.autoplay) {
                this.startAutoplay(carouselData, carouselIndex);
            }
        });
    }

    nextSlide(carouselIndex) {
        const carousel = this.carousels.get(carouselIndex);
        if (!carousel || carousel.isAnimating) return;

        const nextIndex = (carousel.currentIndex + 1) % carousel.slides.length;
        this.goToSlide(carouselIndex, nextIndex);
    }

    prevSlide(carouselIndex) {
        const carousel = this.carousels.get(carouselIndex);
        if (!carousel || carousel.isAnimating) return;

        const prevIndex = (carousel.currentIndex - 1 + carousel.slides.length) % carousel.slides.length;
        this.goToSlide(carouselIndex, prevIndex);
    }

    goToSlide(carouselIndex, slideIndex) {
        const carousel = this.carousels.get(carouselIndex);
        if (!carousel || carousel.isAnimating || slideIndex === carousel.currentIndex) return;

        carousel.isAnimating = true;
        carousel.currentIndex = slideIndex;

        this.animateSlideTransition(carousel, () => {
            carousel.isAnimating = false;
        });

        this.updateIndicators(carouselIndex);

        // Dispatch custom event
        carousel.track.dispatchEvent(new CustomEvent('slideChange', {
            detail: { currentIndex: slideIndex }
        }));
    }

    animateSlideTransition(carousel, callback) {
        const translateX = -carousel.currentIndex * 100;
        carousel.track.style.transform = `translateX(${translateX}%)`;
        
        setTimeout(() => {
            callback();
        }, CONFIG.carousel.transition);
    }

    updateIndicators(carouselIndex) {
        const carousel = this.carousels.get(carouselIndex);
        if (!carousel) return;

        const indicators = carousel.track.closest('.quotes-carousel')
            ?.querySelectorAll('.carousel-indicator');

        indicators?.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === carousel.currentIndex);
        });
    }

    startAutoplay(carouselData, carouselIndex) {
        this.pauseAutoplay(carouselData);
        
        carouselData.autoplayInterval = setInterval(() => {
            this.nextSlide(carouselIndex);
        }, CONFIG.carousel.interval);
    }

    pauseAutoplay(carouselData) {
        if (carouselData.autoplayInterval) {
            clearInterval(carouselData.autoplayInterval);
            carouselData.autoplayInterval = null;
        }
    }
}

// ===== ANIMATION MANAGER =====
class AnimationManager {
    constructor() {
        this.observer = null;
        this.animatedElements = new Set();
        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        this.setupScrollAnimations();
        this.setupHoverAnimations();
    }

    setupIntersectionObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateOnScroll(entry.target);
                }
            });
        }, {
            threshold: CONFIG.animations.threshold,
            rootMargin: CONFIG.animations.rootMargin
        });

        // Observe elements that should animate on scroll
        const animateElements = document.querySelectorAll(
            '.book-card, .social-card, .video-item, .featured-video-card'
        );

        animateElements.forEach(element => {
            this.observer.observe(element);
            this.animatedElements.add(element);
        });
    }

    animateOnScroll(element) {
        if (element.classList.contains('animated')) return;

        element.classList.add('animated');
        
        // Add different animation delays for staggered effects
        const index = Array.from(this.animatedElements).indexOf(element);
        element.style.animationDelay = `${index * 0.1}s`;
    }

    setupScrollAnimations() {
        // Header scroll effect
        let lastScrollY = window.scrollY;

        const handleScroll = Utils.throttle(() => {
            const currentScrollY = window.scrollY;
            
            if (elements.header) {
                if (currentScrollY > lastScrollY && currentScrollY > 100) {
                    elements.header.classList.add('hidden');
                } else {
                    elements.header.classList.remove('hidden');
                }
            }

            lastScrollY = currentScrollY;
        }, 100);

        window.addEventListener('scroll', handleScroll);
    }

    setupHoverAnimations() {
        // Book card hover effects
        elements.bookCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px)';
            });

            card.addEventListener('mouseleave', () => {
                if (!card.classList.contains('animated')) return;
                card.style.transform = 'translateY(0)';
            });
        });

        // Social card hover effects
        elements.socialCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-4px)';
            });

            card.addEventListener('mouseleave', () => {
                if (!card.classList.contains('animated')) return;
                card.style.transform = 'translateY(0)';
            });
        });

        // Button hover effects
        elements.buttons.forEach(button => {
            button.addEventListener('mouseenter', (e) => {
                const rect = button.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                button.style.setProperty('--mouse-x', `${x}px`);
                button.style.setProperty('--mouse-y', `${y}px`);
            });
        });
    }
}

// ===== VIDEO MANAGER =====
class VideoManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupVideoInteractions();
        this.setupYouTubeAPI();
    }

    setupVideoInteractions() {
        elements.videoItems.forEach(item => {
            item.addEventListener('click', () => {
                this.handleVideoClick(item);
            });

            // Keyboard navigation
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handleVideoClick(item);
                }
            });
        });
    }

    handleVideoClick(videoItem) {
        const videoId = videoItem.getAttribute('data-video-id');
        
        if (videoId) {
            this.openVideoModal(videoId);
        }
    }

    openVideoModal(videoId) {
        // Create modal for video playback
        const modal = document.createElement('div');
        modal.className = 'video-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <button class="modal-close" aria-label="Close video">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
                <div class="video-container">
                    <iframe 
                        src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        // Close modal functionality
        const closeModal = () => {
            modal.remove();
            document.body.style.overflow = '';
        };

        modal.querySelector('.modal-overlay').addEventListener('click', closeModal);
        modal.querySelector('.modal-close').addEventListener('click', closeModal);

        // Close on escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') closeModal();
        };
        document.addEventListener('keydown', handleEscape);

        // Cleanup
        modal._cleanup = () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }

    setupYouTubeAPI() {
        // Load YouTube IFrame API if needed
        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            document.head.appendChild(tag);
        }
    }
}

// ===== PERFORMANCE OPTIMIZATIONS =====
class PerformanceOptimizer {
    constructor() {
        this.init();
    }

    init() {
        this.setupLazyLoading();
        this.setupResourcePreloading();
        this.optimizeImages();
    }

    setupLazyLoading() {
        if ('loading' in HTMLImageElement.prototype) {
            // Native lazy loading
            const images = document.querySelectorAll('img[loading="lazy"]');
            images.forEach(img => {
                img.addEventListener('load', () => {
                    img.classList.add('loaded');
                });
            });
        } else {
            // Fallback lazy loading
            this.setupIntersectionLazyLoading();
        }
    }

    setupIntersectionLazyLoading() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.add('loaded');
                    imageObserver.unobserve(img);
                }
            });
        });

        lazyImages.forEach(img => imageObserver.observe(img));
    }

    setupResourcePreloading() {
        // Preload critical resources
        const preloadLinks = [
            { href: 'css/styles.css', as: 'style' },
            { href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap', as: 'style' }
        ];

        preloadLinks.forEach(link => {
            const preload = document.createElement('link');
            preload.rel = 'preload';
            preload.href = link.href;
            preload.as = link.as;
            document.head.appendChild(preload);
        });
    }

    optimizeImages() {
        // Add responsive image support
        const images = document.querySelectorAll('img:not([sizes])');
        images.forEach(img => {
            if (!img.getAttribute('sizes') && img.offsetWidth > 0) {
                img.sizes = `${img.offsetWidth}px`;
            }
        });
    }
}

// ===== ERROR HANDLING & LOGGING =====
class ErrorHandler {
    static init() {
        window.addEventListener('error', (event) => {
            this.logError('Global error', event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.logError('Unhandled promise rejection', event.reason);
        });
    }

    static logError(context, error) {
        console.error(`[${context}]`, error);
        
        // In production, you might want to send this to a logging service
        if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
            // this.sendToLoggingService(context, error);
        }
    }
}

// ===== INITIALIZATION =====
class App {
    constructor() {
        this.managers = {};
        this.init();
    }

    init() {
        try {
            // Initialize error handling first
            ErrorHandler.init();

            // Initialize managers
            this.managers.navigation = new NavigationManager();
            this.managers.carousel = new CarouselManager();
            this.managers.animation = new AnimationManager();
            this.managers.video = new VideoManager();
            this.managers.performance = new PerformanceOptimizer();

            // Setup global event listeners
            this.setupGlobalEvents();

            // Mark app as loaded
            document.documentElement.classList.add('js-loaded');

            console.log('🎉 Raphael\'s Horizon - Website initialized successfully');

        } catch (error) {
            ErrorHandler.logError('App initialization', error);
        }
    }

    setupGlobalEvents() {
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.managers.carousel.carousels.forEach(carousel => {
                    this.managers.carousel.pauseAutoplay(carousel);
                });
            } else {
                this.managers.carousel.carousels.forEach((carousel, index) => {
                    if (CONFIG.carousel.autoplay) {
                        this.managers.carousel.startAutoplay(carousel, index);
                    }
                });
            }
        });

        // Handle window resize
        window.addEventListener('resize', Utils.debounce(() => {
            this.handleResize();
        }, 250));

        // Handle beforeunload for cleanup
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }

    handleResize() {
        // Update any responsive elements
        const headerHeight = elements.header?.offsetHeight || 0;
        document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
    }

    cleanup() {
        // Clean up intervals and event listeners
        this.managers.carousel.carousels.forEach(carousel => {
            this.managers.carousel.pauseAutoplay(carousel);
        });
    }
}

// ===== SERVICE WORKER REGISTRATION (Optional) =====
class ServiceWorkerManager {
    static async register() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('ServiceWorker registered successfully');
                return registration;
            } catch (error) {
                console.log('ServiceWorker registration failed:', error);
            }
        }
    }
}

// ===== START THE APPLICATION =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the main application
    window.RaphaelsHorizonApp = new App();

    // Register service worker (optional)
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
        ServiceWorkerManager.register();
    }
});

// ===== EXPORTS FOR MODULE USAGE =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        App,
        NavigationManager,
        CarouselManager,
        AnimationManager,
        VideoManager,
        PerformanceOptimizer,
        Utils,
        ErrorHandler
    };
}