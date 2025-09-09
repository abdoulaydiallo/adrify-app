"use client";

import { useState, useRef } from "react";
import { AddressCard } from "../address/address-card";
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
  Target,
  RotateCcw,
  Move,
} from "lucide-react";
import { Address } from "@/types/address";
import { Coordinates } from "@/services/location.service";

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
  // Nouvelles props
  customStartLocation?: Coordinates | null;
  onRecalculateFromCurrentLocation?: () => void;
  onResetStartPoint?: () => void;
  userLocation?: Coordinates | null;
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
  customStartLocation,
  onRecalculateFromCurrentLocation,
  onResetStartPoint,
  userLocation,
}: GuestSidebarProps) {
  const [dragY, setDragY] = useState(0);
  const startYRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startYRef.current !== null) {
      let deltaY = e.touches[0].clientY - startYRef.current;
      if (deltaY > 0) {
        // Effet de résistance : plus on tire, plus le déplacement diminue
        const resistance = Math.sqrt(deltaY) * 10;
        setDragY(resistance);
      }
    }
  };

  const handleTouchEnd = () => {
    if (dragY > 120) {
      onClose();
    }
    setDragY(0);
    startYRef.current = null;
  };

  // Fonction pour formater les coordonnées
  const formatCoordinates = (coords: Coordinates) => {
    return `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
  };

  return (
    <aside
      className={`
        fixed md:block top-[52%] md:top-0 left-0 z-40 w-full h-full md:pt-20 md:w-[30%]
        bg-white rounded-t-2xl md:rounded-none shadow-lg md:shadow-none
        transform transition-transform duration-300 ease-out 
        flex flex-col justify-between
        ${isOpen ? "translate-y-0" : "translate-y-full md:translate-y-0"}
        ${className}
      `}
      style={{ transform: `translateY(${dragY}px)` }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Poignée mobile */}
      <div className="flex justify-center p-2 md:hidden cursor-grab">
        <div className="w-16 h-1 bg-gray-300 rounded-full transition-transform duration-200 hover:scale-105"></div>
      </div>

      {/* Header sticky */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 p-3 sm:p-4 border-b border-gray-200 bg-white">
        <div className="flex gap-4 items-center">
          <MapIcon className="w-5 h-5 text-gray-600" />
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

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 pb-28">
        {/* Section Point de départ personnalisé */}
        {customStartLocation && (
          <div className="space-y-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-600" />
              <h4 className="text-sm font-medium text-amber-800">
                Point de départ personnalisé
              </h4>
            </div>
            <div className="text-xs text-amber-700 font-mono">
              📍 {formatCoordinates(customStartLocation)}
            </div>
            <div className="flex gap-2">
              {onRecalculateFromCurrentLocation && (
                <Button
                  onClick={onRecalculateFromCurrentLocation}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 bg-white hover:bg-amber-100 border-amber-300"
                  disabled={loadingRoute}
                >
                  <LocateFixed className="w-3 h-3 mr-1" />
                  Ma position
                </Button>
              )}
              {onResetStartPoint && (
                <Button
                  onClick={onResetStartPoint}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 bg-white hover:bg-amber-100 border-amber-300"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Réinitialiser
                </Button>
              )}
            </div>
          </div>
        )}

        {route ? (
          <div className="space-y-4 mt-4">
            {/* Header itinéraire */}
            <div className="flex items-center gap-2 mb-2">
              <RouteIcon className="w-5 h-5 text-blue-500" />
              <h3 className="font-roboto text-base font-semibold text-gray-900">
                Itinéraire
              </h3>
            </div>

            {/* Distance & durée */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 text-blue-700 font-medium">
                <Navigation className="w-4 h-4" />
                {(route.distance / 1000).toFixed(2)} km
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-50 text-purple-700 font-medium">
                <Clock className="w-4 h-4" />
                {(route.duration / 60).toFixed(0)} min
              </div>
            </div>

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

            {/* Info interactive */}
            {!isTrackingEnabled && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Move className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-700">
                    <p className="font-medium mb-1">💡 Astuce interactive :</p>
                    <p>
                      Glissez le point rouge sur la carte pour changer votre
                      point de départ. L'itinéraire se recalculera
                      automatiquement !
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Étapes */}
            {route.legs?.[0]?.steps && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 flex items-center gap-1 mb-1">
                  <MapPin className="w-4 h-4 text-gray-600" /> Étapes du trajet
                </h4>
                <ul className="max-h-64 overflow-y-auto divide-y divide-gray-200 rounded-lg border border-gray-100">
                  {route.legs[0].steps.map((step: any, idx: number) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between gap-2 p-2 hover:bg-gray-50"
                    >
                      <span className="text-xs text-gray-700">
                        {step.maneuver.instruction}
                      </span>
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Informations de position */}
            {(userLocation || customStartLocation) && (
              <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900">Positions</h4>
                {userLocation && (
                  <div className="text-xs text-gray-600">
                     Position actuelle: {formatCoordinates(userLocation)}
                  </div>
                )}
                {customStartLocation &&
                  customStartLocation !== userLocation && (
                    <div className="text-xs text-gray-600">
                       Point de départ:{" "}
                      {formatCoordinates(customStartLocation)}
                    </div>
                  )}
                <div className="text-xs text-gray-600">
                   Destination:{" "}
                  {address.latitude && address.longitude
                    ? `${parseFloat(address.latitude as any).toFixed(
                        4
                      )}, ${parseFloat(address.longitude as any).toFixed(4)}`
                    : "Coordonnées non disponibles"}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center mt-8 px-4 py-6 bg-blue-50 border border-blue-100 rounded-xl">
            <MapIcon className="w-8 h-8 text-blue-400 mb-2 animate-bounce" />
            <p className="text-sm sm:text-base text-blue-700 font-medium text-center">
              Aucun itinéraire généré
            </p>
            <p className="text-xs text-blue-500 text-center mt-1">
              Cliquez sur "Calculer l'itinéraire" pour afficher le trajet depuis
              votre position.
            </p>
          </div>
        )}
      </div>

      {/* Footer fixe sur mobile */}
      <div className="sticky bottom-0 z-20 p-3 sm:p-4 bg-white border-t border-gray-200 md:static md:bg-transparent md:border-none space-y-3">
        {route && (
          <>
            {/* Boutons de contrôle du point de départ */}
            {customStartLocation && !isTrackingEnabled && (
              <div className="flex gap-2">
                {onRecalculateFromCurrentLocation && (
                  <Button
                    onClick={onRecalculateFromCurrentLocation}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-9"
                    disabled={loadingRoute}
                  >
                    <LocateFixed className="w-3 h-3 mr-1" />
                    Ma position
                  </Button>
                )}
                {onResetStartPoint && (
                  <Button
                    onClick={onResetStartPoint}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-9"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Réinitialiser
                  </Button>
                )}
              </div>
            )}

            {/* Bouton de suivi */}
            {isTrackingEnabled ? (
              <Button
                onClick={onStopTracking}
                variant="outline"
                size="sm"
                className="flex w-full items-center justify-center gap-2 text-xs sm:text-sm text-gray-900 hover:bg-gray-100"
              >
                <LocateOff className="w-4 h-4 text-gray-600" /> Arrêter suivi
              </Button>
            ) : (
              <Button
                onClick={onStartTracking}
                variant="outline"
                size="sm"
                className="flex w-full items-center justify-center gap-2 text-xs sm:text-sm text-gray-900 hover:bg-gray-100"
              >
                <LocateFixed className="w-4 h-4 text-gray-600" /> Suivre
                position
              </Button>
            )}
          </>
        )}

        {/* Bouton principal */}
        <Button
          onClick={onRecalculate}
          className="w-full rounded-xl font-semibold text-white flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg"
          disabled={loadingRoute}
          size="lg"
        >
          {loadingRoute ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Calcul en cours...
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4" />{" "}
              {route ? "Recalculer" : "Calculer l'itinéraire"}
            </>
          )}
        </Button>

        {/* Messages d'aide */}
        {route && (
          <div className="text-xs text-gray-600 text-center mt-2 space-y-1">
            {isTrackingEnabled ? (
              <p>La carte suit automatiquement votre position</p>
            ) : customStartLocation ? (
              <p>🎯 Glissez le point rouge pour changer le départ</p>
            ) : (
              <p>Activez le suivi pour suivre vos déplacements</p>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
