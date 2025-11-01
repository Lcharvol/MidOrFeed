/**
 * Utility functions for profile management
 */

/**
 * Extract initials from a name or email
 */
export function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email[0].toUpperCase();
}

/**
 * Parse game name and tag from a combined string (e.g., "Faker#EUW1" -> ["Faker", "EUW1"])
 */
export function parseGameNameAndTag(value: string): [string, string] {
  if (!value.includes("#")) return [value, ""];
  const [name, ...tagParts] = value.split("#");
  return [name, tagParts.join("#")];
}
