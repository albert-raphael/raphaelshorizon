/**
 * Mock Data Store for Embedded Mode
 * Used when no database is connected
 */

module.exports = {
    books: [
        {
            id: '1',
            title: 'The Light After the Tunnel',
            author: 'Assimagbe Albert Raphael',
            cover: 'assets/images/light-after-the-tunnel-english.jpg',
            description: 'Discovering Your True Purpose in Hard Times',
            language: 'English',
            price: 9.99
        },
        {
            id: '2',
            title: 'Divine Jurisprudence',
            author: 'Assimagbe Albert Raphael',
            cover: 'assets/images/divine-jurisprudence-english.jpg',
            description: 'The Covenant Code for a Flourishing Life',
            language: 'English',
            price: 12.99
        }
    ],
    posts: [
        {
            id: '1',
            title: 'Finding Strength in Scripture',
            author: 'Assimagbe Albert Raphael',
            date: '2025-01-20',
            excerpt: 'Biblical guidance for overcoming fear and finding peace through scripture during difficult times.',
            category: 'Faith'
        },
        {
            id: '2',
            title: 'Embracing The Journey',
            author: 'Assimagbe Albert Raphael',
            date: '2025-01-12',
            excerpt: 'Discovering personal resilience and purpose by transforming challenges into opportunities for growth.',
            category: 'Growth'
        }
    ]
};