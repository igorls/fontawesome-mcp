/**
 * Environment configuration utilities
 */

import { SupportedFramework } from "../types/index.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Get FontAwesome API token from environment
 */
export function getFAToken(): string | null {
  return process.env.FA_TOKEN || process.env.FONTAWESOME_API_TOKEN || null;
}

/**
 * Get framework preference from environment
 */
export function getFramework(): SupportedFramework {
  const framework = (process.env.FRAMEWORK || process.env.FA_FRAMEWORK || 'vanilla').toLowerCase();
  
  if (['angular', 'react', 'vue', 'vanilla'].includes(framework)) {
    return framework as SupportedFramework;
  }
  
  return 'vanilla';
}
