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
const FA_TOKEN = process.env.FA_TOKEN || process.env.FONTAWESOME_API_TOKEN;

// Get framework preference from environment variables
const FRAMEWORK = (process.env.FRAMEWORK || process.env.FA_FRAMEWORK || 'vanilla').toLowerCase();

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

// Framework-specific usage patterns
interface FrameworkUsage {
  name: string;
  iconLibraryMethod: {
    description: string;
    import: string;
    register: string;
    usage: string;
    example: string;
  };
  explicitMethod: {
    description: string;
    import: string;
    usage: string;
    example: string;
  };
}

const FRAMEWORK_USAGE: Record<string, FrameworkUsage> = {
  angular: {
    name: "Angular",
    iconLibraryMethod: {
      description: "Icon Library method - Register icons once and use by name (recommended)",
      import: `import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';`,
      register: `constructor(library: FaIconLibrary) {
  library.addIconPacks(fas, far, fab);
  // Or register specific icons:
  // library.addIcons(faCoffee, faUser);
}`,
      usage: `<fa-icon icon="coffee"></fa-icon>
<fa-icon icon="['solid', 'coffee']"></fa-icon>
<fa-icon icon="['regular', 'user']"></fa-icon>`,
      example: `// Component
constructor(library: FaIconLibrary) {
  library.addIconPacks(fas);
}

// Template
<fa-icon icon="coffee"></fa-icon>`
    },
    explicitMethod: {
      description: "Explicit Reference method - Import and reference icons directly",
      import: `import { faCoffee } from '@fortawesome/free-solid-svg-icons';`,
      usage: `<fa-icon [icon]="faCoffee"></fa-icon>`,
      example: `// Component
import { faCoffee } from '@fortawesome/free-solid-svg-icons';

export class MyComponent {
  faCoffee = faCoffee;
}

// Template
<fa-icon [icon]="faCoffee"></fa-icon>`
    }
  },
  react: {
    name: "React",
    iconLibraryMethod: {
      description: "Icon Library method - Build a library and reference by name",
      import: `import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';`,
      register: `library.add(fas);
// Or add specific icons:
// library.add(faCoffee, faUser);`,
      usage: `<FontAwesomeIcon icon="coffee" />
<FontAwesomeIcon icon={["fas", "coffee"]} />`,
      example: `// App.js
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
library.add(fas);

// Component
<FontAwesomeIcon icon="coffee" />`
    },
    explicitMethod: {
      description: "Explicit Reference method - Import and use icons directly",
      import: `import { faCoffee } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';`,
      usage: `<FontAwesomeIcon icon={faCoffee} />`,
      example: `// Component
import { faCoffee } from '@fortawesome/free-solid-svg-icons';

function MyComponent() {
  return <FontAwesomeIcon icon={faCoffee} />;
}`
    }
  },
  vue: {
    name: "Vue.js",
    iconLibraryMethod: {
      description: "Icon Library method - Register icons globally",
      import: `import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';`,
      register: `library.add(fas);
// Register component globally
app.component('font-awesome-icon', FontAwesomeIcon);`,
      usage: `<font-awesome-icon icon="coffee" />
<font-awesome-icon :icon="['fas', 'coffee']" />`,
      example: `// main.js
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
library.add(fas);

// Template
<font-awesome-icon icon="coffee" />`
    },
    explicitMethod: {
      description: "Explicit Reference method - Import and use icons directly",
      import: `import { faCoffee } from '@fortawesome/free-solid-svg-icons';`,
      usage: `<font-awesome-icon :icon="faCoffee" />`,
      example: `// Component
import { faCoffee } from '@fortawesome/free-solid-svg-icons';

export default {
  data() {
    return {
      faCoffee
    };
  }
};

// Template
<font-awesome-icon :icon="faCoffee" />`
    }
  },
  vanilla: {
    name: "Vanilla HTML/CSS",
    iconLibraryMethod: {
      description: "CSS Classes method - Use FontAwesome CSS classes directly",
      import: `<!-- CSS -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.0/css/all.min.css">
<!-- Or Pro CSS -->
<link rel="stylesheet" href="https://pro.fontawesome.com/releases/v7.0.0/css/all.css">`,
      register: `<!-- No registration needed -->`,
      usage: `<i class="fas fa-coffee"></i>
<i class="far fa-user"></i>
<i class="fab fa-github"></i>`,
      example: `<!-- HTML -->
<i class="fas fa-coffee"></i>
<span>Coffee time!</span>`
    },
    explicitMethod: {
      description: "SVG method - Use FontAwesome SVG JavaScript",
      import: `<!-- JavaScript -->
<script src="https://kit.fontawesome.com/your-kit-id.js" crossorigin="anonymous"></script>`,
      usage: `<i class="fas fa-coffee"></i>
<!-- FontAwesome will convert to SVG -->`,
      example: `<!-- HTML -->
<i class="fas fa-coffee"></i>
<!-- Automatically converted to SVG by FontAwesome JS -->`
    }
  }
};

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

  // Generate framework-specific usage instructions for an icon
  private generateFrameworkUsage(icon: FontAwesomeIcon, framework: string = FRAMEWORK): any {
    const frameworkConfig = FRAMEWORK_USAGE[framework] || FRAMEWORK_USAGE.vanilla;
    
    // Convert icon name to framework-specific format
    const iconName = icon.id;
    const camelCaseIcon = `fa${iconName.split('-').map((word: string) => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('')}`;
    
    // Get available families for this icon
    const allFamilies = [
      ...(icon.familyStylesByLicense?.free || []),
      ...(icon.familyStylesByLicense?.pro || []),
    ];
    
    // Determine the primary family/style (prefer solid, then regular)
    const primaryFamily = allFamilies.find(f => f.style === 'solid') || 
                         allFamilies.find(f => f.style === 'regular') || 
                         allFamilies[0];
    
    if (!primaryFamily) {
      return null;
    }

    const result: any = {
      framework: frameworkConfig.name,
      icon: {
        name: iconName,
        camelCase: camelCaseIcon,
        prefix: primaryFamily.prefix,
        family: primaryFamily.family,
        style: primaryFamily.style
      },
      availableFamilies: allFamilies,
      usage: {}
    };

    // Generate framework-specific usage patterns
    switch (framework) {
      case 'angular':
        result.usage = {
          iconLibrary: {
            description: frameworkConfig.iconLibraryMethod.description,
            import: `import { ${camelCaseIcon} } from '@fortawesome/free-${primaryFamily.family === 'classic' ? 'solid' : primaryFamily.family}-svg-icons';`,
            register: `// In your component or module
constructor(library: FaIconLibrary) {
  library.addIcons(${camelCaseIcon});
}`,
            template: `<fa-icon icon="${iconName}"></fa-icon>
<!-- Or with explicit family/style -->
<fa-icon icon="['${primaryFamily.style}', '${iconName}']"></fa-icon>`
          },
          explicitReference: {
            description: frameworkConfig.explicitMethod.description,
            import: `import { ${camelCaseIcon} } from '@fortawesome/free-${primaryFamily.family === 'classic' ? 'solid' : primaryFamily.family}-svg-icons';`,
            component: `export class MyComponent {
  ${camelCaseIcon} = ${camelCaseIcon};
}`,
            template: `<fa-icon [icon]="${camelCaseIcon}"></fa-icon>`
          }
        };
        break;
        
      case 'react':
        result.usage = {
          iconLibrary: {
            description: frameworkConfig.iconLibraryMethod.description,
            import: frameworkConfig.iconLibraryMethod.import,
            register: `import { ${camelCaseIcon} } from '@fortawesome/free-${primaryFamily.family === 'classic' ? 'solid' : primaryFamily.family}-svg-icons';
library.add(${camelCaseIcon});`,
            component: `<FontAwesomeIcon icon="${iconName}" />
{/* Or with explicit family/style */}
<FontAwesomeIcon icon={["${primaryFamily.prefix.replace('fa', '')}", "${iconName}"]} />`
          },
          explicitReference: {
            description: frameworkConfig.explicitMethod.description,
            import: `import { ${camelCaseIcon} } from '@fortawesome/free-${primaryFamily.family === 'classic' ? 'solid' : primaryFamily.family}-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';`,
            component: `function MyComponent() {
  return <FontAwesomeIcon icon={${camelCaseIcon}} />;
}`
          }
        };
        break;
        
      case 'vue':
        result.usage = {
          iconLibrary: {
            description: frameworkConfig.iconLibraryMethod.description,
            import: frameworkConfig.iconLibraryMethod.import,
            register: `import { ${camelCaseIcon} } from '@fortawesome/free-${primaryFamily.family === 'classic' ? 'solid' : primaryFamily.family}-svg-icons';
library.add(${camelCaseIcon});`,
            template: `<font-awesome-icon icon="${iconName}" />
<!-- Or with explicit family/style -->
<font-awesome-icon :icon="['${primaryFamily.style}', '${iconName}']" />`
          },
          explicitReference: {
            description: frameworkConfig.explicitMethod.description,
            import: `import { ${camelCaseIcon} } from '@fortawesome/free-${primaryFamily.family === 'classic' ? 'solid' : primaryFamily.family}-svg-icons';`,
            component: `export default {
  data() {
    return {
      ${camelCaseIcon}
    };
  }
};`,
            template: `<font-awesome-icon :icon="${camelCaseIcon}" />`
          }
        };
        break;
        
      default: // vanilla
        result.usage = {
          cssClasses: {
            description: frameworkConfig.iconLibraryMethod.description,
            import: frameworkConfig.iconLibraryMethod.import,
            html: `<i class="${primaryFamily.prefix} fa-${iconName}"></i>`
          },
          svgMethod: {
            description: frameworkConfig.explicitMethod.description,
            import: frameworkConfig.explicitMethod.import,
            html: `<i class="${primaryFamily.prefix} fa-${iconName}"></i>
<!-- FontAwesome Kit will convert to SVG -->`
          }
        };
        break;
    }
    
    return result;
  }

  // Check if Pro features are available
  private async hasProAccess(): Promise<boolean> {
    const token = await this.getAccessToken();
    return token !== null && (
      this.scopes.includes('svg_icons_pro') || 
      this.scopes.includes('svg_icons_free')
    );
  }

  // Helper method to try multiple search strategies
  private async trySmartSearch(query: string, version: string, limit: number): Promise<any[]> {
    const searchStrategies = [
      query, // Original query
      ...query.split(' '), // Individual words
      query.replace(/[^a-zA-Z0-9\s]/g, ''), // Remove special characters
    ];

    for (const searchTerm of searchStrategies) {
      if (!searchTerm.trim()) continue;
      
      try {
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
            }
          }
        `;

        const response = await this.graphqlClient.request(searchQuery, {
          version,
          query: searchTerm,
          first: limit,
        });

        const icons = (response as any).search || [];
        if (icons.length > 0) {
          return icons;
        }
      } catch (error) {
        console.error(`Search strategy "${searchTerm}" failed:`, error);
        continue;
      }
    }

    return [];
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
            return await this.searchIcons(args);
          case "get_icon_by_name":
            return await this.getIconByName(args);
          case "get_release_info":
            return await this.getReleaseInfo(args);
          case "get_family_styles":
            return await this.getFamilyStyles(args);
          case "get_pro_plus_showcase":
            return await this.getProPlusShowcase(args);
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

    // Validate family_styles parameter
    if (family_styles && family_styles.length > 0) {
      const validFamilies = ["classic", "duotone", "sharp", "sharp-duotone", "brands", "chisel", "etch", "jelly", "jelly-duo", "jelly-fill", "notdog", "notdog-duo", "slab", "slab-press", "thumbprint", "whiteboard"];
      const validStyles = ["solid", "regular", "light", "thin", "brands", "duotone", "semibold"];
      
      for (const fs of family_styles) {
        if (!validFamilies.includes(fs.family.toLowerCase())) {
          throw new Error(`Invalid family "${fs.family}". Valid families: ${validFamilies.join(', ')}`);
        }
        if (!validStyles.includes(fs.style.toLowerCase())) {
          throw new Error(`Invalid style "${fs.style}". Valid styles: ${validStyles.join(', ')}`);
        }
      }
    }

    // Try smart search first (without SVGs for performance)
    let icons = await this.trySmartSearch(query, version, Math.min(Math.max(limit, 1), 50));

    // If we found icons and need SVGs, fetch them separately
    if (icons.length > 0 && include_svgs) {
      // Build the GraphQL query with SVG data
      let svgFilter = "";
      if (family_styles && family_styles.length > 0) {
        const filterItems = family_styles
          .map((fs: any) => `{ family: ${fs.family.toUpperCase()}, style: ${fs.style.toUpperCase()} }`)
          .join(", ");
        svgFilter = `(filter: { familyStyles: [${filterItems}] })`;
      }

      const svgFields = `
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

      // Fetch SVG data for each icon
      const iconsWithSvgs = await Promise.all(
        icons.map(async (icon) => {
          try {
            const iconQuery = `
              query GetIcon($version: String!, $name: String!) {
                release(version: $version) {
                  icon(name: $name) {
                    ${svgFields}
                  }
                }
              }
            `;
            
            const response = await this.graphqlClient.request(iconQuery, {
              version,
              name: icon.id,
            });

            const svgs = (response as any).release?.icon?.svgs || [];
            return { ...icon, svgs };
          } catch (error) {
            console.error(`Failed to fetch SVGs for icon ${icon.id}:`, error);
            return icon;
          }
        })
      );

      icons = iconsWithSvgs;
    }

    // Filter by family_styles if specified (post-processing for better UX)
    if (family_styles && family_styles.length > 0) {
      const familyStyleSet = new Set(
        family_styles.map((fs: any) => `${fs.family}-${fs.style}`)
      );

      icons = icons.filter((icon) => {
        const availableStyles = [
          ...(icon.familyStylesByLicense?.free || []),
          ...(icon.familyStylesByLicense?.pro || []),
        ];
        
        return availableStyles.some((style) => 
          familyStyleSet.has(`${style.family}-${style.style}`)
        );
      });
    }

    // Add helpful metadata
    const response = {
      query,
      version,
      framework: FRAMEWORK,
      results: icons.length,
      icons: icons.map(icon => ({
        ...icon,
        frameworkUsage: this.generateFrameworkUsage(icon)
      })),
      searchStrategy: icons.length > 0 ? "success" : "no_results",
      suggestions: icons.length === 0 ? [
        `Try simpler keywords (e.g., "${query.split(' ')[0]}")`,
        "Check if the icon exists in FontAwesome",
        "Try related terms or synonyms",
        pro_only ? "Try without pro_only filter" : "Consider using pro_only for more icons"
      ] : undefined,
      frameworkInfo: FRAMEWORK !== 'vanilla' ? FRAMEWORK_USAGE[FRAMEWORK] : undefined,
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
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
        // Try to find similar icons using search
        const similarIcons = await this.trySmartSearch(name, version, 5);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                name,
                version: (response as any).release?.version || version,
                found: false,
                message: `Icon "${name}" not found in FontAwesome ${version}`,
                suggestions: similarIcons.length > 0 ? {
                  message: "Did you mean one of these?",
                  icons: similarIcons.map(icon => ({
                    id: icon.id,
                    label: icon.label,
                    aliases: icon.aliases?.names || []
                  }))
                } : {
                  message: "Try using the search_icons tool to find similar icons",
                  tips: [
                    "Check for typos in the icon name",
                    "Try searching for related keywords",
                    "Visit fontawesome.com to browse available icons"
                  ]
                }
              }, null, 2),
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
                framework: FRAMEWORK,
                icon: {
                  ...icon,
                  frameworkUsage: this.generateFrameworkUsage(icon)
                },
                frameworkInfo: FRAMEWORK !== 'vanilla' ? FRAMEWORK_USAGE[FRAMEWORK] : undefined,
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

  private async getProPlusShowcase(args: any) {
    const { version = "7.x", icons_per_family = 4, include_svgs = false } = args;

    // Get access token (Pro+ families require Pro access)
    const token = await this.getAccessToken();
    if (!token) {
      throw new Error("Pro+ showcase requires authentication. Check your FA_TOKEN.");
    }

    const proPlusFamilies = [
      { family: "chisel", style: "regular", prefix: "facr", description: "Bold, carved aesthetic with strong geometric lines" },
      { family: "etch", style: "solid", prefix: "faes", description: "Hand-drawn aesthetic with sketchy, artistic lines" },
      { family: "jelly", style: "regular", prefix: "fajr", description: "Soft, rounded forms with playful, bouncy appearance" },
      { family: "notdog", style: "solid", prefix: "fans", description: "Quirky, unconventional style breaking traditional design rules" },
      { family: "slab", style: "regular", prefix: "faslr", description: "Bold, chunky letterforms with strong serifs" },
      { family: "thumbprint", style: "light", prefix: "fatl", description: "Textured, fingerprint-like patterns with security aesthetics" },
      { family: "whiteboard", style: "semibold", prefix: "fawsb", description: "Clean, marker-drawn style perfect for presentations" },
    ];

    // Common icons that are likely to exist across families
    const commonIconNames = ["star", "heart", "home", "user", "check", "times", "plus", "minus", "arrow-right", "envelope"];

    const showcaseResults = [];

    for (const familyInfo of proPlusFamilies) {
      const familyIcons = [];
      
      // Try to find icons available in this Pro+ family
      for (const iconName of commonIconNames) {
        if (familyIcons.length >= icons_per_family) break;
        
        try {
          const iconQuery = `
            query GetIcon($version: String!, $name: String!) {
              release(version: $version) {
                icon(name: $name) {
                  id
                  label
                  unicode
                  familyStylesByLicense {
                    pro {
                      family
                      style
                      prefix
                    }
                  }
                  ${include_svgs ? `
                    svgs(filter: { familyStyles: [{ family: ${familyInfo.family.toUpperCase()}, style: ${familyInfo.style.toUpperCase()} }] }) {
                      familyStyle {
                        family
                        style
                        prefix
                      }
                      width
                      height
                      html
                      pathData
                    }
                  ` : ''}
                }
              }
            }
          `;

          const response = await this.graphqlClient.request(iconQuery, {
            version,
            name: iconName,
          });

          const icon = (response as any).release?.icon;
          if (icon && icon.familyStylesByLicense?.pro) {
            // Check if this icon is available in the current Pro+ family
            const hasFamily = icon.familyStylesByLicense.pro.some(
              (fs: any) => fs.family === familyInfo.family && fs.style === familyInfo.style
            );
            
            if (hasFamily) {
              familyIcons.push({
                id: icon.id,
                label: icon.label,
                unicode: icon.unicode,
                prefix: familyInfo.prefix,
                svgs: icon.svgs || undefined,
              });
            }
          }
        } catch (error) {
          console.error(`Failed to fetch icon ${iconName} for family ${familyInfo.family}:`, error);
          continue;
        }
      }

      showcaseResults.push({
        family: familyInfo.family,
        style: familyInfo.style,
        prefix: familyInfo.prefix,
        description: familyInfo.description,
        iconCount: familyIcons.length,
        icons: familyIcons,
      });
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              version,
              message: "FontAwesome Pro+ Style Families Showcase",
              families: showcaseResults,
              usage: {
                html: "Use class names like 'facr fa-star' for Chisel Regular star icon",
                css: "Ensure you have FontAwesome Pro v7+ loaded with Pro+ families enabled",
                note: "Pro+ families require active FontAwesome Pro subscription"
              },
              totalIcons: showcaseResults.reduce((sum, family) => sum + family.iconCount, 0),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // Test authentication and provide detailed status
    const hasToken = !!FA_TOKEN;
    let authStatus = "Free API access only";
    let iconCount = "Unknown";
    
    if (hasToken) {
      try {
        const token = await this.getAccessToken();
        if (token) {
          authStatus = `Pro API access (scopes: ${this.scopes.join(', ')})`;
          
          // Try to get icon count
          try {
            const releaseQuery = `
              query GetRelease($version: String!) {
                release(version: $version) {
                  iconCount {
                    free
                    pro
                  }
                }
              }
            `;
            const response = await this.graphqlClient.request(releaseQuery, { version: "7.x" });
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
    
    console.error(`FontAwesome MCP Server v0.1.0`);
    console.error(`Framework: ${FRAMEWORK.toUpperCase()} (${FRAMEWORK_USAGE[FRAMEWORK]?.name || 'Unknown'})`);
    console.error(`Status: ${authStatus}`);
    console.error(`Icons: ${iconCount}`);
    console.error(`Server running on stdio transport`);
    console.error(`---`);
    console.error(`Available tools: search_icons, get_icon_by_name, get_release_info, get_family_styles, get_pro_plus_showcase`);
    console.error(`Pro+ families: chisel, etch, jelly, notdog, slab, thumbprint, whiteboard`);
    console.error(`Set FRAMEWORK env var to: angular, react, vue, vanilla (current: ${FRAMEWORK})`);
  }
}

// Start the server
const server = new FontAwesomeMCPServer();
server.run().catch(console.error);
