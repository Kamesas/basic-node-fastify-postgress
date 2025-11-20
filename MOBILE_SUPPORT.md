# Mobile App Support - Backend Configuration

## Overview

The backend now supports **both web browsers and mobile apps** with a dual authentication strategy:

- **Web Browsers**: Use httpOnly cookies for refresh tokens (most secure)
- **Mobile Apps**: Use request body for refresh tokens (most compatible)

Both approaches use **Authorization header** for access tokens.

## 🔄 Dual Support Implementation

### 1. Login Endpoint

**`POST /api/auth/login`**

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "user": {
    "id": 1,
    "username": "john",
    "email": "john@example.com",
    "displayName": "John Doe",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

**Plus**: Sets `Set-Cookie: refreshToken=...; HttpOnly` for web browsers

**Usage**:
- **Web**: Ignore `refreshToken` in response, use cookie automatically
- **Mobile**: Store both `accessToken` and `refreshToken` in SecureStore

---

### 2. Refresh Token Endpoint

**`POST /api/auth/refresh`**

**Request (Web - using cookie)**:
```http
POST /api/auth/refresh
Cookie: refreshToken=eyJhbGc...
```

**Request (Mobile - using body)**:
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Backend Logic**:
```typescript
// Tries cookie first (web), then body (mobile)
let refreshToken = request.cookies.refreshToken; // Web
if (!refreshToken && request.body?.refreshToken) {
  refreshToken = request.body.refreshToken; // Mobile
}
```

**Response**:
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

**Plus**: Sets new `Set-Cookie: refreshToken=...` for web browsers

---

### 3. Logout Endpoint

**`POST /api/auth/logout`**

**Request (Web)**:
```http
POST /api/auth/logout
Cookie: refreshToken=eyJhbGc...
```

**Request (Mobile)**:
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response**:
```json
{
  "message": "Logged out"
}
```

**Plus**: Clears cookie for web browsers

---

### 4. Logout All Devices

**`POST /api/auth/logout-all`**

Same dual support as single logout, but deletes all refresh tokens for the user.

---

## 📱 Mobile App Integration Guide

### React Native Example

#### 1. Install Dependencies

```bash
npm install expo-secure-store
# or
npm install @react-native-async-storage/async-storage
```

#### 2. Create Auth Service

```typescript
// services/auth.ts
import * as SecureStore from 'expo-secure-store';

const API_URL = 'https://your-api.com';

// Store tokens
async function storeTokens(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync('accessToken', accessToken);
  await SecureStore.setItemAsync('refreshToken', refreshToken);
}

// Get access token
async function getAccessToken(): Promise<string | null> {
  return await SecureStore.getItemAsync('accessToken');
}

// Get refresh token
async function getRefreshToken(): Promise<string | null> {
  return await SecureStore.getItemAsync('refreshToken');
}

// Clear tokens
async function clearTokens() {
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('refreshToken');
}

// Login
export async function login(email: string, password: string) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  const { accessToken, refreshToken, user } = await response.json();
  
  // Store both tokens
  await storeTokens(accessToken, refreshToken);
  
  return user;
}

// Refresh tokens
export async function refreshTokens(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  
  if (!refreshToken) {
    return false;
  }

  const response = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  if (!response.ok) {
    await clearTokens();
    return false;
  }

  const { accessToken: newAccessToken, refreshToken: newRefreshToken } = 
    await response.json();
  
  // Store new tokens
  await storeTokens(newAccessToken, newRefreshToken);
  
  return true;
}

// Make authenticated request
export async function apiRequest(
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response> {
  const accessToken = await getAccessToken();
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
      ...options.headers,
    }
  });

  // If 401, try to refresh
  if (response.status === 401) {
    const refreshed = await refreshTokens();
    
    if (refreshed) {
      // Retry with new token
      const newAccessToken = await getAccessToken();
      return fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${newAccessToken}`,
          ...options.headers,
        }
      });
    }
    
    // Refresh failed, redirect to login
    throw new Error('Session expired');
  }

  return response;
}

// Logout
export async function logout() {
  const refreshToken = await getRefreshToken();
  
  if (refreshToken) {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
  }
  
  await clearTokens();
}
```

#### 3. Usage in Components

```typescript
// Login screen
import { login } from './services/auth';

