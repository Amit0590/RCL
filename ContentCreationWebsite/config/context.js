/**
 * Application Context Configuration
 * 
 * This file manages application-wide context and settings,
 * providing a centralized way to handle environment-specific configurations
 * and application state.
 */

const envConfig = require('./env-config');

// Application context configuration
const context = {
  // Environment information
  environment: {
    name: envConfig.env,
    isDevelopment: envConfig.env === 'development',
    isProduction: envConfig.env === 'production',
    isTesting: envConfig.env === 'testing'
  },

  // Server configuration
  server: {
    port: envConfig.port,
    baseUrl: envConfig.baseUrl
  },

  // Database configuration
  database: {
    type: envConfig.database.type,
    region: envConfig.database.region,
    endpoint: envConfig.database.endpoint
  },

  // Security settings
  security: {
    cookieOptions: envConfig.cookieOptions,
    sessionSecret: envConfig.sessionSecret
  },

  // Feature flags
  features: {
    enableOAuth: true,
    enableLocalAuth: true,
    enablePasswordReset: true
  },

  // API versioning
  api: {
    version: 'v1',
    prefix: '/api/v1'
  },

  // Content settings
  content: {
    maxUploadSize: '10mb',
    allowedFileTypes: ['doc', 'docx', 'pdf', 'txt', 'md'],
    maxSubmissionsPerProject: 10
  }
};

module.exports = context;