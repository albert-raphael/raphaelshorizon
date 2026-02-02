// Book Configuration File
// Add new books here following the template below

const BOOKS_CONFIG = {
    // Book 1 - English Edition
    'light-after-tunnel': {
        id: 'light-after-tunnel',
        title: 'The Light After the Tunnel',
        subtitle: 'Discovering Your True Purpose In Hard Times',
        description: 'Transformative guidance for finding purpose in adversity through biblical wisdom. Learn how to navigate challenges and discover your divine destiny.',
        cover: '../../../library/books/books_cover/light-after-the-tunnel-english.jpg',
        pdf: '../../../library/books/light-after-the-tunnel-english.pdf',
        language: 'English',
        defaultPages: 245,
        categories: ['Inspirational', 'Christian Living', 'Personal Growth'],
        badges: ['Bestseller'],
        chapters: [
            // Starting from Introduction (PDF page 7 = index 6)
            { title: 'Introduction', page: 7 },
            { title: 'Chapter 1: Hard Times Does Not Discriminate', page: 9 },
            { title: 'Chapter 2: Overcoming Intimidation with Courage', page: 21 },
            { title: 'Chapter 3: Persistence and Resilience', page: 33 },
            { title: 'Chapter 4: Cultivating Spiritual Alertness through Persistent Prayer', page: 44 },
            { title: 'Chapter 5: Unveiling Your Purpose, Exercising Self-Discipline, and Mastering Your Destiny', page: 59 },
            { title: 'Chapter 6: Honoring God in the Midst of Adversity', page: 74 },
            { title: 'Chapter 7: Avoid Dwelling on the Past', page: 84 },
            { title: 'Chapter 8: The Efficacy of Praise and Worship', page: 94 },
            { title: 'Chapter 9: The Pathway to your Destiny', page: 103 },
            { title: 'Chapter 10: The Role of Grace in the Race', page: 115 },
            { title: 'Chapter 11: Divine Correction', page: 129 },
            { title: 'Chapter 12: The Unchanging Love of Christ', page: 138 },
            { title: 'Chapter 13: Making Yourself Available for God\'s Purpose', page: 147 },
            { title: 'Chapter 14: Learning from the Story of Job', page: 160 }
        ]
    },
    
    // Book 2 - German Edition
    'light-tunnel-german': {
        id: 'light-tunnel-german',
        title: 'Das Licht nach dem Tunnel',
        subtitle: 'Entdecken Sie Ihren wahren Zweck in schweren Zeiten',
        description: 'Deutsche Ausgabe - Transformative Anleitung zur Sinnfindung in schwierigen Zeiten durch biblische Weisheit.',
        cover: '../../../library/books/books_cover/light-after-the-tunnel-german.jpg',
        pdf: '../../../library/books/light-after-the-tunnel-german.pdf',
        language: 'German',
        defaultPages: 172,
        categories: ['Inspirational', 'Christian Living', 'German Books'],
        badges: ['German Edition'],
        chapters: [
            // Starting from Einleitung (PDF page 6 = index 5)
            { title: 'Einleitung', page: 7 },
            { title: 'Kapitel 1: Harte Zeiten diskriminieren nicht', page: 10 },
            { title: 'Kapitel 2: Einschüchterung mit Mut überwinden', page: 24 },
            { title: 'Kapitel 3: Beharrlichkeit und Belastbarkeit', page: 37 },
            { title: 'Kapitel 4: Kultivierung spiritueller Wachsamkeit durch beharrliches Gebet', page: 49 },
            { title: 'Kapitel 5: Enthüllen Sie Ihr Ziel, üben Sie Selbstdisziplin und meistern Sie Ihr Schicksal', page: 65 },
            { title: 'Kapitel 6: Gott ehren inmitten von Widrigkeiten', page: 82 },
            { title: 'Kapitel 7: Vermeiden Sie es, in der Vergangenheit zu verweilen', page: 93 },
            { title: 'Kapitel 8: Die Wirksamkeit von Lobpreis und Anbetung', page: 105 },
            { title: 'Kapitel 9: Der Weg zu deinem Schicksal', page: 115 },
            { title: 'Kapitel 10: Die Rolle der Gnade im Rennen', page: 128 },
            { title: 'Kapitel 11: Göttliche Korrektur', page: 144 },
            { title: 'Kapitel 12: Die unveränderliche Liebe Christi', page: 154 },
            { title: 'Kapitel 13: Machen Sie sich für Gottes Ziel verfügbar', page: 164 },
            { title: 'Kapitel 14: Aus der Geschichte von Hiob lernen', page: 178 }
        ]
    },
    
    // Book 3 - English Edition
    'divine-jurisprudence': {
        id: 'divine-jurisprudence',
        title: 'Divine Jurisprudence',
        subtitle: 'The Covenant Code for a Flourishing Life',
        description: 'Unlock divine principles for abundant living through covenant understanding. Discover the spiritual laws that govern success and fulfillment.',
        cover: '../../../library/books/books_cover/divine-jurisprudence-english.jpg',
        pdf: '../../../library/books/divine-jurisprudence-english.pdf',
        language: 'English',
        defaultPages: 122,
        categories: ['Christian Living', 'Spiritual Growth', 'Biblical Study'],
        badges: ['Featured'],
        chapters: [
            // Starting from Introduction (PDF page 6 = index 5)
            { title: 'Introduction', page: 11 },
            { title: 'Chapter 1: The Foundation of Divine Law', page: 14 },
            { title: 'Chapter 2: Unearthing the Covenant Code', page: 22 },
            { title: 'Chapter 3: Embodying Love and Compassion', page: 30 },
            { title: 'Chapter 4: The Power of Faith', page: 38 },
            { title: 'Chapter 5: Walking in Righteousness', page: 45 },
            { title: 'Chapter 6: Navigating Trials and Tribulations', page: 52 },
            { title: 'Chapter 7: Wisdom for Decision Making', page: 58 },
            { title: 'Chapter 8: Living a Life of Gratitude', page: 66 },
            { title: 'Chapter 9: Financial Stewardship', page: 74 },
            { title: 'Chapter 10: Health and Wholeness', page: 81 },
            { title: 'Chapter 11: Forgiveness and Reconciliation', page: 89 },
            { title: 'Chapter 12: Spreading the Light', page: 97 },
            { title: 'Chapter 13: The Eternal Perspective', page: 105 },
            { title: 'Conclusion: The Journey of Divine Jurisprudence', page: 114 },
            { title: 'Guiding Principles for a Flourishing Life: Key Lessons from Divine Jurisprudence', page: 119 }
        ]
    },
    
    // Book 4 - German Edition
    'divine-jurisprudence-german': {
        id: 'divine-jurisprudence-german',
        title: 'Göttliche Rechtsprechung',
        subtitle: 'Der Bundeskodex für ein blühendes Leben',
        description: 'Deutsche Ausgabe - Göttliche Prinzipien für ein erfülltes Leben entdecken und verstehen.',
        cover: '../../../library/books/books_cover/divine-jurisprudence-german.jpg',
        pdf: '../../../library/books/divine-jurisprudence-german.pdf',
        language: 'German',
        defaultPages: 122,
        categories: ['Christian Living', 'German Books', 'Biblical Study'],
        badges: ['German Edition'],
        chapters: [
            // Starting from Einleitung (PDF page 6 = index 5)
            { title: 'Einleitung', page: 9 },
            { title: 'Kapitel 1: Die Grundlage des Göttlichen Gesetzes', page: 12 },
            { title: 'Kapitel 2: Den Bundeskodex Aufdecken', page: 22 },
            { title: 'Kapitel 3: Liebe und Mitgefühl Verkörpern', page: 31 },
            { title: 'Kapitel 4: Die Kraft des Glaubens', page: 40 },
            { title: 'Kapitel 5: In Gerechtigkeit Wandeln', page: 48 },
            { title: 'Kapitel 6: Durch Prüfungen und Schwierigkeiten Navigieren', page: 57 },
            { title: 'Kapitel 7: Weisheit für die Entscheidungsfindung', page: 64 },
            { title: 'Kapitel 8: Ein Leben in Dankbarkeit Führen', page: 73 },
            { title: 'Kapitel 9: Finanzielle Verwaltung', page: 81 },
            { title: 'Kapitel 10: Gesundheit und Ganzheit', page: 89 },
            { title: 'Kapitel 11: Vergebung und Versöhnung', page: 97 },
            { title: 'Kapitel 12: Das Licht Verbreiten', page: 105 },
            { title: 'Kapitel 13: Die Ewige Perspektive', page: 115 },
            { title: 'Abschluss: Die Reise der Göttlichen Rechtsprechung', page: 125 }
        ]
    },
    
    // Book 5 - English Edition
    'embracing-elegance': {
        id: 'embracing-elegance',
        title: 'Embracing Elegance',
        subtitle: 'A Gentle Guide for Women on Cultivating the Best Version of Themselves',
        description: 'Cultivate your best self through God\'s grace and spiritual refinement. A transformative journey toward inner beauty and spiritual elegance.',
        cover: '../../../library/books/books_cover/embracing-elegance.jpg',
        pdf: '../../../library/books/embracing-elegance-english.pdf',
        language: 'English',
        defaultPages: 52,
        categories: ['Women\'s Spirituality', 'Personal Growth', 'Christian Living'],
        badges: ['New Release'],
        chapters: [
            // Starting from Introduction (PDF page 6 = index 5)
            { title: 'Introduction', page: 8 },
            { title: 'Chapter 1: Why Set Standards?', page: 10 },
            { title: 'Chapter 2: Understanding Yourself', page: 14 },
            { title: 'Chapter 3: Graceful Behavior', page: 19 },
            { title: 'Chapter 4: The Art of Communication', page: 25 },
            { title: 'Chapter 5: Speak With Grace And Refinement', page: 30 },
            { title: 'Chapter 6: Personal Style and Elegance', page: 36 },
            { title: 'Chapter 7: Teamwork in Relationships: A Path to Harmony', page: 42 },
            { title: 'Chapter 8: Trust and Truthfulness', page: 47 },
            { title: 'Chapter 9: Becoming a Classy Lady', page: 51 },
            { title: 'General Conclusion', page: 56 },
            { title: 'Relationship Goal Action Plan', page: 59 }
        ]
    },
    
    // ============================================================
    // TEMPLATES FOR NEW BOOKS (Copy and modify these templates)
    // ============================================================
    
    /*
    // Template for New English Book
    'new-english-book': {
        id: 'new-english-book',
        title: 'Your Book Title Here',
        subtitle: 'Your Book Subtitle Here',
        description: 'Brief description of your book...',
        cover: '../../../library/books/books_cover/your-cover-image.jpg',
        pdf: '../../../library/books/your-pdf-file.pdf',
        language: 'English',
        defaultPages: 200, // Approximate page count
        categories: ['Inspirational', 'Christian Living'],
        badges: ['New Release'],
        chapters: [
            // IMPORTANT: These are PDF PAGE INDICES (0-based), not printed page numbers!
            // Example: If "Introduction" starts on PDF page 7, use page: 6
            { title: 'Introduction', page: 5 },
            { title: 'Chapter 1: First Chapter Title', page: 10 },
            { title: 'Chapter 2: Second Chapter Title', page: 25 },
            { title: 'Chapter 3: Third Chapter Title', page: 40 },
            { title: 'Chapter 4: Fourth Chapter Title', page: 55 },
            { title: 'Chapter 5: Fifth Chapter Title', page: 70 },
            { title: 'Conclusion', page: 85 },
            // Add more chapters as needed
        ]
    },
    */
    
    /*
    // Template for New German Book
    'new-german-book': {
        id: 'new-german-book',
        title: 'Ihr Deutscher Buchtitel',
        subtitle: 'Ihr Deutscher Buchuntertitel',
        description: 'Kurze Beschreibung Ihres Buches...',
        cover: '../../../library/books/books_cover/ihre-deutsche-buch-cover.jpg',
        pdf: '../../../library/books/ihre-deutsche-pdf-datei.pdf',
        language: 'German',
        defaultPages: 180, // Ungefähre Seitenzahl
        categories: ['German Books', 'Christian Living'],
        badges: ['German Edition'],
        chapters: [
            // WICHTIG: Dies sind PDF-SEITENINDIZES (0-basiert), nicht gedruckte Seitenzahlen!
            // Beispiel: Wenn "Einleitung" auf PDF-Seite 7 beginnt, verwenden Sie page: 6
            { title: 'Einleitung', page: 5 },
            { title: 'Kapitel 1: Erster Kapiteltitel', page: 12 },
            { title: 'Kapitel 2: Zweiter Kapiteltitel', page: 28 },
            { title: 'Kapitel 3: Dritter Kapiteltitel', page: 44 },
            { title: 'Kapitel 4: Vierter Kapiteltitel', page: 60 },
            { title: 'Kapitel 5: Fünfter Kapiteltitel', page: 76 },
            { title: 'Abschluss', page: 92 },
            // Fügen Sie bei Bedarf weitere Kapitel hinzu
        ]
    },
    */
    
    // Add more books below this line using the templates above
};

