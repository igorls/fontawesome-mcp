/**
 * Base tool class with common functionality
 */

import { FontAwesomeAPIClient } from "../api/index.js";
import { BaseToolArgs } from "../types/index.js";
import { validateFamilyStyles } from "../utils/index.js";

export abstract class BaseTool {
  protected apiClient: FontAwesomeAPIClient;

  constructor(apiClient: FontAwesomeAPIClient) {
    this.apiClient = apiClient;
  }

  /**
   * Validate common arguments and check authentication if needed
   */
  protected async validateCommonArgs(args: BaseToolArgs): Promise<void> {
    const { include_svgs = false, pro_only = false, family_styles } = args;

    // Get access token if Pro features are requested
    if (include_svgs || pro_only) {
      const token = await this.apiClient.getAccessToken();
      if (!token) {
        throw new Error("Pro features requested but authentication failed. Check your FA_TOKEN.");
      }
    }

    // Validate family_styles parameter
    if (family_styles && family_styles.length > 0) {
      validateFamilyStyles(family_styles);
    }
  }

  /**
   * Create a formatted response object
   */
  protected createResponse(data: any): { content: Array<{ type: string; text: string }> } {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  /**
   * Create an error response
   */
  protected createErrorResponse(message: string): { content: Array<{ type: string; text: string }>; isError: boolean } {
    return {
      content: [
        {
          type: "text",
          text: message,
        },
      ],
      isError: true,
    };
  }
}
