// Create a file called 'fix-database.js' to properly add missing columns

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🔧 Fixing SafeVoice database with missing AI columns...');

const db = new sqlite3.Database('./reports.db', (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Connected to existing database');
  }
});

// First, let's check what columns currently exist
function checkExistingColumns() {
  return new Promise((resolve, reject) => {
    db.all("PRAGMA table_info(reports)", (err, columns) => {
      if (err) {
        reject(err);
      } else {
        console.log('\n📋 Current columns in reports table:');
        const columnNames = columns.map(col => {
          console.log(`  - ${col.name} (${col.type})`);
          return col.name;
        });
        resolve(columnNames);
      }
    });
  });
}

// Add missing columns one by one
async function addMissingColumns() {
  try {
    const existingColumns = await checkExistingColumns();
    
    // Define the columns we need to add
    const requiredColumns = [
      { name: 'ai_analysis_complete', sql: 'ALTER TABLE reports ADD COLUMN ai_analysis_complete BOOLEAN DEFAULT 0' },
      { name: 'risk_factors', sql: 'ALTER TABLE reports ADD COLUMN risk_factors TEXT' },
      { name: 'recommended_actions', sql: 'ALTER TABLE reports ADD COLUMN recommended_actions TEXT' },
      { name: 'ai_model_version', sql: 'ALTER TABLE reports ADD COLUMN ai_model_version TEXT DEFAULT "claude-3-5-sonnet-20241022"' },
      { name: 'ai_processing_time', sql: 'ALTER TABLE reports ADD COLUMN ai_processing_time INTEGER' }
    ];

    console.log('\n🔧 Adding missing AI columns...');

    for (const column of requiredColumns) {
      if (!existingColumns.includes(column.name)) {
        try {
          await new Promise((resolve, reject) => {
            db.run(column.sql, (err) => {
              if (err) {
                reject(err);
              } else {
                console.log(`✅ Added column: ${column.name}`);
                resolve();
              }
            });
          });
        } catch (error) {
          console.error(`❌ Error adding column ${column.name}:`, error.message);
        }
      } else {
        console.log(`⏭️  Column ${column.name} already exists`);
      }
    }

    // Create missing AI tables
    await createMissingTables();
    
    // Now create indexes (only for columns that exist)
    await createSafeIndexes();
    
  } catch (error) {
    console.error('❌ Error in migration:', error);
  }
}

// Create missing AI tables
function createMissingTables() {
  return new Promise((resolve, reject) => {
    console.log('\n🗄️  Creating missing AI tables...');
    
    const aiTablesSQL = `
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ai_insights_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        insight_type TEXT NOT NULL,
        data TEXT NOT NULL,
        valid_until DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    db.exec(aiTablesSQL, (err) => {
      if (err) {
        console.error('❌ Error creating AI tables:', err);
        reject(err);
      } else {
        console.log('✅ AI tables created successfully');
        resolve();
      }
    });
  });
}

// Create indexes only for columns that exist
async function createSafeIndexes() {
  console.log('\n📊 Creating database indexes...');

  // Check which columns exist before creating indexes
  const existingColumns = await checkExistingColumns();
  
  const potentialIndexes = [
    { 
      name: 'idx_ai_analysis_logs_report_id', 
      sql: 'CREATE INDEX IF NOT EXISTS idx_ai_analysis_logs_report_id ON ai_analysis_logs (report_id)',
      table: 'ai_analysis_logs'
    },
    { 
      name: 'idx_ai_analysis_logs_type', 
      sql: 'CREATE INDEX IF NOT EXISTS idx_ai_analysis_logs_type ON ai_analysis_logs (analysis_type)',
      table: 'ai_analysis_logs'
    },
    { 
      name: 'idx_reports_ai_complete', 
      sql: 'CREATE INDEX IF NOT EXISTS idx_reports_ai_complete ON reports (ai_analysis_complete)',
      column: 'ai_analysis_complete'
    },
    { 
      name: 'idx_ai_insights_type', 
      sql: 'CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights_cache (insight_type)',
      table: 'ai_insights_cache'
    },
    { 
      name: 'idx_ai_insights_valid', 
      sql: 'CREATE INDEX IF NOT EXISTS idx_ai_insights_valid ON ai_insights_cache (valid_until)',
      table: 'ai_insights_cache'
    },
    { 
      name: 'idx_reports_department', 
      sql: 'CREATE INDEX IF NOT EXISTS idx_reports_department ON reports (assigned_department)',
      column: 'assigned_department'
    },
    { 
      name: 'idx_reports_status', 
      sql: 'CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status)',
      column: 'status'
    },
    { 
      name: 'idx_reports_created', 
      sql: 'CREATE INDEX IF NOT EXISTS idx_reports_created ON reports (created_at)',
      column: 'created_at'
    }
  ];

  for (const index of potentialIndexes) {
    // Check if we should create this index
    let shouldCreate = true;
    
    if (index.column && !existingColumns.includes(index.column)) {
      console.log(`⏭️  Skipping index ${index.name} - column ${index.column} doesn't exist`);
      shouldCreate = false;
    }
    
    if (shouldCreate) {
      try {
        await new Promise((resolve, reject) => {
          db.run(index.sql, (err) => {
            if (err) {
              console.error(`❌ Error creating index ${index.name}:`, err.message);
              resolve(); // Continue with other indexes
            } else {
              console.log(`✅ Created index: ${index.name}`);
              resolve();
            }
          });
        });
      } catch (error) {
        console.error(`❌ Unexpected error with index ${index.name}:`, error);
      }
    }
  }
}

// Verify the final state
function verifyDatabase() {
  console.log('\n🔍 Verifying database state...');
  
  // Check reports table columns
  db.all("PRAGMA table_info(reports)", (err, columns) => {
    if (err) {
      console.error('Error checking reports table:', err);
    } else {
      console.log('\n📋 Final reports table columns:');
      const aiColumns = [];
      columns.forEach(col => {
        if (col.name.includes('ai_') || col.name.includes('risk_') || col.name.includes('recommended_')) {
          console.log(`✅ ${col.name} (${col.type})`);
          aiColumns.push(col.name);
        }
      });
      
      if (aiColumns.length === 0) {
        console.log('⚠️  No AI columns found - migration may have failed');
      } else {
        console.log(`✅ Found ${aiColumns.length} AI-related columns`);
      }
    }
    
    // Check AI tables
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND (name LIKE '%ai%' OR name = 'reports')", (err, tables) => {
      if (err) {
        console.error('Error checking tables:', err);
      } else {
        console.log('\n📋 Available tables:');
        tables.forEach(table => console.log(`  - ${table.name}`));
      }
      
      // Check indexes
      db.all("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'", (err, indexes) => {
        if (err) {
          console.error('Error checking indexes:', err);
        } else {
          console.log('\n📋 Created indexes:');
          indexes.forEach(index => console.log(`  - ${index.name}`));
        }
        
        console.log('\n🎉 Database migration completed!');
        console.log('🚀 You can now start your server with the AI features enabled.');
        
        db.close();
      });
    });
  });
}

// Run the migration
addMissingColumns()
  .then(() => {
    verifyDatabase();
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    db.close();
  });