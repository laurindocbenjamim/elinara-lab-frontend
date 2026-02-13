# Backend Communication Documentation

This document outlines how the frontend React application communicates with the Flask backend API.

## 1. API Client Configuration

The application uses a centralized `axios` instance located in `services/api.ts`.

```typescript
const apiClient = axios.create({
  baseURL: config.API_BASE_URL, // /api/v1 (or valid endpoint)
  withCredentials: true,        // Essential for HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Key Configuration Details
-   **Base URL**: All requests are prefixed with the configured base URL (default: `/api/v1`).
-   **`withCredentials: true`**: This is critical. It ensures that the browser sends `HttpOnly` cookies (containing the JWT access token and session data) with every request.

## 2. Security Policies & Authentication

The application implements a robust security model focusing on **zero-trust** principles for the frontend.

### 2.1 authentication (HttpOnly Cookies)
-   **No LocalStorage**: Access tokens are **never** stored in `localStorage` or `sessionStorage` to prevent XSS attacks.
-   **HttpOnly & Secure**: Tokens are stored in `HttpOnly`, `Secure`, `SameSite=Strict` cookies set by the backend.
-   **Session Management**: The frontend validates the session by calling `/admin/user` (which doubles as session validation). 

### 2.2 CSRF Protection (Double Submit Cookie)
To prevent Cross-Site Request Forgery (CSRF), the application uses a double-submit cookie pattern:
1.  **Cookie**: The backend sets a readable `csrf_access_token` (or `XSRF-TOKEN`) cookie.
2.  **Header**: The `axios` interceptor reads this cookie and injects it into the `X-CSRF-Token` header for every state-changing request (POST, PUT, DELETE).
3.  **Validation**: The backend verifies that the cookie value matches the header value.

### 2.3 Error Handling & Auto-Refresh
-   **401 Unauthorized**: Triggers an automatic redirect to `/login` *unless* it is a specific disconnect action, which degrades gracefully.
-   **CSRF Errors**: If a `Missing CSRF token` error occurs, the frontend will log a warning. The user may need to perform a new action or reload to receive a fresh cookie.
-   **friendly Error Messages**: Raw backend errors (e.g., Python tuples) are parsed into user-friendly messages (e.g., "Your connection has expired. Please reconnect.").

## 3. detailed API Endpoints

### 3.1 Authentication (`authService`)

#### Login
-   **Endpoint**: `POST /auth/login`
-   **Request Body**:
    ```json
    {
      "username": "user123",
      "password": "securepassword"
    }
    ```
-   **Response**:
    ```json
    {
      "msg": "Login successful",
      "user": { ... }
    }
    ```
    *(Sets `access_token_cookie` and `csrf_access_token` cookies)*

#### Logout
-   **Endpoint**: `POST /auth/logout`
-   **Request Body**:
    ```json
    { "mode": "full" } // or "soft"
    ```
-   **Response**: `200 OK` (Clears cookies)

#### Disconnect Provider
-   **Endpoint**: `POST /auth/disconnect/{provider}`
-   **Path Params**: `provider` ('google' | 'microsoft')
-   **Response**: `200 OK`

### 3.2 Cloud Drive Services

#### List Files (Google)
-   **Endpoint**: `GET /drive/files`
-   **Query Params**: `?folder_id=...` (optional)
-   **Response**:
    ```json
    {
      "success": true,
      "files": [
        {
          "id": "123...",
          "name": "Project Specs.pdf",
          "mimeType": "application/pdf",
          "is_folder": false,
          "webViewLink": "https://..."
        }
      ],
      "current_folder": "root"
    }
    ```

#### List Files (OneDrive)
-   **Endpoint**: `GET /drive/microsoft/files`
-   **Query Params**: `?folder_id=...` (optional)
-   **Response**: Similar structure to Google Drive.

### 3.3 User Management

#### Register
-   **Endpoint**: `POST /user/register`
-   **Request Body**:
    ```json
    {
      "username": "newuser",
      "email": "user@example.com",
      "password": "..."
    }
    ```

#### Get Current User
-   **Endpoint**: `GET /admin/user`
-   **Response**:
    ```json
    {
      "success": true,
      "user": {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "is_administrator": true,
        "has_drive_access": true,
        "has_microsoft_drive_access": false
      }
    }
    ```

#### Export Data
-   **Endpoint**: `GET /user/export`
-   **Response**: JSON file download containing full user profile and logs.

## 4. Development vs. Production

-   **Docker**: In Docker, the frontend communicates with the backend via the internal network. The nginx configuration (or Vite proxy in dev) handles forwarding requests from `/api` to the backend service.
-   **Local Dev**: The `vite.config.ts` proxies `/api` requests to `http://127.0.0.1:5000` (or similar) to avoid CORS issues.
