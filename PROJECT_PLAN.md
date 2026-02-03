# Yeetcard Pass Signing Service — Project Plan

## Overview

This document defines the development plan for the Yeetcard pass signing web service, a standalone API that generates signed Apple Wallet passes for the Yeetcard iOS app.

## Timeline

Estimated 3-4 weeks from start to production deployment.

### Phase 1: Research & Setup (Week 1)
Select technology stack (Node.js vs Python), hosting provider, and pass signing library. Set up development environment, Git repository, and hosting infrastructure. Upload and configure Pass Type ID certificate. Deploy a basic health check endpoint to verify infrastructure works.

### Phase 2: Core Implementation (Week 2)
Implement pass.json generation, manifest generation (SHA-1 hashing), PKCS7 signing, and .pkpass ZIP assembly. Build the API endpoint with request validation, API key authentication, and error handling. Create default pass image assets (icon, logo).

### Phase 3: Hardening (Week 3)
Add rate limiting, structured logging, monitoring, and alerting. Write unit and integration tests. Perform security audit. Optimize performance (target <2s pass generation). Load test with concurrent requests.

### Phase 4: Production (Week 3-4)
Deploy to production. Verify health check, generate test passes, validate on physical iOS device. Document operational procedures. Share production URL and API key with iOS app team.

## Critical Path

```
Pass Type ID Certificate (from Apple Developer portal)
  → Hosting infrastructure setup
    → Certificate upload and configuration
      → Pass generation logic (pass.json + manifest + signing)
        → API endpoint
          → Authentication + validation
            → Production deployment
              → iOS app team notified of URL and API key
```

## Dependencies

### From iOS Project
- **Pass Type ID certificate** (.p12 file) — Generated in Apple Developer portal during iOS project setup (iOS Task 1.6)
- **Team Identifier** — From Apple Developer account
- **Pass Type Identifier** — Registered during iOS setup

### To iOS Project
- **Production API URL** — iOS app needs this for PassKitService configuration
- **API key** — iOS app needs this for authentication
- **API contract** — Request/response format must match what iOS app expects

**Timeline coordination:** This service must be deployed and accessible before the iOS app begins Wallet integration work (iOS Week 6). Starting this project in Week 1-2 of the iOS timeline provides comfortable buffer.

## Technology Decision

Must decide before starting implementation:

### Option A: Node.js
- **Framework:** Express.js or Fastify
- **Pass library:** `passkit-generator` (most popular, well-maintained)
- **Signing:** Handled by passkit-generator
- **Hosting fit:** Excellent for AWS Lambda, Railway, Heroku
- **Pros:** Single library handles most complexity, large ecosystem
- **Cons:** Node crypto can be verbose for manual signing

### Option B: Python
- **Framework:** Flask or FastAPI
- **Pass library:** `wallet-py3k` or build from scratch with `cryptography`
- **Signing:** `cryptography` library for PKCS7
- **Hosting fit:** Good for all platforms, excellent for AWS Lambda
- **Pros:** Cleaner crypto handling, simpler file operations
- **Cons:** Fewer turnkey pass libraries, may need more manual work

### Recommendation
Node.js with `passkit-generator` is the faster path. The library abstracts certificate loading, manifest generation, signing, and .pkpass creation into a clean API. Less custom code means fewer bugs.

## Hosting Decision

Must decide before infrastructure setup:

| Option | Cost | Pros | Cons |
|---|---|---|---|
| AWS Lambda | Free tier (1M requests/month) | Scales to zero, no idle costs | Cold starts, more setup |
| Railway | $5/month | Simple deploy, good DX | Monthly cost even when idle |
| Heroku | $5/month (Eco) | Well-documented, easy | Sleeps after 30min inactivity |
| DigitalOcean App Platform | $5/month | Simple, predictable | Monthly cost |
| Render | Free tier available | Easy deploy from Git | Free tier sleeps after 15min |

### Recommendation
For a low-traffic service (the iOS app is the only consumer), **Railway** or **Render** offer the best developer experience. AWS Lambda is best for cost optimization if traffic is very low but adds deployment complexity.

## Risk Register

### High Risk
1. **Certificate handling errors** — Signing fails if certificate is loaded incorrectly, expired, or password is wrong. Mitigate by validating certificate on startup and including certificate status in health check.
2. **Generated passes fail validation** — Apple's Wallet silently rejects malformed passes. Mitigate by testing every generated pass on a physical device.

### Medium Risk
3. **Service downtime blocks iOS Wallet feature** — If the service is down, users can't add cards to Wallet. Mitigate with proper error handling in iOS app (graceful degradation), monitoring, and alerts.
4. **Certificate expiration** — Passes stop generating when the certificate expires. Mitigate by monitoring expiry date, setting calendar reminders, and documenting renewal process.
5. **Hosting provider issues** — Service may go down due to provider outage. Mitigate by choosing a reliable provider and having a documented process for migrating to an alternative.

### Low Risk
6. **API key compromise** — If an API key is leaked, unauthorized users could generate passes. Mitigate by supporting key rotation, monitoring usage patterns, and rate limiting.
7. **Performance degradation** — Pass generation slows under load. Mitigate by load testing and optimizing. Low traffic expected for v1.0.

## Environments

| Environment | Purpose |
|---|---|
| Local | Development and debugging |
| Staging (optional) | Pre-production testing |
| Production | Live service used by iOS app |

For v1.0, staging is optional. Local testing + production is sufficient for a single-consumer service.

## Security Requirements

1. All production traffic over HTTPS
2. API key required for all pass generation requests
3. Certificate never committed to Git
4. Certificate password stored as environment variable or secret
5. Rate limiting to prevent abuse
6. Input validation on all request fields
7. Error messages never expose internal details
8. Dependencies checked for known vulnerabilities

## Monitoring & Alerting

### Metrics to Track
- Uptime (target: 99.9%)
- Response time (target: <2s for pass generation)
- Error rate (target: <1%)
- Request volume (track for capacity planning)
- Certificate expiry countdown

### Alerts
- Service down (health check fails) — immediate notification
- Error rate >5% — immediate notification
- Response time >5s — warning notification
- Certificate expiring in 30 days — warning notification

## Operational Procedures

Document these as part of the project:

1. **Deploying updates** — Git push or manual deploy steps
2. **Rotating API keys** — Generate new key, update iOS app config, deprecate old key
3. **Renewing certificates** — Download new cert from Apple, update env var, deploy
4. **Investigating errors** — Where to find logs, common error patterns
5. **Scaling** — How to handle increased traffic (if needed)
6. **Disaster recovery** — How to redeploy from scratch

## Definition of Done

A task is done when:
1. All acceptance criteria are met
2. Code compiles/runs without errors
3. Unit tests pass
4. No sensitive data in code or logs
5. Code committed and pushed
6. Works in local development environment
7. For deployment tasks: verified in production

## Success Criteria

### Deployment
- Service deployed and accessible via HTTPS
- Health check returns 200 OK with certificate status
- Test pass generates successfully
- Test pass opens correctly in Apple Wallet on physical device
- Barcode in generated pass is scannable
- API key authentication works (valid key accepted, invalid rejected)

### Ongoing
- 99.9% uptime over first 90 days
- <2s average response time
- Zero certificate-related outages
- All passes generated are valid and scannable
