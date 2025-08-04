/**
 * FontAwesome API client for authentication and GraphQL requests
 */

import { GraphQLClient } from "graphql-request";
import { AccessTokenResponse } from "../types/index.js";

// FontAwesome API endpoints
export const FONTAWESOME_API_URL = "https://api.fontawesome.com";
export const FONTAWESOME_TOKEN_URL = "https://api.fontawesome.com/token";

export class FontAwesomeAPIClient {
  private graphqlClient: GraphQLClient;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private scopes: string[] = [];
  private faToken: string | null;

  constructor(faToken?: string) {
    this.faToken = faToken || process.env.FA_TOKEN || process.env.FONTAWESOME_API_TOKEN || null;
    
    // Initialize GraphQL client
    this.graphqlClient = new GraphQLClient(FONTAWESOME_API_URL, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Get or refresh access token
   */
  async getAccessToken(): Promise<string | null> {
    if (!this.faToken) {
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
          'Authorization': `Bearer ${this.faToken}`,
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

  /**
   * Check if Pro features are available
   */
  async hasProAccess(): Promise<boolean> {
    const token = await this.getAccessToken();
    return token !== null && (
      this.scopes.includes('svg_icons_pro') || 
      this.scopes.includes('svg_icons_free')
    );
  }

  /**
   * Execute a GraphQL query
   */
  async request<T = any>(query: string, variables?: any): Promise<T> {
    return this.graphqlClient.request<T>(query, variables);
  }

  /**
   * Get current token scopes
   */
  getScopes(): string[] {
    return [...this.scopes];
  }

  /**
   * Check if API token is configured
   */
  hasToken(): boolean {
    return !!this.faToken;
  }
}
