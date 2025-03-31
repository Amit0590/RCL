#!/bin/sh

# Create data directory with proper permissions
mkdir -p /app/data
chmod 777 /app/data

# Log startup information
echo "Starting ContentCreationWebsite..."
echo "Environment: $NODE_ENV"

if [ -n "$DYNAMODB_ENDPOINT" ]; then
  echo "Using DynamoDB endpoint: $DYNAMODB_ENDPOINT"
else
  echo "Using AWS Cloud DynamoDB in region: $AWS_REGION"
fi

# Start the server
cd /app
NODE_OPTIONS="--max-old-space-size=256" node ContentCreationWebsite/server.js