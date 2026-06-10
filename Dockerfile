# Stage 1: Build React Application
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Add build argument for API Base URL
ARG VITE_API_BASE
ENV VITE_API_BASE=$VITE_API_BASE

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy other source files
COPY . .

# Build Vite application
RUN npm run build

# Stage 2: Serve using Nginx
FROM nginx:alpine

# Copy built files from build stage to Nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 3000
EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
