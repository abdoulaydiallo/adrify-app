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
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-30 transition-opacity duration-500 md:hidden ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 z-40 w-full md:w-80 lg:w-96
          h-[70vh] md:h-full
          bg-white rounded-t-2xl md:rounded-none shadow-lg md:shadow-none
          transform transition-all duration-500 ease-in-out
          ${
            isOpen
              ? "top-[35%] opacity-100 md:top-18 md:opacity-100"
              : "top-[100%] opacity-0 md:top-18 md:opacity-100"
          }
          ${className}
        `}
        style={{ touchAction: "none" }}
      >
        {/* Header sticky */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 p-3 sm:p-4 border-b border-gray-200 bg-white">
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

        {/* Liste scrollable avec padding bottom */}
        <ScrollArea className="overflow-y-auto h-[calc(100%-56px)] pb-4 md:pb-8">
          <div className="p-3 sm:p-4 space-y-4">
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
              <>
                {addresses
                  .slice()
                  .reverse()
                  .map((addr) => (
                    <AddressCard
                      key={addr.id}
                      address={addr}
                      onSelect={handleAddressSelect}
                    />
                  ))}
                {/* Spacer pour le dernier item */}
                <div className="h-8 md:h-12" />
              </>
            )}
          </div>
        </ScrollArea>
      </aside>
    </>
  );
}
