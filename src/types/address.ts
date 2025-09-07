// types/address.ts

export type Address = {
  id: string | number;

  // Type d'adresse: "résidentielle" | "commerciale" | autre
  address_type: string;

  // Infos bâtiment
  building_type?: string | null;
  house_number?: string | null;
  street_name?: string | null;

  // Localisation
  quartier?: string | null;
  commune?: string | null;
  prefecture?: string | null;

  // Repère
  landmark?: string | null;

  // Photo associée
  photo?: string | null;

  // Validation
  is_validated?: 0 | 1 | null; // 1 = validée, 0 = rejetée, null = en attente
  status?: "created" | "shared" | "archived" | string | null; // état interne


  // Lien de partage
  share_link?: string | null;

  // Coordonnées
  latitude?: number | null;
  longitude?: number | null;

  // Timestamps
  created_at: string;
  updated_at?: string | null;
};
