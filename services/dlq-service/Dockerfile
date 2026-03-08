# ---------- Base Image ----------
FROM node:20-alpine

# ---------- App Directory ----------
WORKDIR /app

# ---------- Install Dependencies ----------
COPY package*.json ./
RUN npm install

# ---------- Copy Source ----------
COPY . .

# ---------- Expose Port ----------
EXPOSE 3008

# ---------- Start App ----------
CMD ["sh", "-c", "npx prisma db pull && npx prisma generate && npm run dev"]