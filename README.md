# FontAwesome MCP Server

A Model Context Protocol (MCP) server that provides access to FontAwesome icons through their GraphQL API. This server enables AI agents to search for and retrieve information about FontAwesome icons using fuzzy search capabilities.

## ✨ Features

- **🔍 Fuzzy Icon Search**: Search for icons using natural language queries (e.g., "coffee", "user profile", "arrow left")
- **🎯 Exact Icon Lookup**: Get specific icons by their exact name or alias
- **📊 Release Information**: Get details about FontAwesome versions and releases
- **👨‍💻 Framework-Aware**: Provides framework-specific usage instructions for Angular, React, Vue.js, and Vanilla HTML/CSS
- **🎨 Family/Style Information**: Explore available icon families and styles including Pro+ families
- **📋 Comprehensive Icon Data**: Access metadata including unicode values, CSS prefixes, license info, and change history
- **🖼️ SVG Data Support**: Optional inclusion of SVG data and icon definitions

## 🚀 Framework-Aware Usage

**NEW**: The MCP server now provides framework-specific usage instructions! Set the `FRAMEWORK` environment variable to get tailored code snippets:

- **Angular** (`angular`) - Using `@fortawesome/angular-fontawesome`
- **React** (`react`) - Using `@fortawesome/react-fontawesome` 
- **Vue.js** (`vue`) - Using `@fortawesome/vue-fontawesome`
- **Vanilla** (`vanilla`) - Using CSS classes or FontAwesome Kit

See [FRAMEWORK-AWARE.md](./FRAMEWORK-AWARE.md) for detailed documentation.

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fontawesome-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Usage

The server implements the Model Context Protocol and communicates via JSON-RPC over stdio.

### Available Tools

#### 1. `search_icons`
Search for FontAwesome icons using fuzzy search (powered by the same Algolia search engine as the FontAwesome icon gallery).

**Parameters:**
- `query` (required): Search terms (e.g., "coffee", "user profile", "arrow left")
- `version` (optional): FontAwesome version (default: "7.x")
- `limit` (optional): Maximum results to return, 1-50 (default: 15)
- `include_svgs` (optional): Include SVG data in response (default: false)
- `family_styles` (optional): Filter by specific family/style combinations

**Example:**
```json
{
  "name": "search_icons",
  "arguments": {
    "query": "coffee",
    "limit": 5
  }
}
```

#### 2. `get_icon_by_name`
Get a specific FontAwesome icon by its exact name or alias.

**Parameters:**
- `name` (required): Exact icon name (e.g., "mug-saucer", "coffee", "user")
- `version` (optional): FontAwesome version (default: "7.x")
- `include_svgs` (optional): Include SVG data in response (default: false)
- `family_styles` (optional): Filter by specific family/style combinations

**Example:**
```json
{
  "name": "get_icon_by_name",
  "arguments": {
    "name": "mug-saucer",
    "include_svgs": true
  }
}
```

#### 3. `get_release_info`
Get information about FontAwesome releases.

**Parameters:**
- `version` (optional): Specific version to query (default: "7.x")
- `list_all` (optional): List all available releases (default: false)

**Example:**
```json
{
  "name": "get_release_info",
  "arguments": {
    "version": "7.x"
  }
}
```

#### 4. `get_family_styles`
Get all available family/style combinations for a FontAwesome version.

**Parameters:**
- `version` (optional): FontAwesome version (default: "7.x")

**Example:**
```json
{
  "name": "get_family_styles",
  "arguments": {
    "version": "7.x"
  }
}
```

### Family/Style Filtering

When using `family_styles` parameter, you can filter icons by specific combinations:

```json
{
  "family_styles": [
    {"family": "CLASSIC", "style": "SOLID"},
    {"family": "DUOTONE", "style": "SOLID"}
  ]
}
```

**Available Families:**
- `CLASSIC` - Traditional FontAwesome icons
- `DUOTONE` - Two-color icons
- `SHARP` - Sharp-edged variants
- `SHARP_DUOTONE` - Sharp two-color icons
- `BRANDS` - Brand/logo icons

**Available Styles:**
- `SOLID` - Filled icons
- `REGULAR` - Outlined icons
- `LIGHT` - Thin outlined icons
- `THIN` - Extra thin icons
- `DUOTONE` - Two-color style
- `BRANDS` - Brand style

## Icon Information Returned

Each icon result includes:

- `id`: Icon identifier (e.g., "mug-saucer")
- `label`: Human-readable name (e.g., "Mug Saucer")
- `unicode`: Unicode value as hex string
- `changes`: Array of FontAwesome versions where the icon was modified
- `familyStylesByLicense`: Available families/styles by license (free vs pro)
- `aliases`: Alternative names and unicode values
- `svgs`: SVG data when `include_svgs: true` (includes HTML, path data, icon definitions)

## Development

### Scripts
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Run the compiled server
- `npm run dev` - Build and run in one command

### Testing
Run the test script to verify the server works:
```bash
node test-server.js
```

## FontAwesome API Reference

This server uses the public FontAwesome GraphQL API. Most functionality works without authentication, though some Pro features require an API token.

- **API Endpoint**: https://api.fontawesome.com
- **Documentation**: https://docs.fontawesome.com/apis/graphql
- **Query Fields**: https://docs.fontawesome.com/apis/graphql/query-fields

## Integration

This MCP server can be integrated with any MCP-compatible AI system or application. The server communicates via JSON-RPC over stdio, making it compatible with various MCP clients and frameworks.

## License

This project is licensed under the ISC License. FontAwesome icons and their associated data are subject to FontAwesome's licensing terms.
