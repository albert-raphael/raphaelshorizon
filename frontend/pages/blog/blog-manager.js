// Save as: js/blog-manager.js

class BlogManager {
    constructor() {
        this.posts = [];
        this.currentPost = null;
        this.loadPosts();
    }
    
    async loadPosts() {
        try {
            const response = await fetch('../data/blog-posts.json');
            const data = await response.json();
            this.posts = data.posts;
            console.log('Posts loaded:', this.posts.length);
        } catch (error) {
            console.error('Error loading posts:', error);
            // Create default posts if file doesn't exist
            this.posts = this.getDefaultPosts();
        }
    }
    
    getDefaultPosts() {
        return [
            {
                id: 1,
                title: "About Raphael's Horizon",
                slug: "about-raphaels-horizon",
                excerpt: "Discover the mission and vision behind Raphael's Horizon",
                content: "<p>Default content...</p>",
                category: "Our Mission",
                tags: ["mission"],
                featuredImage: "../../assets/images/blog-post-1.png",
                author: "Assimagbe Albert Raphael",
                date: "2025-01-15",
                readTime: 5,
                views: 0,
                status: "published",
                featured: true
            }
        ];
    }
    
    getPosts(category = null, tag = null, limit = null) {
        let filteredPosts = [...this.posts];
        
        if (category) {
            filteredPosts = filteredPosts.filter(post => 
                post.category.toLowerCase() === category.toLowerCase()
            );
        }
        
        if (tag) {
            filteredPosts = filteredPosts.filter(post => 
                post.tags.includes(tag.toLowerCase())
            );
        }
        
        filteredPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (limit) {
            filteredPosts = filteredPosts.slice(0, limit);
        }
        
        return filteredPosts;
    }
    
    getPostBySlug(slug) {
        return this.posts.find(post => post.slug === slug);
    }
    
    getFeaturedPost() {
        return this.posts.find(post => post.featured) || this.posts[0];
    }
    
    getCategories() {
        const categories = {};
        this.posts.forEach(post => {
            categories[post.category] = (categories[post.category] || 0) + 1;
        });
        return categories;
    }
    
    getTags() {
        const tags = {};
        this.posts.forEach(post => {
            post.tags.forEach(tag => {
                tags[tag] = (tags[tag] || 0) + 1;
            });
        });
        return tags;
    }
    
    async savePost(postData) {
        // Generate new ID
        const newId = Math.max(...this.posts.map(p => p.id)) + 1;
        
        // Create slug if not provided
        if (!postData.slug) {
            postData.slug = this.generateSlug(postData.title);
        }
        
        const newPost = {
            id: newId,
            ...postData,
            date: postData.date || new Date().toISOString().split('T')[0],
            views: 0,
            status: postData.status || 'draft'
        };
        
        this.posts.push(newPost);
        
        // In real implementation, save to server
        console.log('Post saved:', newPost);
        
        return newPost;
    }
    
    generateSlug(title) {
        return title.toLowerCase()
            .replace(/[^\w\s]/gi, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 60);
    }
    
    async updatePost(id, updates) {
        const index = this.posts.findIndex(post => post.id === id);
        if (index !== -1) {
            this.posts[index] = { ...this.posts[index], ...updates };
            console.log('Post updated:', this.posts[index]);
            return this.posts[index];
        }
        return null;
    }
    
    async deletePost(id) {
        const index = this.posts.findIndex(post => post.id === id);
        if (index !== -1) {
            const deleted = this.posts.splice(index, 1)[0];
            console.log('Post deleted:', deleted);
            return deleted;
        }
        return null;
    }
}

// Create global instance
window.blogManager = new BlogManager();