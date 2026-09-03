# Django Admin Iframe Communication Guide

This document describes how the Angular admin app and the Django Commerce Insights app communicate securely when Django is embedded as a cross-origin iframe.

The important rule is:

```text
The Angular parent access token must never be sent to the Django iframe.
```

The iframe gets its own short-lived access token through a one-time authorization code and PKCE verifier.

## Applications

```text
Angular admin app:      frontend/native-federation/admin-app
Django insights app:    backend/django-commerce-insights
NestJS API/auth server: backend/ecommerce-api
```

Local development URLs:

```text
Angular shell/admin: http://localhost:4200 or http://localhost:4202
Django iframe:      http://localhost:8000/app/
NestJS API:         http://localhost:3000/api/v1
```

The admin route is:

```text
/admin/insights
```

## Security Model

Use this model:

```text
Parent admin token
  -> Angular admin app only
  -> used to request a one-time iframe authorization code

Iframe authorization code
  -> sent to Django iframe with postMessage
  -> short-lived
  -> single-use
  -> bound to client_id, redirect_uri, user, scope, and PKCE challenge

Iframe access token
  -> issued after code + PKCE verifier exchange
  -> short-lived
  -> scope-limited
  -> kept only in iframe JavaScript memory
```

Never send these to the iframe:

```text
Parent JWT/access token
Parent refresh token
API secret
Long-lived credential
```

Never put tokens in iframe URLs or query strings.

## Current Flow

```text
1. User logs in through the Angular auth/admin app.

2. Angular stores the parent session.
   Current implementation uses localStorage in auth.service.ts.
   This is parent-side only and must not be posted to Django.

3. Angular admin renders:
   <iframe src="http://localhost:8000/app/">

4. Django iframe generates:
   - codeVerifier
   - codeChallenge using S256
   - state

5. Django iframe sends this message to allowed parent origins:
   commerceos:iframe-ready

6. Angular validates:
   - event.source is the iframe window
   - event.origin is the Django iframe origin
   - message type is commerceos:iframe-ready
   - payload has the expected structure

7. Angular calls NestJS:
   POST /api/v1/auth/iframe/authorization
   Authorization: Bearer <parent access token>

8. NestJS validates the parent user and creates a one-time code.

9. Angular sends only the code back to Django:
   commerceos:authorization-code

10. Django validates:
    - event.source is window.parent
    - event.origin is allowed
    - message type is commerceos:authorization-code
    - state matches the pending authorization request

11. Django exchanges:
    POST /api/iframe/token/
    {
      "code": "...",
      "codeVerifier": "..."
    }

12. Django backend forwards to NestJS:
    POST /api/v1/auth/iframe/token

13. NestJS validates the code and PKCE verifier, marks the code used, and returns an iframe token.

14. Django iframe stores the iframe token in memory and calls:
    GET /api/dashboard/summary/
```

## Message Contract

### Django iframe to Angular parent

Message type:

```text
commerceos:iframe-ready
```

Payload:

```ts
{
  clientId: string;
  redirectUri: string;
  scope: string[];
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  state: string;
}
```

The iframe sends the message only to configured parent origins:

```js
window.parent.postMessage(message, 'http://localhost:4202');
```

Do not use:

```js
window.parent.postMessage(message, '*');
```

### Angular parent to Django iframe

Message type:

```text
commerceos:authorization-code
```

Payload:

```ts
{
  code: string;
  state: string;
  expiresIn: number;
}
```

Angular must send to the exact Django origin:

```ts
iframe.contentWindow?.postMessage(message, 'http://localhost:8000');
```

## Angular Admin Responsibilities

Main file:

```text
frontend/native-federation/admin-app/src/app/features/django-insights/django-insights.component.ts
```

The component must:

