/**
 * Blog Manager
 * Handles blog post management operations for the admin dashboard
 */

const blogManager = {
    posts: [],

    async loadPosts() {
        // In a real production environment, this would fetch from your backend API
        // const response = await Api.request('/blog/posts');
        // this.posts = await response.json();

        // For now, we return the static posts that exist in your project
        this.posts = [
            {
                id: 1,
                title: "Finding Strength in Scripture",
                excerpt: "Biblical guidance for overcoming fear and finding peace through scripture during difficult times.",
                category: "Faith & Scripture",
                status: "published",
                date: "2025-01-20",
                featuredImage: "../../assets/images/blog-post-1.png",
                slug: "1"
            },
            {
                id: 2,
                title: "Embracing The Journey: Unlocking The Power Within",
                excerpt: "Discovering personal resilience and purpose by transforming challenges into opportunities for growth.",
                category: "Personal Growth",
                status: "published",
                date: "2025-01-12",
                featuredImage: "../../assets/images/blog-post-2.jpg",
                slug: "2"
            },
            {
                id: 3,
                title: "Embracing the Journey of Self-Discovery",
                excerpt: "Practical steps for personal transformation through change, resilience, and discovering your authentic self.",
                category: "Personal Growth",
                status: "published",
                date: "2025-01-10",
                featuredImage: "../../assets/images/blog-post-3.jpg",
                slug: "3"
            },
            {
                id: 4,
                title: "The Power of Reading: Illuminating Your Path to True Purpose",
                excerpt: "How cultivating reading habits can lead to personal growth and help discover your life's purpose.",
                category: "Personal Development",
                status: "published",
                date: "2025-01-08",
                featuredImage: "../../assets/images/blog-post-4.jpg",
                slug: "4"
            },
            {
                id: 5,
                title: "Breaking Boundaries: Embracing Your Future Beyond Family Limitations",
                excerpt: "Overcoming generational patterns and family limitations through faith in Christ.",
                category: "Freedom in Christ",
                status: "published",
                date: "2025-01-05",
                featuredImage: "../../assets/images/blog-post-5.jpg",
                slug: "5"
            },
            {
                id: 6,
                title: "Navigating Challenges: Maintaining Focus on Your Goals and Purpose",
                excerpt: "Staying committed to your purpose despite obstacles by maintaining unwavering focus.",
                category: "Purpose & Focus",
                status: "published",
                date: "2025-01-03",
                featuredImage: "../../assets/images/blog-post-6.jpg",
                slug: "6"
            }
        ];
        return this.posts;
    },

    getPosts() {
        return this.posts;
    },

    async deletePost(id) {
        // In production: await Api.request(`/blog/posts/${id}`, { method: 'DELETE' });
        this.posts = this.posts.filter(p => p.id !== id);
        console.log('Deleted post', id);
        return true;
    }
};