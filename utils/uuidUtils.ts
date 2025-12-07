/**
 * UUID Utilities
 * Generates UUID v4 compliant identifiers
 */

/**
 * Check if crypto.randomUUID is available
 */
function hasCryptoRandomUUID(): boolean {
  try {
    return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function';
  } catch {
    return false;
  }
}

/**
 * Generate a UUID v4 compliant identifier
 * Uses crypto.randomUUID() if available, otherwise falls back to manual generation
 */
export function generateUUID(): string {
  // Try to use native crypto.randomUUID() first
  if (hasCryptoRandomUUID()) {
    try {
      return crypto.randomUUID();
    } catch {
      // Fall through to manual generation
    }
  }

  // Fallback: Generate UUID v4 manually
  // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Check if a string is a valid UUID format
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

