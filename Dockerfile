FROM node:18-buster-slim

WORKDIR /app

# Install AWS CLI and build tools
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    python3-pip \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install AWS CLI v2
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install && \
    rm -rf awscliv2.zip aws

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Create data directory with proper permissions
RUN mkdir -p /app/data && chmod 777 /app/data

# Copy the start.sh script first and make it executable
COPY start.sh /app/
RUN chmod +x /app/start.sh

# Copy the rest of the application code
COPY . .

# Set environment variables
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

CMD ["/bin/sh", "/app/start.sh"]