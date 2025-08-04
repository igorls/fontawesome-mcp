/**
 * Validation utilities
 */

import { VALID_FAMILIES, VALID_STYLES, FamilyStyle } from "../types/index.js";

/**
 * Validate family/style combinations
 */
export function validateFamilyStyles(familyStyles: FamilyStyle[]): void {
  for (const fs of familyStyles) {
    if (!VALID_FAMILIES.includes(fs.family.toLowerCase() as any)) {
      throw new Error(`Invalid family "${fs.family}". Valid families: ${VALID_FAMILIES.join(', ')}`);
    }
    if (!VALID_STYLES.includes(fs.style.toLowerCase() as any)) {
      throw new Error(`Invalid style "${fs.style}". Valid styles: ${VALID_STYLES.join(', ')}`);
    }
  }
}

/**
 * Create SVG filter string for GraphQL queries
 */
export function createSvgFilter(familyStyles?: FamilyStyle[]): string {
  if (!familyStyles || familyStyles.length === 0) {
    return "";
  }

  const filterItems = familyStyles
    .map((fs) => `{ family: ${fs.family.toUpperCase()}, style: ${fs.style.toUpperCase()} }`)
    .join(", ");
  
  return `(filter: { familyStyles: [${filterItems}] })`;
}

/**
 * Validate and normalize limit parameter
 */
export function validateLimit(limit?: number): number {
  if (limit === undefined) return 15;
  return Math.min(Math.max(limit, 1), 50);
}
