FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy prisma directory first for schema and migrations
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN npm run build

# Add a script to run migrations and start the application
RUN echo '#!/bin/sh\n\
npm run migrate:deploy\n\
npm start' > /app/docker-entrypoint.sh \
&& chmod +x /app/docker-entrypoint.sh

# Expose the port the app runs on
EXPOSE 3001

# Use the entry point script
ENTRYPOINT ["/app/docker-entrypoint.sh"] 