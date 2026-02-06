import { hexToRgb, DEFAULT_COLORS } from '../../src/utils/colors.js';

describe('hexToRgb', () => {
  test('converts black hex to rgb', () => {
    expect(hexToRgb('#000000')).toBe('rgb(0, 0, 0)');
  });

  test('converts white hex to rgb', () => {
    expect(hexToRgb('#FFFFFF')).toBe('rgb(255, 255, 255)');
  });

  test('converts lowercase hex to rgb', () => {
    expect(hexToRgb('#ffffff')).toBe('rgb(255, 255, 255)');
  });

  test('converts hex without # prefix', () => {
    expect(hexToRgb('FF0000')).toBe('rgb(255, 0, 0)');
  });

  test('converts mixed case hex', () => {
    expect(hexToRgb('#1A1a2E')).toBe('rgb(26, 26, 46)');
  });

  test('converts arbitrary color', () => {
    expect(hexToRgb('#CCCCCC')).toBe('rgb(204, 204, 204)');
  });

  test('throws on invalid hex length', () => {
    expect(() => hexToRgb('#FFF')).toThrow('Invalid hex color');
  });

  test('throws on invalid characters', () => {
    expect(() => hexToRgb('#GGGGGG')).toThrow('Invalid hex color');
  });

  test('throws on empty string', () => {
    expect(() => hexToRgb('')).toThrow('Invalid hex color');
  });
});

describe('DEFAULT_COLORS', () => {
  test('has foreground color', () => {
    expect(DEFAULT_COLORS.foreground).toBe('#FFFFFF');
  });

  test('has background color', () => {
    expect(DEFAULT_COLORS.background).toBe('#1A1A2E');
  });

  test('has label color', () => {
    expect(DEFAULT_COLORS.label).toBe('#CCCCCC');
  });
});
