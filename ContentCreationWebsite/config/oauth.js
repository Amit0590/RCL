// filepath: /workspaces/ContentCreationWebsite/ContentCreationWebsite/config/oauth.js
// OAuth Configuration with environment support
const config = require('./env-config');

// Use environment variables for external client credentials
const facebookClientID = process.env.FACEBOOK_CLIENT_ID || 'default-facebook-id';
const facebookClientSecret = process.env.FACEBOOK_CLIENT_SECRET || 'default-facebook-secret';

const googleClientID = process.env.GOOGLE_CLIENT_ID || 'default-google-id';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || 'default-google-secret';

module.exports = {
    google: {
        clientID: googleClientID,
        clientSecret: googleClientSecret,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || `${config.baseUrl}/auth/google/callback`
    },
    facebook: {
        clientID: facebookClientID,
        clientSecret: facebookClientSecret,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL || `${config.baseUrl}/auth/facebook/callback`
    },
    twitter: {
        consumerKey: process.env.TWITTER_API_KEY || 'your-twitter-api-key',
        consumerSecret: process.env.TWITTER_API_SECRET || 'your-twitter-api-secret',
        callbackURL: `${config.baseUrl}/auth/twitter/callback`
    }
};

/**
 * Instructions for setting up OAuth credentials:
 * 
 * 1. Google:
 *    - Go to https://console.developers.google.com/
 *    - Create a new project
 *    - Go to "Credentials" and create OAuth 2.0 Client ID
 *    - Set authorized redirect URIs for each environment:
 *      - Development: http://localhost:3000/auth/google/callback
 *      - Testing: http://localhost:3001/auth/google/callback
 *      - Production: https://your-production-domain.com/auth/google/callback
 *    - Copy Client ID and Client Secret
 * 
 * 2. Facebook:
 *    - Go to https://developers.facebook.com/
 *    - Create a new app
 *    - Set up Facebook Login product
 *    - Add OAuth redirect URIs for each environment
 *    - Copy App ID and App Secret
 * 
 * 3. Twitter:
 *    - Go to https://developer.twitter.com/en/apps
 *    - Create a new app
 *    - Enable 3-legged OAuth
 *    - Add callback URLs for each environment
 *    - Copy API Key and API Secret
 * 
 * Note: 
 * - For development: use http://localhost:3000/auth/[provider]/callback
 * - For testing: use http://localhost:3001/auth/[provider]/callback
 * - For production: use https://your-production-domain.com/auth/[provider]/callback
 * - You can set environment variables instead of hardcoding credentials
 */