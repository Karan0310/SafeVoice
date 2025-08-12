const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./reports.db');

console.log('🔍 Checking current database structure...');

// Check what tables exist
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  console.log('\n📋 Tables in database:');
  tables.forEach(table => console.log(`  - ${table.name}`));
  
  // Check reports table structure
  db.all("PRAGMA table_info(reports)", (err, columns) => {
    if (err) {
      console.error('Error checking reports table:', err);
    } else {
      console.log('\n📋 Columns in reports table:');
      columns.forEach(col => {
        console.log(`  - ${col.name} (${col.type})`);
      });
    }
    
    db.close();
  });
});