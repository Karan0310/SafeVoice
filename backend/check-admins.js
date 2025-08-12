const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./reports.db');

console.log('🔍 Checking admin accounts...');

db.all("SELECT username, department, role, is_active FROM admins", (err, admins) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  console.log('\n📋 Admin accounts:');
  if (admins.length === 0) {
    console.log('  No admin accounts found!');
  } else {
    admins.forEach(admin => {
      console.log(`  - ${admin.username} (${admin.department}) - ${admin.role} - Active: ${admin.is_active}`);
    });
  }
  
  db.close();
});