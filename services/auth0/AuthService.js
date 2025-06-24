// services/auth0/AuthService.js
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import auth0Config from './config';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

const getAppScheme = () => {
  const scheme = Constants.manifest?.scheme || 'farmfit';
  console.log("App scheme:", scheme);
  return scheme;
};

const generateRedirectUri = () => {
  if (Platform.OS !== 'web') {
    const callbackUrl = `${getAppScheme()}:///`;
    console.log("Native redirect URI:", callbackUrl);
    return callbackUrl;
  }
  
  const redirectUri = AuthSession.makeRedirectUri({
    useProxy: false,
    scheme: getAppScheme()
  });
  
  console.log("Generated redirect URI:", redirectUri);
  return redirectUri;
};

// Secure random state generation using expo-crypto
const generateSecureRandomState = async () => {
  try {
    // Generate a random string and hash it for security
    const randomData = Math.random().toString() + Date.now().toString() + Math.random().toString();
    
    const hashedState = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      randomData,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
    
    console.log('Generated secure state using crypto');
    return hashedState.substring(0, 32); // Use first 32 characters for state
  } catch (error) {
    console.warn('Crypto state generation failed, falling back to simple random:', error);
    // Fallback to simple random if crypto fails
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
};

// Alternative: Generate random bytes and convert to hex
const generateSecureRandomStateBytes = async () => {
  try {
    // Generate 16 random bytes and convert to hex string
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    const hexString = Array.from(randomBytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
    
    console.log('Generated secure state using random bytes');
    return hexString;
  } catch (error) {
    console.warn('Crypto bytes generation failed, falling back to hash method:', error);
    return await generateSecureRandomState();
  }
};

export const login = async () => {
  try {
    const redirectUri = generateRedirectUri();
    console.log("Auth0 Login - Using redirect URI:", redirectUri);
    
    // Generate secure random state using crypto
    const state = await generateSecureRandomStateBytes();
    console.log("Generated secure state for Auth0 flow");
    
    const requestConfig = {
      clientId: auth0Config.clientId,
      redirectUri: redirectUri,
      responseType: AuthSession.ResponseType.Code,
      scopes: ["openid", "profile", "email", "offline_access"],
      additionalParameters: {},
      state: state,
    };

    // For web, add additional parameters to ensure refresh tokens
    if (Platform.OS === 'web') {
      requestConfig.additionalParameters = {
        ...requestConfig.additionalParameters,
        prompt: 'consent', // Force consent to ensure refresh token
      };
      console.log("Added web-specific parameters for refresh token");
    }
    
    const request = new AuthSession.AuthRequest(requestConfig);
    
    const discovery = await AuthSession.fetchDiscoveryAsync(`https://${auth0Config.domain}`);
    console.log("Auth0 endpoints discovered");
    
    console.log("Starting Auth0 authentication flow...");
    const result = await request.promptAsync(discovery);
    console.log("Auth result type:", result.type);
    
    if (result.type === 'success') {
      console.log("Auth successful - Exchanging code for tokens");
      
      const tokenResult = await AuthSession.exchangeCodeAsync(
        {
          clientId: auth0Config.clientId,
          code: result.params.code,
          redirectUri: redirectUri,
          extraParams: {
            code_verifier: request.codeVerifier,
          },
        },
        discovery
      );
      
      console.log("Token exchange successful");
      console.log("Access token received:", !!tokenResult.accessToken);
      console.log("Refresh token received:", !!tokenResult.refreshToken);
      
      // Enhanced logging for debugging
      if (!tokenResult.refreshToken) {
        console.warn("⚠️  No refresh token received. This may cause issues when the access token expires.");
        console.log("Token result keys:", Object.keys(tokenResult));
        console.log("Expires in:", tokenResult.expiresIn, "seconds");
      } else {
        console.log("✅ Refresh token successfully received");
      }
      
      return {
        accessToken: tokenResult.accessToken,
        refreshToken: tokenResult.refreshToken,
        tokenType: tokenResult.tokenType || 'Bearer',
        expiresIn: tokenResult.expiresIn
      };
    }
    
    console.log("Auth failed or cancelled:", result);
    return null;
  } catch (error) {
    console.error('Error during login:', error);
    return null;
  }
};

export const getUserInfo = async (accessToken) => {
  try {
    console.log("Fetching user info from Auth0...");
    
    if (!accessToken) {
      console.error("No access token provided to getUserInfo");
      return null;
    }
    
    const response = await fetch(`https://${auth0Config.domain}/userinfo`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error("Failed to get user info:", response.status, response.statusText);
      const errorText = await response.text();
      console.error("Error response:", errorText);
      return null;
    }
    
    const userInfo = await response.json();
    console.log("User info received successfully");
    return userInfo;
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
};

// Enhanced refreshToken function in AuthService.js
export const refreshToken = async (refreshTokenValue) => {
  try {
    if (!refreshTokenValue) {
      throw new Error('No refresh token provided');
    }

    console.log('🔄 Refreshing access token with Auth0...');
    
    const response = await fetch(`https://${auth0Config.domain}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: auth0Config.clientId,
        refresh_token: refreshTokenValue,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Token refresh failed:', response.status, errorText);
      
      // Handle rotation-specific errors
      if (response.status === 403 || response.status === 401) {
        console.warn('🔄 Refresh token may have been rotated/expired - clearing tokens');
        throw new Error('REFRESH_TOKEN_INVALID');
      }
      
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const tokenData = await response.json();
    console.log('✅ Token refresh successful');
    console.log('New access token received:', !!tokenData.access_token);
    console.log('New refresh token received:', !!tokenData.refresh_token);
    
    // With rotation, you should always get a new refresh token
    if (!tokenData.refresh_token) {
      console.warn('⚠️ No new refresh token received - rotation may not be configured');
    }
    
    return {
      success: true,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || refreshTokenValue,
      expiresIn: tokenData.expires_in,
      rotated: !!tokenData.refresh_token, // Track if token was rotated
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    return {
      success: false,
      error: error.message,
      shouldClearTokens: error.message === 'REFRESH_TOKEN_INVALID',
    };
  }
};

export const validateToken = async (token) => {
  try {
    if (!token) {
      return { isValid: false, error: 'No token provided' };
    }

    console.log("🔍 Validating token...");
    const userInfo = await getUserInfo(token);
    
    if (userInfo) {
      console.log("✅ Token validation successful");
      return { 
        isValid: true, 
        userInfo,
        token 
      };
    } else {
      console.log("❌ Token validation failed");
      return { 
        isValid: false, 
        error: 'Token validation failed',
        expired: true
      };
    }
  } catch (error) {
    console.error('Token validation error:', error);
    
    return { 
      isValid: false, 
      error: error.message || 'Token validation failed',
      expired: true
    };
  }
};

export const logout = async () => {
  try {
    console.log("🚪 Logging out from Auth0...");
    
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.replace(
        `https://${auth0Config.domain}/v2/logout?client_id=${auth0Config.clientId}&returnTo=${window.location.origin}`
      );
    } else if (Platform.OS !== 'web') {
      const returnToUrl = `${getAppScheme()}:///`;
      const logoutUrl = `https://${auth0Config.domain}/v2/logout?client_id=${auth0Config.clientId}&returnTo=${encodeURIComponent(returnToUrl)}`;
      await WebBrowser.openBrowserAsync(logoutUrl);
    }
    console.log("✅ Logout completed");
  } catch (error) {
    console.error('Error during logout:', error);
  }
};

// Export the crypto utilities for potential use elsewhere
export const cryptoUtils = {
  generateSecureRandomState,
  generateSecureRandomStateBytes,
  
  // Generate secure random string of specified length
  generateSecureRandomString: async (length = 32) => {
    try {
      const bytes = await Crypto.getRandomBytesAsync(Math.ceil(length / 2));
      return Array.from(bytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('')
        .substring(0, length);
    } catch (error) {
      console.warn('Crypto string generation failed:', error);
      return Math.random().toString(36).substring(2, 2 + length);
    }
  },
  
  // Hash a string securely
  hashString: async (input, algorithm = Crypto.CryptoDigestAlgorithm.SHA256) => {
    try {
      return await Crypto.digestStringAsync(algorithm, input, {
        encoding: Crypto.CryptoEncoding.HEX
      });
    } catch (error) {
      console.error('Hashing failed:', error);
      throw error;
    }
  }
};