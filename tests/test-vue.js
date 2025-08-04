#!/usr/bin/env node

// Test script to demonstrate Vue.js framework-aware MCP server

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set environment variable for Vue.js framework
process.env.FRAMEWORK = 'vue';
process.env.FA_TOKEN = process.env.FA_TOKEN || 'your-token-here';

console.log('Testing FontAwesome MCP Server with Vue.js framework...\n');

// Start the MCP server
const serverPath = path.join(__dirname, '..', 'dist', 'server.js');
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'inherit'],
  env: { ...process.env, FRAMEWORK: 'vue' }
});

// Test search_icons request
const searchRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "search_icons",
    arguments: {
      query: "heart",
      limit: 2
    }
  }
};

// Test get_icon_by_name request
const getIconRequest = {
  jsonrpc: "2.0",
  id: 2,
  method: "tools/call",
  params: {
    name: "get_icon_by_name",
    arguments: {
      name: "home"
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
        console.log('=== Search Icons Response (Vue.js) ===');
        if (response.result?.content?.[0]?.text) {
          const result = JSON.parse(response.result.content[0].text);
          console.log('Framework:', result.framework);
          if (result.icons?.[0]?.frameworkUsage) {
            console.log('\nVue.js Usage for', result.icons[0].id + ':');
            console.log('Icon Library Method:');
            console.log('Import:', result.icons[0].frameworkUsage.usage.iconLibrary.import);
            console.log('Register:', result.icons[0].frameworkUsage.usage.iconLibrary.register);
            console.log('Template:', result.icons[0].frameworkUsage.usage.iconLibrary.template);
            
            console.log('\nExplicit Reference Method:');
            console.log('Import:', result.icons[0].frameworkUsage.usage.explicitReference.import);
            console.log('Component:', result.icons[0].frameworkUsage.usage.explicitReference.component);
            console.log('Template:', result.icons[0].frameworkUsage.usage.explicitReference.template);
          }
        }
        console.log('\n');
      }
      
      if (response.id === 2) {
        console.log('=== Get Icon By Name Response (Vue.js) ===');
        if (response.result?.content?.[0]?.text) {
          const result = JSON.parse(response.result.content[0].text);
          console.log('Framework:', result.framework);
          if (result.icon?.frameworkUsage) {
            console.log('\nVue.js Icon Library Method:');
            console.log('Available Families:', result.icon.availableFamilies.map(f => `${f.family}-${f.style} (${f.prefix})`).join(', '));
            console.log('Register:', result.icon.frameworkUsage.usage.iconLibrary.register);
            console.log('Template:', result.icon.frameworkUsage.usage.iconLibrary.template);
            
            console.log('\nVue.js Explicit Reference Method:');
            console.log('Import:', result.icon.frameworkUsage.usage.explicitReference.import);
            console.log('Component:', result.icon.frameworkUsage.usage.explicitReference.component);
            console.log('Template:', result.icon.frameworkUsage.usage.explicitReference.template);
          }
        }
        console.log('\n');
        
        // All tests done, close the server
        server.kill();
      }
    } catch (e) {
      // Ignore non-JSON lines (like server startup messages)
    }
  }
});

server.on('close', (code) => {
  console.log('Vue.js framework test completed.');
});

// Error handling
server.on('error', (error) => {
  console.error('Server error:', error);
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
      name: "vue-test-client",
      version: "1.0.0"
    }
  }
}) + '\n');

// Wait a bit then send search request
setTimeout(() => {
  console.log('Sending search request...');
  server.stdin.write(JSON.stringify(searchRequest) + '\n');
}, 1500);

// Wait a bit more then send get icon request
setTimeout(() => {
  console.log('Sending get icon request...');
  server.stdin.write(JSON.stringify(getIconRequest) + '\n');
}, 3000);

// Cleanup after 15 seconds
setTimeout(() => {
  console.log('Timeout reached, closing server...');
  server.kill();
}, 15000);
