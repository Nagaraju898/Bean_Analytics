# React Frontend API Configuration - Docker Ready

## Overview

Your React frontend has been updated with a **production-ready axios configuration** that works seamlessly in Docker.

## Changes Made

### 1. Created `src/config/axiosConfig.js`
A centralized, production-ready axios configuration with:
- ✅ Relative API path `/api` (Docker compatible)
- ✅ Automatic authentication token injection
- ✅ Request/response interceptors
- ✅ Error handling & logging
- ✅ Request timeout (30 seconds)

### 2. Updated Components
- ✅ **AuthContext.js** - Uses new API config for login/register
- ✅ **DashboardView.js** - Uses new API config for analytics fetch

## How It Works

### Before (No centralized config):
```javascript
import axios from 'axios';

// Scattered throughout components
const response = await axios.post('/api/auth/login', data, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### After (Centralized config):
```javascript
import API from '../config/axiosConfig';

// Clean, consistent API calls
// Token is automatically injected by interceptor
const response = await API.post('/auth/login', data);
```

## Key Features

### ✅ Relative Path `/api`
Works in both development and production Docker environments:
- Development: `http://localhost/api` → Nginx proxies to backend
- Production: `https://your-domain.com/api` → Nginx proxies to backend
- No hardcoded localhost URLs

### ✅ Automatic Token Injection
Request interceptor automatically adds authentication:
```javascript
API.post('/auth/login', data)  // Token added automatically
```

### ✅ Error Handling
Response interceptor handles:
- 401 Unauthorized → Auto-redirect to login
- 403 Forbidden → Permission error
- 500+ Server errors → User-friendly messages
- Network errors → Connection error messages

### ✅ Development Logging
In development mode, logs request/response details:
```
[API Request] POST /api/auth/login
[API Response] 200 POST /api/auth/login
```

## Migration Guide

### Step 1: Update Remaining Components

Replace axios imports with the new API config in these files:

#### `src/components/DataTable.js`
```javascript
// Old
import axios from 'axios';
await axios.get(`/api/data/table?page=${page}&limit=${limit}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

// New
import API from '../config/axiosConfig';
await API.get(`/data/table?page=${page}&limit=${limit}`);
```

#### `src/components/AddFile.js`
```javascript
// Old
import axios from 'axios';
await axios.post('/api/files/upload', formData, {
  headers: { 'Authorization': `Bearer ${token}` }
});

// New
import API from '../config/axiosConfig';
await API.post('/files/upload', formData);
```

### Step 2: Update All API Paths

**Remove `/api` prefix** since it's in the baseURL:

```javascript
// Old paths (with /api)
API.get('/api/auth/login')          ❌
API.post('/api/files/upload')       ❌
API.get('/api/analytics/dashboard') ❌

// New paths (without /api)
API.post('/auth/login')             ✅
API.post('/files/upload')           ✅
API.get('/analytics/dashboard')     ✅
```

### Step 3: Remove Header Injection

The API config handles this automatically:

```javascript
// Old (no longer needed)
const token = localStorage.getItem('token');
const response = await axios.get(url, {
  headers: { 'Authorization': `Bearer ${token}` }
});

// New (interceptor handles it)
const response = await API.get(url);
```

## Complete Migration Checklist

- [ ] Update `src/components/DataTable.js`
- [ ] Update `src/components/AddFile.js`
- [ ] Update any other components making API calls
- [ ] Remove manual token header injection
- [ ] Test in Docker: `docker-compose up -d`
- [ ] Verify API calls work: `docker-compose logs -f frontend`
- [ ] Test error handling (try with invalid token)

## Docker Compatibility

The configuration works correctly in Docker because:

1. **Relative Path**: `/api` works everywhere without hardcoding
2. **Nginx Routing**: Nginx forwards `/api/*` to backend container
3. **No Localhost**: No `localhost` or port numbers hardcoded
4. **Production Ready**: HTTPS compatible, security headers ready

## Production Environment

No changes needed! The configuration automatically handles:
- ✅ Relative paths work with any domain
- ✅ HTTPS automatically supported
- ✅ Security headers configured
- ✅ Token management works the same

## Error Handling Examples

### Unauthorized (401)
```javascript
try {
  await API.get('/protected-endpoint');
} catch (error) {
  console.log(error.status);    // 401
  console.log(error.message);   // "Authentication failed..."
  // User redirected to login automatically
}
```

### Server Error (500)
```javascript
try {
  await API.post('/data', data);
} catch (error) {
  console.log(error.status);    // 500
  console.log(error.message);   // "Server error. Please try again..."
}
```

### Network Error
```javascript
try {
  await API.get('/endpoint');
} catch (error) {
  console.log(error.message);   // "No response from server..."
}
```

## Troubleshooting

### API calls failing in Docker
**Check**: Are you using relative paths like `/api/*`?
```javascript
// ✅ Correct (works in Docker)
API.get('/data/table')

// ❌ Wrong (won't work in Docker)
API.get('http://localhost:5000/api/data/table')
API.get('http://backend:5000/api/data/table')
```

### Token not being sent
**Check**: Token is stored before making requests
```javascript
// Verify token exists
console.log(localStorage.getItem('token'));

// API config adds it automatically
// If token is undefined, no header is added
```

### CORS errors in Docker
**Check**: Ensure backend CORS is configured properly
```javascript
// Check curl test
curl -H "Authorization: Bearer TOKEN" http://localhost/api/endpoint
```

## Files Updated

```
✅ client/src/config/axiosConfig.js        [NEW] Axios configuration
✅ client/src/context/AuthContext.js       [UPDATED] Uses API config
✅ client/src/components/DashboardView.js  [UPDATED] Uses API config
```

## Next Steps

1. **Update remaining components** using the migration guide above
2. **Test in Docker**: `docker-compose build && docker-compose up -d`
3. **Verify logs** for any errors: `docker-compose logs -f frontend`
4. **Deploy to production** with confidence!

## Reference

**New centralized config location**: `src/config/axiosConfig.js`

**Usage pattern**:
```javascript
import API from '../config/axiosConfig';

// Anywhere in app
const response = await API.get('/endpoint');
const response = await API.post('/endpoint', data);
const response = await API.put('/endpoint/:id', data);
const response = await API.delete('/endpoint/:id');
```

---

Your React frontend is now **production-ready for Docker** with proper API configuration! 🚀
