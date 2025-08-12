const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('./reports.db');

console.log('🔧 Creating admin accounts...');

const adminAccounts = [
  {
    username: 'super_admin',
    email: 'super.admin@safevoice.gov',
    password: 'SafeVoice2024!',
    department: 'all',
    role: 'super_admin'
  },
  {
    username: 'legal_admin',
    email: 'legal.admin@safevoice.gov',
    password: 'SafeVoice2024!',
    department: 'legal',
    role: 'department_admin'
  },
  {
    username: 'task_admin',
    email: 'task.admin@safevoice.gov',
    password: 'SafeVoice2024!',
    department: 'task',
    role: 'department_admin'
  },
  {
    username: 'support_admin',
    email: 'support.admin@safevoice.gov',
    password: 'SafeVoice2024!',
    department: 'support',
    role: 'department_admin'
  },
  {
    username: 'happy2help_admin',
    email: 'happy2help.admin@safevoice.gov',
    password: 'SafeVoice2024!',
    department: 'happy2help',
    role: 'department_admin'
  }
];

async function createAdminAccounts() {
  for (const account of adminAccounts) {
    try {
      const passwordHash = await bcrypt.hash(account.password, 12);
      
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO admins (username, email, password_hash, department, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
          [account.username, account.email, passwordHash, account.department, account.role, 1],
          function(err) {
            if (err) {
              if (err.message.includes('UNIQUE constraint failed')) {
                console.log(`  ⚠️  Admin account ${account.username} already exists`);
              } else {
                console.error(`  ❌ Error creating ${account.username}:`, err.message);
              }
            } else {
              console.log(`  ✅ Created admin account: ${account.username} (${account.department})`);
            }
            resolve();
          }
        );
      });
    } catch (error) {
      console.error(`  ❌ Error hashing password for ${account.username}:`, error.message);
    }
  }
  
  console.log('\n🔍 Verifying admin accounts...');
  
  db.all("SELECT username, department, role, is_active FROM admins", (err, admins) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log('\n📋 Current admin accounts:');
      admins.forEach(admin => {
        console.log(`  - ${admin.username} (${admin.department}) - ${admin.role} - Active: ${admin.is_active}`);
      });
    }
    
    db.close();
  });
}

createAdminAccounts().catch(err => {
  console.error('❌ Error creating admin accounts:', err);
  process.exit(1);
});