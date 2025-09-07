"use client";

import { useEffect, useState } from "react";
import { Address } from "@/types/address";
import { AddressService } from "@/services/address.service";
import { AddressCard } from "./address-card";
import { Mapbox } from "@/components/Mapbox";
import { AuthService } from "@/services/auth.service";

export function AddressList() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  useEffect(() => {
    async function fetchAddresses() {
      setLoading(true);
      try {
        const data = await AuthService.fetchWithAuth("/addresses/map");
        setAddresses(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchAddresses();
    setLoading(false);
  }, []);

  console.log(addresses);

  if (loading) return <p className="p-4">Chargement...</p>;
  if (addresses.length === 0)
    return <p className="p-4">Aucune adresse trouvée.</p>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-100px)]">
      {/* Liste des adresses */}
      <div className="overflow-y-auto pr-2 space-y-4">
        {addresses.map((addr) => (
          <AddressCard
            key={addr.id}
            address={addr}
          />
        ))}
      </div>

      {/* Carte Mapbox */}
      <div className="hidden lg:block col-span-2 w-full h-full rounded-lg overflow-hidden border">
        {selectedAddress ? (
          <Mapbox
            addresses={addresses}
            center={{
              lat: parseFloat(selectedAddress.latitude),
              lng: parseFloat(selectedAddress.longitude),
            }}
            zoom={11}
            className="w-full h-full"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Sélectionnez une adresse pour l&apos;afficher sur la carte
          </div>
        )}
      </div>
    </div>
  );
}
