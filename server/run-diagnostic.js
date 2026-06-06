const fs = require('fs');

try {
  // Mock express to avoid actual binding if any route does something weird
  console.log('Loading app...');
  const { app } = require('./src/index.js');
  console.log('App loaded successfully.');
  
  // Also load all models manually
  const modelsDir = './src/models';
  const models = fs.readdirSync(modelsDir);
  for (const model of models) {
    if (model.endsWith('.js') && model !== 'index.js') {
      require(`${modelsDir}/${model}`);
      console.log(`Loaded ${model}`);
    }
  }
  
  fs.writeFileSync('diagnostic.txt', 'SUCCESS');
} catch (err) {
  console.error(err);
  fs.writeFileSync('diagnostic.txt', err.stack);
}