// ============================================================
// UTILITY FUNCTIONS FOR DEBUGGING AND FINDING CORRECT PAGES
// ============================================================

/**
 * Debug function to find the correct PDF page for a chapter
 * Call this in browser console: findPDFPage('light-after-tunnel', 'Introduction')
 */
function findPDFPage(bookId, searchText) {
    const book = BOOKS_CONFIG[bookId];
    if (!book) {
        console.error('Book not found:', bookId);
        return;
    }
    
    console.log(`Searching for "${searchText}" in ${book.title}`);
    
    pdfjsLib.getDocument(book.pdf).promise.then(function(pdf) {
        console.log(`PDF has ${pdf.numPages} total pages`);
        
        const searchLower = searchText.toLowerCase();
        let found = false;
        
        // Search first 50 pages
        const maxPages = Math.min(50, pdf.numPages);
        
        // Create an array of page promises
        const pagePromises = [];
        for (let i = 0; i < maxPages; i++) {
            pagePromises.push(
                pdf.getPage(i + 1).then(function(page) {
                    return page.getTextContent().then(function(textContent) {
                        const pageText = textContent.items
                            .map(item => item.str)
                            .join(' ')
                            .toLowerCase();
                        
                        if (pageText.includes(searchLower) || 
                            pageText.includes(searchText.toLowerCase())) {
                            console.log(`✓ Found "${searchText}" on PDF Page ${i + 1} (Index: ${i})`);
                            console.log(`First 100 chars: ${pageText.substring(0, 100)}...`);
                            found = true;
                        }
                        
                        // Also check for common patterns
                        if (searchText.includes('Chapter') || searchText.includes('Kapitel')) {
                            const chapterPattern = searchText.toLowerCase().replace('chapter', '').replace('kapitel', '').trim();
                            if (chapterPattern && pageText.includes(chapterPattern)) {
                                console.log(`✓ Found chapter pattern on PDF Page ${i + 1} (Index: ${i})`);
                                found = true;
                            }
                        }
                        
                        page.cleanup();
                    });
                })
            );
        }
        
        Promise.all(pagePromises).then(function() {
            if (!found) {
                console.log(`"${searchText}" not found in first ${maxPages} pages`);
            }
            pdf.destroy();
        });
    }).catch(function(error) {
        console.error('Error loading PDF:', error);
    });
}

