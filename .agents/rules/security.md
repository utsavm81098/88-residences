---
trigger: always_on
glob:
  - "src/**/*.{js,jsx,ts,tsx}"
description: Enforce security guidelines per SOP §16
---

# Security Guidelines (SOP §16)

Security rules apply across containers, components, and pages.
Violations must be treated as **blockers** in code review.

## XSS Prevention

- ❌ **Avoid `dangerouslySetInnerHTML`** — never use unless absolutely necessary and approved.
- ❌ **Never render raw HTML** from APIs without sanitization.
- ✅ Sanitize any dynamic HTML content before rendering.
- ✅ Rely on React's default escaping for JSX.
- ✅ Do not trust user input or API responses blindly.

## Token Storage

- Tokens must NOT be stored in UI components.
- Avoid storing sensitive tokens in `localStorage` unless explicitly required.
- Prefer `HttpOnly` cookies for authentication tokens.
- If client-side storage is unavoidable:
  - Store only non-sensitive identifiers
  - Never store refresh tokens
- Never log tokens or auth headers.

## API Protection

- ❌ No API calls inside UI components (`/components`).
- ❌ No API calls inside pages (`/pages`).
- ✅ API calls must be made only from:
  - Container hooks
  - Centralized API utilities (`/services`)
- Handle authorization and error responses centrally.
- Do not expose internal API URLs or secrets in UI code.

## Environment Variables

- ❌ Never commit `.env` files with real values.
- ✅ Maintain `.env.example` for reference.
- ❌ Do not expose secrets to client-side code.
- ✅ Use environment variables only for:
  - Public configuration
  - Environment-specific flags
- ❌ Do not hardcode environment values in code.

### Required Files

| File | Purpose | Committed to Git? |
|---|---|---|
| `.env.example` | Template with all required env vars (no values) | ✅ Yes |
| `.env` | Local development values | ❌ No (gitignored) |
| `.env.staging` | Staging values | ❌ No (gitignored) |
| `.env.production` | Production values | ❌ No (gitignored) |

## Input Validation

- All user inputs must be validated before use.
- All route params and query params must be validated.
- Never assume the existence of params.
