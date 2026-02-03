# Yeetcard Pass Signing Service

A REST API service that generates signed Apple Wallet passes (.pkpass files) for the Yeetcard iOS app. The service accepts card data, constructs a pass bundle with barcode and styling, signs it with an Apple Pass Type ID certificate, and returns the finished .pkpass file.

## How It Works

1. iOS app sends card data (name, barcode, format, colors) via POST request
2. Service generates pass.json with barcode configuration and styling
3. Service includes icon and logo image assets in the pass bundle
4. Service creates manifest.json with SHA-1 hashes of all files
5. Service signs manifest with Pass Type ID certificate (PKCS7 detached signature)
6. Service zips everything into a .pkpass file
7. Service returns the .pkpass binary to the iOS app

## Technical Stack

**Runtime:** To be decided — Node.js or Python recommended
**Hosting:** To be decided — AWS Lambda, Railway, Heroku, or DigitalOcean
**Authentication:** API key via X-API-Key header
**Certificate:** Apple Pass Type ID certificate (.p12) for PKCS7 signing

### Technology Decision: Node.js vs Python

**Node.js advantages:**
- `passkit-generator` npm package handles most pass creation complexity
- Good serverless support (AWS Lambda, Vercel)
- Native JSON handling

**Python advantages:**
- `wallet-py3k` or `django-wallet` packages available
- Simpler certificate handling with `cryptography` library
- Straightforward file operations

Either works. Choose based on team familiarity.

## API Specification

### Generate Pass

```
POST /api/v1/passes
```

**Headers:**
```
Content-Type: application/json
X-API-Key: <api-key>
```

**Request Body:**
```json
{
  "cardName": "Costco Membership",
  "barcodeData": "6019835412789",
  "barcodeFormat": "Code128",
  "foregroundColor": "#FFFFFF",
  "backgroundColor": "#1A1A2E",
  "labelColor": "#CCCCCC",
  "logoText": "Costco"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| cardName | string | yes | Display name on the pass |
| barcodeData | string | yes | Raw barcode content |
| barcodeFormat | string | yes | One of: QR, Code128, PDF417, Aztec |
| foregroundColor | string | no | Hex color for text, default #FFFFFF |
| backgroundColor | string | no | Hex color for background, default #1A1A2E |
| labelColor | string | no | Hex color for labels, default #CCCCCC |
| logoText | string | no | Text next to logo, defaults to cardName |

**Success Response:**
```
HTTP 200 OK
Content-Type: application/vnd.apple.pkpass
Content-Disposition: attachment; filename="pass.pkpass"
Body: <binary .pkpass data>
```

**Error Responses:**
```json
// 400 Bad Request — validation failure
{
  "error": "validation_error",
  "message": "barcodeFormat must be one of: QR, Code128, PDF417, Aztec",
  "field": "barcodeFormat"
}

// 401 Unauthorized — missing or invalid API key
{
  "error": "unauthorized",
  "message": "Invalid or missing API key"
}

// 500 Internal Server Error — signing or generation failure
{
  "error": "internal_error",
  "message": "Failed to generate pass. Please try again."
}
```

### Health Check

```
GET /api/health
```

No authentication required.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-02-03T12:00:00Z",
  "certificateLoaded": true,
  "certificateExpiry": "2026-01-15T00:00:00Z"
}
```

## Pass Structure

A .pkpass file is a ZIP archive containing:

```
pass.pkpass (ZIP)
├── pass.json          # Pass content, barcode, styling
├── manifest.json      # SHA-1 hashes of all other files
├── signature           # PKCS7 detached signature of manifest
├── icon.png           # 29x29 pass icon
├── icon@2x.png        # 58x58 pass icon
├── icon@3x.png        # 87x87 pass icon
├── logo.png           # 160x50 pass logo
├── logo@2x.png        # 320x100 pass logo
└── logo@3x.png        # 480x150 pass logo
```

### pass.json Structure

```json
{
  "formatVersion": 1,
  "passTypeIdentifier": "pass.com.[company].yeetcard",
  "serialNumber": "<uuid>",
  "teamIdentifier": "<team-id>",
  "organizationName": "Yeetcard",
  "description": "Costco Membership",
  "foregroundColor": "rgb(255, 255, 255)",
  "backgroundColor": "rgb(26, 26, 46)",
  "labelColor": "rgb(204, 204, 204)",
  "logoText": "Costco",
  "generic": {
    "primaryFields": [
      {
        "key": "card-name",
        "label": "CARD",
        "value": "Costco Membership"
      }
    ]
  },
  "barcode": {
    "format": "PKBarcodeFormatCode128",
    "message": "6019835412789",
    "messageEncoding": "iso-8859-1"
  },
  "barcodes": [
    {
      "format": "PKBarcodeFormatCode128",
      "message": "6019835412789",
      "messageEncoding": "iso-8859-1"
    }
  ]
}
```

**Barcode format mapping:**
| Input | pass.json value |
|---|---|
| QR | PKBarcodeFormatQR |
| Code128 | PKBarcodeFormatCode128 |
| PDF417 | PKBarcodeFormatPDF417 |
| Aztec | PKBarcodeFormatAztec |

### Manifest Generation

