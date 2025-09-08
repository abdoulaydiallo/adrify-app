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

  /** Vérifie si la géolocalisation est disponible et en contexte sécurisé */
  static isGeolocationAvailable(): boolean {
    return "geolocation" in navigator && window.isSecureContext;
  }

  /** Obtenir la position GPS unique avec gestion des erreurs détaillée */
  static getGPSLocation(
    timeout = 20000, // Augmenté pour mobile
    maximumAge = 5000,
    enableHighAccuracy = true
  ): Promise<Coordinates & { accuracy: number }> {
    return new Promise((resolve, reject) => {
      if (!this.isGeolocationAvailable()) {
        return reject(new Error("Géolocalisation non disponible ou non sécurisée (HTTPS requis)"));
      }

      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          }),
        (err) => reject(err),
        { enableHighAccuracy, timeout, maximumAge }
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

  /** Obtenir la position utilisateur avec cache, retry et fallback low accuracy */
  static async getUserLocation(
    retry = 3,
    accuracyThreshold = 50,
    lowAccuracyFallback = true
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

    let attemptHigh = true;

    const attemptLocation = async (): Promise<Coordinates> => {
      try {
        const position = await this.getGPSLocation(20000, 5000, attemptHigh);
        if (position.accuracy <= accuracyThreshold) {
          this.cachedCoords = { lat: position.lat, lng: position.lng };
          this.cachedTime = now;
          return this.cachedCoords;
        } else {
          console.warn("Position GPS ignorée (précision insuffisante)");
          throw new Error("GPS imprécis");
        }
      } catch (err: any) {
        console.warn(`GPS échoué (${attemptHigh ? 'high' : 'low'} accuracy), retries: ${retry}`, err);

        if (err.code === 1) { // PERMISSION_DENIED
          if (this.cachedCoords) return this.cachedCoords;
          throw new Error("Permission de géolocalisation refusée");
        }

        if (err.code === 3 && retry > 0) { // TIMEOUT, retry with longer wait
          await wait(1000 * Math.pow(2, 3 - retry));
          return attemptLocation();
        }

        if (err.code === 2 && retry > 0) { // POSITION_UNAVAILABLE, retry
          await wait(500 * Math.pow(2, 3 - retry));
          return attemptLocation();
        }

        if (retry > 0) {
          await wait(500 * Math.pow(2, 3 - retry));
          retry--;
          return attemptLocation();
        }

        if (attemptHigh && lowAccuracyFallback) {
          attemptHigh = false;
          console.log("Fallback to low accuracy");
          return attemptLocation();
        }

        if (this.cachedCoords) return this.cachedCoords;
        throw new Error("Impossible de récupérer la position de l'utilisateur");
      }
    };

    return attemptLocation();
  }

  /** Démarrer le suivi en temps réel avec filtrage, throttling et retry sur erreur */
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
      timeout = 20000, // Augmenté
      maximumAge = 5000,
      accuracyThreshold = 50,
      minDistance = 20,
    } = options;

    const watchHandler = () => {
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
          if (err.code !== 1) { // Retry if not permission denied
            setTimeout(watchHandler, 5000); // Retry after 5s
          }
        },
        { enableHighAccuracy, timeout, maximumAge }
      );
    };

    watchHandler();
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