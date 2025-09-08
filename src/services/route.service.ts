// services/route.service.ts
import { Coordinates } from "./location.service";
import { AuthService } from "./auth.service";

export class RouteService {
  // Générer une route depuis la position utilisateur vers une adresse donnée
  static async fetchRoute(code: string, start: Coordinates): Promise<any> {
    try {
      const url = `/guest/addresses/${code}/route?latitude=${start.lat}&longitude=${start.lng}`;
      const data = await AuthService.fetchWithoutAuth(url, { method: "GET" });

      if (!data?.route) throw new Error("Impossible de générer l'itinéraire");
      return data.route;
    } catch (err: any) {
      console.error("Erreur RouteService.fetchRoute:", err);
      throw err;
    }
  }
}
