// setup-env.js - Generate environment variables for SafeVoice backend
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

console.log('🔧 Setting up SafeVoice environment variables...\n');

// Generate secure random keys
const generateSecureKey = (length = 64) => {
  return crypto.randomBytes(length).toString('hex');
};

// Environment variables to generate
const envVars = {
  JWT_SECRET: generateSecureKey(32),
  ENCRYPTION_KEY: generateSecureKey(32),
  IP_SALT: generateSecureKey(16),
  NODE_ENV: 'development',
  PORT: '3001',
  FRONTEND_URL: 'http://localhost:3000'
};

// Create .env file content
const envContent = Object.entries(envVars)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

const envFilePath = path.join(__dirname, '.env');

try {
  // Check if .env already exists
  if (fs.existsSync(envFilePath)) {
    console.log('⚠️  .env file already exists!');
    console.log('📋 Current .env file:');
    console.log(fs.readFileSync(envFilePath, 'utf8'));
    
    // Ask if user wants to overwrite (in a real setup, you'd use readline)
    console.log('\n🔄 To regenerate, delete the existing .env file and run this script again.');
    process.exit(0);
  }

  // Write .env file
  fs.writeFileSync(envFilePath, envContent);
  
  console.log('✅ Environment file created successfully!');
  console.log(`📁 Location: ${envFilePath}\n`);
  
  console.log('🔐 Generated environment variables:');
  console.log('==========================================');
  Object.entries(envVars).forEach(([key, value]) => {
    if (key.includes('SECRET') || key.includes('KEY') || key.includes('SALT')) {
      console.log(`${key}=${value.substring(0, 8)}... (${value.length} chars)`);
    } else {
      console.log(`${key}=${value}`);
    }
  });
  
  console.log('\n📋 Environment setup complete!');
  console.log('🚀 You can now start the server with: node server.js');
  console.log('\n🔒 Security Notes:');
  console.log('   • Keep your .env file secure and never commit it to version control');
  console.log('   • The .env file is already in .gitignore');
  console.log('   • These keys are for development only - use different keys in production');
  
} catch (error) {
  console.error('❌ Error creating environment file:', error.message);
  process.exit(1);
}

// Create .gitignore if it doesn't exist
const gitignorePath = path.join(__dirname, '.gitignore');
const gitignoreContent = `# Environment variables
.env

# Database
*.db
*.sqlite
*.sqlite3

# Node modules
node_modules/

# Logs
*.log
logs/

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
`;

if (!fs.existsSync(gitignorePath)) {
  fs.writeFileSync(gitignorePath, gitignoreContent);
  console.log('📝 Created .gitignore file');
}

console.log('\n🎯 Next Steps:');
console.log('1. Install dependencies: npm install express cors helmet express-rate-limit sqlite3 jsonwebtoken bcrypt');
console.log('2. Start the backend server: node server.js');
console.log('3. Start the frontend: npm start (in your React app directory)');
console.log('4. Open http://localhost:3000 to access SafeVoice');

console.log('\n👤 Admin Account Information:');
console.log('=================================');
console.log('Legal Team Admin:');
console.log('  Username: legal_admin');
console.log('  Password: SafeVoice2024!');
console.log('');
console.log('Task Force Admin:');
console.log('  Username: task_admin');
console.log('  Password: SafeVoice2024!');
console.log('');
console.log('Support Services Admin:');
console.log('  Username: support_admin');
console.log('  Password: SafeVoice2024!');
console.log('');
console.log('Happy2Help Admin:');
console.log('  Username: happy2help_admin');
console.log('  Password: SafeVoice2024!');
console.log('');
console.log('Super Admin (All Departments):');
console.log('  Username: super_admin');
console.log('  Password: SafeVoice2024!');

console.log('\n🌟 SafeVoice is ready to help people safely report incidents!');