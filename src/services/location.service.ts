// services/location.service.ts
export type Coordinates = { lat: number; lng: number };

export interface WatchOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  retry?: number;
  accuracyThreshold?: number; // précision minimale en mètres
  minDistance?: number; // distance minimale pour déclencher update
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class LocationService {
  private static watchId: number | null = null;
  private static lastCoords: Coordinates | null = null;
  private static cachedCoords: Coordinates | null = null;
  private static cachedTime: number | null = null;
  private static cacheDuration = 60000; // cache GPS valide pendant 1 min

  /** Vérifie si la géolocalisation est disponible */
  static isGeolocationAvailable(): boolean {
    return "geolocation" in navigator;
  }

  /** Obtenir la position GPS unique */
  static getGPSLocation(
    timeout = 10000,
    maximumAge = 5000
  ): Promise<Coordinates & { accuracy: number }> {
    return new Promise((resolve, reject) => {
      if (!this.isGeolocationAvailable()) {
        return reject(new Error("Géolocalisation non disponible"));
      }

      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout, maximumAge }
      );
    });
  }

  /** Distance entre deux coordonnées en mètres */
  private static getDistance(c1: Coordinates, c2: Coordinates): number {
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

  /** Obtenir la position utilisateur avec cache et retry GPS */
  static async getUserLocation(
    retry = 3,
    accuracyThreshold = 50
  ): Promise<Coordinates> {
    const now = Date.now();

    // Retourner cache si encore valide
    if (
      this.cachedCoords &&
      this.cachedTime &&
      now - this.cachedTime < this.cacheDuration
    ) {
      return this.cachedCoords;
    }

    try {
      const position = await this.getGPSLocation();
      if (position.accuracy <= accuracyThreshold) {
        this.cachedCoords = { lat: position.lat, lng: position.lng };
        this.cachedTime = now;
        return this.cachedCoords;
      } else {
        console.warn("Position GPS ignorée (précision insuffisante)");
        throw new Error("GPS imprécis");
      }
    } catch (err) {
      console.warn(`GPS échoué, retries restants: ${retry}`, err);

      if (retry > 0) {
        await wait(500 * Math.pow(2, 3 - retry));
        return this.getUserLocation(retry - 1, accuracyThreshold);
      }

      throw new Error("Impossible de récupérer la position de l'utilisateur");
    }
  }

  /** Démarrer le suivi en temps réel avec filtrage et throttling */
  static startTracking(
    onUpdate: (coords: Coordinates) => void,
    options: WatchOptions = {}
  ) {
    if (!this.isGeolocationAvailable()) {
      console.warn("Géolocalisation non disponible pour le tracking");
      return;
    }

    if (this.watchId !== null) {
      console.warn("Tracking déjà actif");
      return;
    }

    const {
      enableHighAccuracy = true,
      timeout = 10000,
      maximumAge = 5000,
      accuracyThreshold = 50,
      minDistance = 20,
    } = options;

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (position.coords.accuracy > accuracyThreshold) {
          console.warn("Position GPS ignorée (précision insuffisante)");
          return;
        }

        const coords: Coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        if (
          !this.lastCoords ||
          this.getDistance(this.lastCoords, coords) > minDistance
        ) {
          this.lastCoords = coords;
          this.cachedCoords = coords;
          this.cachedTime = Date.now();
          onUpdate(coords);
        }
      },
      (err) => {
        console.error("Erreur tracking GPS:", err);
      },
      { enableHighAccuracy, timeout, maximumAge }
    );
  }

  /** Arrêter le suivi en temps réel */
  static stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.lastCoords = null;
  }
}