// Admin Audio Management
const AdminAudio = {
    
    // Configuration
    config: {
        itemsPerPage: 10,
        allowedFormats: ['mp3', 'mp4', 'm4a', 'wav'],
        maxFileSize: 500 * 1024 * 1024, // 500MB
        uploadEndpoint: '/api/admin/audio/upload'
    },
    
    // State
    state: {
        audioList: [],
        filteredAudio: [],
        currentPage: 1,
        totalPages: 1,
        selectedAudio: new Set(),
        isLoading: false,
        searchQuery: '',
        filters: {
            category: '',
            status: '',
            format: ''
        }
    },
    
    // Initialize
    init: function() {
        this.setupEventListeners();
        console.log('Admin Audio Management initialized');
    },
    
    setupEventListeners: function() {
        // Add audio button
        const addAudioBtn = document.getElementById('add-audio-btn');
        if (addAudioBtn) {
            addAudioBtn.addEventListener('click', () => this.showAddAudioModal());
        }
    },
    
    loadAudio: function() {
        this.state.isLoading = true;
        
        // Show loading
        const audioContent = document.getElementById('page-audio');
        if (audioContent) {
            audioContent.innerHTML = `
                <div style="text-align: center; padding: 3rem;">
                    <div class="loading-spinner-large" style="margin: 0 auto 1rem;"></div>
                    <p>Loading audio books...</p>
                </div>
            `;
        }
        
        // Simulate API call
        setTimeout(() => {
            // Sample data
            this.state.audioList = [
                {
                    id: 'private-1',
                    title: 'Journey of Self Discovery',
                    category: 'Self-Help',
                    format: 'mp4',
                    duration: '45:30',
                    status: 'published',
                    listens: 1245,
                    added: '2024-01-10',
                    size: '85 MB',
                    cover: '../../library/audio/covers/private-1.jpg'
                },
                {
                    id: 'private-2',
                    title: 'Divine Promises Revealed',
                    category: 'Christian',
                    format: 'mp3',
                    duration: '38:15',
                    status: 'published',
                    listens: 987,
                    added: '2024-02-15',
                    size: '45 MB',
                    cover: '../../library/audio/covers/private-2.jpg'
                },
                {
                    id: 'private-3',
                    title: 'Overcoming Life\'s Obstacles',
                    category: 'Inspirational',
                    format: 'mp3',
                    duration: '52:10',
                    status: 'published',
                    listens: 876,
                    added: '2024-03-05',
                    size: '60 MB',
                    cover: '../../library/audio/covers/private-3.jpg'
                }
            ];
            
            this.state.filteredAudio = [...this.state.audioList];
            this.state.totalPages = Math.ceil(this.state.filteredAudio.length / this.config.itemsPerPage);
            
            this.renderAudioPage();
            this.state.isLoading = false;
            
        }, 1000);
    },
    
    renderAudioPage: function() {
        const audioContent = document.getElementById('page-audio');
        if (!audioContent) return;
        
        audioContent.innerHTML = `
            <div class="page-header">
                <h1>Audio Books Management</h1>
                <div class="page-actions">
                    <button class="btn btn-primary" id="add-audio-btn">
                        <i class="fas fa-plus"></i> Add New Audio
                    </button>
                    <button class="btn btn-secondary" id="batch-upload-btn">
                        <i class="fas fa-folder-plus"></i> Batch Upload
                    </button>
                </div>
            </div>
            
            <div class="management-tools">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Search audio..." id="audio-search">
                </div>
                <div class="filter-options">
                    <select id="audio-category-filter">
                        <option value="">All Categories</option>
                        <option value="self-help">Self Help</option>
                        <option value="christian">Christian</option>
                        <option value="inspirational">Inspirational</option>
                        <option value="prayer">Prayer</option>
                    </select>
                    <select id="audio-format-filter">
                        <option value="">All Formats</option>
                        <option value="mp3">MP3</option>
                        <option value="mp4">MP4</option>
                        <option value="m4a">M4A</option>
                    </select>
                    <select id="audio-status-filter">
                        <option value="">All Status</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="hidden">Hidden</option>
                    </select>
                </div>
            </div>
            
            <div class="data-table-container">
                <table class="data-table" id="audio-table">
                    <thead>
                        <tr>
                            <th><input type="checkbox" id="select-all-audio"></th>
                            <th>Cover</th>
                            <th>Title</th>
                            <th>Category</th>
                            <th>Format</th>
                            <th>Duration</th>
                            <th>Size</th>
                            <th>Status</th>
                            <th>Listens</th>
                            <th>Added</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="audio-table-body">
                        ${this.renderAudioTableBody()}
                    </tbody>
                </table>
            </div>
            
            <div class="table-footer">
                <div class="pagination" id="audio-pagination">
                    ${this.renderPagination()}
                </div>
                <div class="table-actions">
                    <button class="btn btn-sm btn-outline" id="export-audio-btn">
                        <i class="fas fa-download"></i> Export Selected
                    </button>
                    <button class="btn btn-sm btn-danger" id="delete-audio-btn">
                        <i class="fas fa-trash"></i> Delete Selected
                    </button>
                </div>
            </div>
        `;
        
        // Re-attach event listeners
        this.setupAudioEventListeners();
    },
    
    renderAudioTableBody: function() {
        const startIndex = (this.state.currentPage - 1) * this.config.itemsPerPage;
        const endIndex = startIndex + this.config.itemsPerPage;
        const audioToShow = this.state.filteredAudio.slice(startIndex, endIndex);
        
        if (audioToShow.length === 0) {
            return `
                <tr>
                    <td colspan="11" style="text-align: center; padding: 3rem;">
                        <i class="fas fa-headphones fa-3x" style="color: #ddd; margin-bottom: 1rem;"></i>
                        <p>No audio books found</p>
                        <button class="btn btn-primary" onclick="AdminAudio.showAddAudioModal()">
                            <i class="fas fa-plus"></i> Add Your First Audio
                        </button>
                    </td>
                </tr>
            `;
        }
        
        return audioToShow.map(audio => `
            <tr>
                <td>
                    <input type="checkbox" 
                           class="audio-select" 
                           data-id="${audio.id}"
                           ${this.state.selectedAudio.has(audio.id) ? 'checked' : ''}>
                </td>
                <td>
                    <img src="${audio.cover}" 
                         alt="${audio.title}" 
                         style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;"
                         onerror="this.src='https://via.placeholder.com/40/3498db/ffffff?text=A'">
                </td>
                <td>
                    <div class="audio-title">${audio.title}</div>
                    <small class="text-muted">ID: ${audio.id}</small>
                </td>
                <td>
                    <span class="badge badge-category">${audio.category}</span>
                </td>
                <td>
                    <span class="badge badge-format">${audio.format.toUpperCase()}</span>
                </td>
                <td>${audio.duration}</td>
                <td>${audio.size}</td>
                <td>
                    <span class="badge badge-${audio.status === 'published' ? 'success' : 
                                              audio.status === 'draft' ? 'warning' : 'secondary'}">
                        ${audio.status.charAt(0).toUpperCase() + audio.status.slice(1)}
                    </span>
                </td>
                <td>${audio.listens.toLocaleString()}</td>
                <td>${new Date(audio.added).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-play" title="Play" onclick="AdminAudio.playAudio('${audio.id}')">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="btn-action btn-edit" title="Edit" onclick="AdminAudio.editAudio('${audio.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-delete" title="Delete" onclick="AdminAudio.deleteAudio('${audio.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },
    
    renderPagination: function() {
        let html = '';
        
        // Previous button
        html += `
            <button class="page-prev" ${this.state.currentPage === 1 ? 'disabled' : ''}
                    onclick="AdminAudio.goToPage(${this.state.currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        // Page numbers
        for (let i = 1; i <= this.state.totalPages; i++) {
            if (i === 1 || i === this.state.totalPages || 
                (i >= this.state.currentPage - 2 && i <= this.state.currentPage + 2)) {
                html += `
                    <button class="page-number ${i === this.state.currentPage ? 'active' : ''}"
                            onclick="AdminAudio.goToPage(${i})">
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
                    onclick="AdminAudio.goToPage(${this.state.currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        return html;
    },
    
    setupAudioEventListeners: function() {
        // Search
        const searchInput = document.getElementById('audio-search');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.handleAudioSearch());
        }
        
        // Filters
        const categoryFilter = document.getElementById('audio-category-filter');
        const formatFilter = document.getElementById('audio-format-filter');
        const statusFilter = document.getElementById('audio-status-filter');
        
        if (categoryFilter) categoryFilter.addEventListener('change', () => this.handleAudioFilter());
        if (formatFilter) formatFilter.addEventListener('change', () => this.handleAudioFilter());
        if (statusFilter) statusFilter.addEventListener('change', () => this.handleAudioFilter());
        
        // Select all
        const selectAll = document.getElementById('select-all-audio');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => this.toggleSelectAllAudio(e));
        }
        
        // Checkboxes
        setTimeout(() => {
            const checkboxes = document.querySelectorAll('.audio-select');
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', (e) => this.toggleAudioSelection(e));
            });
        }, 100);
        
        // Buttons
        const addAudioBtn = document.getElementById('add-audio-btn');
        const batchUploadBtn = document.getElementById('batch-upload-btn');
        const exportBtn = document.getElementById('export-audio-btn');
        const deleteBtn = document.getElementById('delete-audio-btn');
        
        if (addAudioBtn) addAudioBtn.addEventListener('click', () => this.showAddAudioModal());
        if (batchUploadBtn) batchUploadBtn.addEventListener('click', () => this.showBatchUploadModal());
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportSelectedAudio());
        if (deleteBtn) deleteBtn.addEventListener('click', () => this.deleteSelectedAudio());
    },
    
    handleAudioSearch: function() {
        const searchInput = document.getElementById('audio-search');
        if (searchInput) {
            this.state.searchQuery = searchInput.value.toLowerCase();
            this.applyAudioFilters();
        }
    },
    
    handleAudioFilter: function() {
        this.state.filters = {
            category: document.getElementById('audio-category-filter')?.value || '',
            format: document.getElementById('audio-format-filter')?.value || '',
            status: document.getElementById('audio-status-filter')?.value || ''
        };
        this.applyAudioFilters();
    },
    
    applyAudioFilters: function() {
        this.state.filteredAudio = this.state.audioList.filter(audio => {
            // Search filter
            if (this.state.searchQuery && 
                !audio.title.toLowerCase().includes(this.state.searchQuery) &&
                !audio.id.toLowerCase().includes(this.state.searchQuery)) {
                return false;
            }
            
            // Category filter
            if (this.state.filters.category && audio.category !== this.state.filters.category) {
                return false;
            }
            
            // Format filter
            if (this.state.filters.format && audio.format !== this.state.filters.format) {
                return false;
            }
            
            // Status filter
            if (this.state.filters.status && audio.status !== this.state.filters.status) {
                return false;
            }
            
            return true;
        });
        
        this.state.currentPage = 1;
        this.state.totalPages = Math.ceil(this.state.filteredAudio.length / this.config.itemsPerPage);
        this.renderAudioPage();
    },
    
    goToPage: function(page) {
        if (page < 1 || page > this.state.totalPages || page === this.state.currentPage) return;
        
        this.state.currentPage = page;
        this.renderAudioPage();
    },
    
    showAddAudioModal: function() {
        const modalHTML = `
            <div class="modal show" id="add-audio-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Add New Audio Book</h3>
                        <button class="btn-close" onclick="AdminAudio.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="add-audio-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Audio Title *</label>
                                    <input type="text" class="form-control" id="audio-title" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Subtitle</label>
                                    <input type="text" class="form-control" id="audio-subtitle">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Description</label>
                                <textarea class="form-control" id="audio-description" rows="3"></textarea>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Category *</label>
                                    <select class="form-control" id="audio-category" required>
                                        <option value="">Select Category</option>
                                        <option value="self-help">Self Help</option>
                                        <option value="christian">Christian</option>
                                        <option value="inspirational">Inspirational</option>
                                        <option value="prayer">Prayer</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Language</label>
                                    <select class="form-control" id="audio-language">
                                        <option value="english">English</option>
                                        <option value="german">German</option>
                                        <option value="french">French</option>
                                        <option value="spanish">Spanish</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Cover Image</label>
                                    <input type="file" class="form-control" id="audio-cover" accept="image/*">
                                    <small class="form-text">Recommended: 300x300px, JPG or PNG</small>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Audio File *</label>
                                    <input type="file" class="form-control" id="audio-file" 
                                           accept=".mp3,.mp4,.m4a,.wav" required>
                                    <small class="form-text">Max size: 500MB, Formats: MP3, MP4, M4A, WAV</small>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Status</label>
                                    <select class="form-control" id="audio-status">
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                        <option value="hidden">Hidden</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Duration (HH:MM:SS)</label>
                                    <input type="text" class="form-control" id="audio-duration" 
                                           placeholder="00:45:30" pattern="^[0-9]{2}:[0-5][0-9]:[0-5][0-9]$">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Chapters (Optional)</label>
                                <div id="chapters-container">
                                    <div class="chapter-row">
                                        <input type="text" class="form-control chapter-title" placeholder="Chapter title">
                                        <input type="text" class="form-control chapter-time" placeholder="MM:SS">
                                        <button type="button" class="btn btn-sm btn-danger" onclick="this.closest('.chapter-row').remove()">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                                <button type="button" class="btn btn-sm btn-outline" onclick="AdminAudio.addChapterRow()">
                                    <i class="fas fa-plus"></i> Add Chapter
                                </button>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="AdminAudio.closeModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="AdminAudio.submitAudioForm()">Add Audio</button>
                    </div>
                </div>
            </div>
        `;
        
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);
        
        // Focus first input
        setTimeout(() => {
            const titleInput = document.getElementById('audio-title');
            if (titleInput) titleInput.focus();
        }, 100);
    },
    
    addChapterRow: function() {
        const container = document.getElementById('chapters-container');
        if (container) {
            const row = document.createElement('div');
            row.className = 'chapter-row';
            row.innerHTML = `
                <input type="text" class="form-control chapter-title" placeholder="Chapter title">
                <input type="text" class="form-control chapter-time" placeholder="MM:SS">
                <button type="button" class="btn btn-sm btn-danger" onclick="this.closest('.chapter-row').remove()">
                    <i class="fas fa-times"></i>
                </button>
            `;
            container.appendChild(row);
        }
    },
    
    closeModal: function() {
        const modal = document.getElementById('add-audio-modal');
        if (modal) modal.remove();
    },
    
    submitAudioForm: function() {
        const form = document.getElementById('add-audio-form');
        if (!form) return;
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        // Validate file
        const fileInput = document.getElementById('audio-file');
        if (fileInput.files.length === 0) {
            alert('Please select an audio file');
            return;
        }
        
        const file = fileInput.files[0];
        const fileSize = file.size;
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        // Check file size
        if (fileSize > this.config.maxFileSize) {
            alert(`File size exceeds maximum limit of ${this.config.maxFileSize / (1024*1024)}MB`);
            return;
        }
        
        // Check file format
        if (!this.config.allowedFormats.includes(fileExtension)) {
            alert(`Invalid file format. Allowed formats: ${this.config.allowedFormats.join(', ')}`);
            return;
        }
        
        // Get form data
        const formData = {
            title: document.getElementById('audio-title').value,
            subtitle: document.getElementById('audio-subtitle').value,
            description: document.getElementById('audio-description').value,
            category: document.getElementById('audio-category').value,
            language: document.getElementById('audio-language').value,
            status: document.getElementById('audio-status').value,
            duration: document.getElementById('audio-duration').value,
            cover: document.getElementById('audio-cover').files[0],
            audioFile: file
        };
        
        // Get chapters
        const chapters = [];
        const chapterRows = document.querySelectorAll('.chapter-row');
        chapterRows.forEach(row => {
            const title = row.querySelector('.chapter-title').value;
            const time = row.querySelector('.chapter-time').value;
            if (title && time) {
                chapters.push({ title, time });
            }
        });
        
        if (chapters.length > 0) {
            formData.chapters = chapters;
        }
        
        console.log('Submitting audio form:', formData);
        
        // Simulate API call
        AdminDashboard.showToast('Audio book added successfully', 'success');
        this.closeModal();
        
        // Reload audio list
        setTimeout(() => {
            this.loadAudio();
        }, 500);
    },
    
    showBatchUploadModal: function() {
        AdminDashboard.showToast('Batch upload feature coming soon', 'info');
    },
    
    toggleSelectAllAudio: function(e) {
        const isChecked = e.target.checked;
        const startIndex = (this.state.currentPage - 1) * this.config.itemsPerPage;
        const endIndex = startIndex + this.config.itemsPerPage;
        const audioToSelect = this.state.filteredAudio.slice(startIndex, endIndex);
        
        if (isChecked) {
            audioToSelect.forEach(audio => {
                this.state.selectedAudio.add(audio.id);
            });
        } else {
            audioToSelect.forEach(audio => {
                this.state.selectedAudio.delete(audio.id);
            });
        }
        
        this.updateAudioSelectionUI();
    },
    
    toggleAudioSelection: function(e) {
        const audioId = e.target.dataset.id;
        
        if (e.target.checked) {
            this.state.selectedAudio.add(audioId);
        } else {
            this.state.selectedAudio.delete(audioId);
        }
        
        this.updateAudioSelectionUI();
    },
    
    updateAudioSelectionUI: function() {
        const count = this.state.selectedAudio.size;
        
        // Update select all checkbox
        const selectAll = document.getElementById('select-all-audio');
        if (selectAll) {
            const startIndex = (this.state.currentPage - 1) * this.config.itemsPerPage;
            const endIndex = startIndex + this.config.itemsPerPage;
            const audioOnPage = this.state.filteredAudio.slice(startIndex, endIndex);
            
            const allSelected = audioOnPage.every(audio => 
                this.state.selectedAudio.has(audio.id));
            
            selectAll.checked = allSelected;
            selectAll.indeterminate = 
                !allSelected && audioOnPage.some(audio => this.state.selectedAudio.has(audio.id));
        }
        
        // Update buttons
        const exportBtn = document.getElementById('export-audio-btn');
        const deleteBtn = document.getElementById('delete-audio-btn');
        
        if (exportBtn) exportBtn.disabled = count === 0;
        if (deleteBtn) deleteBtn.disabled = count === 0;
    },
    
    exportSelectedAudio: function() {
        if (this.state.selectedAudio.size === 0) return;
        
        const selectedAudioData = this.state.audioList.filter(audio => 
            this.state.selectedAudio.has(audio.id)
        );
        
        // Create CSV
        const headers = ['Title', 'Category', 'Format', 'Duration', 'Size', 'Status', 'Listens', 'Added'];
        const rows = selectedAudioData.map(audio => [
            audio.title,
            audio.category,
            audio.format,
            audio.duration,
            audio.size,
            audio.status,
            audio.listens,
            audio.added
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
        a.download = `audio-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        AdminDashboard.showToast(`Exported ${this.state.selectedAudio.size} audio books`, 'success');
    },
    
    deleteSelectedAudio: function() {
        if (this.state.selectedAudio.size === 0) return;
        
        if (!confirm(`Are you sure you want to delete ${this.state.selectedAudio.size} audio book(s)? This action cannot be undone.`)) {
            return;
        }
        
        // Remove from state
        this.state.audioList = this.state.audioList.filter(audio => 
            !this.state.selectedAudio.has(audio.id)
        );
        
        this.state.selectedAudio.clear();
        this.applyAudioFilters();
        
        AdminDashboard.showToast(`Deleted ${this.state.selectedAudio.size} audio books`, 'success');
    },
    
    playAudio: function(audioId) {
        // Open audio player
        const audio = this.state.audioList.find(a => a.id === audioId);
        if (audio) {
            window.open(`audio-books.html?play=${audioId}`, '_blank');
        }
    },
    
    editAudio: function(audioId) {
        const audio = this.state.audioList.find(a => a.id === audioId);
        if (audio) {
            AdminDashboard.showToast(`Editing: ${audio.title}`, 'info');
            // Show edit modal (similar to add modal)
        }
    },
    
    deleteAudio: function(audioId) {
        if (!confirm('Are you sure you want to delete this audio book? This action cannot be undone.')) {
            return;
        }
        
        // Remove from state
        this.state.audioList = this.state.audioList.filter(audio => audio.id !== audioId);
        this.state.selectedAudio.delete(audioId);
        this.applyAudioFilters();
        
        AdminDashboard.showToast('Audio book deleted', 'success');
    }
};