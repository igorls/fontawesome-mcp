/**
 * Framework-specific usage pattern types
 */

// Framework-specific usage patterns
export interface FrameworkUsage {
  name: string;
  iconLibraryMethod: {
    description: string;
    import: string;
    register: string;
    usage: string;
    example: string;
  };
  explicitMethod: {
    description: string;
    import: string;
    usage: string;
    example: string;
  };
}

// Supported framework types
export type SupportedFramework = 'angular' | 'react' | 'vue' | 'vanilla';

// Framework usage response for API
export interface FrameworkUsageResponse {
  framework: string;
  icon: {
    name: string;
    camelCase: string;
    prefix: string;
    family: string;
    style: string;
  };
  availableFamilies: Array<{
    family: string;
    style: string;
    prefix: string;
  }>;
  usage: any; // Framework-specific usage patterns
}
