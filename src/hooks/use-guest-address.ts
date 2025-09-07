"use client";

import { useState, useCallback } from "react";
import { AuthService } from "@/services/auth.service"; // Ajuste le chemin si nécessaire
import { z } from "zod";

// Schéma pour valider une adresse
const AddressSchema = z.object({
  id: z.number(),
  house_number: z.string(),
  street_name: z.string(),
  quartier: z.string(),
  landmark: z.string(),
  commune: z.string(),
  prefecture: z.string(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  photo: z.string().nullable(),
  address_type: z.string().nullable(),
  building_type: z.string(),
  status: z.enum(["draft", "shared"]),
  is_validated: z.number().transform(Boolean),
  share_link: z.string(),
  qr_code: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

type GuestAddress = z.infer<typeof AddressSchema>;

export function useGuestAddresses() {
  const [address, setAddress] = useState<GuestAddress | null>(null);
  const [route, setRoute] = useState<any>(null); // Ajuste le type selon la réponse de l'API
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // --- Récupérer une adresse via share_code ---
  const getAddress = useCallback(async (shareCode: string) => {
    setIsLoading(true);
    setIsError(false);
    setError(null);
    try {
      const res = await AuthService.fetchWithoutAuth(`/guest/addresses/${shareCode}`);
      const parsed = AddressSchema.parse(res.data || res);
      setAddress(parsed);
      return parsed;
    } catch (err) {
      console.error("Error fetching guest address", err);
      setIsError(true);
      setError(err instanceof Error ? err : new Error("Failed to fetch guest address"));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- Récupérer l'itinéraire d'une adresse via share_code ---
  const getRoute = useCallback(async (shareCode: string) => {
    setIsLoading(true);
    setIsError(false);
    setError(null);
    try {
      const res = await AuthService.fetchWithoutAuth(`/guest/addresses/${shareCode}/route`);
      setRoute(res.data || res);
      return res.data || res;
    } catch (err) {
      console.error("Error fetching guest route", err);
      setIsError(true);
      setError(err instanceof Error ? err : new Error("Failed to fetch guest route"));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    address,
    route,
    isLoading,
    isError,
    error,
    getAddress,
    getRoute,
  };
}
