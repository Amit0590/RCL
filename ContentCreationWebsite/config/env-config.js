/**
 * Environment Configuration
 * 
 * This file centralizes environment-specific settings to support
 * development, testing, and production environments.
 */

// Determine the current environment
const env = process.env.NODE_ENV || 'development';

// Environment-specific configurations
const config = {
  development: {
    env: 'development',
    port: process.env.PORT || 8080,
    baseUrl: process.env.BASE_URL || 'http://localhost:8080',
    database: {
      path: process.env.DB_PATH || 'data/users.db',
      type: 'dynamodb',
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.DYNAMODB_ENDPOINT || 'http://dynamodb-local:8000'
    },
    cookieOptions: {
      secure: false, // In development, cookies don't need to be secure
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret'
  },
  
  testing: {
    env: 'testing',
    port: process.env.PORT || 3001, // Use different port for testing
    baseUrl: 'http://localhost:3001',
    database: {
      type: 'dynamodb',
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.DYNAMODB_ENDPOINT || 'http://dynamodb-local:8000'
    },
    cookieOptions: {
      secure: false,
      maxAge: 24 * 60 * 60 * 1000
    },
    sessionSecret: process.env.SESSION_SECRET || 'test-session-secret'
  },
  
  production: {
    env: 'production',
    port: process.env.PORT || 80,
    baseUrl: process.env.BASE_URL || 'https://your-production-domain.com',
    database: {
      type: 'dynamodb',
      region: process.env.AWS_REGION || 'us-east-1',
      // In production, we use the default AWS endpoints - don't specify endpoint
    },
    cookieOptions: {
      secure: true, // In production, always use secure cookies
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    },
    sessionSecret: process.env.SESSION_SECRET || 'replace-with-strong-secret-in-production'
  }
};

// Export the configuration for the current environment
module.exports = config[env];

// Export the environment name and all configurations for specific use cases
module.exports.env = env;
module.exports.allConfigs = config;