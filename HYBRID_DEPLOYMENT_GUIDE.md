# 🚀 Hybrid Deployment Guide: Vercel + DigitalOcean

This guide explains how to deploy Raphael's Horizon with:
- **Vercel**: Frontend (static files)
- **DigitalOcean**: Backend API, Audiobookshelf, and Calibre-Web

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
└─────────────────────────────────────────────────────────────────┘
                    │                       │
                    ▼                       ▼
    ┌───────────────────────┐   ┌───────────────────────────────┐
    │       VERCEL          │   │      DIGITALOCEAN DROPLET     │
    │  (raphaelshorizon.    │   │      (159.223.27.101)         │
    │     vercel.app)       │   │                               │
    ├───────────────────────┤   │  ┌─────────────────────────┐  │
    │  • HTML/CSS/JS        │   │  │        NGINX            │  │
    │  • Static assets      │   │  │    (Reverse Proxy)      │  │
    │  • Images/fonts       │   │  └────────────┬────────────┘  │
    │                       │   │               │               │
    │  Rewrites /api/* ─────┼───┼───►  /api/*   │               │
    │                       │   │       ┌───────┴───────┐       │
    └───────────────────────┘   │       ▼               ▼       │
                                │  ┌─────────┐   ┌───────────┐  │
                                │  │ Backend │   │Audiobook- │  │
                                │  │  API    │   │  shelf    │  │
                                │  │ :5002   │   │   :80     │  │
                                │  └─────────┘   └───────────┘  │
                                │       ▼                       │
                                │  ┌─────────┐                  │
                                │  │Calibre- │                  │
                                │  │  Web    │                  │
                                │  │ :8083   │                  │
                                │  └─────────┘                  │
                                └───────────────────────────────┘
```

---

## Part 1: DigitalOcean Setup

### Step 1: Create a Droplet

1. Go to [DigitalOcean](https://cloud.digitalocean.com/)
2. Create a new Droplet:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic - $6/month (1GB RAM, 25GB SSD) minimum
   - **Region**: Choose closest to your users
   - **Authentication**: SSH Key (recommended) or Password

3. Note your Droplet's **IP address**

### Step 2: Configure DNS (Optional but Recommended)

Point a subdomain to your Droplet:
- `api.raphaelshorizon.com` → Your Droplet IP

### Step 3: Connect to Your Droplet

```bash
ssh root@YOUR_DROPLET_IP
```

### Step 4: Run Setup Script

```bash
# Download and run setup script
curl -fsSL https://raw.githubusercontent.com/albert-raphael/raphaelshorizon/main/scripts/digitalocean-setup.sh | bash
```

Or manually:
```bash
apt-get update && apt-get upgrade -y
apt-get install -y docker.io docker-compose git ufw

# Enable firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Enable Docker
systemctl enable docker
systemctl start docker
```

### Step 5: Clone Repository

```bash
cd /opt
git clone https://github.com/albert-raphael/raphaelshorizon.git
cd raphaelshorizon
```

### Step 6: Configure Environment

```bash
# Copy environment file
cp .env.production .env

# Edit with your values
nano .env
```

Update these values in `.env`:
```env
# Update domain
FRONTEND_URL=https://raphaelshorizon.vercel.app
BACKEND_URL=https://api.raphaelshorizon.com

# Update Google OAuth (add your droplet domain to authorized origins)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### Step 7: Set Up SSL Certificates

```bash
# Option A: With domain (recommended)
./scripts/setup-ssl.sh api.raphaelshorizon.com admin@raphaelshorizon.com

# Option B: Self-signed (for testing)
mkdir -p ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/privkey.pem \
    -out ssl/fullchain.pem \
    -subj "/CN=api.raphaelshorizon.com"
```

### Step 8: Deploy Services

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d --build

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Step 9: Upload Your Books & Audiobooks

```bash
# Create directories
mkdir -p audiobooks books

# Upload files via SCP from your local machine
scp -r /path/to/your/audiobooks/* root@YOUR_DROPLET_IP:/opt/raphaelshorizon/audiobooks/
scp -r /path/to/your/books/* root@YOUR_DROPLET_IP:/opt/raphaelshorizon/books/
```

### Step 10: Configure Audiobookshelf & Calibre-Web

1. **Audiobookshelf**: Visit `https://api.raphaelshorizon.com/audiobookshelf/`
   - Create admin account on first visit
   - Add library pointing to `/audiobooks`

2. **Calibre-Web**: Visit `https://api.raphaelshorizon.com/calibre/`
   - Default login: admin / admin123
   - Configure library path to `/books`

---

## Part 2: Vercel Deployment

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Deploy Frontend

```bash
cd frontend
vercel login
vercel --prod
```

### Step 3: Configure Custom Domain (Optional)

1. In Vercel Dashboard, go to your project
2. Settings → Domains
3. Add `raphaelshorizon.com`
4. Follow DNS instructions

### Step 4: Update Google OAuth

In [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

1. Add these to **Authorized JavaScript Origins**:
   - `https://raphaelshorizon.vercel.app`
   - `https://raphaelshorizon.com` (if using custom domain)

2. Add these to **Authorized Redirect URIs**:
   - `https://api.raphaelshorizon.com/api/auth/google/callback`

---

## Part 3: Configuration Updates

### Update config.js with Your Domain

Edit `frontend/js/config.js`:

```javascript
const ENV_CONFIG = {
    production: {
        API_BASE_URL: 'https://api.raphaelshorizon.com',  // Your DigitalOcean domain
        AUDIOBOOKSHELF_URL: 'https://api.raphaelshorizon.com/audiobookshelf/',
        CALIBRE_URL: 'https://api.raphaelshorizon.com/calibre/',
        ASSETS_URL: ''
    }
};
```

### Update vercel.json with Your API Domain

Edit `frontend/vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.raphaelshorizon.com/api/:path*"
    }
  ]
}
```

---

## Verification Checklist

After deployment, verify:

- [ ] Frontend loads: `https://raphaelshorizon.vercel.app`
- [ ] API health: `https://api.raphaelshorizon.com/api/health`
- [ ] Audiobookshelf: `https://api.raphaelshorizon.com/audiobookshelf/`
- [ ] Calibre-Web: `https://api.raphaelshorizon.com/calibre/`
- [ ] Google Login works
- [ ] Audio books play in iframe
- [ ] E-books load in iframe

---

## Troubleshooting

### CORS Errors
If you see CORS errors, check that your DigitalOcean domain is properly configured in `nginx.prod.conf` CORS settings.

### Iframe Not Loading
Check browser console for errors. Common issues:
- X-Frame-Options blocking embedding
- Mixed content (HTTP/HTTPS mismatch)

### SSL Certificate Issues
```bash
# Check certificate status
certbot certificates

# Force renewal
certbot renew --force-renewal
```

### Container Issues
```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f nginx

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

---

## Cost Summary

| Service | Monthly Cost |
|---------|--------------|
| Vercel (Free tier) | $0 |
| DigitalOcean Droplet | $6+ |
| Domain (optional) | ~$12/year |
| **Total** | **~$6-10/month** |

---

## Updating the Deployment

### Update Frontend (Vercel)
```bash
cd frontend
vercel --prod
```

### Update Backend (DigitalOcean)
```bash
ssh root@YOUR_DROPLET_IP
cd /opt/raphaelshorizon
./scripts/deploy-digitalocean.sh
```
