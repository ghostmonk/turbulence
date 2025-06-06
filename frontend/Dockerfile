# Stage 1: Build
FROM node:20 AS build
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package.json package-lock.json ./

RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Stage 2: Production
FROM node:20 AS production
WORKDIR /app

# Copy only the necessary files from the build stage
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/src ./src
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/next.config.ts ./next.config.ts
COPY --from=build /app/postcss.config.js ./postcss.config.js
COPY --from=build /app/tailwind.config.ts ./tailwind.config.ts

# Use environment variable for port, default to 8080 for Cloud Run
ENV PORT=8080

EXPOSE ${PORT}

# Start the Next.js server
CMD ["sh", "-c", "npm start -- -p ${PORT}"]
