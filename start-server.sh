#!/bin/bash

# Start script for ContentCreationWebsite
# Usage: ./start-server.sh [dev|prod]

# Default to development mode if no argument is provided
MODE=${1:-dev}

echo "Starting ContentCreationWebsite in $MODE mode..."

if [ "$MODE" == "dev" ]; then
  # Development mode: Use local DynamoDB
  echo "Using local DynamoDB for development"
  
  # Check if .env exists, create it with dev settings if not
  if [ ! -f ".env" ]; then
    echo "Creating .env file for development..."
    cat > .env << EOF
# Server configuration
PORT=8080
NODE_ENV=development

# AWS Configuration for local DynamoDB
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=local
AWS_SECRET_ACCESS_KEY=local
DYNAMODB_ENDPOINT=http://dynamodb-local:8000

# Session and JWT secrets
SESSION_SECRET=dev-session-secret-key
JWT_SECRET=dev-jwt-secret-key

# Base URL for callbacks
BASE_URL=http://localhost:8080
EOF
  fi
  
  # Start with normal docker-compose (includes local DynamoDB)
  docker-compose down
  docker-compose build
  docker-compose up
  
elif [ "$MODE" == "prod" ]; then
  # Production mode: Use AWS Cloud DynamoDB
  echo "Using AWS Cloud DynamoDB"

  # Check if .env exists with production settings
  if [ ! -f ".env" ] || ! grep -q "NODE_ENV=production" ".env"; then
    echo "Warning: .env file is not configured for production."
    echo "Please make sure to set the following environment variables in your .env file:"
    echo "- NODE_ENV=production"
    echo "- AWS_REGION=<your-aws-region>"
    echo "- AWS_ACCESS_KEY_ID=<your-access-key>"
    echo "- AWS_SECRET_ACCESS_KEY=<your-secret-key>"
    echo ""
    
    # Offer to create from template
    read -p "Would you like to create a production .env file from the template? (y/n): " create_env
    if [[ "$create_env" == "y" || "$create_env" == "Y" ]]; then
      if [ -f ".env.production.template" ]; then
        cp .env.production.template .env
        echo "Created .env file from template. Please edit it with your actual credentials."
        exit 1
      else
        echo "Template file .env.production.template not found."
      fi
    fi
    
    read -p "Continue anyway? (y/n): " confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
      echo "Aborted."
      exit 1
    fi
  fi
  
  # Test AWS credentials
  echo "Testing AWS credentials..."
  node test-aws-connection.js
  
  # Start with production docker-compose file
  docker-compose -f docker-compose.prod.yml down
  docker-compose -f docker-compose.prod.yml build
  docker-compose -f docker-compose.prod.yml up
  
else
  echo "Invalid mode: $MODE"
  echo "Usage: ./start-server.sh [dev|prod]"
  exit 1
fi
