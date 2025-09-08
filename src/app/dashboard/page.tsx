"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Mapbox, MapboxRef } from "@/components/Mapbox";
import { Address } from "@/types/address";
import { useAddresses } from "@/hooks/use-addresses";
import { Loader } from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Menu, X, MapPin, Plus, Search, Map } from "lucide-react";
import { useRouter } from "next/navigation";

type DashboardPageProps = {
  className?: string;
};

export default function DashboardPage({ className = "" }: DashboardPageProps) {
  const router = useRouter();
  const { addresses, fetchAddresses, isLoading, isError, error } =
    useAddresses();

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const mapRef = useRef<MapboxRef>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 9.6412, lng: -13.5784 });
  const [mapZoom, setMapZoom] = useState(11);

  // Fonction pour faire voler la carte vers une adresse
  const flyToAddress = useCallback((address: Address) => {
    if (mapRef.current) {
      const lng =
        typeof address.longitude === "number"
          ? address.longitude
          : parseFloat(address.longitude || "-13.5784");
      const lat =
        typeof address.latitude === "number"
          ? address.latitude
          : parseFloat(address.latitude || "9.6412");
      mapRef.current.flyTo([lng, lat], 14);
    } else {
      const fallbackLng =
        typeof address.longitude === "number"
          ? address.longitude
          : parseFloat(address.longitude || "-13.5784");
      const fallbackLat =
        typeof address.latitude === "number"
          ? address.latitude
          : parseFloat(address.latitude || "9.6412");
      setMapCenter({ lat: fallbackLat, lng: fallbackLng });
      setMapZoom(13);
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

  // Fermer la sidebar et la recherche sur redimensionnement
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isLoading) {
    return <Loader />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full px-4 py-6 sm:p-8">
        <div className="text-center max-w-xs sm:max-w-sm">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <X className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-red-600" />
          </div>
          <h3 className="font-roboto text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-2">
            Erreur de chargement
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
            {error?.message || "Impossible de charger les adresses"}
          </p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="text-xs sm:text-sm"
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className={`flex flex-1 h-[calc(100vh - 2rem)] overflow-hidden ${className}`}>
      {/* Mobile Search Bar */}
      {isSearchOpen && (
        <div className="fixed top-14 left-0 right-0 z-30 md:hidden bg-white/95 rounded-b-xl shadow-lg px-3 py-2 sm:p-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Rechercher une adresse..."
                className="w-full h-9 sm:h-10 md:h-11 px-3 sm:px-4 pr-8 sm:pr-10 bg-gray-100 rounded-lg placeholder-gray-400 text-gray-700 text-xs sm:text-sm font-roboto focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <Search className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSearchOpen(false)}
              className="p-1 sm:p-2 hover:bg-gray-100"
            >
              <X className="w-4 h-4 text-gray-600" />
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Controls */}
      <div className="fixed bottom-3 sm:bottom-4 right-3 sm:right-4 z-30 md:hidden flex gap-4">
        <Button
          onClick={() => setIsSidebarOpen(true)}
          className="h-12 w-12 sm:h-1 sm:w-10 md:h-11 md:w-11 rounded-full bg-white shadow-lg hover:bg-blue-50 transition-all duration-300"
          variant="ghost"
        >
          <Map className="w-4 sm:w-5 h-4 sm:h-5 text-gray-700" />
        </Button>
        
        <Button
          onClick={() => router.push("/dashboard/addresses/new")}
          className="h-12 w-12 sm:h-10 sm:w-10 md:h-11 md:w-11 rounded-full bg-blue-600 shadow-lg hover:bg-blue-700 transition-all duration-300"
        >
          <Plus className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
        </Button>
      </div>

      {/* Sidebar Desktop */}
      <Sidebar
        addresses={addresses as any}
        onSelect={(addr) => setSelectedAddress(addr)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        className="hidden md:block"
      />

      {/* Sidebar Mobile */}
      <Sidebar
        addresses={addresses as any}
        onSelect={(addr) => setSelectedAddress(addr)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        
      />

      {/* Map Container */}
      <div className="flex-1 relative">
        <Mapbox
          ref={mapRef}
          addresses={addresses as any}
          center={mapCenter}
          zoom={mapZoom}
          selectedAddress={selectedAddress}
          className="h-full w-full"
        />

        {/* Mobile Selected Address Info */}
        {selectedAddress && (
          <div className="md:hidden fixed bottom-22 sm:bottom-16 left-3 sm:left-4 right-3 sm:right-4 z-20">
            <div className="bg-white rounded-lg shadow-lg p-2 sm:p-3">
              <div className="flex items-center justify-between gap-1 sm:gap-2">
                <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                  <MapPin className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
                  <div>
                    <p className="font-roboto font-medium text-gray-900 text-xs sm:text-sm truncate">
                      {selectedAddress.building_type || "Adresse"}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {[
                        selectedAddress.house_number,
                        selectedAddress.street_name,
                        selectedAddress.quartier,
                        selectedAddress.commune,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAddress(null)}
                  className="p-1 sm:p-2 hover:bg-gray-100"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Selected Address Info */}
        {selectedAddress && (
          <div className="hidden md:block absolute bottom-12 sm:bottom-4 right-3 sm:right-4 z-20">
            <div className="bg-white/95 rounded-lg shadow-lg p-3 sm:p-4 max-w-xs sm:max-w-sm md:max-w-md">
              <div className="flex items-start gap-2 sm:gap-3">
                <MapPin className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-roboto font-semibold text-gray-900 text-sm sm:text-base truncate">
                    {selectedAddress.building_type || "Adresse"}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">
                    {[
                      selectedAddress.house_number,
                      selectedAddress.street_name,
                      selectedAddress.quartier,
                      selectedAddress.commune,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  {selectedAddress.landmark && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      📍 {selectedAddress.landmark}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAddress(null)}
                  className="p-1 sm:p-2 hover:bg-gray-100"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
