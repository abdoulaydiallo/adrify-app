"use client";

import { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  FiHome,
  FiBriefcase,
  FiMapPin,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiEye,
  FiShare2,
  FiNavigation,
  FiMoreHorizontal,
} from "react-icons/fi";
import { cn } from "@/lib/utils";
import { Address } from "@/types/address";

type AddressCardProps = {
  address: Address;
  onSelect?: (a: Address) => void;
  onView?: (a: Address) => void;
  onShare?: (a: Address) => void;
  onNavigate?: (a: Address) => void;
  variant?: "compact" | "detailed" | "hero";
};

export function AddressCard({
  address,
  onSelect,
  onView,
  onShare,
  onNavigate,
  variant = "detailed",
}: AddressCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fullAddress = [
    address.house_number,
    address.quartier,
    address.commune,
  ]
    .filter(Boolean)
    .join(", ");

  const TypeIcon =
    address.address_type === "résidentielle"
      ? FiHome
      : address.address_type === "commerciale"
      ? FiBriefcase
      : FiMapPin;

  // Validation calculée uniquement avec is_validated
  const validationStatus =
    address.is_validated === 1
      ? "validated"
      : address.is_validated === 0
      ? "rejected"
      : "pending";

  const StatusIcon =
    validationStatus === "validated"
      ? FiCheckCircle
      : validationStatus === "pending"
      ? FiClock
      : FiXCircle;

  const statusColor =
    validationStatus === "validated"
      ? "bg-emerald-100 text-emerald-700"
      : validationStatus === "pending"
      ? "bg-amber-100 text-amber-700"
      : "bg-red-100 text-red-700";

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) {
      onShare(address);
    } else {
      if (!address.share_link) return;
      const code = address?.share_link.split("/").pop();
      if (!code) return;

      const url = window.location.origin + "/dashboard/" + code;

      if (navigator.share) {
        try {
          await navigator.share({
            title: "Adrify Address",
            text: "Voici mon adresse numérique",
            url,
          });
        } catch (err) {
          console.error("Partage annulé:", err);
        }
      } else {
        try {
          await navigator.clipboard.writeText(url);
          alert("Lien copié dans le presse-papier");
        } catch (err) {
          console.error("Impossible de copier le lien:", err);
        }
      }
    }
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!address.share_link) return;

    const code = address.share_link.split("/").pop();
    if (!code) return;

    router.push(`/dashboard/${code}`);
  };

  const handleNavigate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigate?.(address);
  };

  // --- Variant compact ---
  if (variant === "compact") {
    return (
      <Card
        ref={cardRef}
        onClick={() => onSelect?.(address)}
        className="group cursor-pointer overflow-hidden rounded-xl sm:rounded-2xl border bg-white/90 backdrop-blur-sm shadow-sm transition-all duration-100 hover:shadow-sm "
      >
        <CardContent className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 group-hover:from-blue-50 group-hover:to-purple-50 transition-all duration-300">
            <TypeIcon className="h-4 w-4 sm:h-6 sm:w-6 text-white  transition-colors duration-300" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="truncate font-semibold text-sm sm:text-base text-slate-900">
              {address.building_type || "Adresse"}
            </h3>
            <p className="truncate text-xs sm:text-sm text-slate-600">
              {fullAddress}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1">
            <StatusIcon
              className={cn(
                "h-3 w-3 sm:h-4 sm:w-4",
                validationStatus === "validated"
                  ? "text-emerald-500"
                  : validationStatus === "pending"
                  ? "text-amber-500"
                  : "text-red-500"
              )}
            />
            <span className="text-xs text-slate-400 hidden sm:block">
              {new Date(address.created_at).toLocaleDateString("fr-FR")}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- Variant hero ---
  if (variant === "hero") {
    return (
      <Card
        ref={cardRef}
        onClick={() => onSelect?.(address)}
        className="relative cursor-pointer overflow-hidden pt-0 rounded-2xl sm:rounded-3xl border bg-white/95 backdrop-blur-sm shadow-xl transition-all duration-500 hover:shadow-2xl hover:scale-[1.02]"
      >
        {address.photo && (
          <div className="relative h-32 sm:h-48 md:h-56 w-full overflow-hidden">
            <img
              src={`${address.photo}`}
              alt="Photo adresse"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
        )}

        <CardContent className="relative z-10 -mt-8 sm:-mt-16 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 sm:p-3 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg">
                <TypeIcon className="h-4 w-4 sm:h-6 sm:w-6 text-slate-700" />
              </div>
              <StatusIcon
                className={cn(
                  "h-4 w-4 sm:h-5 sm:w-5",
                  validationStatus === "validated"
                    ? "text-emerald-400"
                    : validationStatus === "pending"
                    ? "text-amber-400"
                    : "text-red-400"
                )}
              />
            </div>
            <Badge className="bg-white/20 backdrop-blur-sm text-xs sm:text-sm text-white border-white/20">
              {new Date(address.created_at).toLocaleDateString("fr-FR")}
            </Badge>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 sm:p-4 shadow-lg">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {address.building_type || "Adresse"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              {fullAddress}
            </p>

            {address.landmark && (
              <div className="mt-2 flex items-center gap-1 text-xs sm:text-sm text-slate-700">
                <FiMapPin className="h-3 w-3 sm:h-4 sm:w-4 text-slate-500" />
                <span className="truncate">{address.landmark}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- Variant detailed ---
  return (
    <Card
      ref={cardRef}
      onClick={() => onSelect?.(address)}
      className="group relative p-0 cursor-pointer overflow-hidden rounded-2xl sm:rounded-3xl border bg-white/95 backdrop-blur-sm shadow-md transition-all duration-500 hover:shadow-xl hover:scale-[1.02] hover:bg-white"
    >
      {address.photo && (
        <div className="relative h-32 sm:h-40 md:h-48 w-full overflow-hidden">
          <img
            src={`${address.photo}`}
            alt="Photo adresse"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Mobile floating status */}
          <div className="absolute top-3 right-3 sm:hidden">
            <div className="p-2 rounded-lg bg-white/90 backdrop-blur-sm shadow-lg">
              <StatusIcon
                className={cn(
                  "h-4 w-4",
                  validationStatus === "validated"
                    ? "text-emerald-500"
                    : validationStatus === "pending"
                    ? "text-amber-500"
                    : "text-red-500"
                )}
              />
            </div>
          </div>
        </div>
      )}

      <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
              {address.building_type || "Adresse"}
            </h3>
            <p className="text-sm text-slate-600 mt-1 line-clamp-2 sm:line-clamp-none">
              {fullAddress}
            </p>
          </div>

          {/* Desktop status icon */}
          <div className="hidden sm:block ml-3">
            <StatusIcon
              className={cn(
                "h-5 w-5",
                validationStatus === "validated"
                  ? "text-emerald-500"
                  : validationStatus === "pending"
                  ? "text-amber-500"
                  : "text-red-500"
              )}
            />
          </div>
        </div>

        {address.landmark && (
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <FiMapPin className="h-4 w-4 text-slate-500 flex-shrink-0" />
            <span className="truncate">{address.landmark}</span>
          </div>
        )}

        {/* Mobile badges - simplified */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 sm:hidden">
          <Badge variant="secondary" className="text-xs">
            {address.address_type}
          </Badge>
          <Badge className={cn("text-xs", statusColor)}>
            {validationStatus === "validated"
              ? "✓"
              : validationStatus === "pending"
              ? "⏳"
              : "✗"}
          </Badge>
        </div>

        {/* Desktop badges - full */}
        <div className="hidden sm:flex flex-wrap gap-2">
          <Badge variant="secondary">{address.address_type}</Badge>
          <Badge className={statusColor}>
            {validationStatus === "validated"
              ? "Validée"
              : validationStatus === "pending"
              ? "En attente"
              : "Rejetée"}
          </Badge>
          {address.status && <Badge variant="outline">{address.status}</Badge>}
          <Badge variant="outline">
            {new Date(address.created_at).toLocaleDateString("fr-FR")}
          </Badge>
        </div>

        {/* Mobile actions - single row with more button */}
        <div className="flex gap-2 sm:hidden">
          <Button
            size="sm"
            variant="secondary"
            className="flex-1 flex items-center justify-center gap-1.5 text-xs"
            onClick={handleView}
          >
            <FiEye className="h-3 w-3" />
            <span className="hidden xs:inline">Voir</span>
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="flex-1 flex items-center justify-center gap-1.5 text-xs"
            onClick={handleShare}
          >
            <FiShare2 className="h-3 w-3" />
            <span className="hidden xs:inline">Partager</span>
          </Button>

          {address.latitude && address.longitude && (
            <Button
              size="sm"
              variant="secondary"
              className="flex-1 flex items-center justify-center gap-1.5 text-xs"
              onClick={handleNavigate}
            >
              <FiNavigation className="h-3 w-3" />
              <span className="hidden xs:inline">Maps</span>
            </Button>
          )}
        </div>

        {/* Desktop actions - full */}
        <div className="hidden sm:flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors duration-300"
            onClick={handleView}
          >
            <FiEye className="h-4 w-4" /> Voir
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="flex items-center gap-2 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-colors duration-300"
            onClick={handleShare}
          >
            <FiShare2 className="h-4 w-4" /> Partager
          </Button>

          {address.latitude && address.longitude && (
            <Button
              size="sm"
              variant="secondary"
              className="flex items-center gap-2 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-colors duration-300"
              onClick={handleNavigate}
            >
              <FiNavigation className="h-4 w-4" /> Maps
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
