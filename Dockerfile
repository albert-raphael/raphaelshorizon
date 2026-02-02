# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/
COPY package*.json ./

# Install backend dependencies
WORKDIR /app/backend
RUN npm install && ls -la node_modules | head -5

# Install root dependencies
WORKDIR /app
RUN npm install

# Copy source code
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

# Start the application
CMD ["npm", "start"]