/**
 * MCP tool interfaces and types
 */

// Base tool arguments interface
export interface BaseToolArgs {
  version?: string;
  include_svgs?: boolean;
  pro_only?: boolean;
  family_styles?: Array<{
    family: string;
    style: string;
  }>;
}

// Search icons tool arguments
export interface SearchIconsArgs extends BaseToolArgs {
  query: string;
  limit?: number;
}

// Get icon by name tool arguments
export interface GetIconByNameArgs extends BaseToolArgs {
  name: string;
}

// Get release info tool arguments
export interface GetReleaseInfoArgs {
  version?: string;
  list_all?: boolean;
}

// Get family styles tool arguments
export interface GetFamilyStylesArgs {
  version?: string;
}

// Get Pro+ showcase tool arguments  
export interface GetProPlusShowcaseArgs {
  version?: string;
  icons_per_family?: number;
  include_svgs?: boolean;
}
