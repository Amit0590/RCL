/**
 * Secret Generator for Production Environment
 * 
 * This script generates secure random values for SESSION_SECRET and JWT_SECRET
 * to be used in your production environment.
 * 
 * Usage: node generate-secrets.js
 */

const crypto = require('crypto');

// Generate a secure random string of specified length
function generateSecureSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

// Generate secrets
const sessionSecret = generateSecureSecret();
const jwtSecret = generateSecureSecret();

console.log('Generated secure secrets for production environment:\n');
console.log(`SESSION_SECRET=${sessionSecret}`);
console.log(`JWT_SECRET=${jwtSecret}`);
console.log('\nMake sure to add these values to your production .env file.');
console.log('Do not share or commit these secrets to version control!');