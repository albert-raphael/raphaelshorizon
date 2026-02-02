# ⚠️ PRIVATE PROPERTY - ALL RIGHTS RESERVED ⚠️

## 🚫 LEGAL NOTICE

**This project is PRIVATE PROPERTY and is NOT for public use.**

**Copyright © 2024 Raphael's Horizon. All rights reserved.**

**Unauthorized copying, distribution, modification, or use of this project is strictly prohibited.**

**Legal action will be taken against anyone who illegally copies, distributes, or uses this project without explicit written authorization from the copyright holder.**

---

# Raphael's Horizon

Unveiling God's Promises through Boundless Possibilities. This is the official website for Raphael's Horizon ministry.

## Project Structure

- `frontend/`: Static website files (HTML, CSS, JS)
- `backend/`: Node.js/Express API server
- `public/`: Distribution folder

## Local Development

1. **Frontend**:
   Simply open `frontend/index.html` in your browser or serve it using a static file server.
   ```bash
   cd frontend
   npx serve
   ```

2. **Backend**:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Update .env with your credentials
   npm start
   ```

## Deployment

This project is configured for deployment on Vercel.

1. Install Vercel CLI: `npm i -g vercel`
2. Run the deployment script:
   ```bash
   ./deploy.bat
   ```

## Features

- **PWA Support**: Installable on mobile and desktop.
- **Blog**: Integrated blog with categories.
- **Books**: Online reader and audio player.
- **Authentication**: Google Sign-In and Email/Password.