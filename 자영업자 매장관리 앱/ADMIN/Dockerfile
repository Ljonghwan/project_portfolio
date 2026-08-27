FROM --platform=linux/amd64 node:23.1.0-alpine

# Update Alpine packages to fix security vulnerabilities
RUN apk update && apk upgrade --no-cache

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production=false --legacy-peer-deps

# Copy source code
COPY . .

# 빌드 인자로 환경 받기
ARG BUILD_MODE
ENV VITE_BUILD_MODE=${BUILD_MODE}

# Build the React app
RUN echo "Building with BUILD_MODE=$BUILD_MODE" && \
    npm run build

# Install serve globally
RUN npm install -g serve

# Expose port 3001
EXPOSE 3001

# Serve the build directory
CMD ["serve", "-s", "build", "-l", "3001"]
