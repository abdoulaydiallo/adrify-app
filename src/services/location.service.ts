// services/location.service.ts
export type Coordinates = { 
  lat: number; 
  lng: number; 
  accuracy?: number;
  timestamp?: number;
  source: 'gps' | 'ip' | 'wifi' | 'cell' | 'geocode';
};

export interface WatchOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  retry?: number;
  accuracyThreshold?: number;
  minDistance?: number;
  minTimeInterval?: number;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class LocationService {
  private static watchId: number | null = null;
  private static lastCoords: Coordinates | null = null;
  private static cachedCoords: Coordinates | null = null;
  private static cachedTime: number | null = null;
  private static cacheDuration = 30000;
  private static lastUpdateTime = 0;
  private static isTracking = false;

  /** Vérifie si la géolocalisation est disponible */
  static isGeolocationAvailable(): boolean {
    return "geolocation" in navigator;
  }

  /** Récupère le token Mapbox */
  private static getMapboxToken(): string {
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token) {
      throw new Error("Mapbox token non configuré");
    }
    return token;
  }

  /** Obtenir la position GPS unique */
  static getGPSLocation(
    options: { timeout?: number; maximumAge?: number } = {}
  ): Promise<Coordinates> {
    const { timeout = 10000, maximumAge = 3000 } = options;

    return new Promise((resolve, reject) => {
      if (!this.isGeolocationAvailable()) {
        return reject(new Error("Géolocalisation non disponible"));
      }

      const timer = setTimeout(() => {
        reject(new Error("Timeout de géolocalisation"));
      }, timeout + 1000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timer);
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            source: 'gps'
          });
        },
        (err) => {
          clearTimeout(timer);
          let errorMessage = "Erreur de géolocalisation";
          
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = "Permission de géolocalisation refusée";
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = "Position indisponible";
              break;
            case err.TIMEOUT:
              errorMessage = "Timeout de géolocalisation";
              break;
          }
          
          reject(new Error(errorMessage));
        },
        { enableHighAccuracy: true, timeout, maximumAge }
      );
    });
  }

  /** Vérifie les permissions de géolocalisation */
  static async checkPermissions(): Promise<PermissionState> {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        return result.state;
      }
      return 'prompt';
    } catch (error) {
      console.warn('Permission API non disponible:', error);
      return 'prompt';
    }
  }

  /** Géolocalisation IP avec Mapbox */
  /** Géolocalisation IP avec Mapbox - VERSION CORRIGÉE */
