#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { GraphQLClient } from "graphql-request";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// FontAwesome GraphQL API endpoint
const FONTAWESOME_API_URL = "https://api.fontawesome.com";
const FONTAWESOME_TOKEN_URL = "https://api.fontawesome.com/token";

// Get API token from environment variables
const FA_TOKEN = process.env.FA_TOKEN;

// Interface for FontAwesome access token response
interface AccessTokenResponse {
  access_token: string;
  expires_in: number;
  scopes: string[];
  token_type: string;
}

// Interface for FontAwesome Icon based on the GraphQL API documentation
interface FontAwesomeIcon {
  id: string;
  label: string;
  unicode: string;
  changes: string[];
  familyStylesByLicense: {
    free: Array<{
      family: string;
      style: string;
      prefix: string;
    }>;
    pro: Array<{
      family: string;
      style: string;
      prefix: string;
    }>;
  };
  svgs?: Array<{
    familyStyle: {
      family: string;
      style: string;
      prefix: string;
    };
    width: number;
    height: number;
    html: string;
    pathData: string[];
    iconDefinition: any;
  }>;
  aliases?: {
    names: string[];
    unicodes?: {
      composite: string[];
      primary: string[];
      secondary: string[];
    };
  };
}

// Interface for Release information
interface Release {
  version: string;
  date: string;
  isLatest: boolean;
  iconCount: {
    free: number;
    pro: number;
  };
}

class FontAwesomeMCPServer {
  private server: Server;
  private graphqlClient: GraphQLClient;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private scopes: string[] = [];

