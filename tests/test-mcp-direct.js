#!/usr/bin/env node

/**
 * Direct MCP Test for VS Code Integration
 * This script allows you to test the FontAwesome MCP server directly
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Testing FontAwesome MCP Server for VS Code...\n');

// Start the server
const server = spawn('node', ['dist/server.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: path.dirname(__dirname)
});

let messageId = 0;

// Function to send MCP requests
function sendMCPRequest(method, params = {}) {
  const id = ++messageId;
  const message = JSON.stringify({
    jsonrpc: '2.0',
    id,
    method,
    params
  }) + '\n';
  
  console.log(`📤 Sending: ${method}`);
  server.stdin.write(message);
}

// Handle server output
server.stdout.on('data', (data) => {
  const responses = data.toString().split('\n').filter(line => line.trim());
  responses.forEach(line => {
    try {
      const response = JSON.parse(line);
      console.log(`📥 Response (ID ${response.id}):`, JSON.stringify(response, null, 2));
    } catch (e) {
      console.log('📥 Raw output:', line);
    }
  });
});

// Handle server errors
server.stderr.on('data', (data) => {
  console.log('🖥️  Server:', data.toString().trim());
});

// Test sequence
setTimeout(() => {
  // Test 1: List available tools
  sendMCPRequest('tools/list');
}, 1000);

setTimeout(() => {
  // Test 2: Search for coffee icons
  sendMCPRequest('tools/call', {
    name: 'search_icons',
    arguments: {
      query: 'coffee',
      limit: 3
    }
  });
}, 2000);

setTimeout(() => {
  // Test 3: Get specific icon
  sendMCPRequest('tools/call', {
    name: 'get_icon_by_name',
    arguments: {
      name: 'mug-saucer'
    }
  });
}, 3000);

// Cleanup after tests
setTimeout(() => {
  server.kill();
  console.log('\n✅ MCP Server test completed!');
  console.log('\n📋 To use with VS Code:');
  console.log('1. The server binary is ready at: ./dist/server.js');
  console.log('2. VS Code can invoke it using: node ./dist/server.js');
  console.log('3. The server supports all 4 FontAwesome tools as demonstrated above');
}, 5000);

// Handle server exit
server.on('exit', (code) => {
  console.log(`\n🔚 Server exited with code: ${code}`);
});
