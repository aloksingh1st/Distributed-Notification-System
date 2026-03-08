FROM node:20-alpine

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy package files & install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the app code
COPY . .

# Create logs folder with correct ownership
RUN mkdir -p /app/logs && chown -R appuser:appgroup /app/logs

RUN npm install --save-dev nodemon
# Switch to non-root user
USER appuser

# Start with nodemon for hot reload
CMD ["npx", "nodemon", "--legacy-watch", "index.js"]