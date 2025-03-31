/**
 * Database initialization script
 * Ensures SQLite database file exists and has proper permissions
 */

const fs = require('fs');
const path = require('path');
const config = require('../config/env-config');

// Get database path from config
const dbPath = path.resolve(process.env.DB_PATH || config.database.path);
const dbDir = path.dirname(dbPath);

// Ensure the directory exists
if (!fs.existsSync(dbDir)) {
  console.log(`Creating database directory: ${dbDir}`);
  fs.mkdirSync(dbDir, { recursive: true });
}

// Ensure the database file exists
if (!fs.existsSync(dbPath)) {
  console.log(`Creating empty database file: ${dbPath}`);
  fs.writeFileSync(dbPath, '');
}

// Set permissions
try {
  fs.chmodSync(dbDir, 0o777);
  fs.chmodSync(dbPath, 0o666);
} catch (err) {
  console.warn(`Could not set permissions: ${err.message}`);
}

// Log database info
console.log(`Using database at path: ${dbPath}`);
console.log(`Database directory exists: ${fs.existsSync(dbDir)}`);
console.log(`Database file exists: ${fs.existsSync(dbPath)}`);

// Don't try to connect to the database here - let the main app do that
// Just export the path for use
module.exports = dbPath;