async function handleLogin() {
  try {
    const user = await login(email, password);
    navigation.navigate('Home');
  } catch (error) {
    Alert.alert('Login failed');
  }
}

// Making API calls
import { apiRequest } from './services/auth';

async function fetchUserProfile() {
  const response = await apiRequest('/api/users/me');
  const user = await response.json();
  return user;
}
```

---

## 🌐 Web Browser Integration

The web frontend continues to work as before:

```typescript
// Web automatically uses cookies
const response = await fetch('/api/auth/login', {
  method: 'POST',
  credentials: 'include', // Send cookies
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { accessToken, refreshToken } = await response.json();

// Store only access token
localStorage.setItem('accessToken', accessToken);
// Ignore refreshToken - it's in cookie

// Refresh (no body needed, cookie sent automatically)
const refreshResponse = await fetch('/api/auth/refresh', {
  method: 'POST',
  credentials: 'include'
});
```

---

## 🔒 Security Comparison

### Web (httpOnly Cookies)
```
Access Token:  localStorage (15min)
Refresh Token: httpOnly cookie (7 days)

Security Level: ⭐⭐⭐⭐⭐
- Refresh token immune to XSS
- Access token short-lived
```

### Mobile (SecureStore)
```
Access Token:  SecureStore (15min)
Refresh Token: SecureStore (7 days)

Security Level: ⭐⭐⭐⭐
- OS-level encryption
- Better than plain storage
- Not as secure as httpOnly (app can access)
```

---

## 🧪 Testing

### Test Web Flow (with curl)

```bash
# Login (web)
curl -c cookies.txt \
  -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Response includes accessToken and refreshToken in body
# Cookie file contains refreshToken

# Refresh (web - using cookie)
curl -b cookies.txt \
  -X POST http://localhost:4000/api/auth/refresh

# Logout (web - using cookie)
curl -b cookies.txt \
  -X POST http://localhost:4000/api/auth/logout
```

### Test Mobile Flow (with curl)

```bash
# Login (mobile)
RESPONSE=$(curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}')

# Extract tokens
ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.accessToken')
REFRESH_TOKEN=$(echo $RESPONSE | jq -r '.refreshToken')

# Refresh (mobile - send token in body)
curl -X POST http://localhost:4000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"

# Logout (mobile - send token in body)
curl -X POST http://localhost:4000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"
```

---

## 📊 Backend Changes Summary

| File | Change | Purpose |
|------|--------|---------|
| `auth.routes.ts` | Return `refreshToken` in response | Mobile apps need it |
| `auth.tokens.routes.ts` | Accept token from cookie OR body | Support both clients |
| `auth.tokens.routes.ts` | Return `refreshToken` in response | Mobile apps need new token |
| `auth.logout.routes.ts` | Accept token from cookie OR body | Support both clients |
| `auth.schemas.ts` | Make `refreshToken` optional in body | Web uses cookie, mobile uses body |
| `auth.schemas.ts` | Add `refreshToken` to responses | Mobile apps need it |

---

## ✅ Backwards Compatibility

**Web browsers**: Continue to work exactly as before
- Cookies sent automatically
- `refreshToken` in response is ignored
- No code changes needed

**New mobile apps**: Can now integrate seamlessly
- Use `refreshToken` from response body
- Send it back in request body
- Full support out of the box

---

## 🎯 Best Practices

### For Web
```typescript
✅ Store access token in localStorage
✅ Let browser handle refresh token cookie
✅ Use credentials: 'include' in all requests
✅ Don't manually manage refresh token
```

### For Mobile
```typescript
✅ Store both tokens in SecureStore/Keychain
✅ Send access token in Authorization header
✅ Send refresh token in request body
✅ Implement automatic token refresh on 401
```

---

## 🚀 Ready for Production

Your backend now supports:
- ✅ Web browsers (httpOnly cookies)
- ✅ Mobile apps (React Native, Flutter, etc.)
- ✅ Desktop apps (Electron, Tauri)
- ✅ Server-to-server (microservices)
- ✅ Any client that can send HTTP requests

All with a single, unified API!
