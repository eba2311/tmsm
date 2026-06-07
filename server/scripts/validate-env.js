#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * Validates critical environment variables before application startup
 * Run: node scripts/validate-env.js
 */

require('dotenv').config();

const CRITICAL_VARS = {
  NODE_ENV: {
    required: true,
    description: 'Environment (development, production, staging)',
    allowedValues: ['development', 'production', 'staging', 'test'],
  },
  DATABASE_URL: {
    required: true,
    description: 'PostgreSQL connection string',
    pattern: /^postgres(ql)?:\/\//,
  },
  JWT_SECRET: {
    required: true,
    description: 'JWT signing secret (64+ character hex)',
    minLength: 64,
    notAllowed: ['your-', 'change-this', 'generate-', 'xxx'],
  },
  JWT_REFRESH_SECRET: {
    required: true,
    description: 'JWT refresh secret (64+ character hex)',
    minLength: 64,
    notAllowed: ['your-', 'change-this', 'generate-', 'xxx'],
  },
  FRONTEND_URL: {
    required: true,
    description: 'Frontend application URL',
    pattern: /^https?:\/\//,
    notAllowed: ['localhost', '127.0.0.1', 'your-'],
  },
  SESSION_SECRET: {
    required: true,
    description: 'Session secret for authentication',
    minLength: 32,
    notAllowed: ['your-', 'change-this', 'xxx'],
  },
};

const OPTIONAL_VARS = {
  PORT: {
    description: 'Server port',
    defaultValue: '4000',
    pattern: /^\d{4,5}$/,
  },
  REDIS_URL: {
    description: 'Redis connection URL',
    pattern: /^redis:\/\//,
  },
  LOG_LEVEL: {
    description: 'Logging level',
    defaultValue: 'info',
    allowedValues: ['error', 'warn', 'info', 'debug'],
  },
  CORS_ORIGIN: {
    description: 'CORS allowed origin',
    defaultValue: process.env.FRONTEND_URL,
  },
};

let errors = [];
let warnings = [];

console.log('\n📋 Validating Environment Configuration...\n');

// Check critical variables
Object.entries(CRITICAL_VARS).forEach(([key, config]) => {
  const value = process.env[key];

  if (!value) {
    if (config.required) {
      errors.push(`❌ ${key} is required but not set - ${config.description}`);
    }
    return;
  }

  // Check pattern
  if (config.pattern && !config.pattern.test(value)) {
    errors.push(`❌ ${key} format is invalid - Expected pattern: ${config.pattern}`);
  }

  // Check minimum length
  if (config.minLength && value.length < config.minLength) {
    errors.push(`❌ ${key} is too short - Minimum ${config.minLength} characters, got ${value.length}`);
  }

  // Check not allowed values
  if (config.notAllowed) {
    const isNotAllowed = config.notAllowed.some((notAllowedVal) =>
      value.toLowerCase().includes(notAllowedVal.toLowerCase())
    );
    if (isNotAllowed) {
      errors.push(`❌ ${key} contains placeholder/invalid value - Replace with production value`);
    }
  }

  // Check allowed values
  if (config.allowedValues && !config.allowedValues.includes(value)) {
    errors.push(
      `❌ ${key} has invalid value "${value}" - Allowed: ${config.allowedValues.join(', ')}`
    );
  }

  console.log(`✅ ${key}: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
});

// Check optional variables
console.log('\n📋 Optional Variables:');
Object.entries(OPTIONAL_VARS).forEach(([key, config]) => {
  const value = process.env[key];

  if (!value) {
    if (config.defaultValue) {
      console.log(`ℹ️  ${key}: Not set, will use default: ${config.defaultValue}`);
    } else {
      console.log(`⚠️  ${key}: Not set (optional)`);
    }
    return;
  }

  // Check pattern
  if (config.pattern && !config.pattern.test(value)) {
    warnings.push(`⚠️  ${key} format may be invalid - Expected pattern: ${config.pattern}`);
  }

  // Check allowed values
  if (config.allowedValues && !config.allowedValues.includes(value)) {
    warnings.push(
      `⚠️  ${key} may have invalid value "${value}" - Recommended: ${config.allowedValues.join(', ')}`
    );
  }

  console.log(`✅ ${key}: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
});

// Special validation for production environment
if (process.env.NODE_ENV === 'production') {
  console.log('\n🔒 Production Environment Checks:');

  if (!process.env.DATABASE_URL.includes('sslmode=require')) {
    warnings.push('⚠️  DATABASE_URL should include ?sslmode=require for SSL encryption');
  }

  if (process.env.LOG_LEVEL === 'debug') {
    warnings.push('⚠️  LOG_LEVEL should not be "debug" in production');
  }

  if (!process.env.REDIS_URL) {
    warnings.push('⚠️  REDIS_URL not set - caching disabled in production');
  }

  console.log('✅ Production environment checks complete');
}

// Print warnings
if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  warnings.forEach((w) => console.log(`  ${w}`));
}

// Print errors and exit if any
if (errors.length > 0) {
  console.log('\n❌ ERRORS:');
  errors.forEach((e) => console.log(`  ${e}`));
  console.log(
    '\n🔧 Fix the above errors before running the application in production.\n'
  );
  process.exit(1);
}

console.log('\n✅ All environment variables are valid!\n');
process.exit(0);
