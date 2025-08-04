/**
 * Get icon by name tool implementation
 */

import { BaseTool } from "./BaseTool.js";
import { GetIconByNameArgs, SupportedFramework } from "../types/index.js";
import { FontAwesomeAPIClient } from "../api/index.js";
import { trySmartSearch, createSvgFilter } from "../utils/index.js";
import { generateFrameworkUsage, FRAMEWORK_USAGE } from "../framework/index.js";
import { GET_ICON_QUERY } from "../api/queries.js";

export class GetIconByNameTool extends BaseTool {
  private framework: SupportedFramework;

  constructor(apiClient: FontAwesomeAPIClient, framework: SupportedFramework = 'vanilla') {
    super(apiClient);
    this.framework = framework;
  }

  async execute(args: GetIconByNameArgs) {
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

    await this.validateCommonArgs(args);

    // Build the GraphQL query
    let svgFilter = "";
    if (include_svgs && family_styles && family_styles.length > 0) {
      svgFilter = createSvgFilter(family_styles);
    }

    try {
      const response = await this.apiClient.request(GET_ICON_QUERY(include_svgs, svgFilter), {
        version,
        name,
      });

      const icon = (response as any).release?.icon;

      if (!icon) {
        // Try to find similar icons using search
        const similarIcons = await trySmartSearch(this.apiClient, name, version, 5);
        
        return this.createResponse({
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
        });
      }

      return this.createResponse({
        name,
        version: (response as any).release.version,
        framework: this.framework.toUpperCase(),
        icon: {
          ...icon,
          frameworkUsage: generateFrameworkUsage(icon, this.framework)
        },
        frameworkInfo: this.framework !== 'vanilla' ? FRAMEWORK_USAGE[this.framework] : undefined,
      });
    } catch (error) {
      throw new Error(`FontAwesome API error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
