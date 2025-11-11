// Simple authentication utility
// In production, credentials should be set via environment variables

const getAuthCredentials = () => {
  // Default credentials (can be overridden via environment variables)
  const defaultUsername = process.env.REACT_APP_AUTH_USERNAME || 'admin@fueltheft.com';
  const defaultPassword = process.env.REACT_APP_AUTH_PASSWORD || 'fueltheft123';
  
  return {
    username: defaultUsername,
    password: defaultPassword,
  };
};

export const authenticate = (username: string, password: string): boolean => {
  const credentials = getAuthCredentials();
  return username === credentials.username && password === credentials.password;
};

export const isAuthenticated = (): boolean => {
  // Check if user is authenticated (stored in sessionStorage)
  return sessionStorage.getItem('authenticated') === 'true';
};

export const setAuthenticated = (value: boolean): void => {
  if (value) {
    sessionStorage.setItem('authenticated', 'true');
  } else {
    sessionStorage.removeItem('authenticated');
  }
};

export const logout = (): void => {
  sessionStorage.removeItem('authenticated');
  window.location.reload();
};