/**
 * Quick scan to see all chapter starts in a PDF
 */
function scanBookChapters(bookId) {
    const book = BOOKS_CONFIG[bookId];
    if (!book) return;
    
    console.log(`=== Scanning chapters for: ${book.title} ===`);
    
    pdfjsLib.getDocument(book.pdf).promise.then(function(pdf) {
        console.log(`Total PDF pages: ${pdf.numPages}`);
        
        // Scan first 100 pages
        const maxPages = Math.min(100, pdf.numPages);
        
        for (let i = 0; i < maxPages; i++) {
            pdf.getPage(i + 1).then(function(page) {
                page.getTextContent().then(function(textContent) {
                    const firstLine = textContent.items[0]?.str || '';
                    const first100 = textContent.items.slice(0, 5).map(item => item.str).join(' ');
                    
                    // Check if this looks like a chapter start
                    if (firstLine.includes('Chapter') || 
                        firstLine.includes('CHAPTER') ||
                        firstLine.includes('Kapitel') ||
                        firstLine.includes('KAPITEL') ||
                        firstLine.includes('Introduction') ||
                        firstLine.includes('Einleitung') ||
                        firstLine.includes('Conclusion') ||
                        firstLine.includes('Abschluss') ||
                        firstLine.includes('Preface') ||
                        firstLine.includes('Vorwort')) {
                        
                        console.log(`PDF Page ${i + 1} (Index ${i}): ${firstLine.substring(0, 50)}...`);
                    }
                    
                    page.cleanup();
                });
            });
        }
        
        setTimeout(() => pdf.destroy(), 3000); // Clean up after 3 seconds
    });
}

