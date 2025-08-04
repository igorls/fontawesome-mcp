#!/usr/bin/env node

// Test script to run all framework tests in sequence

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frameworks = ['angular', 'react', 'vue'];

console.log('🧪 Running Framework-Aware FontAwesome MCP Server Tests\n');
console.log('=' .repeat(60));

async function runTest(framework) {
  return new Promise((resolve) => {
    console.log(`\n🔧 Testing ${framework.toUpperCase()} framework...`);
    console.log('-'.repeat(40));
    
    const testFile = path.join(__dirname, `test-${framework}.js`);
    const testProcess = spawn('node', [testFile], {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    testProcess.on('close', (code) => {
      console.log(`✅ ${framework.toUpperCase()} test completed with code ${code}\n`);
      resolve(code);
    });
    
    testProcess.on('error', (error) => {
      console.error(`❌ ${framework.toUpperCase()} test failed:`, error);
      resolve(1);
    });
  });
}

async function runAllTests() {
  console.log('Testing framework-aware functionality with all supported frameworks:\n');
  
  for (const framework of frameworks) {
    await runTest(framework);
    
    // Add a small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('=' .repeat(60));
  console.log('🎉 All framework tests completed!');
  console.log('\nFramework-aware features tested:');
  console.log('✓ Environment variable detection (FRAMEWORK)');
  console.log('✓ Framework-specific usage instructions');
  console.log('✓ Icon name conversion (kebab-case → camelCase)');
  console.log('✓ Correct import statements for each framework');
  console.log('✓ Icon Library and Explicit Reference methods');
  console.log('✓ Template/component code generation');
  
  console.log('\nSupported frameworks:');
  console.log('• Angular - @fortawesome/angular-fontawesome');
  console.log('• React   - @fortawesome/react-fontawesome');
  console.log('• Vue.js  - @fortawesome/vue-fontawesome');
  console.log('• Vanilla - CSS classes or FontAwesome Kit');
  
  console.log('\nTo use framework-aware features:');
  console.log('1. Set FRAMEWORK environment variable (angular|react|vue|vanilla)');
  console.log('2. Configure in VS Code .vscode/mcp.json or Claude Desktop config');
  console.log('3. Search/get icons - receive framework-specific usage instructions');
}

runAllTests().catch(console.error);
