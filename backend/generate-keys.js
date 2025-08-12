// generate-keys.js
const crypto = require('crypto');

console.log('=== SECURE KEYS FOR .env FILE ===\n');

// Generate JWT Secret (32 bytes = 64 hex characters)
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log(`JWT_SECRET=${jwtSecret}`);

// Generate Encryption Key (32 bytes = 64 hex characters)
const encryptionKey = crypto.randomBytes(32).toString('hex');
console.log(`ENCRYPTION_KEY=${encryptionKey}`);

// Generate API Key for internal use
const apiKey = crypto.randomBytes(24).toString('hex');
console.log(`INTERNAL_API_KEY=${apiKey}`);

console.log('\n=== COPY THESE TO YOUR .env FILE ===');