"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Navigation,
  Clock,
  Route as RouteIcon,
  ChevronRight,
  LocateFixed,
  LocateOff,
  Loader2,
} from "lucide-react";
import { Address } from "@/types/address";
import { AddressCard } from "../address/address-card";

type GuestSidebarProps = {
  address: Address;
  route: any | null;
  onRecalculate: () => void;
  isTrackingEnabled: boolean;
  onStopTracking: () => void;
  onStartTracking: () => void;
  loadingRoute: boolean;
};

export function GuestSidebar({
    address,
    route,
    onRecalculate,
    isTrackingEnabled,
    onStopTracking,
    onStartTracking,
    loadingRoute,
}: GuestSidebarProps) {
    return (
        <aside className="min-w-[360px] border-r bg-background flex flex-col">
            <ScrollArea className="flex-1 p-4 space-y-4">
                {/* Adresse */}
                <AddressCard address={address} variant="compact" />

                <Separator className="my-4" />

                {/* Itinéraire */}
                {route ? (
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <RouteIcon className="w-5 h-5 text-primary" />
                                Itinéraire
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                            {route.distance && (
                                <p className="flex items-center gap-2">
                                    <Navigation className="w-4 h-4" />
                                    Distance :{" "}
                                    <span className="text-foreground font-medium">
                                        {(route.distance / 1000).toFixed(2)} km
                                    </span>
                                </p>
                            )}
                            {route.duration && (
                                <p className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Durée estimée :{" "}
                                    <span className="text-foreground font-medium">
                                        {(route.duration / 60).toFixed(0)} min
                                    </span>
                                </p>
                            )}

                            {/* Statut du suivi */}
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
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

                            {/* Étapes détaillées */}
                            {route.legs?.[0]?.steps && (
                                <div className="space-y-2 mt-2">
                                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-1">
                                        <MapPin className="w-4 h-4" /> Étapes du trajet
                                    </h4>
                                    <ul className="text-xs text-muted-foreground space-y-1">
                                        {route.legs[0].steps.map((step: any, idx: number) => (
                                            <li
                                                key={idx}
                                                className="flex items-center justify-between gap-2 p-2 hover:bg-gray-50 rounded"
                                            >
                                                <span>{step.maneuver.instruction}</span>
                                                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <p className="text-sm text-muted-foreground italic px-2 mt-4">
                        Aucun itinéraire généré
                    </p>
                )}
            </ScrollArea>

            {/* Boutons en bas */}
            <div className="p-4 border-t space-y-3">
                {route && (
                    <div className="grid grid-cols-2 gap-2">
                        {isTrackingEnabled ? (
                            <Button
                                onClick={onStopTracking}
                                variant="outline"
                                className="flex items-center justify-center gap-2"
                                size="sm"
                            >
                                <LocateOff className="w-4 h-4" />
                                Arrêter suivi
                            </Button>
                        ) : (
                            <Button
                                onClick={onStartTracking}
                                variant="outline"
                                className="flex items-center justify-center gap-2"
                                size="sm"
                            >
                                <LocateFixed className="w-4 h-4" />
                                Suivre position
                            </Button>
                        )}
                    </div>
                )}

                <Button
                    onClick={onRecalculate}
                    className="w-full flex items-center justify-center gap-2"
                    disabled={loadingRoute}
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
                    )
                    }
                </Button>
        

                {route && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                        {isTrackingEnabled
                            ? "La carte suit automatiquement votre position"
                            : "Activez le suivi pour suivre vos déplacements"}
                    </p>
                )}
            </div>
        </aside>
    );
}