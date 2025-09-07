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
  const router = useRouter(); // <-- initialisation du router

  const fullAddress = [
    address.house_number,
    address.street_name,
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
    e.stopPropagation(); // Empêche le déclenchement de onSelect
    if (onShare) {
      onShare(address);
    } else {
      if (!address.share_link) return;
      // Fallback si onShare n'est pas fourni
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
    e.stopPropagation(); // Empêche le déclenchement de onSelect
    if (!address.share_link) return;

    // Extraire le code après le dernier slash
    const code = address.share_link.split("/").pop();
    if (!code) return;

    // Redirection vers la page détails en utilisant ce code
    router.push(`/dashboard/${code}`);
  };

  const handleNavigate = (e: React.MouseEvent) => {
    e.stopPropagation(); // Empêche le déclenchement de onSelect
    onNavigate?.(address);
  };

  // --- Variant compact ---
  if (variant === "compact") {
    return (
      <Card
        ref={cardRef}
        onClick={() => onSelect?.(address)}
        className="group cursor-pointer overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-sm hover:scale-[1.01]"
      >
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
            <TypeIcon className="h-6 w-6 text-gray-700" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="truncate font-semibold text-gray-900">
              {address.building_type || "Adresse"}
            </h3>
            <p className="truncate text-sm text-gray-600">{fullAddress}</p>
          </div>

          <div className="flex flex-col items-end gap-1">
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
            <span className="text-xs text-gray-400">
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
        className="relative cursor-pointer overflow-hidden pt-0 rounded-3xl border bg-white shadow-xl transition hover:shadow-2xl hover:scale-[1.01]"
      >
        {address.photo && (
          <div className="relative h-48 w-full overflow-hidden">
            <img
              src={`${address.photo}`}
              alt="Photo adresse"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
          </div>
        )}

        <CardContent className="relative z-10 -mt-16 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TypeIcon className="h-6 w-6" />
              <StatusIcon
                className={cn(
                  "h-5 w-5",
                  validationStatus === "validated"
                    ? "text-emerald-400"
                    : validationStatus === "pending"
                    ? "text-amber-400"
                    : "text-red-400"
                )}
              />
            </div>
            <Badge className="bg-white/20 backdrop-blur-sm text-xs">
              {new Date(address.created_at).toLocaleDateString("fr-FR")}
            </Badge>
          </div>

          <h2 className="mt-4 text-xl font-bold">
            {address.building_type || "Adresse"}
          </h2>
          <p className="text-sm">{fullAddress}</p>

          {address.landmark && (
            <div className="mt-2 flex items-center gap-1 text-sm">
              <FiMapPin className="h-4 w-4" /> {address.landmark}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // --- Variant detailed ---
  return (
    <Card
      ref={cardRef}
      onClick={() => onSelect?.(address)}
      className="group relative cursor-pointer overflow-hidden rounded-3xl pt-0 border bg-white shadow-md transition hover:shadow-xl hover:scale-[1.01]"
    >
      {address.photo && (
        <div className="relative h-40 w-full overflow-hidden">
          <img
            src={`${address.photo}`}
            alt="Photo adresse"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        </div>
      )}

      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {address.building_type || "Adresse"}
            </h3>
            <p className="text-sm text-gray-600">{fullAddress}</p>
          </div>
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

        {address.landmark && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <FiMapPin className="h-4 w-4 text-gray-500" />
            {address.landmark}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
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

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="flex items-center gap-1"
            onClick={handleView}
          >
            <FiEye className="h-4 w-4" /> Voir
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="flex items-center gap-1"
            onClick={handleShare}
          >
            <FiShare2 className="h-4 w-4" /> Partager
          </Button>

          {address.latitude && address.longitude && (
            <Button
              size="sm"
              variant="secondary"
              className="flex items-center gap-1"
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
