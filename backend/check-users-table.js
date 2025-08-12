const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./reports.db');

console.log('🔍 Checking users table structure...');

db.all("PRAGMA table_info(users)", (err, columns) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  console.log('\n📋 Users table columns:');
  columns.forEach(col => {
    console.log(`  - ${col.name} (${col.type})`);
  });
  
  db.close();
});