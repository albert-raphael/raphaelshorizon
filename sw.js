// General Service Worker for Raphael's Horizon
const CACHE_NAME = 'raphaels-horizon-v1.0.0';
const STATIC_CACHE = 'raphaels-horizon-static-v1.0.0';
const DYNAMIC_CACHE = 'raphaels-horizon-dynamic-v1.0.0';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/404.html',
  '/css/styles.css',
  '/css/auth.css',
  '/js/scripts.js',
  '/js/auth.js',
  '/js/cookies.js',
  '/assets/icons/logo-square.png',
  '/assets/icons/favicon.ico',
  '/pages/about/about-us.html',
  '/pages/contact/contact-us.html',
  '/pages/profile/index.html',
  '/pages/books/books.html',
  '/pages/books/audio-books/audio-books.html',
  '/pages/books/audio-books/audio-books.css',
  '/pages/books/audio-books/audio-config.js',
  '/pages/books/audio-books/audio-player.js',
  '/pages/books/audio-books/audio-security.js',
  '/pages/books/audio-books/audio-library.js',
  '/pages/books/books-reader/books-online.html',
  '/pages/books/books-reader/book-reader.css',
  '/pages/books/books-reader/books-online.css',
  '/pages/books/books-reader/books-config.js',
  '/pages/books/books-reader/book-reader.js',
  '/pages/books/books-reader/books-online.js',
  '/pages/books/books-reader/books-utils.js',
  '/pages/blog/index.html'
];

// External resources that should be cached
const EXTERNAL_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(DYNAMIC_CACHE).then(cache => {
        console.log('[SW] Caching external assets');
        return cache.addAll(EXTERNAL_ASSETS);
      })
    ]).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache when possible
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle different types of requests
  if (url.origin === location.origin) {
    // Same-origin requests
    if (request.destination === 'document') {
      // HTML pages - Network first, fallback to cache
      event.respondWith(
        fetch(request)
          .then(response => {
            // Cache successful responses
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE).then(cache => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            return caches.match(request).then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Fallback to offline page
              return caches.match('/404.html');
            });
          })
      );
    } else {
      // Other resources - Cache first, fallback to network
      event.respondWith(
        caches.match(request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then(response => {
            // Cache successful responses
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE).then(cache => {
                cache.put(request, responseClone);
              });
            }
            return response;
          });
        })
      );
    }
  } else {
    // External requests (CDNs, etc.)
    if (EXTERNAL_ASSETS.includes(request.url)) {
      // Cache external assets
      event.respondWith(
        caches.match(request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then(response => {
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE).then(cache => {
                cache.put(request, responseClone);
              });
            }
            return response;
          });
        })
      );
    } else {
      // For other external requests, just fetch normally
      event.respondWith(fetch(request));
    }
  }
});

// Handle messages from the main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});