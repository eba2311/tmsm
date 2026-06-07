#!/usr/bin/env node

/**
 * Health Check Script
 * Verifies application is running and all critical systems are functional
 * Run: node scripts/health-check.js
 */

const http = require('http');
const { testConnection } = require('../src/config/database');

const PORT = process.env.PORT || 4000;
const TIMEOUT = 5000;

async function healthCheck() {
  console.log('🏥 Running Health Check...\n');

  let allHealthy = true;

  // 1. Check database connection
  console.log('📊 Checking Database Connection...');
  try {
    await testConnection();
    console.log('✅ Database connection: OK\n');
  } catch (err) {
    console.log(`❌ Database connection: FAILED - ${err.message}\n`);
    allHealthy = false;
  }

  // 2. Check HTTP server
  console.log('🌐 Checking HTTP Server...');
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: '/api/v1/health',
      method: 'GET',
      timeout: TIMEOUT,
    };

    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ HTTP server: OK');
        console.log(`   Response code: ${res.statusCode}\n`);

        if (allHealthy) {
          console.log('✅ All health checks passed!\n');
          resolve(0);
        } else {
          console.log('⚠️  Application running but some checks failed\n');
          resolve(1);
        }
      } else {
        console.log(`❌ HTTP server: Unexpected status code ${res.statusCode}\n`);
        resolve(1);
      }
    });

    req.on('error', (err) => {
      console.log(`❌ HTTP server: FAILED - ${err.message}\n`);
      console.log('   Make sure the application is running on port', PORT, '\n');
      resolve(1);
    });

    req.on('timeout', () => {
      console.log(`❌ HTTP server: TIMEOUT (${TIMEOUT}ms)\n`);
      req.destroy();
      resolve(1);
    });

    req.end();
  }).then((code) => process.exit(code));
}

healthCheck().catch((err) => {
  console.error('❌ Health check failed:', err);
  process.exit(1);
});
