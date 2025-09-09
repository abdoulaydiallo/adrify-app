"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";
import { ModernInput } from "@/components/modern-input";
import { Controller } from "react-hook-form";
import { AuthService } from "@/services/auth.service";
import { useRouter } from "next/navigation";
import { Upload } from "@/components/Upload";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

export type Region =
  | "CONAKRY"
  | "BOKE"
  | "KINDIA"
  | "LABE"
  | "MAMOU"
  | "NZEREKORE"
  | "FARANAH"
  | "KANKAN";

const CommunesByRegion: Record<Region, string[]> = {
  CONAKRY: [
    "Kaloum",
    "Dixinn",
    "Ratoma",
    "Matam",
    "Matoto",
    "Lambanyi",
    "Sonfonia",
    "Gbessia",
    "Tombolia",
    "Kagbelen",
    "Sanoyah",
    "Manéah",
    "Kassa",
  ],
  BOKE: ["Boke-ville", "Boffa", "Fria", "Koundara"],
  KINDIA: ["Kindia", "Coyah", "Dubréka"],
  LABE: ["Labe", "Labé-ville", "Tougué"],
  MAMOU: ["Mamou", "Dalaba", "Pita"],
  NZEREKORE: ["Nzérékoré", "Macenta", "Guéckédou"],
  FARANAH: ["Faranah", "Dabola", "Dinguiraye"],
  KANKAN: ["Kankan", "Kouroussa", "Siguiri"],
};

const addressTypeOptions = [
  { value: "", label: "Sélectionner un type d'adresse (optionnel)" },
  { value: "RESIDENTIEL", label: "Résidentiel" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "INDUSTRIEL", label: "Industriel" },
  { value: "PUBLIC", label: "Public" },
  { value: "GOUVERNEMENTAL", label: "Gouvernemental" },
  { value: "EDUCATION", label: "Éducation" },
  { value: "SANTE", label: "Santé" },
  { value: "RELIGIEUX", label: "Religieux" },
  { value: "AUTRE", label: "Autre" },
];

const buildingTypeOptions = [
  { value: "", label: "Sélectionner un type de bâtiment (optionnel)" },
  { value: "MAISON", label: "Maison" },
  { value: "APPARTEMENT", label: "Appartement" },
  { value: "VILLA", label: "Villa" },
  { value: "BUREAU", label: "Bureau" },
  { value: "ENTREPOT", label: "Entrepôt" },
  { value: "USINE", label: "Usine" },
  { value: "BATIMENT_COMMERCIAL", label: "Bâtiment commercial" },
  { value: "BATIMENT_PUBLIC", label: "Bâtiment public" },
  { value: "IMMEUBLE", label: "Immeuble" },
  { value: "AUTRE", label: "Autre" },
];

const AddressSchema = z.object({
  house_number: z.string().max(50).optional().or(z.literal("")),
  street_name: z.string().max(255).optional().or(z.literal("")),
  quartier: z.string().max(255).min(1, "Le quartier est requis"),
  commune: z.string().max(255).min(1, "La commune est requise"),
  prefecture: z.string().max(255).optional().or(z.literal("")),
  landmark: z.string().max(255).optional().or(z.literal("")),
  address_type: z.string().max(100).optional().or(z.literal("")),
  building_type: z.string().max(100).optional().or(z.literal("")),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  photo: z.string().optional(),
});

type FormValues = z.infer<typeof AddressSchema>;

const formVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
};

const useFormProgress = (form: any) => {
  return useMemo(() => {
    const values = form.getValues();
    const requiredFields: (keyof FormValues)[] = [
      "quartier",
      "commune",
      "latitude",
      "longitude",
    ];
    const filledRequired = requiredFields.reduce(
      (acc, field) => (values[field] && values[field] !== "" ? acc + 1 : acc),
      0
    );
    return {
      progress: Math.round((filledRequired / requiredFields.length) * 100),
      requiredComplete: filledRequired === requiredFields.length,
      completedFields: filledRequired,
      totalFields: requiredFields.length,
    };
  }, [form.watch()]);
};

