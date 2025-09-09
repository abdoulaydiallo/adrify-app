"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Mapbox, MapboxRef } from "@/components/Mapbox";
import { Loader } from "@/components/loader";
import { Address } from "@/types/address";
import { AuthService } from "@/services/auth.service";
import { ERROR_CODES, ServiceError } from "@/services/errors.service";
import { GuestSidebar } from "@/components/layout/guest-sidebar";
import { Button } from "@/components/ui/button";
import { Map, Navigation, LocateFixed } from "lucide-react";
import { LocationService, Coordinates } from "@/services/location.service";
import { RouteService } from "@/services/route.service";
import { toast } from "sonner";

export default function A() {
  const params = useParams();
  const code = params?.code as string;

  const mapRef = useRef<MapboxRef>(null);

  const [address, setAddress] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [route, setRoute] = useState<any>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);

  // --- Récupération de l'adresse ---
  const fetchAddress = useCallback(async () => {
    if (!code) {
      setError("Code manquant dans l'URL");
      setIsLoading(false);
      return;
    }
    try {
      const data = await AuthService.fetchWithoutAuth(
        `/guest/addresses/${code}`
      );
      if (!data?.address)
        throw new ServiceError(
          ERROR_CODES.INTERNAL_SERVER_ERROR,
          "Adresse introuvable"
        );
      setAddress(data.address);
    } catch (err: any) {
      console.error("Erreur fetchAddress:", err);
      setError(err.message || "Erreur lors de la récupération de l'adresse");
    } finally {
      setIsLoading(false);
    }
  }, [code]);

  useEffect(() => {
    fetchAddress();
  }, [fetchAddress]);

  // --- Centrer la carte sur l'adresse ---
  const flyToAddress = useCallback((addr: Address) => {
    if (!mapRef.current) return;

    const lat =
      typeof addr.latitude === "number"
        ? addr.latitude
        : parseFloat(addr.latitude || "0");
    const lng =
      typeof addr.longitude === "number"
        ? addr.longitude
        : parseFloat(addr.longitude || "0");

    mapRef.current.flyTo([lng, lat], 15);
  }, []);

  useEffect(() => {
    if (address) flyToAddress(address);
  }, [address, flyToAddress]);

  // --- Obtenir la position utilisateur ---
  const getUserLocation = useCallback(async () => {
    try {
      const position = await LocationService.getNavigationLocation({
        requiredAccuracy: 100,
        retry: 2,
        timeout: 15000,
      });

      setUserLocation(position);
      setLocationAccuracy(position.accuracy || null);

      // Centrer la carte sur la position utilisateur
      if (mapRef.current) {
        mapRef.current.flyTo([position.lng, position.lat], 15);
      }

      return position;
    } catch (err: any) {
      console.error("Erreur localisation:", err);
      toast.error(err.message || "Impossible de récupérer votre position");
      throw err;
    }
  }, []);

  // --- Génération de l'itinéraire ---
  const handleShowRoute = useCallback(async () => {
    setLoadingRoute(true);
    try {
      const start = await getUserLocation();

      if (!address) throw new Error("Adresse introuvable");

      const routeData = await RouteService.fetchRoute(code!, start);
      setRoute(routeData);

      toast.success("Itinéraire calculé avec succès");
    } catch (err: any) {
      console.error("Erreur itinéraire:", err);
      toast.error(err.message || "Impossible de calculer l'itinéraire");
    } finally {
      setLoadingRoute(false);
    }
  }, [address, code, getUserLocation]);

  // --- Gestion tracking navigation ---
  const handleStartNavigation = useCallback(() => {
    if (!route || isTrackingEnabled) return;

    const success = LocationService.startNavigationTracking(
      (coords) => {
        setUserLocation(coords);
        setLocationAccuracy(coords.accuracy || null);

        // Centrer la carte sur la position en temps réel
        if (mapRef.current) {
          mapRef.current.flyTo([coords.lng, coords.lat], 15);
        }

        // Vérifier si on approche de la destination
        if (address && coords.accuracy) {
          const distanceToDestination = LocationService.getDistance(coords, {
            lat: parseFloat(address.latitude as any),
            lng: parseFloat(address.longitude as any),
            source: "gps"
          });

          if (distanceToDestination < coords.accuracy + 50) {
            toast.success("Vous êtes arrivé à destination !");
            handleStopTracking();
          }
        }
      },
      (error) => {
        console.error("Erreur tracking:", error);
        toast.warning("Perte du signal GPS");
      },
      {
        accuracyThreshold: 25,
        minDistance: 10,
        minTimeInterval: 2000,
      }
    );

    if (success) {
      setIsTrackingEnabled(true);
      toast.success("Navigation démarrée");
    } else {
      toast.error("Impossible de démarrer la navigation");
    }
  }, [route, isTrackingEnabled, address]);

  const handleStopTracking = useCallback(() => {
    LocationService.stopTracking();
    setIsTrackingEnabled(false);
    toast.info("Navigation arrêtée");
  }, []);

  // --- Centrer sur la position utilisateur ---
  const handleCenterOnUser = useCallback(async () => {
    try {
      const position = await getUserLocation();
      if (position && mapRef.current) {
        mapRef.current.flyTo([position.lng, position.lat], 15);
      }
    } catch (err) {
      console.error("Erreur centrage:", err);
    }
  }, [getUserLocation]);

  // --- Nettoyage à la destruction du composant ---
  useEffect(() => {
    return () => {
      LocationService.stopTracking();
      LocationService.cleanup();
    };
  }, []);

  // --- Affichage ---
  if (isLoading) return <Loader />;
  if (error) return <div className="text-red-500 p-4">{error}</div>;
  if (!address)
    return <div className="text-gray-700 p-4">Adresse introuvable</div>;

  return (
    <div className="w-full flex-1 h-[89vh] flex">
      {/* Mobile Controls */}
      <div className="fixed bottom-12 sm:bottom-4 right-3 sm:right-4 z-30 md:hidden flex gap-4">
        <Button
          onClick={() => setIsSidebarOpen(true)}
          className="h-12 w-12 rounded-full bg-white shadow-lg hover:bg-blue-50 transition-all duration-300"
          variant="ghost"
          size="icon"
        >
          <Map className="w-5 h-5 text-gray-700" />
        </Button>

        <Button
          onClick={handleCenterOnUser}
          className="h-12 w-12 rounded-full bg-white shadow-lg hover:bg-blue-50 transition-all duration-300"
          variant="ghost"
          size="icon"
        >
          <LocateFixed className="w-5 h-5 text-gray-700" />
        </Button>
      </div>

      {/* Desktop Controls */}
      <div className="fixed bottom-20 right-4 z-30 hidden md:flex flex-col gap-3">
        <Button
          onClick={handleCenterOnUser}
          className="h-12 w-12 rounded-full bg-white shadow-lg hover:bg-blue-50 transition-all duration-300"
          variant="ghost"
          size="icon"
          title="Centrer sur ma position"
        >
          <LocateFixed className="w-8 h-8 text-gray-700" />
        </Button>

        {route && (
          <Button
            onClick={
              isTrackingEnabled ? handleStopTracking : handleStartNavigation
            }
            className={`h-12 w-12 rounded-full shadow-lg transition-all duration-300 ${
              isTrackingEnabled
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
            size="icon"
            title={
              isTrackingEnabled
                ? "Arrêter la navigation"
                : "Démarrer la navigation"
            }
          >
            <Navigation className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Sidebar */}
      <GuestSidebar
        address={address}
        route={route}
        onRecalculate={handleShowRoute}
        isTrackingEnabled={isTrackingEnabled}
        onStopTracking={handleStopTracking}
        onStartTracking={handleStartNavigation}
        loadingRoute={loadingRoute}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userLocation={userLocation}
        locationAccuracy={locationAccuracy}
        onCenterOnUser={handleCenterOnUser}
      />

      {/* Carte */}
      <div className="flex-1 w-full">
        <Mapbox
          ref={mapRef}
          addresses={address ? [address] : []}
          center={{
            lat: parseFloat(
              userLocation ? userLocation.lat : (address.latitude as any)
            ),
            lng: parseFloat(
              userLocation ? userLocation.lng : (address.longitude as any)
            ),
          }}
          zoom={userLocation ? 15 : 11}
          selectedAddress={address}
          route={route?.geometry}
          onGeolocate={getUserLocation}
        />

        {/* Badge de précision */}
        {locationAccuracy && (
          <div className="fixed top-20 md:top-23 right-20 z-30 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg text-sm">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  locationAccuracy <= 50
                    ? "bg-green-500"
                    : locationAccuracy <= 100
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
              />
              <span>Précision: {Math.round(locationAccuracy)}m</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