- Render the Django iframe from `environment.djangoInsightsUrl`.
- Use `DomSanitizer.bypassSecurityTrustResourceUrl()` only for the configured iframe URL.
- Set `sandbox` on the iframe.
- Listen for `commerceos:iframe-ready`.
- Validate `event.source`.
- Validate `event.origin`.
- Validate the message type and payload shape.
- Call `POST /auth/iframe/authorization` using Angular `HttpClient`.
- Send only the one-time authorization code back to the iframe.

Important: the parent token is attached by the Angular HTTP interceptor/AuthService stack when Angular calls the NestJS API. It is not included in any `postMessage` payload.

The iframe wrapper should look conceptually like this:

```ts
this.http.post(`${environment.apiUrl}/auth/iframe/authorization`, {
  clientId: request.clientId,
  redirectUri: request.redirectUri,
  scope: request.scope,
  codeChallenge: request.codeChallenge,
  codeChallengeMethod: 'S256',
});

this.frame.nativeElement.contentWindow?.postMessage(
  {
    type: 'commerceos:authorization-code',
    payload: {
      code: response.data.code,
      state: request.state,
      expiresIn: response.data.expiresIn,
    },
  },
  this.targetOrigin,
);
```

## Parent AuthService Note

Main file:

```text
frontend/native-federation/admin-app/src/app/core/services/auth.service.ts
```

The current parent auth implementation stores:

```text
access_token
refresh_token
auth_user
```

in `localStorage`.

This is not iframe-specific, and the Django iframe must not read or receive these values. The admin app should use the parent access token only for:

```text
POST /api/v1/auth/iframe/authorization
```

Security note: `localStorage` tokens are readable by JavaScript. If the Angular parent app has XSS, an attacker can steal the parent access token and refresh token. For stronger production security, move refresh-session handling to HttpOnly, Secure, SameSite cookies or another server-managed session design.

## Django Iframe Responsibilities

Main file:

```text
backend/django-commerce-insights/insights/static/insights/app.js
```

The iframe frontend must:

- Load allowed parent origins from Django-rendered config.
- Generate a cryptographically random PKCE verifier.
- Generate a cryptographically random `state`.
- Compute `codeChallenge = base64url(sha256(codeVerifier))`.
- Send `commerceos:iframe-ready` to exact configured parent origins.
- Receive only `commerceos:authorization-code`.
- Validate `event.source === window.parent`.
- Validate `event.origin` against configured parent origins.
- Validate payload shape.
- Validate returned `state`.
- Exchange the code through Django same-origin endpoint.
- Store only the iframe access token in memory.

The iframe token should be stored like this:

```js
let accessToken = '';
```

Do not use:

```js
localStorage.setItem('accessToken', token);
sessionStorage.setItem('accessToken', token);
```

## Django Backend Responsibilities

Main files:

```text
backend/django-commerce-insights/insights/views.py
backend/django-commerce-insights/insights/services.py
```

Django exposes:

```text
POST /api/iframe/token/
GET  /api/dashboard/summary/
```

`POST /api/iframe/token/` accepts only:

```json
{
  "code": "one-time-code",
  "codeVerifier": "pkce-verifier"
}
```

Django then forwards the exchange to NestJS:

```text
POST /api/v1/auth/iframe/token
```

Django supplies the server-configured:

```text
clientId
redirectUri
```

This keeps the browser from choosing arbitrary client IDs or redirect URIs during token exchange.

## NestJS Auth Responsibilities

Main files:

```text
backend/ecommerce-api/src/modules/auth/controllers/iframe-auth.controller.ts
backend/ecommerce-api/src/modules/auth/services/iframe-auth.service.ts
backend/ecommerce-api/src/modules/auth/entities/iframe-authorization-code.entity.ts
backend/ecommerce-api/src/modules/auth/dto/iframe-auth.dto.ts
```

NestJS exposes:

```text
POST /api/v1/auth/iframe/authorization
POST /api/v1/auth/iframe/token
```

### Create authorization code

Endpoint:

```text
POST /api/v1/auth/iframe/authorization
Authorization: Bearer <parent access token>
```

Body:

