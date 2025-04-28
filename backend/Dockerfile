FROM node:20-alpine as development

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy prisma directory for schema and migrations
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

# Create a startup script that sets up the database and starts the app
RUN echo '#!/bin/sh\n\
echo "Setting up the database..."\n\
npm run setup\n\
echo "Starting application..."\n\
npm run dev' > ./docker-entrypoint.sh \
&& chmod +x ./docker-entrypoint.sh

# Expose the port the app runs on
EXPOSE 3001

# Start with the custom entry point
ENTRYPOINT ["./docker-entrypoint.sh"]

# Production build
FROM node:20-alpine as production

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install production dependencies only
RUN npm install --production

# Copy prisma directory for schema and migrations
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

# Build TypeScript
RUN npm run build

# Add a script to run setup and start the application
RUN echo '#!/bin/sh\n\
echo "Setting up the database..."\n\
npm run setup\n\
echo "Starting application..."\n\
npm start' > /app/docker-entrypoint.sh \
&& chmod +x /app/docker-entrypoint.sh

# Expose the port the app runs on
EXPOSE 3001

# Use the entry point script
ENTRYPOINT ["/app/docker-entrypoint.sh"] 