/**
 * Framework-specific usage patterns configuration
 */

import { FrameworkUsage, SupportedFramework } from "../types/index.js";

export const FRAMEWORK_USAGE: Record<SupportedFramework, FrameworkUsage> = {
  angular: {
    name: "Angular",
    iconLibraryMethod: {
      description: "Icon Library method - Register icons once and use by name (recommended)",
      import: `import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';`,
      register: `constructor(library: FaIconLibrary) {
  library.addIconPacks(fas, far, fab);
  // Or register specific icons:
  // library.addIcons(faCoffee, faUser);
}`,
      usage: `<fa-icon icon="coffee"></fa-icon>
<fa-icon icon="['solid', 'coffee']"></fa-icon>
<fa-icon icon="['regular', 'user']"></fa-icon>`,
      example: `// Component
constructor(library: FaIconLibrary) {
  library.addIconPacks(fas);
}

// Template
<fa-icon icon="coffee"></fa-icon>`
    },
    explicitMethod: {
      description: "Explicit Reference method - Import and reference icons directly",
      import: `import { faCoffee } from '@fortawesome/free-solid-svg-icons';`,
      usage: `<fa-icon [icon]="faCoffee"></fa-icon>`,
      example: `// Component
import { faCoffee } from '@fortawesome/free-solid-svg-icons';

export class MyComponent {
  faCoffee = faCoffee;
}

// Template
<fa-icon [icon]="faCoffee"></fa-icon>`
    }
  },
  react: {
    name: "React",
    iconLibraryMethod: {
      description: "Icon Library method - Build a library and reference by name",
      import: `import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';`,
      register: `library.add(fas);
// Or add specific icons:
// library.add(faCoffee, faUser);`,
      usage: `<FontAwesomeIcon icon="coffee" />
<FontAwesomeIcon icon={["fas", "coffee"]} />`,
      example: `// App.js
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
library.add(fas);

// Component
<FontAwesomeIcon icon="coffee" />`
    },
    explicitMethod: {
      description: "Explicit Reference method - Import and use icons directly",
      import: `import { faCoffee } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';`,
      usage: `<FontAwesomeIcon icon={faCoffee} />`,
      example: `// Component
import { faCoffee } from '@fortawesome/free-solid-svg-icons';

function MyComponent() {
  return <FontAwesomeIcon icon={faCoffee} />;
}`
    }
  },
  vue: {
    name: "Vue.js",
    iconLibraryMethod: {
      description: "Icon Library method - Register icons globally",
      import: `import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';`,
      register: `library.add(fas);
// Register component globally
app.component('font-awesome-icon', FontAwesomeIcon);`,
      usage: `<font-awesome-icon icon="coffee" />
<font-awesome-icon :icon="['fas', 'coffee']" />`,
      example: `// main.js
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
library.add(fas);

// Template
<font-awesome-icon icon="coffee" />`
    },
    explicitMethod: {
      description: "Explicit Reference method - Import and use icons directly",
      import: `import { faCoffee } from '@fortawesome/free-solid-svg-icons';`,
      usage: `<font-awesome-icon :icon="faCoffee" />`,
      example: `// Component
import { faCoffee } from '@fortawesome/free-solid-svg-icons';

export default {
  data() {
    return {
      faCoffee
    };
  }
};

// Template
<font-awesome-icon :icon="faCoffee" />`
    }
  },
  vanilla: {
    name: "Vanilla HTML/CSS",
    iconLibraryMethod: {
      description: "CSS Classes method - Use FontAwesome CSS classes directly",
      import: `<!-- CSS -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.0/css/all.min.css">
<!-- Or Pro CSS -->
<link rel="stylesheet" href="https://pro.fontawesome.com/releases/v7.0.0/css/all.css">`,
      register: `<!-- No registration needed -->`,
      usage: `<i class="fas fa-coffee"></i>
<i class="far fa-user"></i>
<i class="fab fa-github"></i>`,
      example: `<!-- HTML -->
<i class="fas fa-coffee"></i>
<span>Coffee time!</span>`
    },
    explicitMethod: {
      description: "SVG method - Use FontAwesome SVG JavaScript",
      import: `<!-- JavaScript -->
<script src="https://kit.fontawesome.com/your-kit-id.js" crossorigin="anonymous"></script>`,
      usage: `<i class="fas fa-coffee"></i>
<!-- FontAwesome will convert to SVG -->`,
      example: `<!-- HTML -->
<i class="fas fa-coffee"></i>
<!-- Automatically converted to SVG by FontAwesome JS -->`
    }
  }
};
