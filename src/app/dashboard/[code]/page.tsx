"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Mapbox, MapboxRef } from "@/components/Mapbox";
import { Loader } from "@/components/loader";
import { Address } from "@/types/address";
import { AuthService } from "@/services/auth.service";
import { ERROR_CODES, ServiceError } from "@/services/errors.service";
import { GuestSidebar } from "@/components/layout/guest-sidebar";

export default function GuestDashboard() {
  const params = useParams();
  const code = params?.code;

  const mapRef = useRef<MapboxRef>(null);

  const [address, setAddress] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [route, setRoute] = useState<any>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(false);

  // 🔹 Récupération de l'adresse
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
      if (!data || !data.address) {
        throw new ServiceError(
          ERROR_CODES.INTERNAL_SERVER_ERROR,
          "Adresse introuvable"
        );
      }
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

  // 🔹 Fonction pour centrer la carte sur une adresse
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
    if (address) {
      flyToAddress(address);
    }
  }, [address, flyToAddress]);

  // 🔹 Démarrer le suivi automatique lorsque la route est disponible
  useEffect(() => {
    if (route && mapRef.current) {
      // Démarrer le suivi automatique
      mapRef.current.startTracking();
      setIsTrackingEnabled(true);

      // Optionnel: Arrêter le suivi après un certain temps (ex: 30 secondes)
      const timeout = setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.stopTracking();
          setIsTrackingEnabled(false);
        }
      }, 30000);

      return () => clearTimeout(timeout);
    }
  }, [route]);

  // 🔹 Génération de la route
  const handleShowRoute = useCallback(() => {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas disponible dans votre navigateur.");
      return;
    }

    setLoadingRoute(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const start = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(start);

        if (!address) return;

        try {
          const url = `/guest/addresses/${code}/route?latitude=${start.lat}&longitude=${start.lng}`;
          const data = await AuthService.fetchWithoutAuth(url, {
            method: "GET",
          });

          if (data && data.route) {
            setRoute(data.route);
            // Ne plus centrer automatiquement sur l'adresse - le suivi s'occupe de ça
          } else {
            alert("Impossible de générer l'itinéraire.");
          }
        } catch (err: any) {
          console.error("Erreur route API:", err);
          alert(err.message || "Erreur lors de la génération de l'itinéraire");
        } finally {
          setLoadingRoute(false);
        }
      },
      (err) => {
        console.error("Erreur géolocalisation:", err);
        alert("Impossible de récupérer votre position.");
        setLoadingRoute(false);
      },
      { enableHighAccuracy: true }
    );
  }, [address, code]);

  // 🔹 Arrêter le suivi manuellement
  const handleStopTracking = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.stopTracking();
      setIsTrackingEnabled(false);
    }
  }, []);

  // 🔹 Reprendre le suivi manuellement
  const handleStartTracking = useCallback(() => {
    if (mapRef.current && route) {
      mapRef.current.startTracking();
      setIsTrackingEnabled(true);
    }
  }, [route]);

  if (isLoading) return <Loader />;
  if (error) return <div className="text-red-500 p-4">{error}</div>;
  if (!address)
    return <div className="text-gray-700 p-4">Adresse introuvable</div>;

  return (
    <div className="w-full max-h-[calc(100vh - 200px)] flex">
      {/* Sidebar avec adresse + itinéraire */}
      <GuestSidebar
        address={address}
        route={route}
        onRecalculate={handleShowRoute}
        isTrackingEnabled={isTrackingEnabled}
        onStopTracking={handleStopTracking}
        onStartTracking={handleStartTracking}
        loadingRoute={loadingRoute}
      />

      {/* Carte */}
      <div className="flex-1">
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
          geolocateControl={true} // 🔹 Activer le contrôle de géolocalisation
          onGeolocate={(position) => {
            // Mettre à jour la position utilisateur
            setUserLocation({
              lat: position.lat,
              lng: position.lng,
            });
          }}
        />
      </div>
    </div>
  );
}
