"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Mapbox, MapboxRef } from "@/components/Mapbox";
import { Address } from "@/types/address";
import { useAddresses } from "@/hooks/use-addresses";
import { Loader } from "@/components/loader";

export default function DashboardPage() {
  const { addresses, fetchAddresses, isLoading, isError, error } =
    useAddresses();

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const mapRef = useRef<MapboxRef>(null);
  const [mapCenter, setMapCenter] = useState({
    lat: 9.6412,
    lng: -13.5784,
  });
  const [mapZoom, setMapZoom] = useState(9);

  // Fonction pour faire voler la carte vers une adresse
  const flyToAddress = useCallback((address: Address) => {
    if (mapRef.current) {
      // Conversion explicite en nombre et gestion des valeurs par défaut
      const lng =
        typeof address.longitude === "number"
          ? address.longitude
          : parseFloat(address.longitude || "-13.5784");

      const lat =
        typeof address.latitude === "number"
          ? address.latitude
          : parseFloat(address.latitude || "9.6412");

      // Utiliser la méthode flyTo du composant Mapbox
      mapRef.current.flyTo([lng, lat], 14); // 14 est le niveau de zoom
    } else {
      // Fallback si la ref n'est pas encore disponible
      const fallbackLng =
        typeof address.longitude === "number"
          ? address.longitude
          : parseFloat(address.longitude || "-13.5784");

      const fallbackLat =
        typeof address.latitude === "number"
          ? address.latitude
          : parseFloat(address.latitude || "9.6412");

      setMapCenter({ lat: fallbackLat, lng: fallbackLng });
      setMapZoom(14);
    }
  }, []);

  // Mettre à jour la carte lorsque selectedAddress change
  useEffect(() => {
    if (selectedAddress) {
      flyToAddress(selectedAddress);
    }
  }, [selectedAddress, flyToAddress]);

  useEffect(() => {
    async function loadAddresses() {
      try {
        await fetchAddresses();
      } catch (err) {
        console.error("Failed to fetch addresses:", err);
      }
    }
    loadAddresses();
  }, [fetchAddresses]);

  if (isLoading) {
    return <Loader />;
  }

  if (isError) {
    return <div>Error: {error?.message || "Failed to load addresses"}</div>;
  }

  return (
    <main className="flex flex-1">
      {/* Sidebar avec callback de sélection */}
      <Sidebar
        addresses={addresses as any}
        onSelect={(addr) => setSelectedAddress(addr)}
      />

      <div className="flex-1">
        <Mapbox
          ref={mapRef}
          addresses={addresses as any}
          center={mapCenter}
          zoom={mapZoom}
          selectedAddress={selectedAddress}
        />
      </div>
    </main>
  );
}