manifest.json contains the SHA-1 hash of every other file in the pass:

```json
{
  "pass.json": "abc123...",
  "icon.png": "def456...",
  "icon@2x.png": "ghi789...",
  "logo.png": "jkl012..."
}
```

### Signing

The manifest is signed using the Pass Type ID certificate to produce the `signature` file:
1. Load .p12 certificate and private key
2. Create PKCS7 detached signature of manifest.json
3. Include Apple WWDR intermediate certificate in the signature chain
4. Write binary signature to `signature` file

## Project Structure

```
yeetcard-pass-service/
├── README.md
├── PROJECT_PLAN.md
├── SKILL.md
├── .env.example          # Environment variable template
├── .gitignore
├── package.json / requirements.txt
├── src/
│   ├── index.js / app.py           # Entry point, server setup
│   ├── routes/
│   │   ├── passes.js / passes.py   # POST /api/v1/passes handler
│   │   └── health.js / health.py   # GET /api/health handler
│   ├── services/
│   │   ├── passGenerator.js/.py     # pass.json creation
│   │   ├── manifestGenerator.js/.py # SHA-1 manifest creation
│   │   ├── passSigner.js/.py        # PKCS7 signing
│   │   └── pkpassBuilder.js/.py     # ZIP .pkpass assembly
│   ├── middleware/
│   │   ├── auth.js / auth.py        # API key validation
│   │   ├── validation.js/.py        # Request body validation
│   │   └── rateLimit.js/.py         # Rate limiting
│   └── utils/
│       ├── colors.js / colors.py    # Hex to RGB conversion
│       └── logger.js / logger.py    # Structured logging
├── assets/
│   ├── icon.png                     # Default pass icon (29x29)
│   ├── icon@2x.png                  # 58x58
│   ├── icon@3x.png                  # 87x87
│   ├── logo.png                     # Default pass logo (160x50)
│   ├── logo@2x.png                  # 320x100
│   └── logo@3x.png                  # 480x150
├── certs/
│   └── .gitkeep                     # Certificates go here (gitignored)
└── tests/
    ├── unit/
    │   ├── passGenerator.test.js/.py
    │   ├── manifestGenerator.test.js/.py
    │   └── validation.test.js/.py
    └── integration/
        └── passes.test.js/.py
```

## Environment Variables

```bash
# Server
PORT=3000
NODE_ENV=production  # or FLASK_ENV

# Apple Certificate
PASS_TYPE_IDENTIFIER=pass.com.[company].yeetcard
TEAM_IDENTIFIER=<your-team-id>
CERTIFICATE_PATH=./certs/pass.p12  # or base64 encoded
CERTIFICATE_PASSWORD=<password>
WWDR_CERTIFICATE_PATH=./certs/AppleWWDRCA.pem

# Authentication
API_KEYS=key1,key2,key3  # Comma-separated valid keys

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_MS=3600000  # 1 hour

# Logging
LOG_LEVEL=info  # debug, info, warn, error
```

## Security Considerations

- **Certificate storage:** Never commit .p12 files to Git. Store as environment variables (base64 encoded) or in secure secret managers.
- **API keys:** Never commit API keys. Use environment variables. Support multiple keys for rotation.
- **HTTPS only:** All production traffic must be over HTTPS. Hosting platforms typically handle this.
- **Input validation:** Validate all request fields before processing. Reject unexpected fields.
- **Error messages:** Never expose internal errors, certificate paths, or stack traces to clients.
- **Rate limiting:** Prevent abuse. 100 requests per hour per API key recommended.
- **Logging:** Log request metadata but never log certificate passwords or full API keys.

## Apple WWDR Certificate

The Apple Worldwide Developer Relations (WWDR) intermediate certificate must be included in the signature chain. Download from Apple:

```
https://www.apple.com/certificateauthority/
```

Download the "Worldwide Developer Relations - G4" certificate and convert to PEM format.

## Local Development

1. Clone the repository
2. Copy .env.example to .env and fill in values
3. Place Pass Type ID certificate (.p12) in certs/
4. Place Apple WWDR certificate in certs/
5. Install dependencies
6. Run development server
7. Test with curl or Postman

**Test request:**
```bash
curl -X POST http://localhost:3000/api/v1/passes \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-test-key" \
  -d '{
    "cardName": "Test Card",
    "barcodeData": "1234567890",
    "barcodeFormat": "QR"
  }' \
  --output test.pkpass
```

Verify the generated pass by opening test.pkpass on a Mac (opens in Wallet preview) or transferring to an iOS device.

## Deployment

1. Configure hosting platform (environment variables, SSL)
2. Upload or encode certificate as environment variable
3. Deploy code
4. Verify health check endpoint returns 200
5. Generate test pass and verify on iOS device
6. Share production URL and API key with iOS app team

## Certificate Renewal

Pass Type ID certificates expire. Plan for renewal:

1. Apple sends expiration notice (or check in developer portal)
2. Generate new certificate in Apple Developer portal
3. Download and convert to .p12
4. Update environment variable or secret with new certificate
5. Deploy (zero-downtime if using rolling deploys)
6. Verify passes still generate correctly
7. Old passes already in users' Wallets continue to work