export function AddressForm({
  isUpdate = false,
  addressId,
}: {
  isUpdate?: boolean;
  addressId?: string;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const defaultCoordinates = {
    latitude: 9.6412,
    longitude: -13.5784,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(AddressSchema),
    mode: "onChange",
    defaultValues: {
      house_number: "",
      street_name: "",
      quartier: "",
      commune: "",
      prefecture: "",
      landmark: "",
      address_type: "",
      building_type: "",
      latitude: defaultCoordinates.latitude,
      longitude: defaultCoordinates.longitude,
      photo: "",
    },
  });

  const formProgress = useFormProgress(form);

  const selectedRegion = form.watch("prefecture") as Region | undefined;
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (mapContainer.current && !mapRef.current) {
      const center: [number, number] = [
        defaultCoordinates.longitude,
        defaultCoordinates.latitude,
      ];

      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: center,
        zoom: 6.5,
      });

      mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

      markerRef.current = new mapboxgl.Marker({
        color: "red",
        draggable: true,
      })
        .setLngLat(center)
        .addTo(mapRef.current);

      markerRef.current.on("dragend", () => {
        const lngLat = markerRef.current!.getLngLat();
        form.setValue("latitude", lngLat.lat);
        form.setValue("longitude", lngLat.lng);
      });

      mapRef.current.on("click", (e) => {
        const { lng, lat } = e.lngLat;
        markerRef.current!.setLngLat([lng, lat]);
        form.setValue("latitude", lat);
        form.setValue("longitude", lng);
      });
    }
  }, [form, defaultCoordinates.latitude, defaultCoordinates.longitude]);

  useEffect(() => {
    if (isUpdate && addressId) {
      loadAddressData(addressId);
    }
  }, [isUpdate, addressId]);

  const loadAddressData = async (id: string) => {
    try {
      const addressData = await AuthService.fetchWithAuth(`/addresses/${id}`);
      form.reset({
        house_number: addressData.house_number || "",
        street_name: addressData.street_name || "",
        quartier: addressData.quartier || "",
        commune: addressData.commune || "",
        prefecture: addressData.prefecture || "",
        landmark: addressData.landmark || "",
        address_type: addressData.address_type || "",
        building_type: addressData.building_type || "",
        latitude: addressData.latitude || defaultCoordinates.latitude,
        longitude: addressData.longitude || defaultCoordinates.longitude,
        photo: addressData.photo || "",
      });

      if (addressData.photo) {
        setPhotoUrls([addressData.photo]);
      }

      if (mapRef.current && markerRef.current) {
        const center: [number, number] = [
          addressData.longitude || defaultCoordinates.longitude,
          addressData.latitude || defaultCoordinates.latitude,
        ];
        markerRef.current.setLngLat(center);
        mapRef.current.setCenter(center);
      }
    } catch (error) {
      console.error("Erreur lors du chargement de l'adresse:", error);
      toast.error("Erreur lors du chargement de l'adresse");
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsPending(true);
    try {
      // Prepare JSON data
      const jsonData = {
        ...data,
        photo: photoUrls[0] || "",
      };

      

      console.log("JSON data:", jsonData);

    const response =
      isUpdate && addressId
        ? await AuthService.fetchWithAuth(`/addresses/${addressId}`, {
            method: "PUT",
            body: JSON.stringify(jsonData),
          })
        : await AuthService.fetchWithAuth("/addresses", {
            method: "POST",
            body: JSON.stringify(jsonData),
          });

      toast.success(isUpdate ? "Adresse mise à jour !" : "Adresse créée !");
      router.push("/addresses");

      if (!isUpdate) {
        form.reset();
        setPhotoUrls([]);

        if (markerRef.current) {
          const center: [number, number] = [
            defaultCoordinates.longitude,
            defaultCoordinates.latitude,
          ];
          markerRef.current.setLngLat(center);
          if (mapRef.current) {
            mapRef.current.setCenter(center);
          }
        }
      }
    } catch (error: any) {
      console.error("Erreur de soumission:", error);
      if (
        error.message?.includes("CORS") ||
        error.message?.includes("Failed to fetch")
      ) {
        toast.error(
          "Erreur CORS: Vérifiez la configuration du serveur backend"
        );
      } else {
        toast.error("Erreur : " + (error.message || "Une erreur est survenue"));
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <motion.form
      onSubmit={form.handleSubmit(onSubmit)}
      className="w-full mx-auto bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl px-8 border-white/20 dark:border-gray-700/20 space-y-6"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={formVariants}
    >
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          {isUpdate ? "Modifier l'adresse" : "Nouvelle adresse"}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ModernInput
          label="Numéro"
          name="house_number"
          control={form.control}
          placeholder="Numéro (optionnel)"
        />
        <ModernInput
          label="Rue"
          name="street_name"
          control={form.control}
          placeholder="Rue (optionnel)"
        />
      </div>

      <ModernInput
        label="Quartier"
        name="quartier"
        control={form.control}
        placeholder="Quartier"
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="prefecture"
          control={form.control}
          render={({ field }) => (
            <select
              {...field}
              value={field.value || ""}
              className="w-full rounded-xl border p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-300 dark:border-gray-700"
            >
              <option value="">Sélectionner une région (optionnel)</option>
              {Object.keys(CommunesByRegion).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          )}
        />
        <Controller
          name="commune"
          control={form.control}
          render={({ field }) => (
            <select
              {...field}
              value={field.value || ""}
              className="w-full rounded-xl border p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-300 dark:border-gray-700"
            >
              <option value="">Sélectionner une commune</option>
              {selectedRegion &&
                CommunesByRegion[selectedRegion].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
            </select>
          )}
        />
      </div>

      <ModernInput
        label="Point de repère"
        name="landmark"
        control={form.control}
        placeholder="Point de repère (optionnel)"
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Type d'adresse
          </label>
          <Controller
            name="address_type"
            control={form.control}
            render={({ field }) => (
              <select
                {...field}
                value={field.value || ""}
                className="w-full rounded-xl border p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-300 dark:border-gray-700"
              >
                {addressTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Type de bâtiment
          </label>
          <Controller
            name="building_type"
            control={form.control}
            render={({ field }) => (
              <select
                {...field}
                value={field.value || ""}
                className="w-full rounded-xl border p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-300 dark:border-gray-700"
              >
                {buildingTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          />
        </div>
      </div>

      <div className="relative h-64 w-full rounded-xl overflow-hidden border border-gray-300 dark:border-gray-700">
        <div ref={mapContainer} className="h-full w-full" />
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <Camera className="w-5 h-5" /> Ajouter une photo (optionnel)
        </label>
        <Upload
          onChange={(urls) => {
            setPhotoUrls(urls);
            form.setValue("photo", urls[0] || "");
          }}
          value={photoUrls}
          maxFiles={1}
          maxSize={5}
        />
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        Coordonnées : Lat{" "}
        {form.getValues("latitude")?.toFixed(5) ||
          defaultCoordinates.latitude.toFixed(5)}
        , Lng{" "}
        {form.getValues("longitude")?.toFixed(5) ||
          defaultCoordinates.longitude.toFixed(5)}
      </div>

      <motion.button
        type="submit"
        disabled={!formProgress.requiredComplete || isPending}
        whileHover={{
          scale: !isPending && formProgress.requiredComplete ? 1.02 : 1,
        }}
        whileTap={{
          scale: !isPending && formProgress.requiredComplete ? 0.98 : 1,
        }}
        className={`w-full h-14 rounded-xl font-semibold text-white flex items-center justify-center gap-2 ${
          formProgress.requiredComplete && !isPending
            ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg"
            : "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
        }`}
      >
        {isPending ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isUpdate ? (
          "Mettre à jour l'adresse"
        ) : (
          "Créer l'adresse"
        )}
      </motion.button>
    </motion.form>
  );
}
