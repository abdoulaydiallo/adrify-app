"use client";

import { AddressCard } from "../address/address-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Address } from "@/types/address";
import { Button } from "@/components/ui/button";
import { X, MapIcon } from "lucide-react";

type SidebarProps = {
  addresses: Address[];
  onSelect?: (a: Address) => void;
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
};

export function Sidebar({
  addresses,
  onSelect,
  isOpen = true,
  onClose,
  className = "",
}: SidebarProps) {
  const handleAddressSelect = (address: Address) => {
    onSelect?.(address);
    if (window.innerWidth < 768) {
      onClose?.();
    }
  };

  return (
    <aside
      className={`
        fixed md:block top-75 md:top-18 left-0 z-40 w-full h-[100vh] sm:h-[85vh] md:h-full md:w-80 lg:w-96
        bg-white rounded-t-2xl md:rounded-none shadow-lg md:shadow-none
        transform transition-transform duration-300 ease-out
        ${isOpen ? "translate-y-0" : "translate-y-full md:translate-y-0"}
        ${className}
      `}
      style={{ touchAction: "none" }} // Améliore l'interaction tactile
    >
      {/* Poignée de glissement (mobile uniquement) */}
      <div className="flex justify-center p-2 md:hidden" onClick={onClose}>
        <div className="w-16 h-1 bg-gray-300 rounded-full transition-transform duration-200 hover:scale-105"></div>
      </div>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 p-3 sm:p-4 border-b border-gray-200">
        <div className="flex gap-4">
          <MapIcon className="h-5 w-5" />
          <h2 className="font-roboto text-base sm:text-lg font-medium text-gray-900">
            Liste des Adresses
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="p-2 hover:bg-gray-100 md:hidden"
        >
          <X className="w-4 h-4 text-gray-600" />
        </Button>
      </div>
      <ScrollArea className="">
        <div className="p-3 sm:p-4 space-y-2">
          {addresses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 sm:py-12 text-center">
              <span className="material-icons text-gray-300 text-3xl sm:text-4xl mb-2">
                place
              </span>
              <h3 className="font-roboto font-medium text-gray-900 text-sm sm:text-base">
                Aucune adresse
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 max-w-48">
                Ajoutez votre première adresse
              </p>
            </div>
          ) : (
            addresses
              .slice()
              .reverse()
              .map((addr) => (
                <AddressCard
                  key={addr.id}
                  address={addr}
                  onSelect={handleAddressSelect}
                />
              ))
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
