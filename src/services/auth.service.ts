import Cookies from 'js-cookie';
import { ServiceError, ERROR_CODES } from './errors.service';

const API_URL = '/api'; // Utiliser le proxy Next.js

// Extend RequestInit to include params
export interface FetchWithAuthOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
}

export class AuthService {
  static async register(name: string, email: string, password: string, passwordConfirmation?: string) {
    try {
      if (!name || !email || !password) {
        throw new ServiceError(
          ERROR_CODES.MISSING_REQUIRED_FIELD,
          'Email et mot de passe requis'
        );
      }

      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ name, email, password, password_confirmation: passwordConfirmation }),
      });

      console.log('Register response status:', response.status);
      console.log('Register response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = {};
        }
        throw new ServiceError(
          ERROR_CODES.AUTHENTICATION_ERROR,
          errorData.message || 'Échec de l\'inscription',
          { status: response.status, errorData }
        );
      }

      const data = await response.json();
      if (!data.token) {
        throw new ServiceError(
          ERROR_CODES.AUTHENTICATION_ERROR,
          'Token manquant dans la réponse'
        );
      }

      return data;
    } catch (error) {
      console.error('AuthService.register error:', error);
      throw ServiceError.fromError(error, ERROR_CODES.AUTHENTICATION_ERROR);
    }
  }

  static async login(email: string, password: string) {
    try {
      if (!email || !password) {
        throw new ServiceError(
          ERROR_CODES.MISSING_REQUIRED_FIELD,
          'Email et mot de passe requis'
        );
      }

      let response;
      try {
        response = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });
      } catch (networkError) {
        console.error('Erreur réseau :', networkError);
        throw new ServiceError(
          ERROR_CODES.SERVICE_UNAVAILABLE,
          'Impossible de contacter le serveur API. Vérifiez que le serveur est en cours d\'exécution.',
          { networkError }
        );
      }

      console.log('Statut de la réponse login :', response.status);
      console.log('En-têtes de la réponse login :', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = {};
        }
        throw new ServiceError(
          ERROR_CODES.AUTHENTICATION_ERROR,
          errorData.message || 'Échec de la connexion',
          { status: response.status, errorData }
        );
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new ServiceError(
          ERROR_CODES.INTERNAL_SERVER_ERROR,
          'Erreur de parsing de la réponse API',
          { parseError }
        );
      }

      console.log('Données de la réponse login :', data);

      if (!data.token) {
        throw new ServiceError(
          ERROR_CODES.AUTHENTICATION_ERROR,
          'Token manquant dans la réponse'
        );
      }

      try {
        Cookies.set('token', data.token, {
          expires: 1,
          secure: process.env.NODE_ENV === 'production',
          path: '/',
        });
        console.log('Token enregistré dans le cookie (login) :', data.token);
      } catch (cookieError) {
        throw new ServiceError(
          ERROR_CODES.INTERNAL_SERVER_ERROR,
          'Erreur lors de l\'enregistrement du cookie',
          { cookieError }
        );
      }

      return data;
    } catch (error) {
      console.error('AuthService.login error:', error);
      throw ServiceError.fromError(error, ERROR_CODES.AUTHENTICATION_ERROR);
    }
  }

  static async profile() {
    try {
      const token = Cookies.get('token');

      if (!token) {
        throw new ServiceError(
          ERROR_CODES.AUTHENTICATION_ERROR,
          'Non authentifié'
        );
      }

      const response = await fetch(`${API_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      console.log('Profile response status:', response.status);

      if (!response.ok) {
        throw new ServiceError(
          ERROR_CODES.AUTHENTICATION_ERROR,
          'Échec de la récupération du profil',
          { status: response.status }
        );
      }

      return response.json();
    } catch (error) {
      console.error('AuthService.profile error:', error);
      throw ServiceError.fromError(error, ERROR_CODES.AUTHENTICATION_ERROR);
    }
  }

  static async logout() {
    try {
      const token = Cookies.get('token');

      if (!token) {
        throw new ServiceError(
          ERROR_CODES.AUTHENTICATION_ERROR,
          'Non authentifié'
        );
      }

      const response = await fetch(`${API_URL}/logout`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      console.log('Logout response status:', response.status);

      if (!response.ok) {
        throw new ServiceError(
          ERROR_CODES.AUTHENTICATION_ERROR,
          'Échec de la déconnexion',
          { status: response.status }
        );
      }

      Cookies.remove('token');
    } catch (error) {
      Cookies.remove('token');
      console.error('AuthService.logout error:', error);
      throw ServiceError.fromError(error, ERROR_CODES.AUTHENTICATION_ERROR);
    }
  }

  static async fetchWithAuth(path: string, options: FetchWithAuthOptions = {}) {
    try {
      const token = Cookies.get('token');

      if (!token) {
        throw new ServiceError(
          ERROR_CODES.AUTHENTICATION_ERROR,
          'Non authentifié'
        );
      }

      const { params, ...fetchOptions } = options;
      const query = params
        ? `?${new URLSearchParams(
            Object.entries(params).filter(([, value]) => value !== undefined) as [string, string][]
          ).toString()}`
        : "";

      const response = await fetch(`${API_URL}${path}${query}`, {
        ...fetchOptions,
        headers: {
          ...fetchOptions.headers,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      console.log('fetchWithAuth response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          Cookies.remove('token');
          throw new ServiceError(
            ERROR_CODES.AUTHENTICATION_ERROR,
            'Session expirée',
            { status: response.status }
          );
        }
        throw new ServiceError(
          ERROR_CODES.INTERNAL_SERVER_ERROR,
          'Erreur API',
          { status: response.status }
        );
      }

      return response.json();
    } catch (error) {
      console.error('AuthService.fetchWithAuth error:', error);
      throw ServiceError.fromError(error, ERROR_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  static async fetchWithAuthFormData(path: string, options: FetchWithAuthOptions = {}) {
    try {
      const token = Cookies.get('token');

      if (!token) {
        throw new ServiceError(
          ERROR_CODES.AUTHENTICATION_ERROR,
          'Non authentifié'
        );
      }

      const { params, ...fetchOptions } = options;
      const query = params
        ? `?${new URLSearchParams(
            Object.entries(params).filter(([, value]) => value !== undefined) as [string, string][]
          ).toString()}`
        : "";

      const response = await fetch(`${API_URL}${path}${query}`, {
        ...fetchOptions,
        headers: {
          ...fetchOptions.headers,
          Authorization: `Bearer ${token}`
        },
      });

      console.log('fetchWithAuth response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          Cookies.remove('token');
          throw new ServiceError(
            ERROR_CODES.AUTHENTICATION_ERROR,
            'Session expirée',
            { status: response.status }
          );
        }
        throw new ServiceError(
          ERROR_CODES.INTERNAL_SERVER_ERROR,
          'Erreur API',
          { status: response.status }
        );
      }

      return response.json();
    } catch (error) {
      console.error('AuthService.fetchWithAuth error:', error);
      throw ServiceError.fromError(error, ERROR_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  static async fetchWithoutAuth(path: string, options: { params?: Record<string, any>; method?: string; body?: any; headers?: Record<string, string> } = {}) {
  try {
    const { params, body, headers, ...fetchOptions } = options;

    const query = params
      ? `?${new URLSearchParams(
          Object.entries(params).filter(([, value]) => value !== undefined) as [string, string][]
        ).toString()}`
      : "";

    const response = await fetch(`${API_URL}${path}${query}`, {
      ...fetchOptions,
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    console.log("fetchWithoutAuth response status:", response.status);

    if (!response.ok) {
      throw new ServiceError(
        ERROR_CODES.INTERNAL_SERVER_ERROR,
        "Erreur API",
        { status: response.status }
      );
    }

    return response.json();
  } catch (error) {
    console.error("AuthService.fetchWithoutAuth error:", error);
    throw ServiceError.fromError(error, ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
}

}