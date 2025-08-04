/**
 * FontAwesome API types and interfaces
 */

// Interface for FontAwesome access token response
export interface AccessTokenResponse {
  access_token: string;
  expires_in: number;
  scopes: string[];
  token_type: string;
}

// Interface for FontAwesome Icon based on the GraphQL API documentation
export interface FontAwesomeIcon {
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
export interface Release {
  version: string;
  date: string;
  isLatest: boolean;
  iconCount: {
    free: number;
    pro: number;
  };
}

// Interface for family/style filtering
export interface FamilyStyle {
  family: string;
  style: string;
}

// Valid families and styles for validation
export const VALID_FAMILIES = [
  "classic", "duotone", "sharp", "sharp-duotone", "brands", 
  "chisel", "etch", "jelly", "jelly-duo", "jelly-fill", 
  "notdog", "notdog-duo", "slab", "slab-press", "thumbprint", "whiteboard"
] as const;

export const VALID_STYLES = [
  "solid", "regular", "light", "thin", "brands", "duotone", "semibold"
] as const;

export type ValidFamily = typeof VALID_FAMILIES[number];
export type ValidStyle = typeof VALID_STYLES[number];
