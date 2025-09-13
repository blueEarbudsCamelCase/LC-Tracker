# Build frontend
FROM node:20 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Build backend
FROM node:20 AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./

# Copy frontend build into /app/build (not ./build)
COPY --from=frontend-build /app/frontend/build /app/build

# Expose port and start backend
EXPOSE 4000
CMD ["npm", "run", "start:prod"]