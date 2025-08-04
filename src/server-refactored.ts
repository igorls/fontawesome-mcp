#!/usr/bin/env node

/**
 * FontAwesome MCP Server - Refactored
 * 
 * A Model Context Protocol server that provides framework-aware access to FontAwesome icons
 * through their GraphQL API with comprehensive search and usage generation capabilities.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { FontAwesomeAPIClient } from "./api/index.js";
import { getFramework, getFAToken } from "./utils/index.js";
import { FRAMEWORK_USAGE } from "./framework/index.js";
import { 
  SearchIconsTool, 
  GetIconByNameTool,
  GetReleaseInfoTool,
  GetFamilyStylesTool,
  GetProPlusShowcaseTool
} from "./tools/index.js";

class FontAwesomeMCPServer {
  private server: Server;
  private apiClient: FontAwesomeAPIClient;
  private framework: string;
  
  // Tool instances
  private searchIconsTool: SearchIconsTool;
  private getIconByNameTool: GetIconByNameTool;
  private getReleaseInfoTool: GetReleaseInfoTool;
  private getFamilyStylesTool: GetFamilyStylesTool;
  private getProPlusShowcaseTool: GetProPlusShowcaseTool;

  constructor() {
    this.framework = getFramework();
    
    this.server = new Server(
      {
        name: "fontawesome-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize API client
    this.apiClient = new FontAwesomeAPIClient(getFAToken() || undefined);

    // Initialize tools
    this.searchIconsTool = new SearchIconsTool(this.apiClient, this.framework as any);
    this.getIconByNameTool = new GetIconByNameTool(this.apiClient, this.framework as any);
    this.getReleaseInfoTool = new GetReleaseInfoTool(this.apiClient);
    this.getFamilyStylesTool = new GetFamilyStylesTool(this.apiClient);
    this.getProPlusShowcaseTool = new GetProPlusShowcaseTool(this.apiClient);

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // Handle tool listing
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "search_icons",
            description: "Search for FontAwesome icons using fuzzy search. Returns icons matching the search query with their metadata.",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Search terms for finding icons (e.g., 'coffee', 'user profile', 'arrow left')",
                },
                version: {
                  type: "string",
                  description: "FontAwesome version to search in (e.g., '7.x', '6.x', '7.0.0'). Defaults to '7.x'",
                  default: "7.x",
                },
                limit: {
                  type: "number",
                  description: "Maximum number of results to return (1-50). Defaults to 15",
                  minimum: 1,
                  maximum: 50,
                  default: 15,
                },
                include_svgs: {
                  type: "boolean",
                  description: "Whether to include SVG data in the response. Defaults to false for faster responses",
                  default: false,
                },
                pro_only: {
                  type: "boolean",
                  description: "Whether to only return Pro icons (requires API token). Defaults to false",
                  default: false,
                },
                family_styles: {
                  type: "array",
                  description: "Filter by specific family/style combinations (e.g., [{family: 'classic', style: 'solid'}])",
                  items: {
                    type: "object",
                    properties: {
                      family: {
                        type: "string",
                        enum: ["classic", "duotone", "sharp", "sharp-duotone", "brands", "chisel", "etch", "jelly", "jelly-duo", "jelly-fill", "notdog", "notdog-duo", "slab", "slab-press", "thumbprint", "whiteboard"],
                        description: "Icon family (lowercase format as returned by API)",
                      },
                      style: {
                        type: "string",
                        enum: ["solid", "regular", "light", "thin", "brands", "duotone", "semibold"],
                        description: "Icon style (lowercase format as returned by API)",
                      },
                    },
                    required: ["family", "style"],
                  },
                },
              },
              required: ["query"],
            },
          },
          {
            name: "get_icon_by_name",
            description: "Get a specific FontAwesome icon by its exact name or alias. More precise than search when you know the exact icon name.",
            inputSchema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "Exact name of the icon (e.g., 'mug-saucer', 'coffee', 'user')",
                },
                version: {
                  type: "string",
                  description: "FontAwesome version (e.g., '7.x', '6.x', '7.0.0'). Defaults to '7.x'",
                  default: "7.x",
                },
                include_svgs: {
                  type: "boolean",
                  description: "Whether to include SVG data in the response. Defaults to false",
                  default: false,
                },
                pro_only: {
                  type: "boolean",
                  description: "Whether to only return Pro icons (requires API token). Defaults to false",
                  default: false,
                },
                family_styles: {
                  type: "array",
                  description: "Filter by specific family/style combinations",
                  items: {
                    type: "object",
                    properties: {
                      family: {
                        type: "string",
                        enum: ["classic", "duotone", "sharp", "sharp-duotone", "brands", "chisel", "etch", "jelly", "jelly-duo", "jelly-fill", "notdog", "notdog-duo", "slab", "slab-press", "thumbprint", "whiteboard"],
                        description: "Icon family (lowercase format as returned by API)",
                      },
                      style: {
                        type: "string",
                        enum: ["solid", "regular", "light", "thin", "brands", "duotone", "semibold"],
                        description: "Icon style (lowercase format as returned by API)",
                      },
                    },
                    required: ["family", "style"],
                  },
                },
              },
              required: ["name"],
            },
          },
          {
            name: "get_release_info",
            description: "Get information about FontAwesome releases, including version details and icon counts.",
            inputSchema: {
              type: "object",
              properties: {
                version: {
                  type: "string",
                  description: "Specific version to get info for (e.g., '7.x', '6.x', '7.0.0'). Defaults to '7.x'",
                  default: "7.x",
                },
                list_all: {
                  type: "boolean",
                  description: "Whether to list all available releases instead of a specific version",
                  default: false,
                },
              },
            },
          },
          {
            name: "get_family_styles",
            description: "Get all available family/style combinations for a FontAwesome version.",
            inputSchema: {
              type: "object",
              properties: {
                version: {
                  type: "string",
                  description: "FontAwesome version (e.g., '7.x', '6.x', '7.0.0'). Defaults to '7.x'",
                  default: "7.x",
                },
              },
            },
          },
          {
            name: "get_pro_plus_showcase",
            description: "Get showcase icons from the new Pro+ style families (chisel, etch, jelly, notdog, slab, thumbprint, whiteboard). Perfect for demonstrating these new families.",
            inputSchema: {
              type: "object",
              properties: {
                version: {
                  type: "string",
                  description: "FontAwesome version (e.g., '7.x', '6.x', '7.0.0'). Defaults to '7.x'",
                  default: "7.x",
                },
                icons_per_family: {
                  type: "number",
                  description: "Number of example icons to return per Pro+ family. Defaults to 4",
                  default: 4,
                  minimum: 1,
                  maximum: 10,
                },
                include_svgs: {
                  type: "boolean",
                  description: "Whether to include SVG data in the response. Defaults to false",
                  default: false,
                },
              },
            },
          },
        ],
      };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "search_icons":
            return await this.searchIconsTool.execute(args as any);
          case "get_icon_by_name":
            return await this.getIconByNameTool.execute(args as any);
          case "get_release_info":
            return await this.getReleaseInfoTool.execute(args as any);
          case "get_family_styles":
            return await this.getFamilyStylesTool.execute(args as any);
          case "get_pro_plus_showcase":
            return await this.getProPlusShowcaseTool.execute(args as any);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // Test authentication and provide detailed status
    const hasToken = this.apiClient.hasToken();
    let authStatus = "Free API access only";
    let iconCount = "Unknown";
    
    if (hasToken) {
      try {
        const token = await this.apiClient.getAccessToken();
        if (token) {
          const scopes = this.apiClient.getScopes();
          authStatus = `Pro API access (scopes: ${scopes.join(', ')})`;
          
          // Try to get icon count
          try {
            const response = await this.apiClient.request(`
              query GetRelease($version: String!) {
                release(version: $version) {
                  iconCount {
                    free
                    pro
                  }
                }
              }
            `, { version: "7.x" });
            
            const counts = (response as any).release?.iconCount;
            if (counts) {
              iconCount = `${counts.free} free, ${counts.pro} pro icons`;
            }
          } catch (e) {
            // Ignore count fetch errors
          }
        } else {
          authStatus = "Pro API token provided but authentication failed";
        }
      } catch (error) {
        authStatus = `Pro API token error: ${error instanceof Error ? error.message : String(error)}`;
      }
    }
    
    console.error(`FontAwesome MCP Server v1.0.0`);
    console.error(`Framework: ${this.framework.toUpperCase()} (${(FRAMEWORK_USAGE as any)[this.framework]?.name || 'Unknown'})`);
    console.error(`Status: ${authStatus}`);
    console.error(`Icons: ${iconCount}`);
    console.error(`Server running on stdio transport`);
    console.error(`---`);
    console.error(`Available tools: search_icons, get_icon_by_name, get_release_info, get_family_styles, get_pro_plus_showcase`);
    console.error(`Pro+ families: chisel, etch, jelly, notdog, slab, thumbprint, whiteboard`);
    console.error(`Set FRAMEWORK env var to: angular, react, vue, vanilla (current: ${this.framework})`);
  }
}

// Start the server
const server = new FontAwesomeMCPServer();
server.run().catch(console.error);
