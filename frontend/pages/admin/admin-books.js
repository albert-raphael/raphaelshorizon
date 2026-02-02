// Admin Books Management
const AdminBooks = {
    
    // Configuration
    config: {
        itemsPerPage: 10,
        apiEndpoint: '/api/admin/books',
        uploadEndpoint: '/api/admin/upload'
    },
    
    // State
    state: {
        books: [],
        filteredBooks: [],
        currentPage: 1,
        totalPages: 1,
        selectedBooks: new Set(),
        isLoading: false,
        searchQuery: '',
        filters: {
            category: '',
            status: '',
            language: ''
        }
    },
    
    // DOM Elements
    elements: {
        booksTableBody: null,
        booksPagination: null,
        selectAllBooks: null,
        bookSearch: null,
        categoryFilter: null,
        statusFilter: null,
        languageFilter: null,
        addBookBtn: null,
        importBooksBtn: null,
        exportBooksBtn: null,
        deleteBooksBtn: null
    },
    
    // Initialize
    init: function() {
        this.setupElements();
        this.setupEventListeners();
        console.log('Admin Books Management initialized');
    },
    
    setupElements: function() {
        this.elements = {
            booksTableBody: document.getElementById('books-table-body'),
            booksPagination: document.getElementById('books-pagination'),
            selectAllBooks: document.getElementById('select-all-books'),
            bookSearch: document.getElementById('book-search'),
            categoryFilter: document.getElementById('book-category-filter'),
            statusFilter: document.getElementById('book-status-filter'),
            languageFilter: document.getElementById('book-language-filter'),
            addBookBtn: document.getElementById('add-book-btn'),
            importBooksBtn: document.getElementById('import-books-btn'),
            exportBooksBtn: document.getElementById('export-books-btn'),
            deleteBooksBtn: document.getElementById('delete-books-btn')
        };
    },
    
    setupEventListeners: function() {
        // Search
        if (this.elements.bookSearch) {
            this.elements.bookSearch.addEventListener('input', () => this.handleSearch());
        }
        
        // Filters
        if (this.elements.categoryFilter) {
            this.elements.categoryFilter.addEventListener('change', () => this.handleFilter());
        }
        if (this.elements.statusFilter) {
            this.elements.statusFilter.addEventListener('change', () => this.handleFilter());
        }
        if (this.elements.languageFilter) {
            this.elements.languageFilter.addEventListener('change', () => this.handleFilter());
        }
        
        // Select all
        if (this.elements.selectAllBooks) {
            this.elements.selectAllBooks.addEventListener('change', (e) => this.toggleSelectAll(e));
        }
        
        // Buttons
        if (this.elements.addBookBtn) {
            this.elements.addBookBtn.addEventListener('click', () => this.showAddBookModal());
        }
        if (this.elements.importBooksBtn) {
            this.elements.importBooksBtn.addEventListener('click', () => this.showImportModal());
        }
        if (this.elements.exportBooksBtn) {
            this.elements.exportBooksBtn.addEventListener('click', () => this.exportSelected());
        }
        if (this.elements.deleteBooksBtn) {
            this.elements.deleteBooksBtn.addEventListener('click', () => this.deleteSelected());
        }
    },
    
    loadBooks: function() {
        this.state.isLoading = true;

        // Show loading
        if (this.elements.booksTableBody) {
            this.elements.booksTableBody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align: center; padding: 3rem;">
                        <div class="loading-spinner-large" style="margin: 0 auto 1rem;"></div>
                        <p>Loading books...</p>
                    </td>
                </tr>
            `;
        }

        // Make API call to load books
        fetch(this.config.apiEndpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                this.state.books = data.data || [];
                this.applyFilters();
                this.renderBooks();
                this.updatePagination();
            } else {
                throw new Error(data.message || 'Failed to load books');
            }
        })
        .catch(error => {
            console.error('Error loading books:', error);
            this.showError('Failed to load books: ' + error.message);
            // Fallback to empty state
            this.state.books = [];
            this.applyFilters();
            this.renderBooks();
            this.updatePagination();
        })
        .finally(() => {
            this.state.isLoading = false;
        });
    },

    renderBooks: function() {
        if (!this.elements.booksTableBody) return;
        
        const startIndex = (this.state.currentPage - 1) * this.config.itemsPerPage;
        const endIndex = startIndex + this.config.itemsPerPage;
        const booksToShow = this.state.filteredBooks.slice(startIndex, endIndex);
        
        if (booksToShow.length === 0) {
            this.elements.booksTableBody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align: center; padding: 3rem;">
                        <i class="fas fa-book fa-3x" style="color: #ddd; margin-bottom: 1rem;"></i>
                        <p>No books found</p>
                        <button class="btn btn-primary" onclick="AdminBooks.showAddBookModal()">
                            <i class="fas fa-plus"></i> Add Your First Book
                        </button>
                    </td>
                </tr>
            `;
            return;
        }
        
        this.elements.booksTableBody.innerHTML = booksToShow.map(book => `
            <tr>
                <td>
                    <input type="checkbox" 
                           class="book-select" 
                           data-id="${book.id}"
                           ${this.state.selectedBooks.has(book.id) ? 'checked' : ''}>
                </td>
                <td>
                    <img src="${book.cover}" 
                         alt="${book.title}" 
                         style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;">
                </td>
                <td>
                    <div class="book-title">${book.title}</div>
                    <small class="text-muted">ID: ${book.id}</small>
                </td>
                <td>
                    <span class="badge badge-category">${book.category}</span>
                </td>
                <td>
                    <span class="badge badge-language">${book.language}</span>
                </td>
                <td>${book.pages}</td>
                <td>
                    <span class="badge badge-${book.status === 'published' ? 'success' : 
                                              book.status === 'draft' ? 'warning' : 'secondary'}">
                        ${book.status.charAt(0).toUpperCase() + book.status.slice(1)}
                    </span>
                </td>
                <td>${book.views.toLocaleString()}</td>
                <td>${new Date(book.added).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-view" title="View" onclick="AdminBooks.viewBook('${book.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action btn-edit" title="Edit" onclick="AdminBooks.editBook('${book.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-delete" title="Delete" onclick="AdminBooks.deleteBook('${book.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        // Add event listeners to checkboxes
        const checkboxes = this.elements.booksTableBody.querySelectorAll('.book-select');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => this.toggleBookSelection(e));
        });
    },
    
    renderPagination: function() {
        if (!this.elements.booksPagination) return;
        
        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <button class="page-prev" ${this.state.currentPage === 1 ? 'disabled' : ''}
                    onclick="AdminBooks.goToPage(${this.state.currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        // Page numbers
        for (let i = 1; i <= this.state.totalPages; i++) {
            if (i === 1 || i === this.state.totalPages || 
                (i >= this.state.currentPage - 2 && i <= this.state.currentPage + 2)) {
                paginationHTML += `
                    <button class="page-number ${i === this.state.currentPage ? 'active' : ''}"
                            onclick="AdminBooks.goToPage(${i})">
                        ${i}
                    </button>
                `;
            } else if (i === this.state.currentPage - 3 || i === this.state.currentPage + 3) {
                paginationHTML += `<span class="page-ellipsis">...</span>`;
            }
        }
        
        // Next button
        paginationHTML += `
            <button class="page-next" ${this.state.currentPage === this.state.totalPages ? 'disabled' : ''}
                    onclick="AdminBooks.goToPage(${this.state.currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        this.elements.booksPagination.innerHTML = paginationHTML;
    },
    
    goToPage: function(page) {
        if (page < 1 || page > this.state.totalPages || page === this.state.currentPage) return;
        
        this.state.currentPage = page;
        this.renderBooks();
        this.renderPagination();
        
        // Scroll to top
        this.elements.booksTableBody.parentElement.scrollTop = 0;
    },
    
    handleSearch: function() {
        this.state.searchQuery = this.elements.bookSearch.value.toLowerCase();
        this.applyFilters();
    },
    
    handleFilter: function() {
        this.state.filters = {
            category: this.elements.categoryFilter.value,
            status: this.elements.statusFilter.value,
            language: this.elements.languageFilter.value
        };
        this.applyFilters();
    },
    
    applyFilters: function() {
        this.state.filteredBooks = this.state.books.filter(book => {
            // Search filter
            if (this.state.searchQuery && 
                !book.title.toLowerCase().includes(this.state.searchQuery) &&
                !book.id.toLowerCase().includes(this.state.searchQuery)) {
                return false;
            }
            
            // Category filter
            if (this.state.filters.category && book.category !== this.state.filters.category) {
                return false;
            }
            
            // Status filter
            if (this.state.filters.status && book.status !== this.state.filters.status) {
                return false;
            }
            
            // Language filter
            if (this.state.filters.language && book.language !== this.state.filters.language) {
                return false;
            }
            
            return true;
        });
        
        this.state.currentPage = 1;
        this.state.totalPages = Math.ceil(this.state.filteredBooks.length / this.config.itemsPerPage);
        this.renderBooks();
        this.renderPagination();
    },
    
    toggleSelectAll: function(e) {
        const isChecked = e.target.checked;
        const booksToSelect = this.state.filteredBooks.slice(
            (this.state.currentPage - 1) * this.config.itemsPerPage,
            this.state.currentPage * this.config.itemsPerPage
        );
        
        if (isChecked) {
            booksToSelect.forEach(book => {
                this.state.selectedBooks.add(book.id);
            });
        } else {
            booksToSelect.forEach(book => {
                this.state.selectedBooks.delete(book.id);
            });
        }
        
        this.renderBooks();
        this.updateSelectionCount();
    },
    
    toggleBookSelection: function(e) {
        const bookId = e.target.dataset.id;
        
        if (e.target.checked) {
            this.state.selectedBooks.add(bookId);
        } else {
            this.state.selectedBooks.delete(bookId);
        }
        
        this.updateSelectionCount();
    },
    
    updateSelectionCount: function() {
        const count = this.state.selectedBooks.size;
        
        // Update select all checkbox
        if (this.elements.selectAllBooks) {
            const booksOnPage = this.state.filteredBooks.slice(
                (this.state.currentPage - 1) * this.config.itemsPerPage,
                this.state.currentPage * this.config.itemsPerPage
            );
            
            const allSelected = booksOnPage.every(book => 
                this.state.selectedBooks.has(book.id));
            
            this.elements.selectAllBooks.checked = allSelected;
            this.elements.selectAllBooks.indeterminate = 
                !allSelected && booksOnPage.some(book => this.state.selectedBooks.has(book.id));
        }
        
        // Update export/delete buttons
        if (this.elements.exportBooksBtn) {
            this.elements.exportBooksBtn.disabled = count === 0;
        }
        if (this.elements.deleteBooksBtn) {
            this.elements.deleteBooksBtn.disabled = count === 0;
        }
    },
    
    showAddBookModal: function() {
        // Create and show modal
        const modalHTML = `
            <div class="modal show" id="add-book-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Add New Book</h3>
                        <button class="btn-close" onclick="AdminBooks.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="add-book-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Book Title *</label>
                                    <input type="text" class="form-control" id="book-title" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Subtitle</label>
                                    <input type="text" class="form-control" id="book-subtitle">
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Category *</label>
                                    <select class="form-control" id="book-category" required>
                                        <option value="">Select Category</option>
                                        <option value="inspirational">Inspirational</option>
                                        <option value="christian">Christian</option>
                                        <option value="self-help">Self Help</option>
                                        <option value="spiritual">Spiritual</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Language *</label>
                                    <select class="form-control" id="book-language" required>
                                        <option value="">Select Language</option>
                                        <option value="english">English</option>
                                        <option value="german">German</option>
                                        <option value="french">French</option>
                                        <option value="spanish">Spanish</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Description</label>
                                <textarea class="form-control" id="book-description" rows="3"></textarea>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Cover Image</label>
                                    <input type="file" class="form-control" id="book-cover" accept="image/*">
                                    <small class="form-text">Recommended: 300x400px, JPG or PNG</small>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">PDF File *</label>
                                    <input type="file" class="form-control" id="book-pdf" accept=".pdf" required>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Status</label>
                                    <select class="form-control" id="book-status">
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                        <option value="hidden">Hidden</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Page Count</label>
                                    <input type="number" class="form-control" id="book-pages" min="1">
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="AdminBooks.closeModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="AdminBooks.submitBookForm()">Add Book</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to body
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);
        
        // Focus first input
        setTimeout(() => {
            const titleInput = document.getElementById('book-title');
            if (titleInput) titleInput.focus();
        }, 100);
    },
    
    closeModal: function() {
        const modal = document.getElementById('add-book-modal');
        if (modal) {
            modal.remove();
        }
    },
    
    submitBookForm: function() {
        const form = document.getElementById('add-book-form');
        if (!form) return;
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        // Get form data
        const formData = {
            title: document.getElementById('book-title').value,
            subtitle: document.getElementById('book-subtitle').value,
            category: document.getElementById('book-category').value,
            language: document.getElementById('book-language').value,
            description: document.getElementById('book-description').value,
            status: document.getElementById('book-status').value,
            pages: parseInt(document.getElementById('book-pages').value) || 0,
            cover: document.getElementById('book-cover').files[0],
            pdf: document.getElementById('book-pdf').files[0]
        };
        
        // Submit to API
        this.submitBookToAPI(formData);
    },

    submitBookToAPI: function(formData) {
        // Show loading
        const submitBtn = document.querySelector('#add-book-modal .btn-primary');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
        }

        // Create FormData for file uploads
        const apiFormData = new FormData();
        apiFormData.append('title', formData.title);
        if (formData.subtitle) apiFormData.append('subtitle', formData.subtitle);
        apiFormData.append('category', formData.category);
        apiFormData.append('language', formData.language);
        if (formData.description) apiFormData.append('description', formData.description);
        apiFormData.append('status', formData.status || 'draft');
        if (formData.pages) apiFormData.append('pages', formData.pages);

        if (formData.cover) apiFormData.append('cover', formData.cover);
        if (formData.pdf) apiFormData.append('pdf', formData.pdf);

        // Make API call
        fetch(this.config.apiEndpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                // Don't set Content-Type for FormData, let browser set it
            },
            body: apiFormData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                AdminDashboard.showToast('Book added successfully', 'success');
                this.closeModal();
                this.loadBooks();
            } else {
                throw new Error(data.message || 'Failed to add book');
            }
        })
        .catch(error => {
            console.error('Error adding book:', error);
            AdminDashboard.showToast('Failed to add book: ' + error.message, 'error');
        })
        .finally(() => {
            // Reset button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Add Book';
            }
        });
    },

    showImportModal: function() {
        AdminDashboard.showToast('Import feature coming soon', 'info');
    },
    
    exportSelected: function() {
        if (this.state.selectedBooks.size === 0) return;
        
        const selectedBooksData = this.state.books.filter(book => 
            this.state.selectedBooks.has(book.id)
        );
        
        // Create CSV
        const headers = ['Title', 'Category', 'Language', 'Pages', 'Status', 'Views', 'Added'];
        const rows = selectedBooksData.map(book => [
            book.title,
            book.category,
            book.language,
            book.pages,
            book.status,
            book.views,
            book.added
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
        a.download = `books-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        AdminDashboard.showToast(`Exported ${this.state.selectedBooks.size} books`, 'success');
    },
    
    deleteSelected: function() {
        if (this.state.selectedBooks.size === 0) return;
        
        if (!confirm(`Are you sure you want to delete ${this.state.selectedBooks.size} book(s)? This action cannot be undone.`)) {
            return;
        }
        
        // Here you would call API to delete books
        console.log('Deleting books:', Array.from(this.state.selectedBooks));
        
        // Remove from state
        this.state.books = this.state.books.filter(book => 
            !this.state.selectedBooks.has(book.id)
        );
        
        this.state.selectedBooks.clear();
        this.applyFilters();
        
        AdminDashboard.showToast(`Deleted ${this.state.selectedBooks.size} books`, 'success');
    },
    
    viewBook: function(bookId) {
        // Open book in reader or preview
        window.open(`/pages/books/books-reader/books-online.html?book=${bookId}`, '_blank');
    },
    
    editBook: function(bookId) {
        const book = this.state.books.find(b => b.id === bookId);
        if (!book) return;
        
        // Show edit modal (similar to add modal)
        AdminDashboard.showToast(`Editing: ${book.title}`, 'info');
    },
    
    deleteBook: function(bookId) {
        if (!confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
            return;
        }
        
        // Remove from state
        this.state.books = this.state.books.filter(book => book.id !== bookId);
        this.state.selectedBooks.delete(bookId);
        this.applyFilters();
        
        AdminDashboard.showToast('Book deleted', 'success');
    }
};