# Raphael's Horizon - Complete Christian Literature Platform

A comprehensive web application for managing and distributing Christian literature, books, and inspirational content with admin-only content management.

## 🌟 Features

### ✅ Completed Features
- **Admin-Only Content Management**: Books, audio, and blog posts can only be uploaded/managed by administrators
- **Complete Book Management System**: Full CRUD operations for books with file uploads
- **Embedded Mode**: Works offline with JSON file storage as fallback
- **JWT Authentication**: Secure admin authentication with role-based access
- **File Upload System**: Cloudinary integration for images and PDFs
- **PayPal Integration**: Subscription and purchase payments
- **PWA Support**: Progressive Web App with offline capabilities
- **Responsive Design**: Mobile-first responsive frontend
- **Real-time Features**: Socket.io for live updates
- **Multi-language Support**: English, German, French, Spanish

### 🔧 Technical Stack
- **Backend**: Node.js, Express.js, MongoDB/Mongoose
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Authentication**: JWT, Passport.js (Google OAuth)
- **File Storage**: Cloudinary, Multer
- **Payments**: PayPal API
- **Real-time**: Socket.io
- **Deployment**: Vercel (frontend), Render (backend)

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- MongoDB (optional - embedded mode available)

### Installation

1. **Clone and setup**:
```bash
git clone <repository-url>
cd raphaels-horizon
```

2. **Install dependencies**:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Root
cd ..
```

3. **Environment setup**:
```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
```

4. **Run the application**:
```bash
# Development mode
cd backend
npm run dev

# Production build
npm run build
npm start
```

## 📁 Project Structure

```
raphaels-horizon/
├── backend/                 # Express.js API server
│   ├── config/             # Database, passport config
│   ├── controllers/        # Business logic
│   ├── middleware/         # Auth, error handling
│   ├── models/            # Mongoose schemas
│   ├── routes/            # API endpoints
│   ├── embedded-data/     # JSON fallback data
│   └── server.js          # Main server file
├── frontend/               # Static frontend
│   ├── pages/             # HTML pages
│   ├── js/                # JavaScript modules
│   ├── css/               # Stylesheets
│   └── assets/            # Images, fonts
├── scripts/               # Build/deployment scripts
└── docs/                  # Documentation
```

## 🔐 Admin Access

### Creating Admin User
```bash
cd backend
node scripts/create-admin.js
```

### Admin Dashboard
- Access: `/admin/login.html`
- Features:
  - Book management (upload, edit, delete)
  - Audio content management
  - Blog post management
  - User analytics
  - System statistics

## 📚 API Documentation

### Authentication Endpoints
```
POST /api/auth/login          # Admin login
POST /api/auth/google         # Google OAuth
GET  /api/auth/logout         # Logout
```

### Book Management (Admin Only)
```
GET    /api/admin/books       # List all books
POST   /api/admin/books       # Upload new book
GET    /api/admin/books/:id   # Get book details
PUT    /api/admin/books/:id   # Update book
DELETE /api/admin/books/:id   # Delete book
```

### Public Endpoints
```
GET  /api/books              # List published books
GET  /api/books/:id          # Get book details
GET  /api/blog/posts         # List blog posts
GET  /api/health             # Health check
```

### File Upload
```
POST /api/admin/upload       # Upload files (images, PDFs, audio)
```

## 🔧 Configuration

### Environment Variables
```env
# Server
NODE_ENV=production
PORT=8000

# Security
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback

# File Storage
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Payments
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret

# URLs
FRONTEND_URL=https://yourdomain.com
```

## 🚀 Deployment

### Automated Deployment
```bash
chmod +x deploy-complete.sh
./deploy-complete.sh
```

### Manual Deployment

1. **Backend**:
```bash
cd backend
npm install
npm run build
npm start
```

2. **Frontend**:
```bash
cd frontend
npm install
npm run build
# Copy dist/ to backend/public/
```

### Production Hosting
- **Frontend**: Vercel, Netlify
- **Backend**: Render, Heroku, DigitalOcean
- **Database**: MongoDB Atlas
- **Files**: Cloudinary

## 🧪 Testing

### API Testing
```bash
# Health check
curl http://localhost:8000/api/health

# List books
curl http://localhost:8000/api/books
```

### Admin Testing
1. Create admin user
2. Login at `/admin/login.html`
3. Upload a book
4. Verify it appears in public listing

## 🔍 Troubleshooting

### Common Issues

1. **Server won't start**:
   - Check port 8000 is available
   - Verify .env file exists
   - Check MongoDB connection (or use embedded mode)

2. **File uploads fail**:
   - Verify Cloudinary credentials
   - Check file size limits
   - Ensure upload directories exist

3. **Admin login fails**:
   - Run `node scripts/create-admin.js`
   - Check JWT_SECRET in .env

### Debug Mode
```bash
# Run with debug logging
DEBUG=* npm start

# Check embedded mode
curl http://localhost:8000/api/health
```

## 📈 Performance Optimization

- **Caching**: Redis for session storage
- **CDN**: Cloudinary for file delivery
- **Compression**: Gzip compression enabled
- **Database**: Indexed queries for fast searches
- **PWA**: Service worker for offline access

## 🔒 Security Features

- **Helmet.js**: Security headers
- **Rate Limiting**: API request limits
- **Input Validation**: Sanitized user inputs
- **CORS**: Configured for allowed origins
- **JWT**: Secure token-based auth
- **File Validation**: Type and size restrictions

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built for Christian literature distribution
- Focus on inspirational and spiritual content
- Admin-controlled content management
- Offline-first architecture

---

**Status**: ✅ **PRODUCTION READY**
**Version**: 1.0.0
**Last Updated**: December 2024