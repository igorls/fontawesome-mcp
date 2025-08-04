/**
 * Get Pro+ showcase tool implementation
 */

import { BaseTool } from "./BaseTool.js";
import { GetProPlusShowcaseArgs } from "../types/index.js";
import { GET_ICON_QUERY } from "../api/queries.js";

export class GetProPlusShowcaseTool extends BaseTool {
  async execute(args: GetProPlusShowcaseArgs) {
    const { version = "7.x", icons_per_family = 4, include_svgs = false } = args;

    // Get access token (Pro+ families require Pro access)
    const token = await this.apiClient.getAccessToken();
    if (!token) {
      throw new Error("Pro+ showcase requires authentication. Check your FA_TOKEN.");
    }

    const proPlusFamilies = [
      { family: "chisel", style: "regular", prefix: "facr", description: "Bold, carved aesthetic with strong geometric lines" },
      { family: "etch", style: "solid", prefix: "faes", description: "Hand-drawn aesthetic with sketchy, artistic lines" },
      { family: "jelly", style: "regular", prefix: "fajr", description: "Soft, rounded forms with playful, bouncy appearance" },
      { family: "notdog", style: "solid", prefix: "fans", description: "Quirky, unconventional style breaking traditional design rules" },
      { family: "slab", style: "regular", prefix: "faslr", description: "Bold, chunky letterforms with strong serifs" },
      { family: "thumbprint", style: "light", prefix: "fatl", description: "Textured, fingerprint-like patterns with security aesthetics" },
      { family: "whiteboard", style: "semibold", prefix: "fawsb", description: "Clean, marker-drawn style perfect for presentations" },
    ];

    // Common icons that are likely to exist across families
    const commonIconNames = ["star", "heart", "home", "user", "check", "times", "plus", "minus", "arrow-right", "envelope"];

    const showcaseResults = await Promise.all(
      proPlusFamilies.map(async (familyInfo) => {
        const familyIcons = [];
        
        // Try to find icons available in this Pro+ family
        for (const iconName of commonIconNames) {
          if (familyIcons.length >= icons_per_family) break;
          
          try {
            const response = await this.apiClient.request(GET_ICON_QUERY(include_svgs, 
              `(filter: { familyStyles: [{ family: ${familyInfo.family.toUpperCase()}, style: ${familyInfo.style.toUpperCase()} }] })`
            ), {
              version,
              name: iconName,
            });

            const icon = (response as any).release?.icon;
            if (icon && icon.familyStylesByLicense?.pro) {
              // Check if this icon is available in the current Pro+ family
              const hasFamily = icon.familyStylesByLicense.pro.some(
                (fs: any) => fs.family === familyInfo.family && fs.style === familyInfo.style
              );
              
              if (hasFamily) {
                familyIcons.push({
                  id: icon.id,
                  label: icon.label,
                  unicode: icon.unicode,
                  prefix: familyInfo.prefix,
                  svgs: icon.svgs || undefined,
                });
              }
            }
          } catch (error) {
            console.error(`Failed to fetch icon ${iconName} for family ${familyInfo.family}:`, error);
            continue;
          }
        }

        return {
          family: familyInfo.family,
          style: familyInfo.style,
          prefix: familyInfo.prefix,
          description: familyInfo.description,
          iconCount: familyIcons.length,
          icons: familyIcons,
        };
      })
    );

    return this.createResponse({
      version,
      message: "FontAwesome Pro+ Style Families Showcase",
      families: showcaseResults,
      usage: {
        html: "Use class names like 'facr fa-star' for Chisel Regular star icon",
        css: "Ensure you have FontAwesome Pro v7+ loaded with Pro+ families enabled",
        note: "Pro+ families require active FontAwesome Pro subscription"
      },
      totalIcons: showcaseResults.reduce((sum, family) => sum + family.iconCount, 0),
    });
  }
}
