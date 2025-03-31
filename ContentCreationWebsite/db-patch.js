/**
 * SQLite patch script to fix Docker compatibility issues
 * 
 * Usage: Add `require('./db-patch')` at the top of your server.js file
 */

// Override process to catch segfault
process.on('uncaughtException', (err) => {
  console.error('CRITICAL ERROR:', err);
  // Don't exit - try to keep server running
});

// Override require to intercept sqlite3 imports and add safeguards
const originalRequire = module.constructor.prototype.require;
module.constructor.prototype.require = function(path) {
  if (path === 'sqlite3') {
    console.log('Patching sqlite3 module for Docker compatibility');
    const sqlite3 = originalRequire.call(this, path);
    
    // Patch the Database constructor
    const originalDatabase = sqlite3.Database;
    sqlite3.Database = function(filename, mode, callback) {
      // Ensure we're using the correct path from our config
      const config = require('./config/env-config');
      const fs = require('fs');
      const nodePath = require('path');
      
      // Always use the data directory
      if (filename !== ':memory:' && !filename.startsWith('/') && !nodePath.isAbsolute(filename)) {
        const dataPath = nodePath.resolve(process.cwd(), 'data', filename);
        console.log(`Redirecting SQLite path from ${filename} to ${dataPath}`);
        filename = dataPath;
        
        // Ensure the directory exists
        const dbDir = nodePath.dirname(dataPath);
        if (!fs.existsSync(dbDir)) {
          fs.mkdirSync(dbDir, { recursive: true });
        }
      }
      
      return new originalDatabase(filename, mode, callback);
    };
    
    return sqlite3;
  }
  return originalRequire.call(this, path);
};

console.log('SQLite patch applied for Docker compatibility');
