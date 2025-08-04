#!/usr/bin/env node

// Test script to demonstrate React framework-aware MCP server

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set environment variable for React framework
process.env.FRAMEWORK = 'react';
process.env.FA_TOKEN = process.env.FA_TOKEN || 'your-token-here';

console.log('Testing FontAwesome MCP Server with React framework...\n');

// Start the MCP server
const serverPath = path.join(__dirname, '..', 'dist', 'server.js');
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'inherit'],
  env: { ...process.env, FRAMEWORK: 'react' }
});

// Test get_icon_by_name request
const getIconRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "get_icon_by_name",
    arguments: {
      name: "star"
    }
  }
};

let responses = [];

server.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    try {
      const response = JSON.parse(line);
      responses.push(response);
      
      if (response.id === 1) {
        console.log('=== Get Icon By Name Response (React) ===');
        if (response.result?.content?.[0]?.text) {
          const result = JSON.parse(response.result.content[0].text);
          console.log('Framework:', result.framework);
          if (result.icon?.frameworkUsage) {
            console.log('\nReact Icon Library Method:');
            console.log('Import:', result.icon.frameworkUsage.usage.iconLibrary.import);
            console.log('Register:', result.icon.frameworkUsage.usage.iconLibrary.register);
            console.log('Component:', result.icon.frameworkUsage.usage.iconLibrary.component);
            
            console.log('\nReact Explicit Reference Method:');
            console.log('Import:', result.icon.frameworkUsage.usage.explicitReference.import);
            console.log('Component:', result.icon.frameworkUsage.usage.explicitReference.component);
          }
        }
        console.log('\n');
        
        // Test done, close the server
        server.kill();
      }
    } catch (e) {
      // Ignore non-JSON lines (like server startup messages)
    }
  }
});

server.on('close', (code) => {
  console.log('Test completed.');
});

// Send initialization request
server.stdin.write(JSON.stringify({
  jsonrpc: "2.0",
  id: 0,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: {
      name: "test-client",
      version: "1.0.0"
    }
  }
}) + '\n');

// Wait a bit then send get icon request
setTimeout(() => {
  server.stdin.write(JSON.stringify(getIconRequest) + '\n');
}, 1000);

// Cleanup after 10 seconds
setTimeout(() => {
  server.kill();
}, 10000);
