import { sha1Hash, generateManifest } from '../../src/services/manifestGenerator.js';

describe('sha1Hash', () => {
  test('hashes empty string', () => {
    expect(sha1Hash('')).toBe('da39a3ee5e6b4b0d3255bfef95601890afd80709');
  });

  test('hashes simple string', () => {
    expect(sha1Hash('hello')).toBe('aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d');
  });

  test('hashes Buffer', () => {
    expect(sha1Hash(Buffer.from('hello'))).toBe(
      'aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d'
    );
  });

  test('produces consistent hashes', () => {
    const data = 'test data';
    expect(sha1Hash(data)).toBe(sha1Hash(data));
  });

  test('produces different hashes for different input', () => {
    expect(sha1Hash('hello')).not.toBe(sha1Hash('world'));
  });
});

describe('generateManifest', () => {
  test('generates manifest for single file', () => {
    const files = new Map();
    const content = '{"test":true}';
    files.set('pass.json', Buffer.from(content));

    const manifest = generateManifest(files);

    expect(Object.keys(manifest)).toContain('pass.json');
    expect(manifest['pass.json']).toBe(sha1Hash(content));
  });

  test('generates manifest for multiple files', () => {
    const files = new Map();
    files.set('pass.json', Buffer.from('{"test":true}'));
    files.set('icon.png', Buffer.from('png data'));
    files.set('logo.png', Buffer.from('logo data'));

    const manifest = generateManifest(files);

    expect(Object.keys(manifest)).toHaveLength(3);
    expect(Object.keys(manifest)).toContain('pass.json');
    expect(Object.keys(manifest)).toContain('icon.png');
    expect(Object.keys(manifest)).toContain('logo.png');
  });

  test('returns empty object for empty input', () => {
    const manifest = generateManifest(new Map());
    expect(manifest).toEqual({});
  });

  test('handles binary data correctly', () => {
    const binaryData = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG header
    const files = new Map();
    files.set('test.png', binaryData);

    const manifest = generateManifest(files);

    expect(manifest['test.png']).toBe(sha1Hash(binaryData));
  });
});
