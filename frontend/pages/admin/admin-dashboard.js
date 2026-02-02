// Admin Dashboard Main Controller
const AdminDashboard = {
    
    // Configuration
    config: {
        sessionTimeout: 3600000, // 1 hour
        sessionWarningTime: 120000, // 2 minutes before timeout
        autoSaveInterval: 30000, // 30 seconds
        refreshStatsInterval: 60000, // 1 minute
        enableRealtime: true
    },
    
    // State
    state: {
        currentPage: 'dashboard',
        sidebarCollapsed: false,
        notifications: [],
        stats: {},
        isLoading: false,
        lastSave: null,
        sessionTimer: null,
        autoSaveTimer: null,
        statsTimer: null
    },
    
    // DOM Elements
    elements: {
        // Navigation
        sidebar: null,
        sidebarToggle: null,
        menuItems: null,
        
        // User menu
        userMenuToggle: null,
        userDropdown: null,
        logoutBtn: null,
        
        // Notifications
        notificationBell: null,
        notificationPanel: null,
        notificationClose: null,
        notificationCount: null,
        
        // Session
        sessionTimerEl: null,
        sessionWarningModal: null,
        sessionWarningTime: null,
        sessionLogoutBtn: null,
        sessionExtendBtn: null,
        
        // Pages
        pageContents: null,
        
        // Dashboard elements
        usersCount: null,
        booksCount: null,
        audioCount: null,
        todayViews: null,
        totalViews: null,
        activeUsers: null,
        booksRead: null,
        revenue: null
    },
    
    // Initialize
    init: function() {
        console.log('Initializing Admin Dashboard...');
        
        this.setupElements();
        this.loadState();
        this.setupEventListeners();
        this.loadDashboardData();
        this.startTimers();
        this.checkSession();
        
        // Initialize charts
        this.initCharts();
        
        console.log('Admin Dashboard initialized');
    },
    
    setupElements: function() {
        // Navigation
        this.elements.sidebar = document.getElementById('admin-sidebar');
        this.elements.sidebarToggle = document.getElementById('sidebar-toggle');
        this.elements.menuItems = document.querySelectorAll('.menu-item');
        
        // User menu
        this.elements.userMenuToggle = document.getElementById('user-menu-toggle');
        this.elements.userDropdown = document.getElementById('user-dropdown-menu');
        this.elements.logoutBtn = document.getElementById('logout-btn');
        
        // Notifications
        this.elements.notificationBell = document.getElementById('notification-bell');
        this.elements.notificationPanel = document.getElementById('notification-panel');
        this.elements.notificationClose = document.getElementById('notification-close');
        this.elements.notificationCount = document.getElementById('notification-count');
        
        // Session
        this.elements.sessionTimerEl = document.getElementById('session-time');
        this.elements.sessionWarningModal = document.getElementById('session-warning-modal');
        this.elements.sessionWarningTime = document.getElementById('session-warning-time');
        this.elements.sessionLogoutBtn = document.getElementById('session-logout-btn');
        this.elements.sessionExtendBtn = document.getElementById('session-extend-btn');
        
        // Pages
        this.elements.pageContents = document.querySelectorAll('.page-content');
        
        // Dashboard stats
        this.elements.usersCount = document.getElementById('users-count');
        this.elements.booksCount = document.getElementById('books-count');
        this.elements.audioCount = document.getElementById('audio-count');
        this.elements.todayViews = document.getElementById('today-views');
        this.elements.totalViews = document.getElementById('total-views');
        this.elements.activeUsers = document.getElementById('active-users');
        this.elements.booksRead = document.getElementById('books-read');
        this.elements.revenue = document.getElementById('revenue');
    },
    
    loadState: function() {
        try {
            const savedState = localStorage.getItem('admin_dashboard_state');
            if (savedState) {
                const state = JSON.parse(savedState);
                this.state.sidebarCollapsed = state.sidebarCollapsed || false;
                this.state.currentPage = state.currentPage || 'dashboard';
            }
        } catch (error) {
            console.warn('Failed to load dashboard state:', error);
        }
        
        // Apply loaded state
        if (this.state.sidebarCollapsed && this.elements.sidebar) {
            this.elements.sidebar.classList.add('collapsed');
        }
        
        this.showPage(this.state.currentPage);
    },
    
    saveState: function() {
        try {
            localStorage.setItem('admin_dashboard_state', JSON.stringify({
                sidebarCollapsed: this.state.sidebarCollapsed,
                currentPage: this.state.currentPage,
                lastSave: new Date().toISOString()
            }));
            this.state.lastSave = Date.now();
        } catch (error) {
            console.warn('Failed to save dashboard state:', error);
        }
    },
    
    setupEventListeners: function() {
        // Sidebar toggle
        if (this.elements.sidebarToggle) {
            this.elements.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }
        
        // Menu item clicks
        this.elements.menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                if (page) {
                    this.showPage(page);
                }
            });
        });
        
        // User menu toggle
        if (this.elements.userMenuToggle) {
            this.elements.userMenuToggle.addEventListener('click', () => this.toggleUserMenu());
        }
        
        // Logout button
        if (this.elements.logoutBtn) {
            this.elements.logoutBtn.addEventListener('click', () => this.logout());
        }
        
        // Notification bell
        if (this.elements.notificationBell) {
            this.elements.notificationBell.addEventListener('click', () => this.toggleNotifications());
        }
        
        if (this.elements.notificationClose) {
            this.elements.notificationClose.addEventListener('click', () => this.hideNotifications());
        }
        
        // Session warning buttons
        if (this.elements.sessionLogoutBtn) {
            this.elements.sessionLogoutBtn.addEventListener('click', () => this.logout());
        }
        
        if (this.elements.sessionExtendBtn) {
            this.elements.sessionExtendBtn.addEventListener('click', () => this.extendSession());
        }
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (this.elements.userDropdown && this.elements.userDropdown.classList.contains('show')) {
                if (!e.target.closest('.user-menu')) {
                    this.elements.userDropdown.classList.remove('show');
                }
            }
            
            if (this.elements.notificationPanel.classList.contains('show')) {
                if (!e.target.closest('.notification-bell') && 
                    !e.target.closest('.notification-panel')) {
                    this.hideNotifications();
                }
            }
        });
        
        // Auto-save on form changes
        document.addEventListener('input', () => {
            this.scheduleAutoSave();
        });
        
        // Prevent accidental navigation
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return e.returnValue;
            }
        });
    },
    
    toggleSidebar: function() {
        this.state.sidebarCollapsed = !this.state.sidebarCollapsed;
        
        if (this.state.sidebarCollapsed) {
            this.elements.sidebar.classList.add('collapsed');
        } else {
            this.elements.sidebar.classList.remove('collapsed');
        }
        
        this.saveState();
    },
    
    showPage: function(pageId) {
        // Update active menu item
        this.elements.menuItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === pageId) {
                item.classList.add('active');
            }
        });
        
        // Show page content
        this.elements.pageContents.forEach(page => {
            page.classList.remove('active');
            if (page.id === `page-${pageId}`) {
                page.classList.add('active');
            }
        });
        
        this.state.currentPage = pageId;
        this.saveState();
        
        // Load page-specific data
        this.loadPageData(pageId);
    },
    
    loadPageData: function(pageId) {
        switch(pageId) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'books':
                if (typeof AdminBooks !== 'undefined') {
                    AdminBooks.loadBooks();
                }
                break;
            case 'audio':
                if (typeof AdminAudio !== 'undefined') {
                    AdminAudio.loadAudio();
                }
                break;
            case 'users':
                if (typeof AdminUsers !== 'undefined') {
                    AdminUsers.loadUsers();
                }
                break;
            case 'security':
                this.loadSecurityData();
                break;
        }
    },
    
    loadDashboardData: function() {
        // Simulate API call to load dashboard data
        setTimeout(() => {
            // Update stats
            this.elements.usersCount.textContent = '1,248';
            this.elements.booksCount.textContent = '25';
            this.elements.audioCount.textContent = '12';
            this.elements.todayViews.textContent = '342';
            this.elements.totalViews.textContent = '12,458';
            this.elements.activeUsers.textContent = '1,248';
            this.elements.booksRead.textContent = '5,832';
            this.elements.revenue.textContent = '$8,452';
            
            // Update recent activity
            this.loadRecentActivity();
            
            // Update top content
            this.loadTopContent();
            
        }, 500);
    },
    
    loadRecentActivity: function() {
        const activityList = document.getElementById('recent-activity');
        if (!activityList) return;
        
        const activities = [
            { user: 'John Doe', action: 'read "The Light After the Tunnel"', time: '5 minutes ago', icon: 'book' },
            { user: 'Jane Smith', action: 'bookmarked page 45', time: '12 minutes ago', icon: 'bookmark' },
            { user: 'Robert Johnson', action: 'completed audio book', time: '30 minutes ago', icon: 'headphones' },
            { user: 'Sarah Williams', action: 'shared book on social media', time: '1 hour ago', icon: 'share' },
            { user: 'Michael Brown', action: 'created new bookmark', time: '2 hours ago', icon: 'bookmark' }
        ];
        
        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <p><strong>${activity.user}</strong> ${activity.action}</p>
                    <small class="activity-time">${activity.time}</small>
                </div>
            </div>
        `).join('');
    },
    
    loadTopContent: function() {
        const contentList = document.getElementById('top-content');
        if (!contentList) return;
        
        const topContent = [
            { title: 'The Light After the Tunnel', views: '2,458', progress: 85 },
            { title: 'Divine Jurisprudence', views: '1,892', progress: 72 },
            { title: 'Embracing Elegance', views: '1,543', progress: 68 },
            { title: 'Journey of Self Discovery (Audio)', views: '1,234', progress: 65 },
            { title: 'Mass Prayer Session', views: '987', progress: 45 }
        ];
        
        contentList.innerHTML = topContent.map(content => `
            <div class="content-item">
                <div class="content-title">${content.title}</div>
                <div class="content-stats">
                    <span class="content-views">${content.views} views</span>
                    <div class="content-progress">
                        <div class="progress-bar">
                            <div class="progress" style="width: ${content.progress}%"></div>
                        </div>
                        <span class="progress-text">${content.progress}%</span>
                    </div>
                </div>
            </div>
        `).join('');
    },
    
    initCharts: function() {
        // Traffic Chart
        const trafficCtx = document.getElementById('traffic-chart');
        if (trafficCtx) {
            new Chart(trafficCtx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                    datasets: [{
                        label: 'Page Views',
                        data: [12000, 19000, 15000, 25000, 22000, 30000, 28000],
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        }
        
        // Content Distribution Chart
        const contentCtx = document.getElementById('content-chart');
        if (contentCtx) {
            new Chart(contentCtx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Inspirational', 'Christian', 'Self-Help', 'Audio', 'German'],
                    datasets: [{
                        data: [35, 25, 20, 15, 5],
                        backgroundColor: [
                            '#667eea',
                            '#764ba2',
                            '#3498db',
                            '#2ecc71',
                            '#f39c12'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    },
    
    toggleUserMenu: function() {
        this.elements.userDropdown.classList.toggle('show');
    },
    
    toggleNotifications: function() {
        this.elements.notificationPanel.classList.toggle('show');
        if (this.elements.notificationPanel.classList.contains('show')) {
            this.loadNotifications();
        }
    },
    
    hideNotifications: function() {
        this.elements.notificationPanel.classList.remove('show');
    },
    
    loadNotifications: function() {
        const notificationList = document.getElementById('notification-list');
        if (!notificationList) return;
        
        const notifications = [
            { type: 'success', message: 'New user registered: Sarah Johnson', time: '10 min ago' },
            { type: 'warning', message: 'Book "Divine Jurisprudence" needs update', time: '2 hours ago' },
            { type: 'info', message: 'Monthly backup completed successfully', time: '1 day ago' },
            { type: 'danger', message: 'Failed login attempt detected', time: '2 days ago' }
        ];
        
        notificationList.innerHTML = notifications.map(notification => `
            <div class="notification-item notification-${notification.type}">
                <div class="notification-icon">
                    <i class="fas fa-${notification.type === 'success' ? 'check-circle' : 
                                      notification.type === 'warning' ? 'exclamation-triangle' : 
                                      notification.type === 'danger' ? 'exclamation-circle' : 'info-circle'}"></i>
                </div>
                <div class="notification-content">
                    <p>${notification.message}</p>
                    <small>${notification.time}</small>
                </div>
            </div>
        `).join('');
        
        // Update notification count
        this.elements.notificationCount.textContent = notifications.length;
    },
    
    startTimers: function() {
        // Session timer
        this.state.sessionTimer = setInterval(() => this.updateSessionTimer(), 1000);
        
        // Auto-save timer
        this.state.autoSaveTimer = setInterval(() => this.autoSave(), this.config.autoSaveInterval);
        
        // Stats refresh timer
        this.state.statsTimer = setInterval(() => this.refreshStats(), this.config.refreshStatsInterval);
    },
    
    updateSessionTimer: function() {
        if (!this.elements.sessionTimerEl) return;
        
        const session = AdminSecurity?.state?.currentSession;
        if (session && session.expiry) {
            const timeLeft = Math.max(0, session.expiry - Date.now());
            const minutes = Math.floor(timeLeft / 60000);
            const seconds = Math.floor((timeLeft % 60000) / 1000);
            
            this.elements.sessionTimerEl.textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Show warning when session is about to expire
            if (timeLeft < this.config.sessionWarningTime && timeLeft > 0) {
                this.showSessionWarning(timeLeft);
            }
        }
    },
    
    showSessionWarning: function(timeLeft) {
        if (this.elements.sessionWarningModal.classList.contains('show')) return;
        
        const minutes = Math.ceil(timeLeft / 60000);
        this.elements.sessionWarningTime.textContent = `${minutes} minute${minutes > 1 ? 's' : ''}`;
        this.elements.sessionWarningModal.classList.add('show');
    },
    
    extendSession: function() {
        if (AdminSecurity?.state?.currentSession) {
            AdminSecurity.state.currentSession.expiry = Date.now() + this.config.sessionTimeout;
            
            // Save updated session
            localStorage.setItem('admin_session', 
                JSON.stringify(AdminSecurity.state.currentSession));
            
            // Hide warning
            this.elements.sessionWarningModal.classList.remove('show');
            
            this.showToast('Session extended successfully', 'success');
        }
    },
    
    checkSession: function() {
        if (!AdminSecurity?.state?.sessionActive) {
            this.logout();
        }
    },
    
    logout: function() {
        // Clear session
        if (typeof AdminSecurity !== 'undefined') {
            AdminSecurity.logout();
        } else {
            localStorage.removeItem('admin_session');
            window.location.href = 'login_admin.html';
        }
    },
    
    autoSave: function() {
        if (this.hasUnsavedChanges()) {
            this.saveState();
            this.showToast('Changes auto-saved', 'info');
        }
    },
    
    scheduleAutoSave: function() {
        // Debounce auto-save
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            this.autoSave();
        }, 5000);
    },
    
    hasUnsavedChanges: function() {
        // Check if any form has unsaved changes
        const forms = document.querySelectorAll('form');
        let hasChanges = false;
        
        forms.forEach(form => {
            if (form.classList.contains('dirty')) {
                hasChanges = true;
            }
        });
        
        return hasChanges;
    },
    
    refreshStats: function() {
        if (this.state.currentPage === 'dashboard') {
            this.loadDashboardData();
        }
    },
    
    loadSecurityData: function() {
        // Load security-related data
        console.log('Loading security data...');
    },
    
    showToast: function(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'success' ? '#2ecc71' : 
                        type === 'error' ? '#e74c3c' : 
                        type === 'warning' ? '#f39c12' : '#3498db'};
            color: white;
            padding: 12px 20px;
            border-radius: var(--radius-md);
            z-index: 9999;
            box-shadow: var(--shadow-lg);
            animation: slideInRight 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: 300px;
        `;
        
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                              type === 'error' ? 'exclamation-circle' : 
                              type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },
    
    // Cleanup
    destroy: function() {
        clearInterval(this.state.sessionTimer);
        clearInterval(this.state.autoSaveTimer);
        clearInterval(this.state.statsTimer);
        clearTimeout(this.autoSaveTimeout);
    }
};