# Use an official Node.js runtime as a parent image
FROM node:20-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Copy the rest of the application code
COPY . .

# Install all dependencies
RUN npm install

# Install sqlite3
RUN apt-get update && apt-get install -y sqlite3

# Rebuild native modules to ensure they are compatible with the container's environment
RUN npm rebuild

# Generate the SQLite database by running the creation script
# The script needs to be executable
RUN chmod +x /usr/src/app/db/create_db.sh
RUN /usr/src/app/db/create_db.sh

# Expose the port the app runs on
EXPOSE 7007

# Define the command to run the app
CMD ["npm", "start"]
