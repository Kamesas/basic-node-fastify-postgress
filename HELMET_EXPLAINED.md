# How Helmet Works - Security Headers Explained

## What Helmet Does

Helmet automatically sets **HTTP security headers** to protect your API from common attacks.

## Security Headers Helmet Sets:

### 1. **X-Content-Type-Options: nosniff**

**Prevents:** MIME type sniffing attacks
**What it does:** Tells browsers not to try to "guess" the content type

```
Without: Browser might interpret JSON as HTML and execute malicious code
With: Browser strictly follows the Content-Type header
```

### 2. **X-Frame-Options: DENY**

**Prevents:** Clickjacking attacks
**What it does:** Prevents your site from being loaded in an iframe

```
Without: Attacker can load your API in a hidden iframe and trick users
With: Browser blocks iframe loading
```

### 3. **X-XSS-Protection: 0**

**Prevents:** XSS attacks (legacy header, now deprecated)
**What it does:** Modern browsers don't need this, CSP is better

### 4. **Strict-Transport-Security (HSTS)**

**Prevents:** Man-in-the-middle attacks
**What it does:** Forces HTTPS connections

```
Strict-Transport-Security: max-age=15552000; includeSubDomains
```

**Means:** "Always use HTTPS for the next 180 days"

### 5. **Content-Security-Policy (CSP)**

**Prevents:** XSS, code injection, data theft
**What it does:** Controls what resources can be loaded

```typescript
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],           // Only load resources from same origin
    scriptSrc: ["'self'", "'unsafe-inline'"],  // Where scripts can come from
    styleSrc: ["'self'", "https://fonts.googleapis.com"],
    imgSrc: ["'self'", "data:", "https:"],
  }
}
```

### 6. **X-Permitted-Cross-Domain-Policies: none**

**Prevents:** Adobe Flash/PDF cross-domain attacks
**What it does:** Blocks Flash/PDF from loading cross-domain content

### 7. **Referrer-Policy: no-referrer**

**Prevents:** Information leakage
**What it does:** Doesn't send the Referrer header

```
Without: External sites see where your users came from
With: Referrer info is hidden
```

### 8. **X-Download-Options: noopen**

**Prevents:** IE-specific attacks
**What it does:** Prevents IE from executing downloads in your site's context

### 9. **X-DNS-Prefetch-Control: off**

**Prevents:** Privacy leaks
**What it does:** Disables DNS prefetching

---

## Real-World Example

**WITHOUT Helmet:**

```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 42

{"users": [...]}
```

**Risk:** Vulnerable to clickjacking, XSS, MIME sniffing, etc.

**WITH Helmet:**

```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 42
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0
Strict-Transport-Security: max-age=15552000; includeSubDomains
Content-Security-Policy: default-src 'self'
X-Permitted-Cross-Domain-Policies: none
Referrer-Policy: no-referrer
X-Download-Options: noopen
X-DNS-Prefetch-Control: off

{"users": [...]}
```

**Result:** Much harder to attack!

---

## Common Attack Scenarios Helmet Prevents:

### 1. **Clickjacking Attack**

```
WITHOUT Helmet:
1. Attacker creates evil.com
2. Loads your API in invisible iframe
3. Tricks user into clicking
4. User unknowingly makes API calls

WITH Helmet (X-Frame-Options):
Browser blocks the iframe loading ✅
```

### 2. **XSS Attack**

```
WITHOUT Helmet:
1. Attacker injects <script> tag
2. Browser executes malicious code
3. Steals user data

WITH Helmet (CSP):
Browser blocks inline scripts ✅
```

### 3. **MIME Sniffing Attack**

```
WITHOUT Helmet:
1. Attacker uploads "image.jpg" (actually HTML with JS)
2. Browser "sniffs" and executes it as HTML
3. XSS attack succeeds

WITH Helmet (X-Content-Type-Options):
Browser respects Content-Type, doesn't execute ✅
```

### 4. **Man-in-the-Middle Attack**

```
WITHOUT HSTS:
1. User types "yourapi.com" (no https)
2. Attacker intercepts HTTP request
3. Steals credentials

WITH Helmet (HSTS):
Browser automatically upgrades to HTTPS ✅
```

---

## Configuration for Your Production API:

```typescript
import helmet from "@fastify/helmet";

// Basic (good for APIs)
fastify.register(helmet);

// Custom (for APIs serving web content)
fastify.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // If you need to embed content
});

// Disable for local development (optional)
if (process.env.NODE_ENV === "production") {
  fastify.register(helmet);
}
```

---

## Do You Need It?

**For APIs (JSON only):** Some headers are less critical, but still recommended
**For Web Apps (serving HTML):** **Absolutely essential!**
**For Production:** **YES! Always enable it**

### Why enable even for JSON APIs?

1. Defense in depth - multiple layers of security
2. Some headers still matter (HSTS, X-Content-Type-Options)
3. Future-proofing if you add web content later
4. No performance impact
5. Industry best practice

---

## Testing Helmet

You can test your headers at:

- https://securityheaders.com
- https://observatory.mozilla.org

Just deploy your API and check the security score!

---

## Summary

**Helmet = One line of code, massive security improvement**

```typescript
await fastify.register(helmet);
```

**Result:**

- ✅ Protects against clickjacking
- ✅ Prevents XSS attacks
- ✅ Stops MIME sniffing
- ✅ Forces HTTPS
- ✅ Hides referrer info
- ✅ Industry standard security
- ✅ Required for production apps with millions of users

**Cost:** ~0ms latency, zero performance impact
**Benefit:** Major security improvements

**Always enable helmet in production!**
