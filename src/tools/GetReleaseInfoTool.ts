/**
 * Get release info tool implementation
 */

import { BaseTool } from "./BaseTool.js";
import { GetReleaseInfoArgs } from "../types/index.js";
import { GET_RELEASES_QUERY, GET_RELEASE_QUERY } from "../api/queries.js";

export class GetReleaseInfoTool extends BaseTool {
  async execute(args: GetReleaseInfoArgs) {
    const { version = "7.x", list_all = false } = args;

    if (list_all) {
      try {
        const response = await this.apiClient.request(GET_RELEASES_QUERY);
        return this.createResponse({
          releases: (response as any).releases,
        });
      } catch (error) {
        throw new Error(`FontAwesome API error: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      try {
        const response = await this.apiClient.request(GET_RELEASE_QUERY, {
          version,
        });

        return this.createResponse({
          release: (response as any).release,
        });
      } catch (error) {
        throw new Error(`FontAwesome API error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
}
