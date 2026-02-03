---
name: yeetcard-pass-service
description: >
  Web service development skill for Yeetcard Pass Signing Service, a REST API that
  generates signed Apple Wallet .pkpass files. Use when working on any pass service
  development tasks including: pass.json generation, manifest hashing, PKCS7 certificate
  signing, .pkpass ZIP assembly, API endpoints, authentication middleware, deployment,
  certificate management, or any feature/bug/test work on the pass signing service.
  Also use when discussing Apple Wallet pass specifications, PassKit formats, or the
  API contract between this service and the Yeetcard iOS app.
---

# Yeetcard Pass Signing Service

## Purpose

Single-purpose REST API: accept card data from iOS app, return signed .pkpass file for Apple Wallet.

## API Contract

```
POST /api/v1/passes
Headers: Content-Type: application/json, X-API-Key: <key>
Body: { cardName, barcodeData, barcodeFormat, foregroundColor?, backgroundColor?, labelColor?, logoText? }
Success: 200, Content-Type: application/vnd.apple.pkpass, binary body
Errors: 400 (validation), 401 (auth), 429 (rate limit), 500 (server)

GET /api/health
No auth. Returns: { status, timestamp, certificateLoaded, certificateExpiry }
```

## Pass Generation Pipeline

Five sequential steps, each isolated into its own service/function:

### 1. Input Validation
Validate all request fields. Required: cardName (string, non-empty), barcodeData (string, non-empty), barcodeFormat (one of: QR, Code128, PDF417, Aztec). Optional: foregroundColor, backgroundColor, labelColor (hex strings), logoText (string).

### 2. pass.json Generation
Build pass.json object per Apple spec:
- formatVersion: 1 (always)
- passTypeIdentifier: from env PASS_TYPE_IDENTIFIER
- serialNumber: generate UUID for each pass
- teamIdentifier: from env TEAM_IDENTIFIER
- organizationName: "Yeetcard"
- description: cardName
- Colors: convert hex (#FFFFFF) to rgb format ("rgb(255, 255, 255)")
- Pass style: "generic" with primaryFields containing card name
- barcode: { format: mapped format, message: barcodeData, messageEncoding: "iso-8859-1" }
- barcodes: array containing same barcode object (for iOS 9+ compatibility)

**Barcode format mapping:**
- QR → PKBarcodeFormatQR
- Code128 → PKBarcodeFormatCode128
- PDF417 → PKBarcodeFormatPDF417
- Aztec → PKBarcodeFormatAztec

### 3. Manifest Generation
Create manifest.json: object where keys are filenames and values are SHA-1 hex digests.
Include: pass.json, icon.png, icon@2x.png, icon@3x.png, logo.png, logo@2x.png, logo@3x.png.
Hash the actual file bytes, not the filename.

### 4. Signing
Sign manifest.json with Pass Type ID certificate:
- Load .p12 certificate and extract private key + certificate
- Create PKCS7 detached signature of manifest.json bytes
- Include Apple WWDR intermediate certificate in signature chain
- Output raw binary signature (DER format)

### 5. .pkpass Assembly
Create ZIP archive (no compression needed, store is fine):
- pass.json
- manifest.json
- signature
- All icon and logo image files from assets/
- Flat structure (no subdirectories)
- Return as binary Buffer/bytes

## Image Assets

Default images shipped with the service in assets/ directory:
- icon.png (29x29), icon@2x.png (58x58), icon@3x.png (87x87)
- logo.png (160x50), logo@2x.png (320x100), logo@3x.png (480x150)

These are the Yeetcard brand images used on every pass. Must be PNG format with no transparency issues.

## Certificate Handling

The Pass Type ID certificate (.p12) is the most sensitive component:
- Never commit to Git
- Store as env var (base64 encoded) or in secure secrets manager
- Load once on service startup, validate, and cache in memory
- Password stored as separate env var
- Check certificate validity on startup and in health check
- Apple WWDR intermediate cert also required for signature chain

## Environment Variables

```
PASS_TYPE_IDENTIFIER    # pass.com.[company].yeetcard
TEAM_IDENTIFIER         # Apple team ID
CERTIFICATE_PATH        # Path to .p12 (or CERTIFICATE_BASE64 for encoded)
CERTIFICATE_PASSWORD    # .p12 password
WWDR_CERTIFICATE_PATH   # Path to Apple WWDR CA cert
API_KEYS                # Comma-separated valid keys
RATE_LIMIT_REQUESTS     # Max requests per window (default: 100)
RATE_LIMIT_WINDOW_MS    # Window in ms (default: 3600000 = 1hr)
PORT                    # Server port (default: 3000)
LOG_LEVEL               # debug/info/warn/error
```

## Error Handling

All errors return JSON with consistent structure: { error: string, message: string, field?: string }

- Validation errors: 400, include which field failed and why
- Auth errors: 401, generic message (don't reveal if key exists)
- Rate limit: 429, include Retry-After header
- Server errors: 500, generic message to client, log full details server-side
- Never expose: certificate paths, stack traces, internal state

## Testing Strategy

### Unit Tests
- pass.json generation with various inputs and formats
- Manifest SHA-1 hash calculation
- Input validation (valid, invalid, edge cases)
- Color conversion (hex to rgb)
- Each test should be independent, no shared state

### Integration Tests
- Full pipeline: request → .pkpass response
- Verify .pkpass is valid ZIP with correct contents
- Verify pass.json inside .pkpass matches expected structure
- Auth: valid key accepted, invalid rejected, missing rejected
- Validation: missing fields rejected, invalid formats rejected

### Manual Verification
- Generate .pkpass and open on macOS (Quick Look or Wallet preview)
- Transfer .pkpass to iOS device and add to Wallet
- Verify barcode appears correctly
- Verify barcode scans at a store (if possible)
- Verify pass styling (colors, text, logo)

## Common Issues

### "Pass is invalid" on iOS
- Check that manifest.json hashes match actual file bytes
- Check that signature was created from manifest.json (not pass.json)
- Check that WWDR certificate is included in signature chain
- Check that passTypeIdentifier matches the certificate
- Check that teamIdentifier is correct

### Certificate loading fails
- Verify .p12 file is not corrupted
- Verify password is correct
- Verify certificate was generated for correct Pass Type ID
- If base64 encoded: verify encoding/decoding is correct

### Pass shows in Wallet but barcode wrong
- Check barcodeFormat mapping (QR vs PKBarcodeFormatQR)
- Check messageEncoding is "iso-8859-1"
- Check barcodeData is not truncated or modified
