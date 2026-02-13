# Flask JWT Auth Frontend

A modern, responsive React frontend built with Vite and Tailwind CSS, featuring secure cookie-based authentication, user profile management, and a dedicated admin dashboard.

## Overview
This frontend is designed to work with a Flask backend using JWT authentication. It has been recently refactored to prioritize security by using **HttpOnly Cookies** instead of manual token storage.

---

## Log of Major Improvements & Fixes

### 1. Secure Cookie-Based Authentication
- **Transition**: Moved away from `localStorage` and URL-based token capture.
- **Implementation**: All API calls now include `credentials: 'include'`, allowing the browser to automatically manage JWT cookies set by the backend.
- **Benefit**: Immune to XSS-based token theft.

### 2. OAuth Flow Resolution
- **Issue**: Previously, OAuth redirects (Google/GitHub) caused redirection loops or required manual token parsing from fragments.
- **Solution**: The backend now sets the authentication cookie directly during the OAuth callback. The frontend automatically synchronizes the session on mount by calling the `/admin/user` profile endpoint.

### 3. Routing & Redirection Fixes
- **Dashboard Graceful State**: The dashboard now handles unauthenticated states with a clear UI instead of getting stuck in a redirect loop.
- **Protected Routes**: Navigation is managed via a robust `AuthStatus` enum, ensuring users only see pages they are authorized for.
- **File Management**: Dedicated routes for file interactions:
  - `/drive/file/:id`: Properties and details view.
  - `/drive/cross-reference`: AI analysis and cross-referencing tool.

### 4. Logic & Privacy Cleanup
- **Debug Cleanup**: All sensitive console logs exposing user data or internal session states have been removed for production readiness.
- **Logout Reliability**: Refactored logout to clear React state immediately and perform a hard redirect, ensuring full synchronization with the backend.

---

## Features
- **Authentication**: Secure Login, Registration, and Social OAuth (Google/GitHub) via cookies.
- **User Dashboard**: Manage personal profile information (Email, Phone, Country, etc.).
- **Admin Dashboard**: Comprehensive user management for administrative accounts.
- **Portfolio Suite**: Public "About Me", "Projects", "Experience", and the new "Elinara" sanctuary page.
- **Premium Aesthetics**: Built with Lucide icons, glassmorphism, and responsive Tailwind layouts.

---

## Configuration

Located in `config.ts`:
```typescript
export const config = {
  API_BASE_URL: 'http://localhost:5000/api/v1', 
};
```

---

## Running the Application

### Locally (Development)
1. `npm install`
2. `npm run dev` (Runs on http://localhost:3000)

### With Docker
1. `docker build -t flask-frontend .`
2. `docker run -d -p 3000:80 --name frontend flask-frontend`

---

## Backend Integration Requirements

### 1. Session Persistence (Cookies)
The backend must set an `HttpOnly` and `Secure` cookie containing the JWT. The frontend does **not** send an `Authorization` header; it relies on the browser to attach the cookie automatically.

### 2. Response Format
The frontend expects a nested JSON structure for user-related data:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "...",
    "email": "...",
    "is_administrator": true,
    ...
  }
}
```

### 3. OAuth Redirects
After a successful Google or GitHub login, the backend should redirect the user back to the frontend root (e.g., `http://localhost:3000/#/dashboard`). The frontend will automatically detect the presence of the cookie and fetch the user profile.
