"use client";

import { AddressCard } from "../address/address-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Navigation,
  Clock,
  Route as RouteIcon,
  ChevronRight,
  LocateFixed,
  LocateOff,
  Loader2,
  MapIcon,
  X,
} from "lucide-react";
import { Address } from "@/types/address";

type GuestSidebarProps = {
  address: Address;
  route: any | null;
  onRecalculate: () => void;
  isTrackingEnabled: boolean;
  onStopTracking: () => void;
  onStartTracking: () => void;
  loadingRoute: boolean;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
};

export function GuestSidebar({
  address,
  route,
  onRecalculate,
  isTrackingEnabled,
  onStopTracking,
  onStartTracking,
  loadingRoute,
  isOpen = true,
  onClose,
  className,
}: GuestSidebarProps) {
  return (
    <aside
      className={`
        fixed md:block top-[40%] md:top-0 left-0 z-40 w-full h-full md:pt-20 md:w-[30%]
        bg-white rounded-t-2xl md:rounded-none shadow-lg md:shadow-none
        transform transition-transform duration-300 ease-out 
        flex flex-col
        ${isOpen ? "translate-y-0" : "translate-y-full md:translate-y-0"}
        ${className}
      `}
      style={{ touchAction: "none" }}
    >
      {/* Poignée mobile */}
      <div className="flex justify-center p-2 md:hidden">
        <div className="w-16 h-1 bg-gray-300 rounded-full transition-transform duration-200 hover:scale-105"></div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-4 p-3 sm:p-4 border-b border-gray-200 shrink-0">
        <div className="flex w-full justify-between gap-4">
          <div className="flex gap-4">
            <MapIcon className="h-5 w-5 text-gray-600" />
            <h2 className="font-roboto text-base sm:text-lg font-medium text-gray-900">
              Détails de l'itinéraire
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
      </div>

      {/* Contenu scrollable */}
      <ScrollArea className="flex-1 max-h-[calc(85vh-60px)] md:max-h-full overflow-y-auto p-3 sm:p-4 space-y-4 pb-24 md:pb-4">
        {/* Adresse */}
        <AddressCard address={address} variant="compact" />

        {/* Itinéraire */}
        <div className="py-4 min-h-50">
          {route ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <RouteIcon className="w-5 h-5 text-gray-600" />
                <h3 className="font-roboto text-base font-medium text-gray-900">
                  Itinéraire
                </h3>
              </div>
              <div className="space-y-3 text-sm text-gray-600">
                {route.distance && (
                  <p className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-gray-600" />
                    Distance :{" "}
                    <span className="text-gray-900 font-medium">
                      {(route.distance / 1000).toFixed(2)} km
                    </span>
                  </p>
                )}
                {route.duration && (
                  <p className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-600" />
                    Durée estimée :{" "}
                    <span className="text-gray-900 font-medium">
                      {(route.duration / 60).toFixed(0)} min
                    </span>
                  </p>
                )}

                {/* Statut suivi */}
                <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-100">
                  {isTrackingEnabled ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs font-medium text-green-700">
                        Suivi activé
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      <span className="text-xs font-medium text-gray-600">
                        Suivi désactivé
                      </span>
                    </>
                  )}
                </div>

                {/* Étapes */}
                {route.legs?.[0]?.steps && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900 flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-gray-600" /> Étapes du
                      trajet
                    </h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {route.legs[0].steps.map((step: any, idx: number) => (
                        <li
                          key={idx}
                          className="flex items-center justify-between gap-2 p-2 hover:bg-gray-50 rounded-lg"
                        >
                          <span>{step.maneuver.instruction}</span>
                          <ChevronRight className="w-3 h-3 text-gray-600" />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className=" text-xs sm:text-sm text-gray-600 italic px-2">
              Aucun itinéraire généré
            </p>
          )}
        </div>

        {/* Boutons */}
        <div className="p-3 sm:p-4 border-t border-gray-200 space-y-3">
          {route && (
            <div>
              {isTrackingEnabled ? (
                <Button
                  onClick={onStopTracking}
                  variant="outline"
                  size="sm"
                  className="flex w-full items-center justify-center gap-2 text-xs sm:text-center text-gray-900 hover:bg-gray-100"
                >
                  <LocateOff className="w-4 h-4 text-gray-600" />
                  Arrêter suivi
                </Button>
              ) : (
                <Button
                  onClick={onStartTracking}
                  variant="outline"
                  className="flex w-full items-center justify-center gap-2 text-xs sm:text-sm text-gray-900 hover:bg-gray-100"
                  size="sm"
                >
                  <LocateFixed className="w-4 h-4 text-gray-600" />
                  Suivre position
                </Button>
              )}
            </div>
          )}

          <Button
            onClick={onRecalculate}
            className={`w-full cursor-pointer rounded-xl font-semibold text-white flex items-center justify-center gap-2 ${"bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg"}`}
            disabled={loadingRoute}
            size="lg"
          >
            {loadingRoute ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Calcul en cours...
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4" />
                {route ? "Recalculer" : "Calculer l'itinéraire"}
              </>
            )}
          </Button>

          {route && (
            <p className="text-xs text-gray-600 text-center mt-2">
              {isTrackingEnabled
                ? "La carte suit automatiquement votre position"
                : "Activez le suivi pour suivre vos déplacements"}
            </p>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
