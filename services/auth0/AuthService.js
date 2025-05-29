import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import auth0Config from './config';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

// Get app scheme from app config
const getAppScheme = () => {
  const scheme = Constants.manifest?.scheme || 'farmfit';
  console.log("App scheme:", scheme);
  return scheme;
};

// Generate redirect URI based on platform and environment
const generateRedirectUri = () => {
  // For native platforms, use the specific callback format accepted by Auth0
  if (Platform.OS !== 'web') {
    const callbackUrl = `${getAppScheme()}:///`;
    console.log("Native redirect URI:", callbackUrl);
    return callbackUrl;
  }
  
  // For web, use standard redirect URI
  const redirectUri = AuthSession.makeRedirectUri({
    useProxy: false,
    scheme: getAppScheme()
  });
  
  console.log("Generated redirect URI:", redirectUri);
  return redirectUri;
};

export const login = async () => {
  try {
    // Generate and log the redirect URI
    const redirectUri = generateRedirectUri();
    console.log("Auth0 Login - Using redirect URI:", redirectUri);
    
    // Create a new AuthRequest
    const request = new AuthSession.AuthRequest({
      clientId: auth0Config.clientId,
      redirectUri: redirectUri,
      responseType: "token",
      scopes: ["openid", "profile", "email"],
    });
    
    // Auto discover Auth0 configuration
    const discovery = await AuthSession.fetchDiscoveryAsync(`https://${auth0Config.domain}`);
    console.log("Auth0 endpoints discovered:", {
      authorizationEndpoint: discovery.authorizationEndpoint,
      tokenEndpoint: discovery.tokenEndpoint
    });
    
    // Start the auth flow
    console.log("Starting Auth0 authentication flow...");
    const result = await request.promptAsync(discovery);
    console.log("Auth result type:", result.type);
    
    if (result.type === 'success') {
      console.log("Auth successful - Token received");
      return result.params.access_token;
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
    const response = await fetch(`https://${auth0Config.domain}/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      console.error("Failed to get user info:", response.status, response.statusText);
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

export const logout = async () => {
  try {
    console.log("Logging out from Auth0...");
    
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.replace(
        `https://${auth0Config.domain}/v2/logout?client_id=${auth0Config.clientId}&returnTo=${window.location.origin}`
      );
    } else if (Platform.OS !== 'web') {
      // For native platforms, specify a logout redirect
      const returnToUrl = `${getAppScheme()}:///`;
      const logoutUrl = `https://${auth0Config.domain}/v2/logout?client_id=${auth0Config.clientId}&returnTo=${encodeURIComponent(returnToUrl)}`;
      await WebBrowser.openBrowserAsync(logoutUrl);
    }
    console.log("Logout completed");
  } catch (error) {
    console.error('Error during logout:', error);
  }
};