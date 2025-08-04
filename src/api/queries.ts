/**
 * GraphQL queries for FontAwesome API
 */

export const SEARCH_ICONS_QUERY = `
  query SearchIcons($version: String!, $query: String!, $first: Int!) {
    search(version: $version, query: $query, first: $first) {
      id
      label
      unicode
      changes
      familyStylesByLicense {
        free {
          family
          style
          prefix
        }
        pro {
          family
          style
          prefix
        }
      }
      aliases {
        names
        unicodes {
          composite
          primary
          secondary
        }
      }
    }
  }
`;

export const GET_ICON_QUERY = (includeSvgs: boolean = false, svgFilter: string = "") => `
  query GetIcon($version: String!, $name: String!) {
    release(version: $version) {
      version
      icon(name: $name) {
        id
        label
        unicode
        changes
        familyStylesByLicense {
          free {
            family
            style
            prefix
          }
          pro {
            family
            style
            prefix
          }
        }
        aliases {
          names
          unicodes {
            composite
            primary
            secondary
          }
        }
        ${includeSvgs ? `
          svgs${svgFilter} {
            familyStyle {
              family
              style
              prefix
            }
            width
            height
            html
            pathData
            iconDefinition
          }
        ` : ''}
      }
    }
  }
`;

export const GET_ICON_SVGS_QUERY = (svgFilter: string = "") => `
  query GetIcon($version: String!, $name: String!) {
    release(version: $version) {
      icon(name: $name) {
        svgs${svgFilter} {
          familyStyle {
            family
            style
            prefix
          }
          width
          height
          html
          pathData
          iconDefinition
        }
      }
    }
  }
`;

export const GET_RELEASES_QUERY = `
  query GetReleases {
    releases {
      version
      date
      isLatest
      iconCount {
        free
        pro
      }
    }
  }
`;

export const GET_RELEASE_QUERY = `
  query GetRelease($version: String!) {
    release(version: $version) {
      version
      date
      isLatest
      iconCount {
        free
        pro
      }
      download {
        separatesWebDesktop
      }
    }
  }
`;

export const GET_FAMILY_STYLES_QUERY = `
  query GetFamilyStyles($version: String!) {
    release(version: $version) {
      version
      familyStyles {
        family
        style
        prefix
      }
    }
  }
`;

export const GET_RELEASE_ICON_COUNT_QUERY = `
  query GetRelease($version: String!) {
    release(version: $version) {
      iconCount {
        free
        pro
      }
    }
  }
`;
