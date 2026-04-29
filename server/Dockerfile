# Use Node.js as the base image
FROM node:20-bullseye

# Install Python 3, pip, and FFmpeg
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Copy Python requirements
COPY requirements.txt ./

# Install Python dependencies (system-wide since we are in Docker)
RUN pip3 install -r requirements.txt

# Copy app source code, excluding .env
COPY . .
# Ensure .env is invalid/not copied if we want to force env vars usage, 
# but copying it is fine as a fallback if the user wants to mount it.
# Usually standard procedure is COPY . . and .dockerignore handles .env

# Create directories for clips
RUN mkdir -p public/clips temp/downloads

# Expose port
EXPOSE 3000

# Set environment variables
ENV PORT=3000
ENV PYTHON_PATH=python3

# Start the server
CMD ["node", "server.js"]
