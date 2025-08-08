FROM node:20-alpine AS base

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

FROM base AS development
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
# Copy and set permissions for entrypoint script
COPY --chmod=755 entrypoint.sh /app/entrypoint.sh
EXPOSE 8787
ENTRYPOINT ["sh", "/app/entrypoint.sh"]
CMD ["npm", "run", "dev"]

FROM base AS production
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 8787
CMD ["npm", "start"]