  constructor() {
    this.server = new Server(
      {
        name: "fontawesome-mcp",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize GraphQL client for FontAwesome API (will be updated with auth)
    this.graphqlClient = new GraphQLClient(FONTAWESOME_API_URL, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupToolHandlers();
  }

  // Get or refresh access token
  private async getAccessToken(): Promise<string | null> {
    if (!FA_TOKEN) {
      console.error("No FA_TOKEN found in environment variables");
      return null;
    }

    // Check if current token is still valid (with 5 minute buffer)
    const now = Date.now() / 1000;
    if (this.accessToken && now < (this.tokenExpiry - 300)) {
      return this.accessToken;
    }

    try {
      console.error(`Requesting new access token from FontAwesome...`);
      
      const response = await fetch(FONTAWESOME_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FA_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`Token request failed: ${response.status} ${response.statusText}`);
        return null;
      }

      const tokenData: AccessTokenResponse = await response.json();
      
      this.accessToken = tokenData.access_token;
      this.tokenExpiry = now + tokenData.expires_in;
      this.scopes = tokenData.scopes;

      console.error(`Access token obtained. Scopes: ${this.scopes.join(', ')}`);

      // Update GraphQL client with new token
      this.graphqlClient = new GraphQLClient(FONTAWESOME_API_URL, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.accessToken}`,
        },
      });

      return this.accessToken;
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  // Check if Pro features are available
  private async hasProAccess(): Promise<boolean> {
    const token = await this.getAccessToken();
    return token !== null && (
      this.scopes.includes('svg_icons_pro') || 
      this.scopes.includes('svg_icons_free')
    );
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
                        enum: ["CLASSIC", "DUOTONE", "SHARP", "SHARP_DUOTONE", "BRANDS"],
                      },
                      style: {
                        type: "string",
                        enum: ["SOLID", "REGULAR", "LIGHT", "THIN", "DUOTONE", "BRANDS"],
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
                        enum: ["CLASSIC", "DUOTONE", "SHARP", "SHARP_DUOTONE", "BRANDS"],
                      },
                      style: {
                        type: "string",
                        enum: ["SOLID", "REGULAR", "LIGHT", "THIN", "DUOTONE", "BRANDS"],
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
        ],
      };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "search_icons":
            return await this.searchIcons(args);
          case "get_icon_by_name":
            return await this.getIconByName(args);
          case "get_release_info":
            return await this.getReleaseInfo(args);
          case "get_family_styles":
            return await this.getFamilyStyles(args);
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

  private async searchIcons(args: any) {
    const {
      query,
      version = "7.x",
      limit = 15,
      include_svgs = false,
      family_styles,
      pro_only = false,
    } = args;

    if (!query) {
      throw new Error("Query parameter is required");
    }

    // Get access token if Pro features are requested
    if (include_svgs || pro_only) {
      const token = await this.getAccessToken();
      if (!token) {
        throw new Error("Pro features requested but authentication failed. Check your FA_TOKEN.");
      }
    }

    // Build the GraphQL query
    let svgFields = "";
    if (include_svgs) {
      let svgFilter = "";
      if (family_styles && family_styles.length > 0) {
        const filterItems = family_styles
          .map((fs: any) => `{ family: ${fs.family}, style: ${fs.style} }`)
          .join(", ");
        svgFilter = `(filter: { familyStyles: [${filterItems}] })`;
      }

      svgFields = `
        svgs${svgFilter} {
          familyStyle {
            family
            style
            prefix
          }
          width
          height
          html
          pathData
          iconDefinition
        }
      `;
    }

    const searchQuery = `
      query SearchIcons($version: String!, $query: String!, $first: Int!) {
        search(version: $version, query: $query, first: $first) {
          id
          label
          unicode
          changes
          familyStylesByLicense {
            free {
              family
              style
              prefix
            }
            pro {
              family
              style
              prefix
            }
          }
          aliases {
            names
            unicodes {
              composite
              primary
              secondary
            }
          }
          ${svgFields}
        }
      }
    `;

    try {
      const response = await this.graphqlClient.request(searchQuery, {
        version,
        query,
        first: Math.min(Math.max(limit, 1), 50),
      });

      const icons = (response as any).search || [];

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                query,
                version,
                results: icons.length,
                icons,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      throw new Error(`FontAwesome API error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getIconByName(args: any) {
    const {
      name,
      version = "7.x",
      include_svgs = false,
      family_styles,
      pro_only = false,
    } = args;

    if (!name) {
      throw new Error("Name parameter is required");
    }

    // Get access token if Pro features are requested
    if (include_svgs || pro_only) {
      const token = await this.getAccessToken();
      if (!token) {
        throw new Error("Pro features requested but authentication failed. Check your FA_TOKEN.");
      }
    }

    // Build the GraphQL query
    let svgFields = "";
    if (include_svgs) {
      let svgFilter = "";
      if (family_styles && family_styles.length > 0) {
        const filterItems = family_styles
          .map((fs: any) => `{ family: ${fs.family}, style: ${fs.style} }`)
          .join(", ");
        svgFilter = `(filter: { familyStyles: [${filterItems}] })`;
      }

      svgFields = `
        svgs${svgFilter} {
          familyStyle {
            family
            style
            prefix
          }
          width
          height
          html
          pathData
          iconDefinition
        }
      `;
    }

    const iconQuery = `
      query GetIcon($version: String!, $name: String!) {
        release(version: $version) {
          version
          icon(name: $name) {
            id
            label
            unicode
            changes
            familyStylesByLicense {
              free {
                family
                style
                prefix
              }
              pro {
                family
                style
                prefix
              }
            }
            aliases {
              names
              unicodes {
                composite
                primary
                secondary
              }
            }
            ${svgFields}
          }
        }
      }
    `;

    try {
      const response = await this.graphqlClient.request(iconQuery, {
        version,
        name,
      });

      const icon = (response as any).release?.icon;

      if (!icon) {
        return {
          content: [
            {
              type: "text",
              text: `Icon "${name}" not found in FontAwesome ${version}`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                name,
                version: (response as any).release.version,
                icon,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      throw new Error(`FontAwesome API error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getReleaseInfo(args: any) {
    const { version = "7.x", list_all = false } = args;

    if (list_all) {
      const releasesQuery = `
        query GetReleases {
          releases {
            version
            date
            isLatest
            iconCount {
              free
              pro
            }
          }
        }
      `;

      try {
        const response = await this.graphqlClient.request(releasesQuery);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  releases: (response as any).releases,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        throw new Error(`FontAwesome API error: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      const releaseQuery = `
        query GetRelease($version: String!) {
          release(version: $version) {
            version
            date
            isLatest
            iconCount {
              free
              pro
            }
            download {
              separatesWebDesktop
            }
          }
        }
      `;

      try {
        const response = await this.graphqlClient.request(releaseQuery, {
          version,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  release: (response as any).release,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        throw new Error(`FontAwesome API error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  private async getFamilyStyles(args: any) {
    const { version = "7.x" } = args;

    const familyStylesQuery = `
      query GetFamilyStyles($version: String!) {
        release(version: $version) {
          version
          familyStyles {
            family
            style
            prefix
          }
        }
      }
    `;

    try {
      const response = await this.graphqlClient.request(familyStylesQuery, {
        version,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                version: (response as any).release.version,
                familyStyles: (response as any).release.familyStyles,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      throw new Error(`FontAwesome API error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    const proStatus = FA_TOKEN ? "Pro API token available" : "Free API access only";
    console.error(`FontAwesome MCP server running on stdio (${proStatus})`);
  }
}

// Start the server
const server = new FontAwesomeMCPServer();
server.run().catch(console.error);
