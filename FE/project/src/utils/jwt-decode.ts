/**
 * Decode JWT token without verification (client-side only)
 * Note: This does NOT verify the token signature - only use for reading claims
 */

export interface JWTPayload {
  tutorId?: number; // tutor ID (e.g., 1)
  userId?: number; // user ID (e.g., 2)
  role?: string; // user role (e.g., "Tutor")
  exp?: number; // expiration timestamp
  [key: string]: any; // allow other custom claims
}

/**
 * Decode a JWT token and return the payload
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      console.error('Invalid JWT format');
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    
    // Base64 URL decode
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

/**
 * Get the access token from storage (localStorage or sessionStorage)
 * @returns Access token string or null
 */
export const getAccessToken = (): string | null => {
  return (
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('access_token')
  );
};

/**
 * Get tutorId from the stored access token
 * @returns tutorId or null if not found
 */
export const getTutorIdFromToken = (): number | null => {
  const token = getAccessToken();
  
  if (!token) {
    return null;
  }

  const payload = decodeJWT(token);
  
  if (!payload || !payload.tutorId) {
    return null;
  }

  return payload.tutorId;
};
