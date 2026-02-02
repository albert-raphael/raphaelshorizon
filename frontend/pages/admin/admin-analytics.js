// Admin Analytics and Reporting
const AdminAnalytics = {
    
    // Configuration
    config: {
        chartColors: [
            '#667eea', '#764ba2', '#3498db', '#2ecc71', '#f39c12',
            '#e74c3c', '#9b59b6', '#1abc9c', '#34495e', '#7f8c8d'
        ],
        dateRanges: {
            '7d': 'Last 7 days',
            '30d': 'Last 30 days',
            '90d': 'Last 90 days',
            '1y': 'Last year',
            'all': 'All time'
        }
    },
    
    // State
    state: {
        currentRange: '30d',
        charts: {},
        stats: {},
        isLoading: false
    },
    
    // Initialize
    init: function() {
        console.log('Admin Analytics initialized');
    },
    
    loadStatistics: function() {
        // Load statistics page
        const statsContent = document.getElementById('page-statistics');
        if (!statsContent) return;
        
        this.state.isLoading = true;
        
        statsContent.innerHTML = `
            <div class="page-header">
                <h1>Statistics & Analytics</h1>
                <div class="page-actions">
                    <select class="date-range-select" id="analytics-range">
                        ${Object.entries(this.config.dateRanges).map(([key, label]) => `
                            <option value="${key}" ${key === this.state.currentRange ? 'selected' : ''}>
                                ${label}
                            </option>
                        `).join('')}
                    </select>
                    <button class="btn btn-primary" id="refresh-analytics">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon primary">
                        <i class="fas fa-eye"></i>
                    </div>
                    <div class="stat-content">
                        <h3>Total Page Views</h3>
                        <p class="stat-number" id="total-page-views">0</p>
                        <p class="stat-change positive">
                            <i class="fas fa-arrow-up"></i> Loading...
                        </p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon success">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-content">
                        <h3>New Users</h3>
                        <p class="stat-number" id="new-users">0</p>
                        <p class="stat-change positive">
                            <i class="fas fa-arrow-up"></i> Loading...
                        </p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon warning">
                        <i class="fas fa-book"></i>
                    </div>
                    <div class="stat-content">
                        <h3>Books Read</h3>
                        <p class="stat-number" id="total-books-read">0</p>
                        <p class="stat-change positive">
                            <i class="fas fa-arrow-up"></i> Loading...
                        </p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon danger">
                        <i class="fas fa-dollar-sign"></i>
                    </div>
                    <div class="stat-content">
                        <h3>Revenue</h3>
                        <p class="stat-number" id="total-revenue">$0</p>
                        <p class="stat-change positive">
                            <i class="fas fa-arrow-up"></i> Loading...
                        </p>
                    </div>
                </div>
            </div>
            
            <div class="charts-row">
                <div class="chart-container">
                    <div class="chart-header">
                        <h3>Traffic Overview</h3>
                    </div>
                    <canvas id="traffic-overview-chart"></canvas>
                </div>
                
                <div class="chart-container">
                    <div class="chart-header">
                        <h3>User Engagement</h3>
                    </div>
                    <canvas id="engagement-chart"></canvas>
                </div>
            </div>
            
            <div class="charts-row">
                <div class="chart-container">
                    <div class="chart-header">
                        <h3>Content Performance</h3>
                    </div>
                    <canvas id="content-performance-chart"></canvas>
                </div>
                
                <div class="chart-container">
                    <div class="chart-header">
                        <h3>Geographic Distribution</h3>
                    </div>
                    <canvas id="geographic-chart"></canvas>
                </div>
            </div>
            
            <div class="data-table-container">
                <div class="table-header">
                    <h3>Top Performing Content</h3>
                </div>
                <table class="data-table" id="top-content-table">
                    <thead>
                        <tr>
                            <th>Content</th>
                            <th>Type</th>
                            <th>Views</th>
                            <th>Engagement</th>
                            <th>Completion Rate</th>
                            <th>Trend</th>
                        </tr>
                    </thead>
                    <tbody id="top-content-table-body">
                        <tr>
                            <td colspan="6" style="text-align: center; padding: 2rem;">
                                <div class="loading-spinner-large" style="margin: 0 auto 1rem;"></div>
                                <p>Loading analytics data...</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
        
        // Set up event listeners
        setTimeout(() => {
            const rangeSelect = document.getElementById('analytics-range');
            const refreshBtn = document.getElementById('refresh-analytics');
            
            if (rangeSelect) {
                rangeSelect.addEventListener('change', (e) => {
                    this.state.currentRange = e.target.value;
                    this.loadAnalyticsData();
                });
            }
            
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => this.loadAnalyticsData());
            }
        }, 100);
        
        // Load data
        this.loadAnalyticsData();
    },
    
    loadAnalyticsData: function() {
        // Simulate API call
        setTimeout(() => {
            // Update stats
            document.getElementById('total-page-views').textContent = '12,458';
            document.getElementById('new-users').textContent = '124';
            document.getElementById('total-books-read').textContent = '5,832';
            document.getElementById('total-revenue').textContent = '$8,452';
            
            // Initialize charts
            this.initAnalyticsCharts();
            
            // Load top content
            this.loadTopContentTable();
            
            this.state.isLoading = false;
            
        }, 1500);
    },
    
    initAnalyticsCharts: function() {
        // Traffic Overview Chart
        const trafficCtx = document.getElementById('traffic-overview-chart');
        if (trafficCtx) {
            new Chart(trafficCtx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [
                        {
                            label: 'Page Views',
                            data: [1200, 1900, 1500, 2500, 2200, 3000, 2800],
                            borderColor: '#667eea',
                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Unique Visitors',
                            data: [800, 1200, 1000, 1800, 1500, 2200, 2000],
                            borderColor: '#764ba2',
                            backgroundColor: 'rgba(118, 75, 162, 0.1)',
                            tension: 0.4,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'top' }
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
        
        // Engagement Chart
        const engagementCtx = document.getElementById('engagement-chart');
        if (engagementCtx) {
            new Chart(engagementCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['Books', 'Audio', 'Blog', 'Downloads', 'Social'],
                    datasets: [{
                        label: 'Engagement Rate (%)',
                        data: [85, 72, 65, 45, 38],
                        backgroundColor: this.config.chartColors.slice(0, 5),
                        borderWidth: 0
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
                            max: 100,
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        }
        
        // Content Performance Chart
        const contentCtx = document.getElementById('content-performance-chart');
        if (contentCtx) {
            new Chart(contentCtx.getContext('2d'), {
                type: 'radar',
                data: {
                    labels: ['Views', 'Engagement', 'Completion', 'Shares', 'Revenue'],
                    datasets: [
                        {
                            label: 'Books',
                            data: [85, 90, 75, 60, 80],
                            borderColor: '#667eea',
                            backgroundColor: 'rgba(102, 126, 234, 0.2)',
                            pointBackgroundColor: '#667eea'
                        },
                        {
                            label: 'Audio',
                            data: [70, 65, 80, 50, 60],
                            borderColor: '#764ba2',
                            backgroundColor: 'rgba(118, 75, 162, 0.2)',
                            pointBackgroundColor: '#764ba2'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 100,
                            ticks: { display: false }
                        }
                    }
                }
            });
        }
        
        // Geographic Chart
        const geoCtx = document.getElementById('geographic-chart');
        if (geoCtx) {
            new Chart(geoCtx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['USA', 'Germany', 'UK', 'Canada', 'Australia', 'Others'],
                    datasets: [{
                        data: [35, 25, 15, 10, 8, 7],
                        backgroundColor: this.config.chartColors,
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'right' }
                    }
                }
            });
        }
    },
    
    loadTopContentTable: function() {
        const tableBody = document.getElementById('top-content-table-body');
        if (!tableBody) return;
        
        const topContent = [
            {
                title: 'The Light After the Tunnel',
                type: 'Book',
                views: 2458,
                engagement: 92,
                completion: 85,
                trend: 'up'
            },
            {
                title: 'Divine Jurisprudence',
                type: 'Book',
                views: 1892,
                engagement: 88,
                completion: 78,
                trend: 'up'
            },
            {
                title: 'Journey of Self Discovery',
                type: 'Audio',
                views: 1543,
                engagement: 85,
                completion: 72,
                trend: 'up'
            },
            {
                title: 'Mass Prayer Session',
                type: 'Audio',
                views: 1245,
                engagement: 90,
                completion: 65,
                trend: 'stable'
            },
            {
                title: 'Embracing Elegance',
                type: 'Book',
                views: 987,
                engagement: 82,
                completion: 68,
                trend: 'up'
            }
        ];
        
        tableBody.innerHTML = topContent.map(item => `
            <tr>
                <td>
                    <div class="content-cell">
                        <div class="content-icon">
                            <i class="fas fa-${item.type === 'Book' ? 'book' : 'headphones'}"></i>
                        </div>
                        <div class="content-title">${item.title}</div>
                    </div>
                </td>
                <td>
                    <span class="badge badge-${item.type === 'Book' ? 'primary' : 'success'}">
                        ${item.type}
                    </span>
                </td>
                <td>${item.views.toLocaleString()}</td>
                <td>
                    <div class="progress-cell">
                        <div class="progress-bar">
                            <div class="progress" style="width: ${item.engagement}%"></div>
                        </div>
                        <span class="progress-text">${item.engagement}%</span>
                    </div>
                </td>
                <td>
                    <div class="progress-cell">
                        <div class="progress-bar">
                            <div class="progress" style="width: ${item.completion}%"></div>
                        </div>
                        <span class="progress-text">${item.completion}%</span>
                    </div>
                </td>
                <td>
                    <span class="trend-indicator trend-${item.trend}">
                        <i class="fas fa-${item.trend === 'up' ? 'arrow-up' : 
                                          item.trend === 'down' ? 'arrow-down' : 'minus'}"></i>
                        ${item.trend === 'up' ? 'Growing' : 
                         item.trend === 'down' ? 'Declining' : 'Stable'}
                    </span>
                </td>
            </tr>
        `).join('');
    },
    
    // Generate reports
    generateReport: function(type, format = 'pdf') {
        const reports = {
            'daily': 'Daily Activity Report',
            'weekly': 'Weekly Summary Report',
            'monthly': 'Monthly Analytics Report',
            'custom': 'Custom Period Report'
        };
        
        AdminDashboard.showToast(`Generating ${reports[type]}...`, 'info');
        
        // Simulate report generation
        setTimeout(() => {
            const reportData = {
                type: type,
                format: format,
                generatedAt: new Date().toISOString(),
                data: {
                    pageViews: 12458,
                    users: 1248,
                    booksRead: 5832,
                    revenue: 8452,
                    topContent: [
                        { title: 'The Light After the Tunnel', views: 2458 },
                        { title: 'Divine Jurisprudence', views: 1892 },
                        { title: 'Journey of Self Discovery', views: 1543 }
                    ]
                }
            };
            
            // For PDF, we would generate and download
            // For now, just show success message
            AdminDashboard.showToast(`${reports[type]} generated successfully`, 'success');
            
            // Log report generation
            if (typeof AdminSecurity !== 'undefined') {
                AdminSecurity.logEvent('report_generated', {
                    reportType: type,
                    format: format,
                    timestamp: reportData.generatedAt
                });
            }
            
        }, 2000);
    },
    
    // Export data
    exportAnalyticsData: function() {
        const data = {
            stats: this.state.stats,
            charts: this.state.charts,
            exportDate: new Date().toISOString(),
            range: this.state.currentRange
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        AdminDashboard.showToast('Analytics data exported', 'success');
    }
};