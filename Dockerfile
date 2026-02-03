# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies (curl for healthcheck, openssl for SSL)
RUN apk add --no-cache curl openssl

# Copy package files
COPY backend/package*.json ./backend/
COPY package*.json ./

# Install backend dependencies FIRST
RUN cd backend && npm install

# Install root dependencies
RUN npm install

# Copy source code (excluding node_modules via .dockerignore)
COPY . .

# Build frontend
RUN npm run build:frontend

# Create uploads directory
RUN mkdir -p backend/uploads

# Set the PORT for Docker
ENV PORT=5002

# Expose port
EXPOSE 5002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5002/api/health || exit 1

# Start the application directly with node (saves RAM)
CMD ["node", "--max-old-space-size=256", "backend/server.js"]
