class APIClient {
  constructor(baseURL) {
    if (!baseURL) {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        this.baseURL = 'http://localhost:5002/api';
      } else {
        this.baseURL = '/api';
      }
    } else {
      this.baseURL = baseURL;
    }
    this.token = localStorage.getItem('authToken');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers,
      credentials: 'include'
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        // Token expired, clear it and redirect to standalone login
        this.clearToken();
        window.location.href = '/pages/admin/login.html';
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async login(credentials) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    
    return data;
  }

  async logout() {
    const data = await this.request('/auth/logout');
    this.clearToken();
    return data;
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Blog endpoints
  async getPosts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/blog/posts?${queryString}`);
  }

  async getPost(id) {
    return this.request(`/blog/posts/${id}`);
  }

  async getPostBySlug(slug) {
    return this.request(`/blog/posts/slug/${slug}`);
  }

  async createPost(postData) {
    return this.request('/blog/posts', {
      method: 'POST',
      body: JSON.stringify(postData)
    });
  }

  async updatePost(id, postData) {
    return this.request(`/blog/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(postData)
    });
  }

  async deletePost(id) {
    return this.request(`/blog/posts/${id}`, {
      method: 'DELETE'
    });
  }

  async searchPosts(query) {
    return this.request(`/blog/search?q=${encodeURIComponent(query)}`);
  }

  // Comment endpoints
  async getComments(postId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/comments/post/${postId}?${queryString}`);
  }

  async createComment(commentData) {
    return this.request('/comments', {
      method: 'POST',
      body: JSON.stringify(commentData)
    });
  }

  async likeComment(commentId) {
    return this.request(`/comments/${commentId}/like`, {
      method: 'POST'
    });
  }

  // Upload endpoints
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    return this.request('/upload', {
      method: 'POST',
      headers: {},
      body: formData
    });
  }

  async getMediaLibrary(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/upload/library?${queryString}`);
  }

  // Analytics endpoints
  async trackPageView(data) {
    return this.request('/analytics/track', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getAnalytics(period = '7d') {
    return this.request(`/analytics?period=${period}`);
  }

  async getPostAnalytics(postId, period = '30d') {
    return this.request(`/analytics/posts/${postId}?period=${period}`);
  }
}

// Create global instance
window.apiClient = new APIClient();