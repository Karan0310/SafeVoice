const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🔧 Creating SafeVoice database...');

// Create database file
const dbPath = './reports.db';
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error creating database:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Database file created at:', path.resolve(dbPath));
  }
});

// Create all the tables (copied from your server.js initializeDatabase function)
function createTables() {
  const createTablesSQL = `
    -- Admin tables
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      department TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      is_active BOOLEAN DEFAULT 1,
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES admins (id)
    );

    -- User tables
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      anonymous_id TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
      ip_hash TEXT
    );

    -- Reports table with AI columns
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id TEXT UNIQUE NOT NULL,
      user_id INTEGER,
      incident_type TEXT NOT NULL,
      incident_date DATE NOT NULL,
      incident_time TEXT,
      location TEXT,
      description TEXT NOT NULL,
      current_safety TEXT NOT NULL,
      witnesses TEXT,
      evidence TEXT,
      contact_method TEXT,
      contact_info TEXT,
      anonymous BOOLEAN DEFAULT 0,
      detected_location TEXT,
      ai_sentiment TEXT,
      ai_risk_level TEXT,
      ai_category_suggestion TEXT,
      assigned_department TEXT,
      assignment_confidence INTEGER,
      assignment_reasoning TEXT,
      status TEXT DEFAULT 'submitted',
      priority TEXT DEFAULT 'medium',
      assigned_agent TEXT,
      case_notes TEXT,
      
      -- New AI columns
      ai_analysis_complete BOOLEAN DEFAULT 0,
      risk_factors TEXT,
      recommended_actions TEXT,
      ai_model_version TEXT DEFAULT 'claude-3-5-sonnet-20241022',
      ai_processing_time INTEGER,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    -- Other tables
    CREATE TABLE IF NOT EXISTS case_updates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id TEXT NOT NULL,
      admin_id INTEGER,
      update_type TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports (report_id),
      FOREIGN KEY (admin_id) REFERENCES admins (id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id TEXT,
      sender_type TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      sender_department TEXT,
      message TEXT NOT NULL,
      encrypted BOOLEAN DEFAULT 1,
      read_by_user BOOLEAN DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports (report_id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id TEXT,
      session_type TEXT NOT NULL,
      date DATE NOT NULL,
      time TEXT NOT NULL,
      counselor TEXT,
      department TEXT,
      status TEXT DEFAULT 'scheduled',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports (report_id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      admin_id INTEGER,
      report_id TEXT,
      ip_hash TEXT,
      details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES admins (id)
    );

    CREATE TABLE IF NOT EXISTS department_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      department TEXT NOT NULL,
      date DATE NOT NULL,
      total_cases INTEGER DEFAULT 0,
      new_cases INTEGER DEFAULT 0,
      resolved_cases INTEGER DEFAULT 0,
      avg_response_time REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- New AI tables
    CREATE TABLE IF NOT EXISTS ai_analysis_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id TEXT NOT NULL,
      analysis_type TEXT NOT NULL,
      input_data TEXT NOT NULL,
      output_data TEXT NOT NULL,
      model_version TEXT NOT NULL,
      processing_time INTEGER,
      confidence_score REAL,
      success BOOLEAN DEFAULT 1,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports (report_id)
    );

    CREATE TABLE IF NOT EXISTS ai_insights_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      insight_type TEXT NOT NULL,
      data TEXT NOT NULL,
      valid_until DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Split the SQL and execute each statement
  const statements = createTablesSQL.split(';').filter(stmt => stmt.trim());
  
  let completed = 0;
  const total = statements.length;

  statements.forEach((statement, index) => {
    if (statement.trim()) {
      db.run(statement.trim(), (err) => {
        if (err) {
          console.error(`❌ Error creating table ${index + 1}:`, err.message);
        } else {
          completed++;
          console.log(`✅ Table ${completed}/${total} created`);
          
          if (completed === total) {
            createIndexes();
          }
        }
      });
    }
  });
}

function createIndexes() {
  console.log('📊 Creating database indexes...');
  
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_ai_analysis_logs_report_id ON ai_analysis_logs (report_id)',
    'CREATE INDEX IF NOT EXISTS idx_ai_analysis_logs_type ON ai_analysis_logs (analysis_type)',
    'CREATE INDEX IF NOT EXISTS idx_reports_ai_complete ON reports (ai_analysis_complete)',
    'CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights_cache (insight_type)',
    'CREATE INDEX IF NOT EXISTS idx_ai_insights_valid ON ai_insights_cache (valid_until)',
    'CREATE INDEX IF NOT EXISTS idx_reports_department ON reports (assigned_department)',
    'CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status)',
    'CREATE INDEX IF NOT EXISTS idx_reports_created ON reports (created_at)'
  ];

  let indexCompleted = 0;
  
  indexes.forEach((indexSQL, i) => {
    db.run(indexSQL, (err) => {
      if (err) {
        console.error(`❌ Error creating index ${i + 1}:`, err.message);
      } else {
        indexCompleted++;
        console.log(`✅ Index ${indexCompleted}/${indexes.length} created`);
        
        if (indexCompleted === indexes.length) {
          console.log('🎉 Database setup completed successfully!');
          console.log('📍 Database location:', path.resolve(dbPath));
          
          // Verify tables were created
          db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
            if (err) {
              console.error('Error checking tables:', err);
            } else {
              console.log('\n📋 Created tables:');
              tables.forEach(table => console.log(`  - ${table.name}`));
            }
            
            db.close((err) => {
              if (err) {
                console.error('Error closing database:', err);
              } else {
                console.log('\n✅ Database created and ready to use!');
                console.log('🚀 You can now start your server with: npm start');
              }
            });
          });
        }
      }
    });
  });
}

// Start the database creation
createTables();