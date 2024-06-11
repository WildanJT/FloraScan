# Parent image
FROM node:20.13.1

# Set environtment variables
ENV PORT=3000

ENV PROJECT_ID=florascan-425212

ENV MODEL_URL=https://storage.googleapis.com/florascan-model-bucket/tfjs-model/model.json

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image
COPY package*.json ./

# Install production dependencies
RUN npm install

# Copy local code to the container image
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Run the web service on container startup
CMD ["npm", "run", "start"]