"use client";

import { useState, useCallback } from "react";
import { AuthService } from "@/services/auth.service"; // Adjust path
import { z } from "zod";

// Define schemas based on the provided address data structure
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
  is_validated: z.number().transform((val) => Boolean(val)),
  share_link: z.string(),
  qr_code: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

const AddressFilterSchema = z.object({
  search: z.string().optional(), // For searching by street_name, quartier, etc.
  limit: z.number().min(1).default(10), // Pagination limit
  offset: z.number().min(0).default(0), // Pagination offset
  commune: z.string().optional(), // Filter by commune
  prefecture: z.string().optional(), // Filter by prefecture
  address_type: z.string().optional(), // Filter by address_type
});

type AddressInput = z.infer<typeof AddressSchema>;
type AddressFilter = z.infer<typeof AddressFilterSchema>;

export function useAddresses() {
  const [filters, setFilters] = useState<AddressFilter>({ limit: 10, offset: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [addresses, setAddresses] = useState<z.infer<typeof AddressSchema>[]>([]);
  const [favorites, setFavorites] = useState<z.infer<typeof AddressSchema>[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const offset = (pagination.page - 1) * pagination.limit;

  // Queries
  const fetchAddresses = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);
    try {
      const data = await AuthService.fetchWithAuth("/addresses/map", {
        params: { ...filters, limit: pagination.limit, offset },
      });
      const parsedData = AddressSchema.array().parse(data.data || data); // Handle nested data if API returns { data: [...] }
      setAddresses(parsedData);
      setTotal(data.total || data.length || 0); // Update total from API response
      return parsedData;
    } catch (error) {
      console.error("Error fetching addresses", error);
      setIsError(true);
      setError(error instanceof Error ? error : new Error("Failed to fetch addresses"));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination]);

  const fetchSearchAddresses = useCallback(async (searchQuery: string) => {
    setIsLoading(true);
    setIsError(false);
    setError(null);
    try {
      const data = await AuthService.fetchWithAuth("/addresses/search", {
        params: { search: searchQuery, limit: pagination.limit, offset },
      });
      const parsedData = AddressSchema.array().parse(data.data || data);
      setAddresses(parsedData);
      setTotal(data.total || data.length || 0);
      return parsedData;
    } catch (error) {
      console.error("Error searching addresses", error);
      setIsError(true);
      setError(error instanceof Error ? error : new Error("Failed to search addresses"));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [pagination]);

  const fetchTotalAddresses = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);
    try {
      const data = await AuthService.fetchWithAuth("/addresses/map", {
        params: { ...filters, limit: 1, offset: 0 },
      });
      const totalCount = data.total || data.length || 0;
      setTotal(totalCount);
      return totalCount;
    } catch (error) {
      console.error("Error fetching total addresses", error);
      setIsError(true);
      setError(error instanceof Error ? error : new Error("Failed to fetch total addresses"));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const fetchFavorites = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);
    try {
      const data = await AuthService.fetchWithAuth("/favorites");
      const parsedData = AddressSchema.array().parse(data.data || data);
      setFavorites(parsedData);
      return parsedData;
    } catch (error) {
      console.error("Error fetching favorites", error);
      setIsError(true);
      setError(error instanceof Error ? error : new Error("Failed to fetch favorites"));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mutations
  const createAddress = useCallback(
    async (data: Omit<AddressInput, "id" | "share_link" | "qr_code" | "status" | "is_validated">) => {
      setIsLoading(true);
      setIsError(false);
      setError(null);
      try {
        const result = await AuthService.fetchWithAuth("/addresses", {
          method: "POST",
          body: JSON.stringify(data),
        });
        const parsedResult = AddressSchema.parse(result.data || result);
        await fetchAddresses(); // Refresh address list
        return parsedResult;
      } catch (error) {
        console.error("Error creating address", error);
        setIsError(true);
        setError(error instanceof Error ? error : new Error("Failed to create address"));
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchAddresses]
  );

  const updateAddress = useCallback(
    async (id: number, data: Partial<AddressInput>) => {
      setIsLoading(true);
      setIsError(false);
      setError(null);
      try {
        const result = await AuthService.fetchWithAuth(`/addresses/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
        const parsedResult = AddressSchema.parse(result.data || result);
        await fetchAddresses(); // Refresh
        return parsedResult;
      } catch (error) {
        console.error("Error updating address", error);
        setIsError(true);
        setError(error instanceof Error ? error : new Error("Failed to update address"));
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchAddresses]
  );

  const deleteAddress = useCallback(
    async (id: number) => {
      setIsLoading(true);
      setIsError(false);
      setError(null);
      try {
        await AuthService.fetchWithAuth(`/addresses/${id}`, {
          method: "DELETE",
        });
        await fetchAddresses(); // Refresh
      } catch (error) {
        console.error("Error deleting address", error);
        setIsError(true);
        setError(error instanceof Error ? error : new Error("Failed to delete address"));
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchAddresses]
  );

  const validateAddress = useCallback(
    async (id: number) => {
      setIsLoading(true);
      setIsError(false);
      setError(null);
      try {
        const result = await AuthService.fetchWithAuth(`/addresses/${id}/validate`, {
          method: "POST",
        });
        const parsedResult = AddressSchema.parse(result.data || result);
        await fetchAddresses(); // Refresh
        return parsedResult;
      } catch (error) {
        console.error("Error validating address", error);
        setIsError(true);
        setError(error instanceof Error ? error : new Error("Failed to validate address"));
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchAddresses]
  );

  const shareAddress = useCallback(
    async (id: number) => {
      setIsLoading(true);
      setIsError(false);
      setError(null);
      try {
        const result = await AuthService.fetchWithAuth(`/addresses/${id}/share`);
        return { share_link: result.share_link, qr_code: result.qr_code };
      } catch (error) {
        console.error("Error sharing address", error);
        setIsError(true);
        setError(error instanceof Error ? error : new Error("Failed to share address"));
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const addToFavorites = useCallback(
    async (id: number) => {
      setIsLoading(true);
      setIsError(false);
      setError(null);
      try {
        const result = await AuthService.fetchWithAuth(`/favorites/${id}`, {
          method: "POST",
        });
        await fetchFavorites(); // Refresh favorites
        return result;
      } catch (error) {
        console.error("Error adding to favorites", error);
        setIsError(true);
        setError(error instanceof Error ? error : new Error("Failed to add to favorites"));
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchFavorites]
  );

  const removeFromFavorites = useCallback(
    async (id: number) => {
      setIsLoading(true);
      setIsError(false);
      setError(null);
      try {
        await AuthService.fetchWithAuth(`/favorites/${id}`, {
          method: "DELETE",
        });
        await fetchFavorites(); // Refresh favorites
      } catch (error) {
        console.error("Error removing from favorites", error);
        setIsError(true);
        setError(error instanceof Error ? error : new Error("Failed to remove from favorites"));
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchFavorites]
  );

  const getGuestAddress = useCallback(
    async (shareCode: string) => {
      setIsLoading(true);
      setIsError(false);
      setError(null);
      try {
        const result = await AuthService.fetchWithAuth(`/guest/addresses/${shareCode}`);
        return AddressSchema.parse(result.data || result);
      } catch (error) {
        console.error("Error fetching guest address", error);
        setIsError(true);
        setError(error instanceof Error ? error : new Error("Failed to fetch guest address"));
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getGuestRoute = useCallback(
    async (shareCode: string) => {
      setIsLoading(true);
      setIsError(false);
      setError(null);
      try {
        const result = await AuthService.fetchWithAuth(`/guest/addresses/${shareCode}/route`);
        return result; // Adjust schema based on route response
      } catch (error) {
        console.error("Error fetching guest route", error);
        setIsError(true);
        setError(error instanceof Error ? error : new Error("Failed to fetch guest route"));
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateFilters = useCallback((newFilters: Partial<AddressFilter>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  return {
    // Data
    addresses,
    favorites,
    fetchAddresses,
    fetchSearchAddresses,
    fetchFavorites,
    fetchTotalAddresses,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
    setPagination,

    // States
    isLoading,
    isError,
    error,

    // Filters
    filters,
    updateFilters,

    // Actions
    createAddress,
    updateAddress,
    deleteAddress,
    validateAddress,
    shareAddress,
    addToFavorites,
    removeFromFavorites,
    getGuestAddress,
    getGuestRoute,
  };
}