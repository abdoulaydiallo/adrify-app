"use client";

import { useState, useRef, useEffect } from "react";
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
  AlertCircle,
  CheckCircle2,
  Compass,
  Satellite,
  Wifi,
  Smartphone,
  ChevronUp,
  ChevronDown,
  BarChart3,
  Crosshair,
  RefreshCw,
} from "lucide-react";
import { Address } from "@/types/address";
import { Coordinates } from "@/services/location.service";
import { cn } from "@/lib/utils";

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
  userLocation?: Coordinates | null;
  locationAccuracy?: number | null;
  onCenterOnUser?: () => void;
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
  userLocation,
  locationAccuracy,
  onCenterOnUser,
}: GuestSidebarProps) {
  const [dragY, setDragY] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-expand sur desktop
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      setIsExpanded(true);
    }
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startYRef.current !== null) {
      const deltaY = e.touches[0].clientY - startYRef.current;
      if (deltaY > 0) {
        const resistance = Math.min(deltaY, 200); // Limiter le drag à 200px
        setDragY(resistance);
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragY > 80) {
      onClose();
    }
    setDragY(0);
    startYRef.current = null;
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const formatCoordinates = (coords: Coordinates) => {
    return `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
  };

  const getAccuracyStatus = (accuracy: number) => {
    if (accuracy <= 15)
      return { color: "text-green-600", icon: Crosshair, label: "Excellente" };
    if (accuracy <= 30)
      return { color: "text-blue-600", icon: Satellite, label: "Très bonne" };
    if (accuracy <= 50)
      return { color: "text-cyan-600", icon: Compass, label: "Bonne" };
    if (accuracy <= 100)
      return { color: "text-yellow-600", icon: Wifi, label: "Moyenne" };
    return { color: "text-orange-600", icon: Smartphone, label: "Faible" };
  };

  const isLocationAccurate = locationAccuracy && locationAccuracy <= 50;

  const AccuracyIcon = locationAccuracy
    ? getAccuracyStatus(locationAccuracy).icon
    : Crosshair;

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed md:relative z-40 w-full md:w-96 bg-white shadow-xl md:shadow-none",
          "flex flex-col transition-all duration-300 ease-out",
          "md:rounded-l-xl md:border-r md:border-gray-200",
          "h-[85vh] max-h-[700px] md:h-full", // Hauteur contrôlée
          isOpen
            ? "bottom-0 md:translate-x-0"
            : "-bottom-full md:translate-x-[-100%]",
          className
        )}
        style={{
          transform: `translateY(${isDragging ? dragY : 0}px)`,
          touchAction: "none",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header avec poignée mobile */}
        <div className="flex items-center justify-between p-4 mb-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3 ">
            <MapIcon className="w-5 h-5 text-gray-700" />
            <h2 className="font-semibold text-gray-900 text-sm md:text-base">
              Itinéraire
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Bouton expand/collapse pour mobile */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleExpand}
              className="p-1 md:hidden"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1 md:hidden"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Poignée de drag mobile */}
        <div className="flex justify-center py-2 md:hidden cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Contenu scrollable */}
        <div
          ref={contentRef}
          className={cn(
            "flex-1 overflow-y-auto px-4 pb-4 transition-all duration-300",
            "md:max-h-none",
            isExpanded ? "max-h-[calc(85vh-120px)]" : "max-h-40" // Contrôle hauteur mobile
          )}
        >
          {/* Section Position utilisateur */}
          {userLocation && (
            <div className="mb-4 p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <LocateFixed className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-medium text-blue-900">
                  Votre position
                </h3>
              </div>

              <div className="text-xs text-blue-700 font-mono mb-2">
                {formatCoordinates(userLocation)}
              </div>

              {locationAccuracy && (
                <div className="flex items-center gap-2 text-xs mb-2">
                  <AccuracyIcon className="w-3 h-3" />
                  <span className={getAccuracyStatus(locationAccuracy).color}>
                    {Math.round(locationAccuracy)}m •{" "}
                    {getAccuracyStatus(locationAccuracy).label}
                  </span>
                </div>
              )}

              {onCenterOnUser && (
                <Button
                  onClick={onCenterOnUser}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-8 border-blue-200 bg-white hover:bg-blue-50"
                >
                  <Crosshair className="w-3 h-3 mr-1" />
                  Centrer la carte
                </Button>
              )}
            </div>
          )}

          

          {route ? (
            <div className="space-y-4">
              {/* Informations itinéraire */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                  <Navigation className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="text-xs text-gray-600">Distance</div>
                    <div className="text-sm font-semibold text-blue-800">
                      {(route.distance / 1000).toFixed(1)} km
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-purple-50/50 border border-purple-100 rounded-lg">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <div>
                    <div className="text-xs text-gray-600">Durée</div>
                    <div className="text-sm font-semibold text-purple-800">
                      {(route.duration / 60).toFixed(0)} min
                    </div>
                  </div>
                </div>
              </div>

              {/* Statut navigation */}
              <div className="p-3 bg-gray-100/50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      isTrackingEnabled
                        ? "bg-green-500 animate-pulse"
                        : "bg-gray-400"
                    )}
                  />
                  <span className="text-xs font-medium">
                    {isTrackingEnabled
                      ? "Navigation active"
                      : "Prêt à naviguer"}
                  </span>
                </div>
              </div>

              {/* Avertissements */}
              {!isLocationAccurate && userLocation && (
                <div className="p-3 bg-orange-50/50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-orange-700">
                      <p className="font-medium">Précision limitée</p>
                      <p>Déplacez-vous pour améliorer la précision GPS.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Étapes détaillées (seulement en expanded) */}
              {isExpanded && route.legs?.[0]?.steps && (
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <ChevronRight className="w-3 h-3" />
                    Instructions de navigation
                  </h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {route.legs[0].steps
                      .slice(0, 8)
                      .map((step: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-2 text-xs text-gray-600 bg-gray-50/50 rounded border border-gray-100"
                        >
                          {step.maneuver.instruction}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Compass className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-2">Aucun itinéraire</p>
              <p className="text-xs text-gray-500">
                Calculez l'itinéraire depuis votre position actuelle
              </p>
            </div>
          )}
        </div>

        {/* Footer avec actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 space-y-3">
          {route && (
            <Button
              onClick={isTrackingEnabled ? onStopTracking : onStartTracking}
              variant={isTrackingEnabled ? "outline" : "default"}
              size="sm"
              className={cn(
                "w-full text-sm font-medium",
                isTrackingEnabled
                  ? "border-red-300 text-red-700 hover:bg-red-50"
                  : "bg-green-600 hover:bg-green-700"
              )}
              disabled={!isLocationAccurate && !isTrackingEnabled}
            >
              {isTrackingEnabled ? (
                <>
                  <LocateOff className="w-4 h-4 mr-2" />
                  Arrêter
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 mr-2" />
                  Démarrer navigation
                </>
              )}
            </Button>
          )}

          <Button
            onClick={onRecalculate}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            disabled={loadingRoute}
            size="lg"
          >
            {loadingRoute ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Calcul...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                {route ? "Recalculer" : "Calculer l'itinéraire"}
              </>
            )}
          </Button>

          {/* Info précision */}
          {!isLocationAccurate && !isTrackingEnabled && (
            <div className="text-xs text-orange-600 text-center flex items-center justify-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Précision GPS insuffisante
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
