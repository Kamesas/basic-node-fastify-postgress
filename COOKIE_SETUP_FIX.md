# Cookie Setup - FIXED ✅

## 🐛 The Problem You Found

You saw **`oauth2-redirect-state`** cookie but NOT **`refreshToken`** cookie.

### Why?

1. **`oauth2-redirect-state`** - Created by `@fastify/oauth2` plugin for Google OAuth security
   - Temporary cookie used during OAuth flow
   - NOT your refresh token
   - Automatically managed by the OAuth library

2. **`refreshToken`** - Your authentication cookie
   - Was NOT being created
   - Reason: `@fastify/cookie` plugin was not registered
   - Even though the code called `reply.setCookie()`, it did nothing

---

## ✅ What I Fixed

### 1. Registered Cookie Plugin

**File**: `src/plugins/support.ts`

```typescript
import cookie from "@fastify/cookie";

await fastify.register(cookie);
```

Now `reply.setCookie()` and `request.cookies` work properly!

---

### 2. Registered CORS Plugin

**File**: `src/plugins/support.ts`

```typescript
import cors from "@fastify/cors";

await fastify.register(cors, {
  origin: config.frontendUrl,  // http://localhost:3000
  credentials: true             // REQUIRED for cookies!
});
```

This allows:
- Frontend (localhost:3000) to make requests to Backend (localhost:4000)
- Cookies to be sent cross-origin
- Credentials to be included

---

### 3. Installed Missing Packages

```bash
npm install @fastify/cookie  # Already installed (dependency of oauth2)
npm install @fastify/cors    # Just installed
```

---

## 🍪 What You Should See Now

After restarting your backend and logging in:

### In Browser DevTools → Application → Cookies → localhost:4000

```
Name:       refreshToken
Value:      eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Domain:     localhost
Path:       /api/auth
HttpOnly:   ✓
Secure:     (empty in dev, ✓ in production)
SameSite:   Lax
Expires:    (7 days from now)
```

### In Browser DevTools → Application → Cookies → localhost:3000

You might also see the cookie here if CORS is configured correctly!

---

## 🧪 How to Test

### 1. Restart Backend

```bash
cd /home/alex/code/basic/basic-back
npm run dev
```

### 2. Login via Frontend

Go to http://localhost:3000/auth/login and login with email/password or Google.

### 3. Check Cookies

**Chrome DevTools**:
1. Press F12
2. Go to "Application" tab
3. Expand "Cookies" in left sidebar
4. Click "http://localhost:4000"
5. Look for `refreshToken`

**Firefox DevTools**:
1. Press F12
2. Go to "Storage" tab
3. Expand "Cookies"
4. Click "http://localhost:4000"
5. Look for `refreshToken`

---

### 4. Verify Cookie is Sent with Requests

**Chrome DevTools**:
1. Go to "Network" tab
2. Make a request to `/api/auth/refresh` or any protected endpoint
3. Click on the request
4. Look at "Request Headers"
5. Should see: `Cookie: refreshToken=eyJhbGc...`

---

## 📊 Before vs After

### Before (Broken)

```
Browser sends request → Backend tries reply.setCookie()
                      → Nothing happens (plugin not registered)
                      → No cookie sent to browser
                      → request.cookies is undefined
                      → Refresh token flow broken for web
```

### After (Working)

```
Browser sends request → Backend calls reply.setCookie()
                      → Cookie plugin sets the cookie
                      → Cookie sent to browser
                      → Browser stores it
                      → Next request includes cookie automatically
                      → request.cookies.refreshToken works
                      → Full authentication flow works!
```

---

## 🔍 Understanding the Cookies

### Cookies You Should See

#### 1. `refreshToken` (Yours - Authentication)
```
Created by:  Your backend (setAuthCookies)
Purpose:     Store refresh token securely
Lifetime:    7 days
HttpOnly:    Yes (JavaScript can't read it)
Path:        /api/auth
When:        After login
```

#### 2. `oauth2-redirect-state` (Library - OAuth Security)
```
Created by:  @fastify/oauth2 plugin
Purpose:     CSRF protection during OAuth
Lifetime:    Short (few minutes)
HttpOnly:    Yes
Path:        /
When:        During Google OAuth flow only
```

#### 3. `accessToken` (NOT created - by design)
```
NOT a cookie!
Stored in:   localStorage (frontend)
Sent via:    Authorization: Bearer header
Why:         More flexible, no path restrictions
```

---

## 🎯 Summary

**The issue**: Cookie plugin wasn't registered, so cookies weren't being set.

**The fix**: 
1. ✅ Registered `@fastify/cookie` plugin
2. ✅ Registered `@fastify/cors` plugin with credentials
3. ✅ Backend can now set and read cookies
4. ✅ Frontend can receive cookies cross-origin

**What you should see**:
- `oauth2-redirect-state` - OAuth security (temporary)
- `refreshToken` - Your authentication token (persistent)

**Test it**: Restart backend, login, check DevTools → Application → Cookies!
