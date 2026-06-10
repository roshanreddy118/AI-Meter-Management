#!/usr/bin/env node

/**
 * Database Initialization Script
 * Run this manually to create all database tables:
 *   node scripts/init-db.js
 */

import { initializeDatabase } from '../lib/db.js';

async function main() {
  console.log('🚀 Starting database initialization...\n');
  
  try {
    await initializeDatabase();
    
    console.log('\n✅ Database initialization completed successfully!\n');
    console.log('Tables created:');
    console.log('  ✓ properties');
    console.log('  ✓ meter_readings');
    console.log('  ✓ settings (with default BESCOM rate of 8.5)\n');
    console.log('Your Meter Tracker app is now ready to use!');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database initialization failed!\n');
    console.error('Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Ensure DATABASE_URL is set in .env.local');
    console.error('  2. Verify your Neon database is active');
    console.error('  3. Check your internet connection');
    console.error('  4. Try again in a few moments\n');
    
    process.exit(1);
  }
}

main();
