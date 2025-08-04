#!/usr/bin/env node

// Simple test script to verify the FontAwesome MCP server works
import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

console.log('Testing FontAwesome MCP Server...\n');

// Start the server
const server = spawn('node', ['dist/server.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: process.cwd()
});

let serverOutput = '';
let serverError = '';

server.stdout.on('data', (data) => {
  serverOutput += data.toString();
});

server.stderr.on('data', (data) => {
  serverError += data.toString();
});

// Test 1: List tools
const listToolsMessage = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list',
  params: {}
}) + '\n';

console.log('Sending tools/list request...');
server.stdin.write(listToolsMessage);

// Test 2: Search for coffee icons
const searchMessage = JSON.stringify({
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/call',
  params: {
    name: 'search_icons',
    arguments: {
      query: 'coffee',
      limit: 5
    }
  }
}) + '\n';

// Wait a bit then send search request
setTimeout(1000).then(() => {
  console.log('Sending search_icons request for "coffee"...');
  server.stdin.write(searchMessage);
  
  // Wait for responses and then close
  setTimeout(3000).then(() => {
    console.log('\n--- Server Output ---');
    console.log(serverOutput);
    
    if (serverError) {
      console.log('\n--- Server Error ---');
      console.log(serverError);
    }
    
    server.kill();
    console.log('\nTest completed.');
  });
});

server.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
});