```json
{
  "clientId": "commerce-insights-iframe",
  "redirectUri": "http://localhost:8000/app/",
  "scope": ["product.read", "inventory.read", "order.read", "review.manage"],
  "codeChallenge": "base64url-sha256-value",
  "codeChallengeMethod": "S256"
}
```

NestJS must:

- Validate the parent access token.
- Validate `clientId`.
- Validate exact `redirectUri`.
- Require `codeChallengeMethod = S256`.
- Store only a hash of the authorization code.
- Bind the code to user, client, redirect URI, scopes, and PKCE challenge.
- Expire the code quickly. Current local default is `60s`.
- Return only the one-time code, expiry, and granted scope.

### Exchange authorization code

Endpoint:

```text
POST /api/v1/auth/iframe/token
```

Body:

```json
{
  "clientId": "commerce-insights-iframe",
  "redirectUri": "http://localhost:8000/app/",
  "code": "one-time-code",
  "codeVerifier": "original-pkce-verifier"
}
```

NestJS must reject the request if:

- The code does not exist.
- The code was already used.
- The code expired.
- The client ID does not match.
- The redirect URI does not match.
- The PKCE verifier does not match the stored challenge.

Returned token:

```json
{
  "accessToken": "iframe-scoped-jwt",
  "tokenType": "Bearer",
  "expiresIn": 300,
  "scope": ["product.read", "inventory.read", "order.read", "review.manage"]
}
```

## API Permission Model

Iframe tokens include:

```text
tokenUse = iframe
permissions = granted iframe scopes
sessionId = iframe:<authorization-code-id>
```

The API must:

- Validate JWT signature.
- Validate expiration.
- Load the current user from the database.
- Verify the user can still authenticate.
- Intersect token permissions with the user's current database permissions.
- Enforce route permissions.
- Deny iframe tokens on routes that do not explicitly allow them.

The iframe token must not be able to call customer or parent-only APIs such as:

```text
/cart
/checkout
/users/manage
/account/delete
/billing
```

Current verified behavior:

```text
GET /api/v1/cart with iframe token -> 403
```

Recommended production hardening:

- Add explicit JWT `iss`.
- Add explicit JWT `aud`.
- Validate `iss` and `aud` in the JWT strategy.
- Make code exchange atomic with a conditional update.
- Add explicit route metadata such as `@AllowIframeToken()` instead of URL substring checks.

## Environment Variables

NestJS:

```env
IFRAME_CLIENT_ID=commerce-insights-iframe
IFRAME_REDIRECT_URI=http://localhost:8000/app/
IFRAME_AUTHORIZATION_CODE_TTL=60s
IFRAME_ACCESS_TOKEN_EXPIRES_IN=5m
IFRAME_ALLOWED_SCOPES=product.read,inventory.read,order.read,review.manage
CORS_ORIGINS=http://localhost:4200,http://localhost:4202,http://localhost:8000
```

Django:

```env
NEST_API_BASE_URL=http://localhost:3000/api/v1
IFRAME_CLIENT_ID=commerce-insights-iframe
IFRAME_REDIRECT_URI=http://localhost:8000/app/
IFRAME_SCOPES=product.read,inventory.read,order.read,review.manage
IFRAME_PARENT_ORIGINS=http://localhost:4200,http://localhost:4202
```

Angular:

```ts
export const environment = {
  apiUrl: 'http://localhost:3000/api/v1',
  djangoInsightsUrl: 'http://localhost:8000/app/',
};
```

Production values must use HTTPS.

## CSP, Framing, and Browser Security

Django `/app/` should send a strict CSP:

```text
default-src 'self';
base-uri 'none';
object-src 'none';
form-action 'none';
script-src 'self';
style-src 'self';
img-src 'self' data: https:;
connect-src 'self' https://api.example.com;
frame-ancestors 'self' https://app.example.com;
```

Use `frame-ancestors` to restrict which parent origins can embed the Django app. Do not rely only on `X-Frame-Options` for cross-origin framing.

