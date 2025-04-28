FROM node:16-alpine as development

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Set environment variables
ENV NODE_ENV=development
ENV REACT_APP_API_URL=http://localhost:3001/api

# Expose port
EXPOSE 3000

# Start in development mode
CMD ["npm", "start"]

# Production build
FROM node:16-alpine as build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Build the React application
RUN npm run build

# Production stage
FROM nginx:alpine as production

# Copy custom nginx configuration
COPY ./docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built app from the build stage
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 