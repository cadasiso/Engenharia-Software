// Smart database initialization script - only resets if needed
const { execSync } = require('child_process');

console.log('🔄 Checking database status...');

try {
  // First, try to generate Prisma client and check if DB is accessible
  console.log('📝 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Try to push schema without reset (safe operation)
  console.log('🚀 Syncing schema (safe mode)...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  
  console.log('✅ Database sync complete - no reset needed!');
} catch (error) {
  console.log('⚠️  Database sync failed, checking if reset is needed...');
  
  // Only reset if there's a real schema mismatch, not migration issues
  if (error.message.includes('P3009') || error.message.includes('migration')) {
    console.log('🔧 Migration conflict detected, resolving...');
    try {
      execSync('npx prisma migrate resolve --applied 20241202_add_chat_requests', { stdio: 'inherit' });
      execSync('npx prisma db push', { stdio: 'inherit' });
      console.log('✅ Migration conflict resolved!');
    } catch (resolveError) {
      console.log('❌ Could not resolve migration conflict. Manual intervention may be needed.');
      process.exit(1);
    }
  } else {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}