private static async getMapboxIPLocation(): Promise<Coordinates> {
  const token = this.getMapboxToken();
  
  try {
    // Utiliser le BON endpoint pour la géolocalisation IP
    const response = await fetch(
      `https://api.mapbox.com/geolocation/v1/ipgeo.json?access_token=${token}`,
      { 
        signal: AbortSignal.timeout(5000),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Format de réponse de l'API IP geolocation
    if (!data.latitude || !data.longitude) {
      throw new Error("Format de réponse Mapbox invalide");
    }

    // Mapbox IP geolocation retourne un accuracy_radius en mètres
    const accuracy = data.accuracy_radius ? data.accuracy_radius * 1000 : 5000;

    return {
      lat: data.latitude,
      lng: data.longitude,
      accuracy,
      timestamp: Date.now(),
      source: 'ip'
    };

  } catch (error) {
    console.error("Erreur Mapbox IP location:", error);
    throw new Error("Localisation Mapbox indisponible");
  }
}

  /** Estimer la précision basée sur le type de résultat Mapbox */
  private static estimateMapboxAccuracy(feature: any): number {
    const placeType = feature.place_type?.[0];
    
    switch (placeType) {
      case 'address':
        return 50;
      case 'poi':
        return 100;
      case 'neighborhood':
        return 500;
      case 'postcode':
        return 1000;
      case 'place':
        return 2000;
      case 'region':
        return 5000;
      default:
        return 2000;
    }
  }

  /** Service de fallback IP alternatif */
  private static async getFallbackIPLocation(): Promise<Coordinates> {
    const fallbackServices = [
      "https://ipapi.co/json/",
      "https://ipinfo.io/json",
      "https://freeipapi.com/api/json"
    ];

    for (const serviceUrl of fallbackServices) {
      try {
        const response = await fetch(serviceUrl, {
          signal: AbortSignal.timeout(3000)
        });

        if (!response.ok) continue;

        const data = await response.json();
        
        if (data.latitude && data.longitude) {
          return {
            lat: parseFloat(data.latitude),
            lng: parseFloat(data.longitude),
            accuracy: data.accuracy || (data.accuracy_radius ? data.accuracy_radius * 1000 : 3000),
            timestamp: Date.now(),
            source: 'ip'
          };
        }
      } catch (error) {
        console.warn(`Service fallback ${serviceUrl} échoué:`, error);
        continue;
      }
    }

    throw new Error("Tous les services de fallback ont échoué");
  }

  /** Distance entre deux coordonnées en mètres */
  static getDistance(c1: Coordinates, c2: Coordinates): number {
    const R = 6371000;
    const dLat = ((c2.lat - c1.lat) * Math.PI) / 180;
    const dLng = ((c2.lng - c1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((c1.lat * Math.PI) / 180) *
        Math.cos((c2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /** Obtenir la position pour navigation */
  static async getNavigationLocation(
    options: {
      retry?: number;
      requiredAccuracy?: number;
      timeout?: number;
    } = {}
  ): Promise<Coordinates> {
    const {
      retry = 2,
      requiredAccuracy = 100,
      timeout = 15000
    } = options;

    const now = Date.now();

    // Utiliser le cache seulement si très récent et précis
    if (this.cachedCoords && this.cachedTime && 
        now - this.cachedTime < 10000 &&
        this.cachedCoords.accuracy && 
        this.cachedCoords.accuracy <= requiredAccuracy) {
      return this.cachedCoords;
    }

    try {
      // Essayer d'abord le GPS
      const gpsPosition = await Promise.race([
        this.getGPSLocation({ timeout }),
        wait(timeout).then(() => { throw new Error("GPS timeout"); })
      ]);

      if (gpsPosition.accuracy && gpsPosition.accuracy <= requiredAccuracy) {
        this.cachePosition(gpsPosition);
        return gpsPosition;
      }

      // GPS acceptable pour démarrage
      if (gpsPosition.accuracy && gpsPosition.accuracy <= 500) {
        console.warn("GPS peu précis mais utilisable");
        this.cachePosition(gpsPosition);
        return gpsPosition;
      }

      throw new Error("GPS trop imprécis");

    } catch (gpsError) {
      console.warn("GPS failed, trying Mapbox IP:", gpsError);

      if (retry > 0) {
        await wait(1000);
        return this.getNavigationLocation({ 
          retry: retry - 1, 
          requiredAccuracy: 500
        });
      }

      // Fallback avec Mapbox
      try {
        const mapboxPosition = await this.getMapboxIPLocation();
        
        if (mapboxPosition.accuracy && mapboxPosition.accuracy <= 2000) {
          this.cachePosition(mapboxPosition);
          return mapboxPosition;
        }
        
        throw new Error("Mapbox trop imprécis");

      } catch (mapboxError) {
        console.warn("Mapbox failed, trying fallback IP:", mapboxError);
        
        // Fallback sur services IP gratuits
        try {
          const fallbackPosition = await this.getFallbackIPLocation();
          
          if (fallbackPosition.accuracy && fallbackPosition.accuracy <= 3000) {
            this.cachePosition(fallbackPosition);
            return fallbackPosition;
          }
          
          throw new Error("Fallback IP trop imprécis");

        } catch (fallbackError) {
          // Dernier recours: cache
          if (this.cachedCoords) {
            console.warn("Using expired cache as last resort");
            return this.cachedCoords;
          }
          
          throw new Error("Aucune localisation précise disponible");
        }
      }
    }
  }

  /** Reverse geocoding avec Mapbox */
  static async reverseGeocode(coords: Coordinates): Promise<string> {
    const token = this.getMapboxToken();
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.lng},${coords.lat}.json?access_token=${token}&limit=1`
      );

      if (!response.ok) {
        throw new Error("Reverse geocoding failed");
      }

      const data = await response.json();
      return data.features[0]?.place_name || "Adresse inconnue";

    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return "Adresse non disponible";
    }
  }

  /** Géocoder une adresse en coordonnées */
  static async geocodeAddress(address: string): Promise<Coordinates> {
    const token = this.getMapboxToken();
    
    try {
      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${token}&limit=1`
      );

      if (!response.ok) {
        throw new Error("Geocoding failed");
      }

      const data = await response.json();
      const feature = data.features[0];
      
      if (!feature) {
        throw new Error("Adresse non trouvée");
      }

      const [lng, lat] = feature.center;
      const accuracy = this.estimateMapboxAccuracy(feature);

      return {
        lat,
        lng,
        accuracy,
        source: 'geocode'
      };

    } catch (error) {
      console.error("Geocoding error:", error);
      throw new Error("Impossible de trouver cette adresse");
    }
  }

  /** Démarrer le suivi en temps réel */
  static startTracking(
    onUpdate: (coords: Coordinates) => void,
    onError?: (error: Error) => void,
    options: WatchOptions = {}
  ) {
    if (!this.isGeolocationAvailable()) {
      console.warn("Géolocalisation non disponible pour le tracking");
      onError?.(new Error("Géolocalisation non disponible"));
      return false;
    }

    if (this.isTracking) {
      console.warn("Tracking déjà actif");
      return false;
    }

    const {
      enableHighAccuracy = true,
      timeout = 10000,
      maximumAge = 5000,
      accuracyThreshold = 50,
      minDistance = 20,
      minTimeInterval = 1000
    } = options;

    this.isTracking = true;
    this.lastUpdateTime = 0;

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        
        // Filtrage temporel
        if (now - this.lastUpdateTime < minTimeInterval) {
          return;
        }

        // Filtrage de précision
        if (position.coords.accuracy > accuracyThreshold) {
          console.warn("Position GPS ignorée (précision insuffisante)");
          return;
        }

        const coords: Coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          source: 'gps'
        };

        // Filtrage de distance et mise à jour
        if (!this.lastCoords || 
            this.getDistance(this.lastCoords, coords) > minDistance) {
          
          this.lastCoords = coords;
          this.cachedCoords = coords;
          this.cachedTime = now;
          this.lastUpdateTime = now;
          
          onUpdate(coords);
        }
      },
      (err) => {
        console.error("Erreur tracking GPS:", err);
        onError?.(new Error(`Erreur tracking: ${err.message}`));
        
        // Tentative de reprise automatique
        if (this.isTracking) {
          setTimeout(() => {
            if (this.isTracking) {
              this.stopTracking();
              this.startTracking(onUpdate, onError, options);
            }
          }, 5000);
        }
      },
      { enableHighAccuracy, timeout, maximumAge }
    );

    return true;
  }

  /** Démarrer le tracking navigation avec haute précision */
  static startNavigationTracking(
    onUpdate: (coords: Coordinates) => void,
    onError?: (error: Error) => void,
    options: WatchOptions = {}
  ) {
    const navOptions: WatchOptions = {
      enableHighAccuracy: true,
      accuracyThreshold: 25,
      minDistance: 10,
      minTimeInterval: 1000,
      timeout: 10000,
      maximumAge: 2000,
      ...options
    };

    return this.startTracking(onUpdate, onError, navOptions);
  }

  /** Arrêter le suivi en temps réel */
  static stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isTracking = false;
    this.lastCoords = null;
  }

  /** Mettre en cache une position */
  private static cachePosition(coords: Coordinates) {
    this.cachedCoords = coords;
    this.cachedTime = Date.now();
  }

  /** Nettoyage */
  static cleanup() {
    this.stopTracking();
    this.cachedCoords = null;
    this.cachedTime = null;
    this.lastCoords = null;
  }

  /** Obtenir la dernière position connue */
  static getLastKnownLocation(): Coordinates | null {
    return this.cachedCoords;
  }

  /** Vérifier si une position est suffisamment précise pour la navigation */
  static isAccurateForNavigation(coords: Coordinates, threshold: number = 100): boolean {
    return coords.accuracy !== undefined && coords.accuracy <= threshold;
  }
}

export default LocationService;