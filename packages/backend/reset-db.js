// Simple script to reset database for fresh deployment
const { execSync } = require('child_process');

console.log('🔄 Resetting database for fresh deployment...');

try {
  // First, try to reset the migration history
  console.log('📝 Marking migrations as resolved...');
  execSync('npx prisma migrate resolve --applied 20241202_add_chat_requests', { stdio: 'inherit' });
  
  // Then push the current schema
  console.log('🚀 Pushing current schema...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  
  console.log('✅ Database reset complete!');
} catch (error) {
  console.log('⚠️  Migration resolve failed, trying direct push...');
  try {
    execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
    console.log('✅ Database force reset complete!');
  } catch (pushError) {
    console.error('❌ Database reset failed:', pushError.message);
    process.exit(1);
  }
}