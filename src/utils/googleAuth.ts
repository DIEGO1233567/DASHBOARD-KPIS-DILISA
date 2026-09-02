import { GoogleUserInfo } from '../types';

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              error?: string;
              error_description?: string;
              expires_in?: number;
            }) => void;
            error_callback?: (error: any) => void;
            prompt?: string;
            hint?: string;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string; hint?: string }) => void;
          };
          hasGrantedAllScopes: (tokenResponse: any, ...scopes: string[]) => boolean;
        };
      };
    };
  }
}

// Scopes required for Google Drive & Google Sheets
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

// Default Google Client ID provided for the application
export const DEFAULT_GOOGLE_CLIENT_ID = '1761125251-brtm6pb32teakfi83gt22codipnv6iv0.apps.googleusercontent.com';

const DEFAULT_CLIENT_ID_KEY = 'kpi_dashboard_google_client_id';

export function getSavedClientId(): string {
  return localStorage.getItem(DEFAULT_CLIENT_ID_KEY) || DEFAULT_GOOGLE_CLIENT_ID;
}

export function saveClientId(clientId: string): void {
  if (clientId && clientId !== DEFAULT_GOOGLE_CLIENT_ID) {
    localStorage.setItem(DEFAULT_CLIENT_ID_KEY, clientId.trim());
  } else {
    localStorage.removeItem(DEFAULT_CLIENT_ID_KEY);
  }
}

/**
 * Ensures Google Identity Services (GSI) script is loaded in the DOM
 */
export function loadGsiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const existingScript = document.getElementById('gsi-client-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', (e) => reject(e));
      return;
    }

    const script = document.createElement('script');
    script.id = 'gsi-client-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(new Error('No se pudo cargar Google Identity Services.'));
    document.head.appendChild(script);
  });
}

/**
 * Fetches Google User Profile information using the access token
 */
export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo | null> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    return {
      email: data.email || '',
      name: data.name || data.email || 'Usuario Google',
      picture: data.picture,
      hd: data.hd,
    };
  } catch (err) {
    console.warn('Could not fetch user profile info:', err);
    return null;
  }
}

/**
 * Requests an OAuth 2.0 Access Token from Google using the Google Identity Services popup
 */
export async function requestGoogleAccessToken(
  customClientId?: string,
  hintEmail?: string
): Promise<{ accessToken: string; userInfo: GoogleUserInfo | null; expiresIn: number }> {
  await loadGsiScript();

  const clientId = customClientId?.trim() || getSavedClientId() || '';

  if (!clientId) {
    throw new Error('CLIENT_ID_REQUIRED');
  }

  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services no está disponible en este momento.');
  }

  return new Promise((resolve, reject) => {
    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: GOOGLE_SCOPES,
        callback: async (response) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }

          if (!response.access_token) {
            reject(new Error('No se recibió el token de acceso de Google.'));
            return;
          }

          const userInfo = await fetchGoogleUserInfo(response.access_token);

          resolve({
            accessToken: response.access_token,
            userInfo,
            expiresIn: response.expires_in || 3599,
          });
        },
        error_callback: (err) => {
          const msg = err?.type || err?.message || '';
          if (msg.includes('popup_closed') || msg.includes('Popup window closed') || msg.includes('closed_by_user')) {
            reject(new Error('POPUP_CLOSED'));
          } else {
            reject(new Error(err?.message || 'Error en la autenticación de Google'));
          }
        },
        hint: hintEmail,
        prompt: hintEmail ? '' : 'select_account',
      });

      client.requestAccessToken({ prompt: 'select_account' });
    } catch (err: any) {
      reject(err);
    }
  });
}
