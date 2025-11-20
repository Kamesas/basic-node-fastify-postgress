# Refresh Token Flow - Complete Explanation

## 🍪 Where is the Refresh Token Cookie?

### Important: Domain Separation

The `refreshToken` cookie is stored on **`localhost:4000`** (backend domain), NOT on `localhost:3000` (frontend domain).

**Why?**
- Cookies are domain-specific
- Backend sets cookie with domain `localhost` (port 4000)
- Browser stores it for that domain
- When frontend makes request to backend, browser automatically sends it

---

## 🔍 How to Check Cookies Correctly

### In Chrome DevTools:

1. **Press F12** to open DevTools
2. **Go to Application tab**
3. **Expand "Cookies"** in left sidebar
4. You'll see TWO domains:
   ```
   📁 Cookies
     ├─ http://localhost:3000  (Frontend - should be EMPTY or have frontend cookies only)
     └─ http://localhost:4000  (Backend - should have refreshToken)
   ```

5. **Click `http://localhost:4000`**
6. **You should see**:
   ```
   Name:       refreshToken
   Value:      eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Domain:     localhost
   Path:       /api/auth
   Expires:    (7 days from now)
   HttpOnly:   ✓ (checkmark)
   Secure:     (empty in dev, ✓ in production)
   SameSite:   Lax
   ```

---

## 🔄 Complete Refresh Token Flow

### Scenario: User Logs In and Uses the App

#### **Step 1: Login (User Action)**

```
🌐 URL: http://localhost:3000/auth/login
👤 User enters: email + password
🖱️ User clicks: "Login" button
```

**What happens**:

```typescript
// Frontend (LoginForm.tsx)
const response = await fetchAPI('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});

// Actual request:
POST http://localhost:4000/api/auth/login
Headers:
  Content-Type: application/json
  Origin: http://localhost:3000
Body:
  { "email": "user@example.com", "password": "password123" }
```

**Backend processes**:

```typescript
// Backend (auth.routes.ts)
1. Validates email/password
2. Generates accessToken (15min)
3. Generates refreshToken (7 days)
4. Stores refreshToken hash in database
5. Sets cookie:
   reply.setCookie("refreshToken", refreshToken, {
     httpOnly: true,
     path: "/api/auth",
     maxAge: 604800 // 7 days
   });
6. Returns response
```

**Backend response**:

```http
HTTP/1.1 201 Created
Set-Cookie: refreshToken=eyJhbGc...; Path=/api/auth; HttpOnly; SameSite=Lax
Content-Type: application/json

{
  "user": { "id": 1, "username": "john", ... },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Frontend receives**:

```typescript
// Frontend (LoginForm.tsx)
const { accessToken, refreshToken, user } = await response.json();

// Store access token
storeAccessToken(accessToken); // → localStorage

// Browser automatically stores refreshToken cookie for localhost:4000
// (Frontend doesn't need to do anything for this!)

// Store user info
localStorage.setItem('user', JSON.stringify(user));

// Redirect to dashboard
router.push('/');
```

**Result**:
- ✅ `accessToken` in `localStorage` (frontend domain)
- ✅ `refreshToken` in cookie (backend domain)
- ✅ User redirected to dashboard

---

#### **Step 2: Making Authenticated Requests (First 15 minutes)**

```
🌐 URL: http://localhost:3000/profile
📄 Page loads, needs to fetch user data
```

**What happens**:

```typescript
// Frontend (profile page)
const user = await apiGet('/api/users/me');

// Actual request:
GET http://localhost:4000/api/users/me
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (from localStorage)
  Cookie: refreshToken=eyJhbGc... (automatically added by browser!)
```

**Backend receives**:

```typescript
// Backend (middleware)
1. Reads Authorization header
2. Extracts accessToken
3. Verifies JWT signature
4. Checks expiration: ✅ Still valid (only 5 mins old)
5. Attaches user to request
6. Returns user data
```

**Result**: ✅ User data returned, page renders

---

#### **Step 3: Token Expires (After 15 minutes)**

```
⏰ 15 minutes pass...
🌐 User still on: http://localhost:3000/profile
🔄 Page makes another request
```

**What happens**:

```typescript
// Frontend
const posts = await apiGet('/api/posts');

// Actual request:
GET http://localhost:4000/api/posts
Headers:
  Authorization: Bearer EXPIRED_TOKEN... (15+ mins old!)
  Cookie: refreshToken=eyJhbGc... (still valid for 7 days)
```

**Backend checks**:

```typescript
// Backend (middleware)
1. Reads Authorization header
2. Extracts accessToken
3. Verifies JWT signature: ✅ Valid
4. Checks expiration: ❌ EXPIRED (15+ mins old)
5. Returns 401 Unauthorized
```

**Backend response**:

```http
HTTP/1.1 401 Unauthorized
{ "error": "Token expired" }
```

**Frontend catches 401**:

```typescript
// Frontend (api.ts - fetchAPI function)
if (response.status === 401 && !options._retry) {
  console.log("🔒 Received 401, attempting token refresh...");
  
  const refreshed = await refreshAccessToken();
  
  if (refreshed) {
    // Retry original request with new token
    return fetchAPI(endpoint, { ...options, _retry: true });
  }
}
```

---

#### **Step 4: Automatic Token Refresh**

**Frontend calls refresh**:

```typescript
// Frontend (api.ts - refreshAccessToken function)
const response = await fetch(`${API_URL}/api/auth/refresh`, {
  method: 'POST',
  credentials: 'include', // Send cookies!
});

// Actual request:
POST http://localhost:4000/api/auth/refresh
Headers:
  Content-Type: application/json
  Cookie: refreshToken=eyJhbGc... (browser automatically sends it!)
