FROM --platform=linux/amd64 node:23.1.0-alpine

# Update Alpine packages to fix security vulnerabilities
RUN apk update && apk upgrade --no-cache

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production=false

# Copy source code
COPY . .

# pm2 설치
RUN npm install -g pm2

# Expose port 3000
EXPOSE 3000

# Serve the build directory
# CMD ["serve", "-s", "build", "-l", "3000"]
CMD ["npm", "run", "pm2:live"]
