/**
 * Validates that a URL uses only http or https protocols.
 * Prevents XSS attacks via javascript: or data: URLs.
 */
export function isValidHttpUrl(url: string): boolean {
  if (!url || typeof url !== "string") {
    return false;
  }

  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitizes a URL by returning it only if valid, otherwise returns null.
 */
export function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return isValidHttpUrl(url) ? url : null;
}
