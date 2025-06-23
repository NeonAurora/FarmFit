// services/auth0/AuthService.js
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
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

export const login = async () => {
  try {
    const redirectUri = generateRedirectUri();
    console.log("Auth0 Login - Using redirect URI:", redirectUri);
    
    const request = new AuthSession.AuthRequest({
      clientId: auth0Config.clientId,
      redirectUri: redirectUri,
      responseType: "token",
      scopes: ["openid", "profile", "email"],
    });
    
    const discovery = await AuthSession.fetchDiscoveryAsync(`https://${auth0Config.domain}`);
    console.log("Auth0 endpoints discovered");
    
    console.log("Starting Auth0 authentication flow...");
    const result = await request.promptAsync(discovery);
    console.log("Auth result type:", result.type);
    
    if (result.type === 'success') {
      console.log("Auth successful - Token received");
      
      // Return object format expected by AuthContext
      return {
        accessToken: result.params.access_token,
        // Auth0 implicit flow doesn't typically return refresh tokens
        // If you need refresh tokens, you'd need to use authorization code flow
        refreshToken: null,
        tokenType: result.params.token_type || 'Bearer',
        expiresIn: result.params.expires_in
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
    console.log("User info received:", JSON.stringify(userInfo).substring(0, 100) + "...");
    return userInfo;
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
};

// NEW: Validate stored token
export const validateToken = async (token) => {
  try {
    if (!token) {
      return { isValid: false, error: 'No token provided' };
    }

    console.log("Validating token...");
    const userInfo = await getUserInfo(token);
    
    if (userInfo) {
      return { 
        isValid: true, 
        userInfo,
        token 
      };
    } else {
      return { 
        isValid: false, 
        error: 'Token validation failed' 
      };
    }
  } catch (error) {
    console.error('Token validation error:', error);
    
    if (error.message?.includes('expired') || error.status === 401) {
      return { 
        isValid: false, 
        error: 'Token expired',
        expired: true 
      };
    }
    
    return { 
      isValid: false, 
      error: error.message || 'Token validation failed' 
    };
  }
};

// NEW: Refresh token (Auth0 implicit flow doesn't support this)
export const refreshToken = async (refreshToken) => {
  try {
    console.warn('Refresh token not supported with Auth0 implicit flow');
    return {
      success: false,
      error: 'Refresh token not supported with current Auth0 configuration',
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const logout = async () => {
  try {
    console.log("Logging out from Auth0...");
    
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.replace(
        `https://${auth0Config.domain}/v2/logout?client_id=${auth0Config.clientId}&returnTo=${window.location.origin}`
      );
    } else if (Platform.OS !== 'web') {
      const returnToUrl = `${getAppScheme()}:///`;
      const logoutUrl = `https://${auth0Config.domain}/v2/logout?client_id=${auth0Config.clientId}&returnTo=${encodeURIComponent(returnToUrl)}`;
      await WebBrowser.openBrowserAsync(logoutUrl);
    }
    console.log("Logout completed");
  } catch (error) {
    console.error('Error during logout:', error);
  }
};