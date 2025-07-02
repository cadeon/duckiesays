# Use an official Node.js runtime as a parent image
FROM node:20-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install production dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Generate the SQLite database by running the creation script
# The script needs to be executable
RUN chmod +x /usr/src/app/db/create_db.sh
RUN /usr/src/app/db/create_db.sh

# Set environment for production
ENV NODE_ENV=production

# Expose the port the app runs on in production
EXPOSE 3000

# Define the command to run the app
CMD ["node", "server.js"]
