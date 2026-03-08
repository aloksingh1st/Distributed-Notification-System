FROM node:20-slim

WORKDIR /app

# Copy package files first (better layer caching)
COPY package.json package-lock.json* ./

RUN npm install

# Copy prisma schema BEFORE generating client
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Now copy the rest of the app
COPY . .

CMD ["node", "index.js"]