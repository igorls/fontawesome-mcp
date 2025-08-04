/**
 * Framework-specific usage generator
 */

import { FontAwesomeIcon, FrameworkUsageResponse, SupportedFramework } from "../types/index.js";
import { FRAMEWORK_USAGE } from "./config.js";

/**
 * Generate framework-specific usage instructions for an icon
 */
export function generateFrameworkUsage(
  icon: FontAwesomeIcon, 
  framework: SupportedFramework = 'vanilla'
): FrameworkUsageResponse | null {
  const frameworkConfig = FRAMEWORK_USAGE[framework] || FRAMEWORK_USAGE.vanilla;
  
  // Convert icon name to framework-specific format
  const iconName = icon.id;
  const camelCaseIcon = `fa${iconName.split('-').map((word: string) => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join('')}`;
  
  // Get available families for this icon
  const allFamilies = [
    ...(icon.familyStylesByLicense?.free || []),
    ...(icon.familyStylesByLicense?.pro || []),
  ];
  
  // Determine the primary family/style (prefer solid, then regular)
  const primaryFamily = allFamilies.find(f => f.style === 'solid') || 
                       allFamilies.find(f => f.style === 'regular') || 
                       allFamilies[0];
  
  if (!primaryFamily) {
    return null;
  }

  const result: FrameworkUsageResponse = {
    framework: frameworkConfig.name,
    icon: {
      name: iconName,
      camelCase: camelCaseIcon,
      prefix: primaryFamily.prefix,
      family: primaryFamily.family,
      style: primaryFamily.style
    },
    availableFamilies: allFamilies,
    usage: {}
  };

  // Generate framework-specific usage patterns
  switch (framework) {
    case 'angular':
      result.usage = {
        iconLibrary: {
          description: frameworkConfig.iconLibraryMethod.description,
          import: `import { ${camelCaseIcon} } from '@fortawesome/free-${primaryFamily.family === 'classic' ? 'solid' : primaryFamily.family}-svg-icons';`,
          register: `// In your component or module
constructor(library: FaIconLibrary) {
  library.addIcons(${camelCaseIcon});
}`,
          template: `<fa-icon icon="${iconName}"></fa-icon>
<!-- Or with explicit family/style -->
<fa-icon icon="['${primaryFamily.style}', '${iconName}']"></fa-icon>`
        },
        explicitReference: {
          description: frameworkConfig.explicitMethod.description,
          import: `import { ${camelCaseIcon} } from '@fortawesome/free-${primaryFamily.family === 'classic' ? 'solid' : primaryFamily.family}-svg-icons';`,
          component: `export class MyComponent {
  ${camelCaseIcon} = ${camelCaseIcon};
}`,
          template: `<fa-icon [icon]="${camelCaseIcon}"></fa-icon>`
        }
      };
      break;
      
    case 'react':
      result.usage = {
        iconLibrary: {
          description: frameworkConfig.iconLibraryMethod.description,
          import: frameworkConfig.iconLibraryMethod.import,
          register: `import { ${camelCaseIcon} } from '@fortawesome/free-${primaryFamily.family === 'classic' ? 'solid' : primaryFamily.family}-svg-icons';
library.add(${camelCaseIcon});`,
          component: `<FontAwesomeIcon icon="${iconName}" />
{/* Or with explicit family/style */}
<FontAwesomeIcon icon={["${primaryFamily.prefix.replace('fa', '')}", "${iconName}"]} />`
        },
        explicitReference: {
          description: frameworkConfig.explicitMethod.description,
          import: `import { ${camelCaseIcon} } from '@fortawesome/free-${primaryFamily.family === 'classic' ? 'solid' : primaryFamily.family}-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';`,
          component: `function MyComponent() {
  return <FontAwesomeIcon icon={${camelCaseIcon}} />;
}`
        }
      };
      break;
      
    case 'vue':
      result.usage = {
        iconLibrary: {
          description: frameworkConfig.iconLibraryMethod.description,
          import: frameworkConfig.iconLibraryMethod.import,
          register: `import { ${camelCaseIcon} } from '@fortawesome/free-${primaryFamily.family === 'classic' ? 'solid' : primaryFamily.family}-svg-icons';
library.add(${camelCaseIcon});`,
          template: `<font-awesome-icon icon="${iconName}" />
<!-- Or with explicit family/style -->
<font-awesome-icon :icon="['${primaryFamily.style}', '${iconName}']" />`
        },
        explicitReference: {
          description: frameworkConfig.explicitMethod.description,
          import: `import { ${camelCaseIcon} } from '@fortawesome/free-${primaryFamily.family === 'classic' ? 'solid' : primaryFamily.family}-svg-icons';`,
          component: `export default {
  data() {
    return {
      ${camelCaseIcon}
    };
  }
};`,
          template: `<font-awesome-icon :icon="${camelCaseIcon}" />`
        }
      };
      break;
      
    default: // vanilla
      result.usage = {
        cssClasses: {
          description: frameworkConfig.iconLibraryMethod.description,
          import: frameworkConfig.iconLibraryMethod.import,
          html: `<i class="${primaryFamily.prefix} fa-${iconName}"></i>`
        },
        svgMethod: {
          description: frameworkConfig.explicitMethod.description,
          import: frameworkConfig.explicitMethod.import,
          html: `<i class="${primaryFamily.prefix} fa-${iconName}"></i>
<!-- FontAwesome Kit will convert to SVG -->`
        }
      };
      break;
  }
  
  return result;
}
