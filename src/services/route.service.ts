// services/route.service.ts
import { Coordinates } from "./location.service";
import { AuthService } from "./auth.service";

export interface Route {
  distance: number;
  duration: number;
  geometry: any; // remplacer par GeoJSON.LineString si besoin
}

export class RouteService {
  private static cache = new Map<string, Route>();

  // Générer une route depuis la position utilisateur vers une adresse donnée
  static async fetchRoute(code: string, start: Coordinates): Promise<Route> {
    // Validation coordonnées
    if (!start || isNaN(start.lat) || isNaN(start.lng)) {
      throw new Error("Coordonnées invalides");
    }

    const cacheKey = `${code}:${start.lat}:${start.lng}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const params = new URLSearchParams({
      latitude: String(start.lat),
      longitude: String(start.lng),
    });
    const url = `/guest/addresses/${encodeURIComponent(code)}/route?${params}`;

    // Retry avec backoff exponentiel
    let lastError: any;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const data = await AuthService.fetchWithoutAuth(url, { method: "GET" });

        if (!data?.route) throw new Error("Réponse API invalide");

        const route: Route = data.route;
        this.cache.set(cacheKey, route);

        return route;
      } catch (err) {
        lastError = err;
        const delay = Math.pow(2, attempt) * 200; // 200ms, 400ms, 800ms
        await new Promise((res) => setTimeout(res, delay));
      }
    }

    console.error("Erreur RouteService.fetchRoute:", { code, start, err: lastError });
    throw lastError;
  }
}