Angular iframe sandbox:

```html
<iframe
  src="https://widget.example.com/app/"
  title="Commerce Insights"
  sandbox="allow-scripts allow-same-origin allow-forms"
  referrerpolicy="same-origin"
></iframe>
```

Only keep sandbox permissions that the Django app needs.

## CORS

NestJS CORS should list exact allowed origins. Do not use:

```text
Access-Control-Allow-Origin: *
```

when APIs accept `Authorization` headers or return sensitive data.

Current API configuration uses:

```text
credentials: false
allowedHeaders: Authorization, Content-Type, X-Request-Id, Idempotency-Key
```

That is appropriate for bearer-token requests.

## CSRF

The iframe token exchange does not rely on cookies, so classic browser-cookie CSRF is not the main risk for:

```text
POST /api/iframe/token/
POST /api/v1/auth/iframe/token
```

These endpoints are protected by the one-time code and PKCE verifier.

The parent authorization endpoint is different:

```text
POST /api/v1/auth/iframe/authorization
```

It uses the parent bearer token in an `Authorization` header. Browsers do not attach bearer headers automatically, so normal CSRF is not expected unless a custom client script supplies the token.

If the parent auth model moves to cookies, this endpoint must get CSRF protection or SameSite protections.

## Reload and Lifecycle Behavior

| Scenario | Required behavior |
| --- | --- |
| Initial iframe load | Generate PKCE/state, request code, exchange token, load dashboard |
| Iframe reload | Generate a new PKCE/state and obtain a new code/token |
| Parent reload | Restore parent auth, receive iframe-ready, create a new code |
| Both reload | Reject stale messages by state; eventually create a fresh code/token |
| Token expiration | Clear iframe token, request one new authorization, retry once |
| Logout | Parent clears auth and no longer creates iframe codes |
| Account switch | Reload iframe and authorize only as the new parent user |
| Multiple tabs | Each tab must use its own parent auth state and iframe authorization transaction |
| Multiple iframes | Each iframe must use independent state and should include an iframe instance ID |

Current implementation handles initial load and iframe reload. Token expiration reauthorization and explicit multi-iframe instance IDs are recommended next hardening steps.

## Verification Checklist

Run these checks after changes:

```text
1. Parent login succeeds.
2. Iframe sends commerceos:iframe-ready.
3. Angular validates source and origin.
4. Angular creates an iframe authorization code.
5. Angular sends only the code to Django.
6. Django validates source, origin, and state.
7. Django exchanges code + PKCE verifier.
8. Dashboard loads with iframe token.
9. Reusing the same code returns 401.
10. Wrong PKCE verifier returns 401.
11. Wrong redirect URI returns 400/401.
12. Iframe token cannot call /cart.
13. Iframe token cannot call unscoped parent/admin endpoints.
14. Logout prevents new iframe authorization.
15. Account switch reloads iframe as the new user.
```

Latest local verification:

```text
parentLogin:               True
authCodeIssued:            True
iframeTokenIssued:         True
dashboardSuccess:          True
dashboardProducts:         16
dashboardInventoryItems:   32
reusedCodeStatus:          401
cartWithIframeTokenStatus: 403
```

## Final Architecture

```text
Angular shell/admin
  -> owns parent authentication
  -> never sends parent JWT to Django

Angular admin insights component
  -> embeds Django iframe
  -> receives iframe PKCE authorization request
  -> calls NestJS to create one-time code
  -> sends only code + state to iframe

Django iframe frontend
  -> generates PKCE verifier/challenge
  -> validates parent postMessage origin/source/state
  -> keeps iframe token in memory
  -> calls Django same-origin dashboard API

Django backend
  -> exchanges code with NestJS
  -> proxies dashboard data from NestJS

NestJS API/auth
  -> validates parent token for authorization-code creation
  -> validates PKCE for token exchange
  -> issues short-lived iframe token
  -> enforces iframe scopes and tokenUse
```
