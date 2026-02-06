/**
 * Convert hex color string to RGB format required by Apple Wallet passes.
 * @param {string} hex - Hex color string (e.g., "#FFFFFF" or "FFFFFF")
 * @returns {string} RGB string in format "rgb(255, 255, 255)"
 */
export function hexToRgb(hex) {
  const cleanHex = hex.replace(/^#/, '');

  if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return `rgb(${r}, ${g}, ${b})`;
}

export const DEFAULT_COLORS = {
  foreground: '#FFFFFF',
  background: '#1A1A2E',
  label: '#CCCCCC',
};
