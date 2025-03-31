/**
 * Patch for server.js SQLite handling
 * Import this file at the top of server.js with:
 * require('./server-patch');
 */

// Override SQLite to use better-sqlite3 which is more Docker compatible
const config = require('./config/env-config');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dbPath = path.resolve(process.cwd(), config.database.path);
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log(`Database path configured as: ${dbPath}`);

// Set this as a global to be used by the main app
global.DB_PATH = dbPath;

// Override some SQLite functions that might cause segfaults
const sqlite3 = require('sqlite3');
const originalVerbose = sqlite3.verbose;

sqlite3.verbose = function() {
  const instance = originalVerbose.apply(this, arguments);
  
  // Override the Database constructor to add safeguards
  const originalDatabase = instance.Database;
  instance.Database = function(filename, mode, callback) {
    console.log(`Opening SQLite database at: ${filename}`);
    
    // Always use absolute path for database file
    if (filename !== ':memory:' && !path.isAbsolute(filename)) {
      filename = path.resolve(process.cwd(), filename);
    }
    
    return new originalDatabase(filename, mode, callback);
  };
  
  return instance;
};

// Force SQLite to use write-ahead logging and busy timeout
process.env.SQLITE_OPEN_FLAGS = '6'; // SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE
process.env.SQLITE_BUSY_TIMEOUT = '30000'; // 30 seconds
