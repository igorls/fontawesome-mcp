/**
 * Icon search utilities
 */

import { FontAwesomeAPIClient } from "../api/index.js";
import { FontAwesomeIcon } from "../types/index.js";
import { SEARCH_ICONS_QUERY } from "../api/queries.js";

/**
 * Try multiple search strategies to find icons
 */
export async function trySmartSearch(
  apiClient: FontAwesomeAPIClient,
  query: string,
  version: string,
  limit: number
): Promise<FontAwesomeIcon[]> {
  const searchStrategies = [
    query, // Original query
    ...query.split(' '), // Individual words
    query.replace(/[^a-zA-Z0-9\s]/g, ''), // Remove special characters
  ];

  for (const searchTerm of searchStrategies) {
    if (!searchTerm.trim()) continue;
    
    try {
      const response = await apiClient.request(SEARCH_ICONS_QUERY, {
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
