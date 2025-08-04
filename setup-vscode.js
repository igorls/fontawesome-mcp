#!/usr/bin/env node

/**
 * VS Code MCP Integration Test
 * This script helps test the FontAwesome MCP server with VS Code
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

console.log('🔧 Setting up FontAwesome MCP Server for VS Code testing...\n');

// Get the absolute path to the server
const serverPath = path.resolve(process.cwd(), 'dist', 'server.js');
const configPath = path.resolve(process.cwd(), 'mcp-config.json');

console.log(`📁 Server path: ${serverPath}`);
console.log(`📋 Config path: ${configPath}`);

// Check if server exists
if (!fs.existsSync(serverPath)) {
  console.error('❌ Server not found! Run "npm run build" first.');
  process.exit(1);
}

// Test the server directly
console.log('\n🧪 Testing server startup...');
const testServer = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let error = '';

testServer.stdout.on('data', (data) => {
  output += data.toString();
});

testServer.stderr.on('data', (data) => {
  error += data.toString();
  if (error.includes('FontAwesome MCP server running on stdio')) {
    console.log('✅ Server started successfully!');
    
    // Test tools/list
    const listMessage = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    }) + '\n';
    
    testServer.stdin.write(listMessage);
    
    setTimeout(() => {
      testServer.kill();
      
      console.log('\n📋 MCP Configuration Instructions:');
      console.log('1. Copy the following configuration:');
      console.log('');
      console.log(JSON.stringify({
        mcpServers: {
          fontawesome: {
            command: 'node',
            args: [serverPath],
            env: {}
          }
        }
      }, null, 2));
      
      console.log('\n2. Add this to your VS Code MCP configuration file:');
      
      // Different paths for different platforms
      let configDir;
      if (process.platform === 'win32') {
        configDir = path.join(os.homedir(), 'AppData', 'Roaming', 'Code', 'User');
      } else if (process.platform === 'darwin') {
        configDir = path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User');
      } else {
        configDir = path.join(os.homedir(), '.config', 'Code', 'User');
      }
      
      console.log(`   ${path.join(configDir, 'mcp-settings.json')}`);
      console.log('');
      console.log('3. Alternatively, if you have Claude Desktop or another MCP client,');
      console.log('   you can use the generated mcp-config.json file directly.');
      console.log('');
      console.log('🎉 Server is ready for MCP integration!');
      
    }, 1000);
  }
});

testServer.on('error', (err) => {
  console.error('❌ Failed to start server:', err.message);
});

// Timeout after 5 seconds
setTimeout(() => {
  testServer.kill();
  console.log('⏰ Test timeout - server may not be responding properly');
}, 5000);
