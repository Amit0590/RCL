const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database
const db = new sqlite3.Database(path.join(__dirname, '../users.db'));

// Add columns for OAuth providers if they don't exist
db.serialize(() => {
  // Check if provider column exists
  db.all("PRAGMA table_info(users)", (err, rows) => {
    if (err) {
      console.error('Error checking table schema:', err);
      return;
    }
    
    // Check if columns already exist
    let hasProvider = false;
    let hasProviderId = false;
    
    rows.forEach(row => {
      if (row.name === 'provider') hasProvider = true;
      if (row.name === 'provider_id') hasProviderId = true;
    });
    
    // Add columns if they don't exist
    if (!hasProvider) {
      db.run("ALTER TABLE users ADD COLUMN provider TEXT DEFAULT 'local'", err => {
        if (err) console.error('Error adding provider column:', err);
        else console.log('Added provider column to users table');
      });
    }
    
    if (!hasProviderId) {
      db.run("ALTER TABLE users ADD COLUMN provider_id TEXT", err => {
        if (err) console.error('Error adding provider_id column:', err);
        else console.log('Added provider_id column to users table');
      });
    }
  });
});

console.log('Database schema update script executed');

// Close the database connection when done
setTimeout(() => {
  db.close();
  console.log('Database connection closed');
}, 1000);