try {
  require('./src/index.js');
  console.log('Syntax OK');
  process.exit(0);
} catch (err) {
  console.error('Syntax Error:', err);
  process.exit(1);
}
