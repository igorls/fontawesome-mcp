#!/usr/bin/env node

/**
 * Example usage of the FontAwesome MCP Server
 * This script demonstrates ho        } else {
          const data = JSON.parse(text);
          if (data.icon) {o interact with the server programmatically
 */

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

class FontAwesomeMCPClient {
  constructor() {
    this.server = null;
    this.messageId = 0;
  }

  async start() {
    console.log('🚀 Starting FontAwesome MCP Server...\n');
    
    this.server = spawn('node', ['dist/server.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });

    this.server.stderr.on('data', (data) => {
      console.log('Server:', data.toString().trim());
    });

    // Wait for server to start
    await setTimeout(1000);
  }

  async sendRequest(method, params = {}) {
    return new Promise((resolve) => {
      const messageId = ++this.messageId;
      const message = JSON.stringify({
        jsonrpc: '2.0',
        id: messageId,
        method,
        params
      }) + '\n';

      let responseBuffer = '';
      
      const onData = (data) => {
        responseBuffer += data.toString();
        const lines = responseBuffer.split('\n');
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const response = JSON.parse(line);
              if (response.id === messageId) {
                this.server.stdout.removeListener('data', onData);
                resolve(response);
                return;
              }
            } catch (e) {
              // Ignore parse errors for partial data
            }
          }
        }
      };

      this.server.stdout.on('data', onData);
      this.server.stdin.write(message);
    });
  }

  async searchIcons(query, options = {}) {
    console.log(`🔍 Searching for icons: "${query}"`);
    const response = await this.sendRequest('tools/call', {
      name: 'search_icons',
      arguments: { query, ...options }
    });
    
    if (response.result && response.result.content) {
      const data = JSON.parse(response.result.content[0].text);
      console.log(`Found ${data.results} icons:\n`);
      
      data.icons.forEach((icon, index) => {
        console.log(`${index + 1}. ${icon.label} (${icon.id})`);
        console.log(`   Unicode: ${icon.unicode}`);
        console.log(`   Free styles: ${icon.familyStylesByLicense.free.map(f => f.prefix).join(', ') || 'None'}`);
        console.log(`   Pro styles: ${icon.familyStylesByLicense.pro.slice(0, 3).map(f => f.prefix).join(', ')}${icon.familyStylesByLicense.pro.length > 3 ? '...' : ''}`);
        if (icon.aliases && icon.aliases.names.length > 0) {
          console.log(`   Aliases: ${icon.aliases.names.join(', ')}`);
        }
        console.log('');
      });
    }
    
    return response;
  }

  async getIconByName(name, options = {}) {
    console.log(`📍 Getting specific icon: "${name}"`);
    const response = await this.sendRequest('tools/call', {
      name: 'get_icon_by_name',
      arguments: { name, ...options }
    });
    
    if (response.result && response.result.content) {
      const text = response.result.content[0].text;
      if (text.startsWith('Icon "')) {
        console.log(`❌ ${text}\n`);
      } else {
        const data = JSON.parse(text);
        if (data.icon) {
        const icon = data.icon;
        console.log(`\n✅ Found icon: ${icon.label} (${icon.id})`);
        console.log(`Unicode: ${icon.unicode}`);
        console.log(`Version: ${data.version}`);
        
        if (icon.aliases && icon.aliases.names.length > 0) {
          console.log(`Aliases: ${icon.aliases.names.join(', ')}`);
        }
        
        console.log('\nAvailable in:');
        if (icon.familyStylesByLicense.free.length > 0) {
          console.log(`  Free: ${icon.familyStylesByLicense.free.map(f => `${f.family} ${f.style} (${f.prefix})`).join(', ')}`);
        }
        if (icon.familyStylesByLicense.pro.length > 0) {
          console.log(`  Pro: ${icon.familyStylesByLicense.pro.slice(0, 4).map(f => `${f.family} ${f.style} (${f.prefix})`).join(', ')}${icon.familyStylesByLicense.pro.length > 4 ? '...' : ''}`);
        }
        console.log('');
        } else {
          console.log(`❌ Icon "${name}" not found\n`);
        }
      }
    }
    
    return response;
  }

  async getReleaseInfo(version = '7.x') {
    console.log(`📊 Getting release info for version: ${version}`);
    const response = await this.sendRequest('tools/call', {
      name: 'get_release_info',
      arguments: { version }
    });
    
    if (response.result && response.result.content) {
      const data = JSON.parse(response.result.content[0].text);
      if (data.release) {
        const release = data.release;
        console.log(`\n📋 FontAwesome ${release.version}`);
        console.log(`Release Date: ${release.date}`);
        console.log(`Latest: ${release.isLatest ? 'Yes' : 'No'}`);
        console.log(`Free Icons: ${release.iconCount.free}`);
        console.log(`Pro Icons: ${release.iconCount.pro}`);
        console.log('');
      }
    }
    
    return response;
  }

  async getFamilyStyles(version = '7.x') {
    console.log(`🎨 Getting family/styles for version: ${version}`);
    const response = await this.sendRequest('tools/call', {
      name: 'get_family_styles',
      arguments: { version }
    });
    
    if (response.result && response.result.content) {
      const data = JSON.parse(response.result.content[0].text);
      if (data.familyStyles) {
        console.log(`\n🎨 Available Family/Styles in FontAwesome ${data.version}:`);
        
        const grouped = data.familyStyles.reduce((acc, fs) => {
          if (!acc[fs.family]) acc[fs.family] = [];
          acc[fs.family].push(`${fs.style} (${fs.prefix})`);
          return acc;
        }, {});
        
        Object.entries(grouped).forEach(([family, styles]) => {
          console.log(`  ${family.toUpperCase()}: ${styles.join(', ')}`);
        });
        console.log('');
      }
    }
    
    return response;
  }

  stop() {
    if (this.server) {
      this.server.kill();
    }
  }
}

// Example usage
async function main() {
  const client = new FontAwesomeMCPClient();
  
  try {
    await client.start();
    
    // Example 1: Search for coffee-related icons
    await client.searchIcons('coffee', { limit: 3 });
    
    // Example 2: Get a specific icon
    await client.getIconByName('mug-saucer');
    
    // Example 3: Try to get a non-existent icon
    await client.getIconByName('non-existent-icon');
    
    // Example 4: Get release information
    await client.getReleaseInfo();
    
    // Example 5: Get family/styles
    await client.getFamilyStyles();
    
    // Example 6: Search with family/style filtering
    console.log('🎯 Searching for "arrow" icons in Classic Solid style only:');
    await client.searchIcons('arrow', { 
      limit: 3,
      family_styles: [{ family: 'CLASSIC', style: 'SOLID' }]
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.stop();
    console.log('👋 Demo completed!');
  }
}

// Run the example
main().catch(console.error);
