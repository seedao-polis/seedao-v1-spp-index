# === Stage 1: Build ===

# Use the official Node.js lts image as the base image
FROM node:lts-alpine as BUILD

# Set the working directory inside the container
WORKDIR /app

# node:lts no longer includes Yarn. This repo uses Yarn 1 (yarn.lock v1).
RUN apk add --no-cache libc6-compat openssl \
 && npm install -g yarn@1.22.22

# Copy the package.json and yarn.lock files to the container
COPY package*.json yarn.lock ./

# Install project dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the application code to the container
COPY . .

# conf.json is gitignored. Keep a real file from the build context when
# present; otherwise use the example so tsc can resolve the import.
# Production should mount the real file over /app/conf.json.
RUN if [ ! -f conf.json ]; then cp conf.json.example conf.json; fi

# Run prisma geneate and build production file
RUN yarn prisma generate && yarn build

# === Stage 2: Run ===

# Use a lightweight Node.js lts image as the base image for the final stage
FROM node:lts-alpine

# Set the working directory inside the container
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl \
 && npm install -g yarn@1.22.22

# Copy the built application files from the previous stage
COPY --from=BUILD /app/dist ./dist
COPY --from=BUILD /app/conf.json ./
COPY --from=BUILD /app/prisma ./prisma
COPY --from=BUILD /app/package*.json ./
COPY --from=BUILD /app/yarn.lock ./

# Install production dependencies
RUN yarn install --production --frozen-lockfile && yarn cache clean

# Expose the port that the NestJS application will listen on
EXPOSE 3000

# Start the NestJS application
CMD ["yarn", "start:prod"]
