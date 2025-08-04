/**
 * Search icons tool implementation
 */

import { BaseTool } from "./BaseTool.js";
import { SearchIconsArgs, SupportedFramework } from "../types/index.js";
import { FontAwesomeAPIClient } from "../api/index.js";
import { trySmartSearch, validateLimit, createSvgFilter } from "../utils/index.js";
import { generateFrameworkUsage, FRAMEWORK_USAGE } from "../framework/index.js";
import { GET_ICON_SVGS_QUERY } from "../api/queries.js";

export class SearchIconsTool extends BaseTool {
  private framework: SupportedFramework;

  constructor(apiClient: FontAwesomeAPIClient, framework: SupportedFramework = 'vanilla') {
    super(apiClient);
    this.framework = framework;
  }

  async execute(args: SearchIconsArgs) {
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

    await this.validateCommonArgs(args);

    const normalizedLimit = validateLimit(limit);

    // Try smart search first (without SVGs for performance)
    let icons = await trySmartSearch(this.apiClient, query, version, normalizedLimit);

    // If we found icons and need SVGs, fetch them separately
    if (icons.length > 0 && include_svgs) {
      const svgFilter = createSvgFilter(family_styles);

      // Fetch SVG data for each icon
      const iconsWithSvgs = await Promise.all(
        icons.map(async (icon) => {
          try {
            const response = await this.apiClient.request(GET_ICON_SVGS_QUERY(svgFilter), {
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
        family_styles.map((fs) => `${fs.family}-${fs.style}`)
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
      framework: this.framework.toUpperCase(),
      results: icons.length,
      icons: icons.map(icon => ({
        ...icon,
        frameworkUsage: generateFrameworkUsage(icon, this.framework)
      })),
      searchStrategy: icons.length > 0 ? "success" : "no_results",
      suggestions: icons.length === 0 ? [
        `Try simpler keywords (e.g., "${query.split(' ')[0]}")`,
        "Check if the icon exists in FontAwesome",
        "Try related terms or synonyms",
        pro_only ? "Try without pro_only filter" : "Consider using pro_only for more icons"
      ] : undefined,
      frameworkInfo: this.framework !== 'vanilla' ? FRAMEWORK_USAGE[this.framework] : undefined,
    };

    return this.createResponse(response);
  }
}
