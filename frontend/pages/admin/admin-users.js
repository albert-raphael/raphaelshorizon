// Admin Users Management
const AdminUsers = {
    
    // Configuration
    config: {
        itemsPerPage: 10,
        userRoles: ['admin', 'moderator', 'user', 'guest'],
        subscriptionPlans: ['free', 'basic', 'premium', 'enterprise']
    },
    
    // State
    state: {
        users: [],
        filteredUsers: [],
        currentPage: 1,
        totalPages: 1,
        selectedUsers: new Set(),
        isLoading: false,
        searchQuery: '',
        filters: {
            role: '',
            status: '',
            subscription: ''
        }
    },
    
    // Initialize
    init: function() {
        console.log('Admin Users Management initialized');
    },
    
    loadUsers: function() {
        this.state.isLoading = true;
        
        // Show loading
        const usersContent = document.getElementById('page-users');
        if (usersContent) {
            usersContent.innerHTML = `
                <div style="text-align: center; padding: 3rem;">
                    <div class="loading-spinner-large" style="margin: 0 auto 1rem;"></div>
                    <p>Loading users...</p>
                </div>
            `;
        }
        
        // Simulate API call
        setTimeout(() => {
            // Sample user data
            this.state.users = [
                {
                    id: 'user-001',
                    name: 'John Doe',
                    email: 'john@example.com',
                    role: 'admin',
                    status: 'active',
                    subscription: 'premium',
                    joined: '2024-01-15',
                    lastLogin: '2024-05-20',
                    booksRead: 24,
                    avatar: null
                },
                {
                    id: 'user-002',
                    name: 'Jane Smith',
                    email: 'jane@example.com',
                    role: 'user',
                    status: 'active',
                    subscription: 'basic',
                    joined: '2024-02-10',
                    lastLogin: '2024-05-19',
                    booksRead: 12,
                    avatar: null
                },
                {
                    id: 'user-003',
                    name: 'Robert Johnson',
                    email: 'robert@example.com',
                    role: 'user',
                    status: 'inactive',
                    subscription: 'free',
                    joined: '2024-03-05',
                    lastLogin: '2024-04-15',
                    booksRead: 5,
                    avatar: null
                },
                {
                    id: 'user-004',
                    name: 'Sarah Williams',
                    email: 'sarah@example.com',
                    role: 'moderator',
                    status: 'active',
                    subscription: 'enterprise',
                    joined: '2024-03-20',
                    lastLogin: '2024-05-18',
                    booksRead: 42,
                    avatar: null
                },
                {
                    id: 'user-005',
                    name: 'Michael Brown',
                    email: 'michael@example.com',
                    role: 'user',
                    status: 'suspended',
                    subscription: 'basic',
                    joined: '2024-04-01',
                    lastLogin: '2024-05-10',
                    booksRead: 8,
                    avatar: null
                }
            ];
            
            this.state.filteredUsers = [...this.state.users];
            this.state.totalPages = Math.ceil(this.state.filteredUsers.length / this.config.itemsPerPage);
            
            this.renderUsersPage();
            this.state.isLoading = false;
            
        }, 1000);
    },
    
    renderUsersPage: function() {
        const usersContent = document.getElementById('page-users');
        if (!usersContent) return;
        
        usersContent.innerHTML = `
            <div class="page-header">
                <h1>Users Management</h1>
                <div class="page-actions">
                    <button class="btn btn-primary" id="add-user-btn">
                        <i class="fas fa-user-plus"></i> Add User
                    </button>
                    <button class="btn btn-secondary" id="invite-users-btn">
                        <i class="fas fa-envelope"></i> Invite Users
                    </button>
                </div>
            </div>
            
            <div class="management-tools">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Search users..." id="users-search">
                </div>
                <div class="filter-options">
                    <select id="users-role-filter">
                        <option value="">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="moderator">Moderator</option>
                        <option value="user">User</option>
                        <option value="guest">Guest</option>
                    </select>
                    <select id="users-status-filter">
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                        <option value="banned">Banned</option>
                    </select>
                    <select id="users-subscription-filter">
                        <option value="">All Subscriptions</option>
                        <option value="free">Free</option>
                        <option value="basic">Basic</option>
                        <option value="premium">Premium</option>
                        <option value="enterprise">Enterprise</option>
                    </select>
                </div>
            </div>
            
            <div class="data-table-container">
                <table class="data-table" id="users-table">
                    <thead>
                        <tr>
                            <th><input type="checkbox" id="select-all-users"></th>
                            <th>User</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Subscription</th>
                            <th>Joined</th>
                            <th>Last Login</th>
                            <th>Books Read</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="users-table-body">
                        ${this.renderUsersTableBody()}
                    </tbody>
                </table>
            </div>
            
            <div class="table-footer">
                <div class="pagination" id="users-pagination">
                    ${this.renderUsersPagination()}
                </div>
                <div class="table-actions">
                    <button class="btn btn-sm btn-outline" id="export-users-btn">
                        <i class="fas fa-download"></i> Export Selected
                    </button>
                    <button class="btn btn-sm btn-danger" id="delete-users-btn">
                        <i class="fas fa-trash"></i> Delete Selected
                    </button>
                </div>
            </div>
        `;
        
        // Set up event listeners
        this.setupUsersEventListeners();
    },
    
    renderUsersTableBody: function() {
        const startIndex = (this.state.currentPage - 1) * this.config.itemsPerPage;
        const endIndex = startIndex + this.config.itemsPerPage;
        const usersToShow = this.state.filteredUsers.slice(startIndex, endIndex);
        
        if (usersToShow.length === 0) {
            return `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 3rem;">
                        <i class="fas fa-users fa-3x" style="color: #ddd; margin-bottom: 1rem;"></i>
                        <p>No users found</p>
                    </td>
                </tr>
            `;
        }
        
        return usersToShow.map(user => `
            <tr>
                <td>
                    <input type="checkbox" 
                           class="user-select" 
                           data-id="${user.id}"
                           ${this.state.selectedUsers.has(user.id) ? 'checked' : ''}>
                </td>
                <td>
                    <div class="user-info-cell">
                        <div class="user-avatar-small">
                            ${user.avatar ? 
                                `<img src="${user.avatar}" alt="${user.name}">` : 
                                `<i class="fas fa-user"></i>`
                            }
                        </div>
                        <div class="user-details-cell">
                            <div class="user-name">${user.name}</div>
                            <div class="user-email">${user.email}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge badge-${user.role === 'admin' ? 'danger' : 
                                              user.role === 'moderator' ? 'warning' : 'secondary'}">
                        ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                </td>
                <td>
                    <span class="badge badge-${user.status === 'active' ? 'success' : 
                                              user.status === 'inactive' ? 'warning' : 'danger'}">
                        ${user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </span>
                </td>
                <td>
                    <span class="badge badge-subscription-${user.subscription}">
                        ${user.subscription.charAt(0).toUpperCase() + user.subscription.slice(1)}
                    </span>
                </td>
                <td>${new Date(user.joined).toLocaleDateString()}</td>
                <td>${new Date(user.lastLogin).toLocaleDateString()}</td>
                <td>${user.booksRead}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-view" title="View Profile" onclick="AdminUsers.viewUser('${user.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action btn-edit" title="Edit User" onclick="AdminUsers.editUser('${user.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-message" title="Send Message" onclick="AdminUsers.messageUser('${user.id}')">
                            <i class="fas fa-envelope"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },
    
    renderUsersPagination: function() {
        let html = '';
        
        // Previous button
        html += `
            <button class="page-prev" ${this.state.currentPage === 1 ? 'disabled' : ''}
                    onclick="AdminUsers.goToPage(${this.state.currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        // Page numbers
        for (let i = 1; i <= this.state.totalPages; i++) {
            if (i === 1 || i === this.state.totalPages || 
                (i >= this.state.currentPage - 2 && i <= this.state.currentPage + 2)) {
                html += `
                    <button class="page-number ${i === this.state.currentPage ? 'active' : ''}"
                            onclick="AdminUsers.goToPage(${i})">
                        ${i}
                    </button>
                `;
            } else if (i === this.state.currentPage - 3 || i === this.state.currentPage + 3) {
                html += `<span class="page-ellipsis">...</span>`;
            }
        }
        
        // Next button
        html += `
            <button class="page-next" ${this.state.currentPage === this.state.totalPages ? 'disabled' : ''}
                    onclick="AdminUsers.goToPage(${this.state.currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        return html;
    },
    
    setupUsersEventListeners: function() {
        // Set up event listeners for users page
        setTimeout(() => {
            // Search
            const searchInput = document.getElementById('users-search');
            if (searchInput) {
                searchInput.addEventListener('input', () => this.handleUsersSearch());
            }
            
            // Filters
            const roleFilter = document.getElementById('users-role-filter');
            const statusFilter = document.getElementById('users-status-filter');
            const subscriptionFilter = document.getElementById('users-subscription-filter');
            
            if (roleFilter) roleFilter.addEventListener('change', () => this.handleUsersFilter());
            if (statusFilter) statusFilter.addEventListener('change', () => this.handleUsersFilter());
            if (subscriptionFilter) subscriptionFilter.addEventListener('change', () => this.handleUsersFilter());
            
            // Select all
            const selectAll = document.getElementById('select-all-users');
            if (selectAll) {
                selectAll.addEventListener('change', (e) => this.toggleSelectAllUsers(e));
            }
            
            // Checkboxes
            const checkboxes = document.querySelectorAll('.user-select');
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', (e) => this.toggleUserSelection(e));
            });
            
            // Buttons
            const addUserBtn = document.getElementById('add-user-btn');
            const inviteUsersBtn = document.getElementById('invite-users-btn');
            const exportBtn = document.getElementById('export-users-btn');
            const deleteBtn = document.getElementById('delete-users-btn');
            
            if (addUserBtn) addUserBtn.addEventListener('click', () => this.showAddUserModal());
            if (inviteUsersBtn) inviteUsersBtn.addEventListener('click', () => this.showInviteModal());
            if (exportBtn) exportBtn.addEventListener('click', () => this.exportSelectedUsers());
            if (deleteBtn) deleteBtn.addEventListener('click', () => this.deleteSelectedUsers());
        }, 100);
    },
    
    handleUsersSearch: function() {
        const searchInput = document.getElementById('users-search');
        if (searchInput) {
            this.state.searchQuery = searchInput.value.toLowerCase();
            this.applyUsersFilters();
        }
    },
    
    handleUsersFilter: function() {
        this.state.filters = {
            role: document.getElementById('users-role-filter')?.value || '',
            status: document.getElementById('users-status-filter')?.value || '',
            subscription: document.getElementById('users-subscription-filter')?.value || ''
        };
        this.applyUsersFilters();
    },
    
    applyUsersFilters: function() {
        this.state.filteredUsers = this.state.users.filter(user => {
            // Search filter
            if (this.state.searchQuery && 
                !user.name.toLowerCase().includes(this.state.searchQuery) &&
                !user.email.toLowerCase().includes(this.state.searchQuery)) {
                return false;
            }
            
            // Role filter
            if (this.state.filters.role && user.role !== this.state.filters.role) {
                return false;
            }
            
            // Status filter
            if (this.state.filters.status && user.status !== this.state.filters.status) {
                return false;
            }
            
            // Subscription filter
            if (this.state.filters.subscription && user.subscription !== this.state.filters.subscription) {
                return false;
            }
            
            return true;
        });
        
        this.state.currentPage = 1;
        this.state.totalPages = Math.ceil(this.state.filteredUsers.length / this.config.itemsPerPage);
        this.renderUsersPage();
    },
    
    goToPage: function(page) {
        if (page < 1 || page > this.state.totalPages || page === this.state.currentPage) return;
        
        this.state.currentPage = page;
        this.renderUsersPage();
    },
    
    toggleSelectAllUsers: function(e) {
        const isChecked = e.target.checked;
        const startIndex = (this.state.currentPage - 1) * this.config.itemsPerPage;
        const endIndex = startIndex + this.config.itemsPerPage;
        const usersToSelect = this.state.filteredUsers.slice(startIndex, endIndex);
        
        if (isChecked) {
            usersToSelect.forEach(user => {
                this.state.selectedUsers.add(user.id);
            });
        } else {
            usersToSelect.forEach(user => {
                this.state.selectedUsers.delete(user.id);
            });
        }
        
        this.updateUsersSelectionUI();
    },
    
    toggleUserSelection: function(e) {
        const userId = e.target.dataset.id;
        
        if (e.target.checked) {
            this.state.selectedUsers.add(userId);
        } else {
            this.state.selectedUsers.delete(userId);
        }
        
        this.updateUsersSelectionUI();
    },
    
    updateUsersSelectionUI: function() {
        const count = this.state.selectedUsers.size;
        
        // Update select all checkbox
        const selectAll = document.getElementById('select-all-users');
        if (selectAll) {
            const startIndex = (this.state.currentPage - 1) * this.config.itemsPerPage;
            const endIndex = startIndex + this.config.itemsPerPage;
            const usersOnPage = this.state.filteredUsers.slice(startIndex, endIndex);
            
            const allSelected = usersOnPage.every(user => 
                this.state.selectedUsers.has(user.id));
            
            selectAll.checked = allSelected;
            selectAll.indeterminate = 
                !allSelected && usersOnPage.some(user => this.state.selectedUsers.has(user.id));
        }
        
        // Update buttons
        const exportBtn = document.getElementById('export-users-btn');
        const deleteBtn = document.getElementById('delete-users-btn');
        
        if (exportBtn) exportBtn.disabled = count === 0;
        if (deleteBtn) deleteBtn.disabled = count === 0;
    },
    
    showAddUserModal: function() {
        AdminDashboard.showToast('Add user feature coming soon', 'info');
    },
    
    showInviteModal: function() {
        AdminDashboard.showToast('Invite users feature coming soon', 'info');
    },
    
    exportSelectedUsers: function() {
        if (this.state.selectedUsers.size === 0) return;
        
        const selectedUsersData = this.state.users.filter(user => 
            this.state.selectedUsers.has(user.id)
        );
        
        // Create CSV
        const headers = ['Name', 'Email', 'Role', 'Status', 'Subscription', 'Joined', 'Last Login', 'Books Read'];
        const rows = selectedUsersData.map(user => [
            user.name,
            user.email,
            user.role,
            user.status,
            user.subscription,
            user.joined,
            user.lastLogin,
            user.booksRead
        ]);
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        
        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        AdminDashboard.showToast(`Exported ${this.state.selectedUsers.size} users`, 'success');
    },
    
    deleteSelectedUsers: function() {
        if (this.state.selectedUsers.size === 0) return;
        
        if (!confirm(`Are you sure you want to delete ${this.state.selectedUsers.size} user(s)? This action cannot be undone.`)) {
            return;
        }
        
        // Remove from state
        this.state.users = this.state.users.filter(user => 
            !this.state.selectedUsers.has(user.id)
        );
        
        this.state.selectedUsers.clear();
        this.applyUsersFilters();
        
        AdminDashboard.showToast(`Deleted ${this.state.selectedUsers.size} users`, 'success');
    },
    
    viewUser: function(userId) {
        const user = this.state.users.find(u => u.id === userId);
        if (user) {
            AdminDashboard.showToast(`Viewing profile: ${user.name}`, 'info');
            // Show user profile modal
        }
    },
    
    editUser: function(userId) {
        const user = this.state.users.find(u => u.id === userId);
        if (user) {
            AdminDashboard.showToast(`Editing user: ${user.name}`, 'info');
            // Show edit user modal
        }
    },
    
    messageUser: function(userId) {
        const user = this.state.users.find(u => u.id === userId);
        if (user) {
            AdminDashboard.showToast(`Messaging: ${user.name}`, 'info');
            // Show message modal
        }
    }
};