// ============================================================
// BOOK LIBRARY UTILITY FUNCTIONS
// ============================================================

const BookLibrary = {
    // Initialize the library
    init: function() {
        this.renderBooks();
        this.preloadBookMetadata();
    },
    
    // Render all books to the page
    renderBooks: function() {
        const container = document.getElementById('books-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        Object.values(BOOKS_CONFIG).forEach(book => {
            const bookCard = this.createBookCard(book);
            container.appendChild(bookCard);
        });
    },
    
    // Create HTML for a single book card
    createBookCard: function(book) {
        const card = document.createElement('div');
        card.className = 'library-book-card';
        card.dataset.bookId = book.id;
        
        // Count bookmarks for this book
        const bookmarkCount = this.getBookmarkCount(book.id);
        
        card.innerHTML = `
            <img src="${book.cover}" 
                 alt="${book.title}" 
                 class="book-cover-library"
                 onerror="this.src='https://via.placeholder.com/200x280/2d6a4f/ffffff?text=${encodeURIComponent(book.title)}'">
            ${book.badges.map(badge => `<div class="book-badge">${badge}</div>`).join('')}
            <h3>${book.title}</h3>
            <p class="book-subtitle">${book.subtitle}</p>
            <p class="book-excerpt">${book.description}</p>
            <div class="book-meta">
                <span class="page-count" data-book-id="${book.id}">
                    <i class="fas fa-file-alt"></i> ${book.defaultPages} pages
                </span>
                <span class="bookmark-count" data-book-id="${book.id}">
                    <i class="fas fa-bookmark"></i> ${bookmarkCount} bookmark${bookmarkCount !== 1 ? 's' : ''}
                </span>
            </div>
            <button class="btn btn-primary read-online-btn" onclick="openBookReader('${book.id}')">
                <i class="fas fa-book-reader"></i> Read Online
            </button>
        `;
        
        return card;
    },
    
    // Preload book metadata (page counts)
    preloadBookMetadata: function() {
        Object.values(BOOKS_CONFIG).forEach(book => {
            this.detectPageCount(book.id);
        });
    },
    
    // Detect actual page count from PDF
    detectPageCount: async function(bookId) {
        const book = BOOKS_CONFIG[bookId];
        if (!book) return;
        
        const pageCountElement = document.querySelector(`.page-count[data-book-id="${bookId}"]`);
        if (!pageCountElement) return;
        
        // Show loading state
        pageCountElement.innerHTML = `<i class="fas fa-sync-alt fa-spin"></i> Detecting pages...`;
        
        try {
            const loadingTask = pdfjsLib.getDocument({
                url: book.pdf,
                withCredentials: false
            });
            
            const pdf = await loadingTask.promise;
            const actualPages = pdf.numPages;
            
            // Update display
            pageCountElement.innerHTML = `<i class="fas fa-file-alt"></i> ${actualPages} pages`;
            
            // Store actual pages
            book.actualPages = actualPages;
            
            // Clean up
            pdf.destroy();
            
        } catch (error) {
            // Keep default count on error
            pageCountElement.innerHTML = `<i class="fas fa-file-alt"></i> ${book.defaultPages} pages`;
            console.warn(`Could not detect pages for ${book.title}:`, error);
        }
    },
    
    // Get bookmark count for a book
    getBookmarkCount: function(bookId) {
        try {
            const saved = localStorage.getItem('bookmarks');
            if (!saved) return 0;
            
            const bookmarks = JSON.parse(saved);
            const book = BOOKS_CONFIG[bookId];
            if (!book) return 0;
            
            return bookmarks.filter(b => b.book === book.title).length;
            
        } catch (error) {
            return 0;
        }
    },
    
    // Update bookmark count display
    updateBookmarkCount: function(bookId) {
        const count = this.getBookmarkCount(bookId);
        const element = document.querySelector(`.bookmark-count[data-book-id="${bookId}"]`);
        
        if (element) {
            element.innerHTML = `<i class="fas fa-bookmark"></i> ${count} bookmark${count !== 1 ? 's' : ''}`;
        }
    }
};

// Global function to open book reader
window.openBookReader = function(bookId) {
    if (BookReader && BookReader.open) {
        BookReader.open(bookId);
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BOOKS_CONFIG, BookLibrary };
}