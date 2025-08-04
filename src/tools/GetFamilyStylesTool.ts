/**
 * Get family styles tool implementation
 */

import { BaseTool } from "./BaseTool.js";
import { GetFamilyStylesArgs } from "../types/index.js";
import { GET_FAMILY_STYLES_QUERY } from "../api/queries.js";

export class GetFamilyStylesTool extends BaseTool {
  async execute(args: GetFamilyStylesArgs) {
    const { version = "7.x" } = args;

    try {
      const response = await this.apiClient.request(GET_FAMILY_STYLES_QUERY, {
        version,
      });

      return this.createResponse({
        version: (response as any).release.version,
        familyStyles: (response as any).release.familyStyles,
      });
    } catch (error) {
      throw new Error(`FontAwesome API error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
