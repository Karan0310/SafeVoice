const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./reports.db');

console.log('🔍 Checking created cases...');

// Check total cases
db.get("SELECT COUNT(*) as total FROM reports", (err, result) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  console.log(`\n📊 Total cases created: ${result.total}`);
  
  // Check cases by department
  db.all("SELECT assigned_department, COUNT(*) as count FROM reports GROUP BY assigned_department", (err, deptResults) => {
    if (err) {
      console.error('Error:', err);
      return;
    }
    
    console.log('\n📋 Cases by department:');
    deptResults.forEach(dept => {
      console.log(`  - ${dept.assigned_department}: ${dept.count} cases`);
    });
    
    // Check case details
    console.log('\n🔍 Sample case details:');
    db.all("SELECT report_id, incident_type, assigned_department, priority, status, assigned_agent FROM reports LIMIT 5", (err, sampleCases) => {
      if (err) {
        console.error('Error:', err);
        return;
      }
      
      sampleCases.forEach(case_ => {
        console.log(`  - ${case_.report_id}: ${case_.incident_type} (${case_.assigned_department}) - ${case_.priority} priority - ${case_.status} - ${case_.assigned_agent}`);
      });
      
      db.close();
    });
  });
});