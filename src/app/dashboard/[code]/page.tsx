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
import { Map } from "lucide-react";
import { LocationService, Coordinates } from "@/services/location.service";
import { RouteService } from "@/services/route.service";

export default function GuestDashboard() {
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

  // --- Génération de l'itinéraire ---
  const handleShowRoute = useCallback(async () => {
    setLoadingRoute(true);
    try {
      const start = await LocationService.getUserLocation();
      setUserLocation(start);

      if (!address) throw new Error("Adresse introuvable");

      const routeData = await RouteService.fetchRoute(code!, start);
      setRoute(routeData);
    } catch (err: any) {
      console.error("Erreur itinéraire:", err);
      alert(
        err.message || "Impossible de récupérer la position ou l'itinéraire."
      );
    } finally {
      setLoadingRoute(false);
    }
  }, [address, code]);

  // --- Gestion tracking ---
  const handleStartTracking = useCallback(() => {
    if (!route || isTrackingEnabled) return; // ne lancer qu'une fois

    LocationService.startTracking((coords) => {
      setUserLocation(coords); // met à jour la position live
      mapRef.current?.flyTo([coords.lng, coords.lat], 15);
    });

    setIsTrackingEnabled(true);
  }, [route, isTrackingEnabled]);

  const handleStopTracking = useCallback(() => {
    LocationService.stopTracking();
    setIsTrackingEnabled(false);
  }, []);

  // --- Affichage ---
  if (isLoading) return <Loader />;
  if (error) return <div className="text-red-500 p-4">{error}</div>;
  if (!address)
    return <div className="text-gray-700 p-4">Adresse introuvable</div>;

  return (
    <div className="w-full min-h-[calc(100vh-200px)] flex">
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
      </div>

      {/* Sidebar */}
      <GuestSidebar
        address={address}
        route={route}
        onRecalculate={handleShowRoute}
        isTrackingEnabled={isTrackingEnabled}
        onStopTracking={handleStopTracking}
        onStartTracking={handleStartTracking}
        loadingRoute={loadingRoute}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Carte */}
      <div className="flex-1 mt-5">
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
          zoom={11}
          selectedAddress={address}
          route={route?.geometry}
          onGeolocate={(position) =>
            setUserLocation({ lat: position.lat, lng: position.lng })
          }
        />
      </div>
    </div>
  );
}
