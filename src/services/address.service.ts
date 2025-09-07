import Cookies from 'js-cookie';
import { ServiceError, ERROR_CODES } from './errors.service';

const API_URL = '/api';

export class AddressService {
  // -------------------------
  // Récupérer toutes les adresses
  // -------------------------
  static async getAll() {
    try {
      const token = Cookies.get('token');
      if (!token) {
        throw new ServiceError(ERROR_CODES.AUTHENTICATION_ERROR, 'Non authentifié');
      }

      const response = await fetch(`${API_URL}/addresses`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new ServiceError(ERROR_CODES.INTERNAL_SERVER_ERROR, 'Erreur lors de la récupération des adresses', { status: response.status });
      }

      return response.json();
    } catch (error) {
      console.error('AddressService.getAll error:', error);
      throw ServiceError.fromError(error, ERROR_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  // -------------------------
  // Récupérer une adresse par ID
  // -------------------------
  static async getById(id: number | string) {
    try {
      return await this.fetchWithAuth(`/addresses/${id}`);
    } catch (error) {
      console.error('AddressService.getById error:', error);
      throw error;
    }
  }

  // -------------------------
  // Créer une nouvelle adresse
  // -------------------------
  static async create(data: any) {
    try {
      return await this.fetchWithAuth('/addresses', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('AddressService.create error:', error);
      throw error;
    }
  }

  // -------------------------
  // Mettre à jour une adresse
  // -------------------------
  static async update(id: number | string, data: any) {
    try {
      return await this.fetchWithAuth(`/addresses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('AddressService.update error:', error);
      throw error;
    }
  }

  // -------------------------
  // Supprimer une adresse
  // -------------------------
  static async delete(id: number | string) {
    try {
      return await this.fetchWithAuth(`/addresses/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('AddressService.delete error:', error);
      throw error;
    }
  }

  // -------------------------
  // Routes spécifiques
  // -------------------------
  static async search(query: string) {
    try {
      return await this.fetchWithAuth(`/addresses/search?query=${encodeURIComponent(query)}`);
    } catch (error) {
      console.error('AddressService.search error:', error);
      throw error;
    }
  }

  static async map() {
    try {
      return await this.fetchWithAuth('/addresses/map');
    } catch (error) {
      console.error('AddressService.map error:', error);
      throw error;
    }
  }

  static async share(id: number | string) {
    try {
      return await this.fetchWithAuth(`/addresses/${id}/share`);
    } catch (error) {
      console.error('AddressService.share error:', error);
      throw error;
    }
  }

  static async validate(id: number | string) {
    try {
      return await this.fetchWithAuth(`/addresses/${id}/validate`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('AddressService.validate error:', error);
      throw error;
    }
  }

  // -------------------------
  // Fonction utilitaire fetch avec auth
  // -------------------------
  private static async fetchWithAuth(path: string, options: RequestInit = {}) {
    try {
      const token = Cookies.get('token');
      if (!token) {
        throw new ServiceError(ERROR_CODES.AUTHENTICATION_ERROR, 'Non authentifié');
      }

      const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          Cookies.remove('token');
          throw new ServiceError(ERROR_CODES.AUTHENTICATION_ERROR, 'Session expirée', { status: response.status });
        }
        throw new ServiceError(ERROR_CODES.INTERNAL_SERVER_ERROR, 'Erreur API', { status: response.status });
      }

      return response.json();
    } catch (error) {
      console.error('AddressService.fetchWithAuth error:', error);
      throw ServiceError.fromError(error, ERROR_CODES.INTERNAL_SERVER_ERROR);
    }
  }
}