Body: (empty - token is in cookie!)
```

**Backend processes**:

```typescript
// Backend (auth.tokens.routes.ts)
1. Reads refreshToken from cookie: request.cookies.refreshToken
2. Verifies JWT signature: ✅ Valid
3. Checks in database: ✅ Exists and not revoked
4. Deletes old refresh token from database
5. Generates NEW accessToken (15min)
6. Generates NEW refreshToken (7 days)
7. Stores new refreshToken hash in database
8. Sets new cookie
9. Returns new accessToken
```

**Backend response**:

```http
HTTP/1.1 200 OK
Set-Cookie: refreshToken=NEW_TOKEN...; Path=/api/auth; HttpOnly; SameSite=Lax
Content-Type: application/json

{
  "accessToken": "NEW_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "NEW_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Frontend receives**:

```typescript
// Frontend (api.ts - refreshAccessToken function)
const data = await response.json();

// Store new access token
setAccessToken(data.accessToken); // → localStorage

// Browser automatically updates refreshToken cookie
// Old cookie is replaced with new one

console.log("✅ Token refreshed successfully");
return true; // Refresh succeeded
```

**Frontend retries original request**:

```typescript
// Frontend (api.ts - fetchAPI function)
return fetchAPI(endpoint, { ...options, _retry: true });

// New request with fresh token:
GET http://localhost:4000/api/posts
Headers:
  Authorization: Bearer NEW_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Cookie: refreshToken=NEW_TOKEN...
```

**Backend checks**:

```typescript
1. Reads Authorization header
2. Extracts NEW accessToken
3. Verifies JWT: ✅ Valid
4. Checks expiration: ✅ Fresh (just created!)
5. Returns posts data
```

**Result**: ✅ Posts data returned

**User Experience**: User sees **NO interruption**! The refresh happened automatically in the background.

---

## 🎯 Key Points

### 1. Cookie Domain

```
Cookie is stored on:     localhost:4000 (backend)
NOT on:                  localhost:3000 (frontend)

But when frontend makes request to localhost:4000,
browser automatically includes the cookie!
```

### 2. Automatic Cookie Sending

```
Frontend code does NOT manually send cookie!
Browser does it automatically because:
- Request is to localhost:4000
- Cookie exists for localhost:4000
- credentials: 'include' is set
```

### 3. Token Locations

```
Access Token:
  - Stored in: localStorage (frontend)
  - Sent via: Authorization header
  - Lifetime: 15 minutes
  - Updated: When refresh happens

Refresh Token:
  - Stored in: httpOnly cookie (backend domain)
  - Sent via: Cookie header (automatic!)
  - Lifetime: 7 days
  - Updated: When refresh happens
```

### 4. Security Benefits

```
XSS Attack Scenario:
- Attacker injects: <script>steal(localStorage.getItem('accessToken'))</script>
- Attacker gets: accessToken (15 min access)
- Attacker tries: steal(document.cookie)
- Result: Empty! (httpOnly blocks JavaScript access)
- After 15 min: Attacker's access token expires
- Attacker cannot refresh: No refresh token!
- ✅ Limited damage (only 15 min window)
```

---

## 🧪 Testing the Flow

### Test 1: Verify Cookie Location

```javascript
// Open browser console on http://localhost:3000
console.log('Frontend cookies:', document.cookie);
// Should NOT show refreshToken (it's on localhost:4000)

console.log('Access token:', localStorage.getItem('accessToken'));
// Should show the JWT token
```

### Test 2: Simulate Token Refresh

```javascript
// In browser console
async function testRefresh() {
  const response = await fetch('http://localhost:4000/api/auth/refresh', {
    method: 'POST',
    credentials: 'include'
  });
  
  const data = await response.json();
  console.log('New tokens:', data);
  
  // Update localStorage
  localStorage.setItem('accessToken', data.accessToken);
}

testRefresh();
```

### Test 3: View Backend Cookies

1. Open DevTools (F12)
2. Application → Cookies
3. Click `http://localhost:4000`
4. See `refreshToken` cookie

---

## ❓ FAQ

### Q: Why do I see the cookie on localhost:3000?

**A**: You probably don't! Check DevTools carefully:
- Look at the **domain column**
- Cookie domain should be `localhost` (port 4000)
- If viewing from frontend, you're seeing backend's cookies in the list

### Q: Can JavaScript on frontend read the refreshToken?

**A**: No! `httpOnly: true` prevents JavaScript access:
```javascript
document.cookie // Won't show refreshToken
```

### Q: Does frontend need to manually send the cookie?

**A**: No! Browser automatically sends it when:
- Request goes to `localhost:4000`
- `credentials: 'include'` is set
- Cookie path matches (`/api/auth`)

### Q: What happens if refresh token expires (after 7 days)?

**A**: 
1. Frontend tries to refresh
2. Backend returns 401 (token expired/invalid)
3. Frontend redirects to login page
4. User must login again

### Q: Can mobile apps use the same flow?

**A**: Almost! Mobile apps:
- Store refreshToken in SecureStore (not cookie)
- Send it in request body (not cookie)
- Backend accepts both methods!

---

## 🎉 Summary

Your refresh token flow is **working correctly**!

- ✅ Cookie stored on backend domain (localhost:4000)
- ✅ Browser automatically sends cookie with requests
- ✅ Frontend doesn't need to manage cookie manually
- ✅ Automatic refresh on 401 errors
- ✅ Secure (httpOnly prevents XSS theft)
- ✅ User experience is seamless

**The magic**: Browser handles the cookie, frontend just needs to use `credentials: 'include'`!
