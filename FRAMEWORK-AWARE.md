# Framework-Aware FontAwesome MCP Server

This MCP server now provides framework-specific usage instructions for popular web frameworks. Instead of generic icon information, you get ready-to-use code snippets tailored to your development environment.

## Supported Frameworks

- **Angular** (`angular`) - Using `@fortawesome/angular-fontawesome`
- **React** (`react`) - Using `@fortawesome/react-fontawesome`
- **Vue.js** (`vue`) - Using `@fortawesome/vue-fontawesome`
- **Vanilla HTML/CSS** (`vanilla`) - Using CSS classes or FontAwesome Kit

## Configuration

Set the `FRAMEWORK` environment variable to specify your framework:

```bash
# For Angular projects
export FRAMEWORK=angular

# For React projects  
export FRAMEWORK=react

# For Vue.js projects
export FRAMEWORK=vue

# For vanilla HTML/CSS (default)
export FRAMEWORK=vanilla
```

### VS Code Configuration

Update your `.vscode/mcp.json` to include the framework setting:

```json
{
  "mcpServers": {
    "fontawesome": {
      "command": "node",
      "args": ["./dist/server.js"],
      "env": {
        "FONTAWESOME_API_TOKEN": "your-token-here",
        "FRAMEWORK": "angular"
      }
    }
  }
}
```

### Claude Desktop Configuration

Update your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "fontawesome": {
      "command": "node",
      "args": ["path/to/dist/server.js"],
      "env": {
        "FONTAWESOME_API_TOKEN": "your-token-here",
        "FRAMEWORK": "angular"
      }
    }
  }
}
```

## Framework-Specific Output

When you search for icons or get icon details, the MCP server now includes framework-specific usage instructions:

### Angular Example

```typescript
// Search result includes Angular-specific usage
{
  "framework": "angular",
  "icon": {
    "name": "coffee",
    "camelCase": "faCoffee",
    "frameworkUsage": {
      "usage": {
        "iconLibrary": {
          "description": "Icon Library method - Register icons once and use by name (recommended)",
          "import": "import { faCoffee } from '@fortawesome/free-solid-svg-icons';",
          "register": "// In your component or module\nconstructor(library: FaIconLibrary) {\n  library.addIcons(faCoffee);\n}",
          "template": "<fa-icon icon=\"coffee\"></fa-icon>\n<!-- Or with explicit family/style -->\n<fa-icon icon=\"['solid', 'coffee']\"></fa-icon>"
        },
        "explicitReference": {
          "description": "Explicit Reference method - Import and reference icons directly",
          "import": "import { faCoffee } from '@fortawesome/free-solid-svg-icons';",
          "component": "export class MyComponent {\n  faCoffee = faCoffee;\n}",
          "template": "<fa-icon [icon]=\"faCoffee\"></fa-icon>"
        }
      }
    }
  }
}
```

### React Example

```javascript
// Search result includes React-specific usage
{
  "framework": "react",
  "icon": {
    "name": "star",
    "camelCase": "faStar",
    "frameworkUsage": {
      "usage": {
        "iconLibrary": {
          "register": "import { faStar } from '@fortawesome/free-solid-svg-icons';\nlibrary.add(faStar);",
          "component": "<FontAwesomeIcon icon=\"star\" />\n{/* Or with explicit family/style */}\n<FontAwesomeIcon icon={[\"fas\", \"star\"]} />"
        },
        "explicitReference": {
          "import": "import { faStar } from '@fortawesome/free-solid-svg-icons';\nimport { FontAwesomeIcon } from '@fortawesome/react-fontawesome';",
          "component": "function MyComponent() {\n  return <FontAwesomeIcon icon={faStar} />;\n}"
        }
      }
    }
  }
}
```

## Implementation Methods

Each framework supports two main approaches:

### 1. Icon Library Method (Recommended)
- **Angular**: Register icons with `FaIconLibrary`, use by name in templates
- **React**: Add icons to global library, reference by string name
- **Vue**: Add icons to global library, use string names in templates
- **Vanilla**: Use CSS classes directly

### 2. Explicit Reference Method
- **Angular**: Import icons directly, bind to component properties
- **React**: Import icons directly, pass to FontAwesome component
- **Vue**: Import icons directly, reference in component data
- **Vanilla**: Use FontAwesome Kit for SVG conversion

## Benefits

1. **Ready-to-use code**: Copy-paste code snippets directly into your project
2. **Framework best practices**: Uses recommended patterns for each framework
3. **Consistent naming**: Automatically converts icon names to camelCase for JavaScript frameworks
4. **Import suggestions**: Shows correct import paths for each framework
5. **Multiple approaches**: Shows both icon library and explicit reference methods

## Testing

Test the framework functionality:

```bash
# Test Angular framework
node test-angular.js

# Test React framework  
node test-react.js
```

The server will automatically detect the framework from the environment variable and provide appropriate usage instructions for each icon search or retrieval operation.
