"use client";

import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Address } from "@/types/address";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

type Coordinate = {
  lat: number;
  lng: number;
};

type MapboxProps = {
  addresses: Address[];
  center: Coordinate;
  zoom?: number;
  route?: GeoJSON.Feature<GeoJSON.LineString>;
  geolocateControl?: boolean;
  onGeolocate?: (position: mapboxgl.LngLat) => void;
  onClick?: (position: mapboxgl.LngLat) => void;
  className?: string;
  style?: React.CSSProperties;
  selectedAddress?: Address | null;
  onMarkerClick?: (address: Address) => void;
  onVerifyAddress?: (addressId: string) => void;
  onShareAddress?: (address: Address) => void;
  onDeleteAddress?: (addressId: string) => void;
  onViewAddress?: (address: Address) => void;
};

export interface MapboxRef {
  flyTo: (center: [number, number], zoom?: number) => void;
  getMap: () => mapboxgl.Map | null;
  startTracking: () => void;
  stopTracking: () => void;
  isTracking: () => boolean;
  showUserPulse: () => void;
  hideUserPulse: () => void;
  updateUserPulsePosition: (lnglat: [number, number]) => void;
}

// Fonction utilitaire pour convertir en nombre en toute sécurité
const safeParseFloat = (
  value: string | number | null | undefined,
  defaultValue: number
): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
};

export const Mapbox = forwardRef<MapboxRef, MapboxProps>(
  (
    {
      addresses,
      center,
      zoom = 12,
      route,
      geolocateControl = false,
      onGeolocate,
      onClick,
      className = "",
      style = { width: "100%", height: "100%" },
      selectedAddress,
      onMarkerClick,
      onVerifyAddress,
      onShareAddress,
      onDeleteAddress,
      onViewAddress,
    },
    ref
  ) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const animationRef = useRef<number | null>(null);
    const popupRef = useRef<mapboxgl.Popup | null>(null);
    const geolocateControlRef = useRef<mapboxgl.GeolocateControl | null>(null);
    const routeSourceId = "route-source";
    const routeLayerId = "route-layer";
    const pendingRouteRef = useRef<GeoJSON.Feature<GeoJSON.LineString> | null>(
      null
    );

    // États et références pour le suivi utilisateur et le marker pulsant
    const [isTrackingUser, setIsTrackingUser] = useState(false);
    const userLocationRef = useRef<mapboxgl.LngLat | null>(null);
    const userPulseMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const [showUserPulse, setShowUserPulse] = useState(false);

    // Exposer les méthodes via la ref
    useImperativeHandle(
      ref,
      () => ({
        flyTo: (newCenter: [number, number], newZoom?: number) => {
          if (mapRef.current) {
            setIsTrackingUser(false); // Désactiver le suivi lors d'un flyTo manuel
            mapRef.current.flyTo({
              center: newCenter,
              zoom: newZoom,
              duration: 1500,
              essential: true,
            });
          }
        },
        getMap: () => mapRef.current,
        startTracking: () => {
          if (geolocateControlRef.current) {
            geolocateControlRef.current.trigger();
            setIsTrackingUser(true);
          }
        },
        stopTracking: () => {
          setIsTrackingUser(false);
        },
        isTracking: () => isTrackingUser,
        showUserPulse: () => {
          showUserPulseMarker();
        },
        hideUserPulse: () => {
          hideUserPulseMarker();
        },
        updateUserPulsePosition: (lnglat: [number, number]) => {
          if (userPulseMarkerRef.current) {
            userPulseMarkerRef.current.setLngLat(lnglat);
          }
        },
      }),
      [isTrackingUser]
    );

    // Annule toute animation en cours
    const cancelCurrentAnimation = useCallback(() => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.stop();
      }
    }, []);

    // Nettoyer tous les marqueurs
    const clearAllMarkers = useCallback(() => {
      Object.values(markersRef.current).forEach((marker) => marker.remove());
      markersRef.current = {};
    }, []);

    // Fonction pour créer le marker pulsant de position utilisateur
    const createUserPulseMarker = useCallback(() => {
      const el = document.createElement("div");
      el.className = "user-pulse-marker";
      el.innerHTML = `
        <div class="pulse-dot"></div>
        <div class="pulse-ring"></div>
        <div class="pulse-ring" style="animation-delay: 1s"></div>
        <div class="pulse-ring" style="animation-delay: 2s"></div>
      `;
      el.style.width = "40px";
      el.style.height = "40px";
      return el;
    }, []);

    // Fonction pour afficher le marker pulsant
    const showUserPulseMarker = useCallback(() => {
      if (!mapRef.current || !userLocationRef.current) return;

      if (userPulseMarkerRef.current) {
        userPulseMarkerRef.current.remove();
      }

      const markerElement = createUserPulseMarker();
      userPulseMarkerRef.current = new mapboxgl.Marker(markerElement)
        .setLngLat(userLocationRef.current)
        .addTo(mapRef.current);

      setShowUserPulse(true);
    }, [createUserPulseMarker]);

    // Fonction pour cacher le marker pulsant
    const hideUserPulseMarker = useCallback(() => {
      if (userPulseMarkerRef.current) {
        userPulseMarkerRef.current.remove();
        userPulseMarkerRef.current = null;
      }
      setShowUserPulse(false);
    }, []);

    // Fonction pour créer ou mettre à jour les marqueurs
    const updateMarkers = useCallback(() => {
      if (!mapRef.current || !isMapLoaded) return;

      // Créer un Set des IDs d'adresses actuelles
      const currentAddressIds = new Set(addresses.map((addr) => addr.id));

      // Supprimer les marqueurs qui ne sont plus dans les adresses
      Object.keys(markersRef.current).forEach((id) => {
        if (!currentAddressIds.has(id)) {
          markersRef.current[id].remove();
          delete markersRef.current[id];
        }
      });

      // Ajouter ou mettre à jour les marqueurs
      addresses.forEach((addr) => {
        if (!addr.latitude || !addr.longitude) return;

        // Utilisation de safeParseFloat pour gérer les types
        const lng = safeParseFloat(addr.longitude, -13.5784);
        const lat = safeParseFloat(addr.latitude, 9.6412);

        if (markersRef.current[addr.id]) {
          // Mettre à jour la position du marqueur existant
          markersRef.current[addr.id].setLngLat([lng, lat]);
        } else {
          // Créer un nouveau marqueur
          const color =
            addr.is_validated === 1
              ? "#10B981"
              : addr.is_validated === 0
              ? "#EF4444"
              : "#F59E0B";

          const marker = new mapboxgl.Marker({ color })
            .setLngLat([lng, lat])
            .addTo(mapRef.current!);

          // Ajouter l'événement de clic
          marker.getElement().addEventListener("click", () => {
            if (onMarkerClick) {
              onMarkerClick(addr);
            } else {
              showPopup(addr);
            }
          });

          markersRef.current[addr.id] = marker;
        }
      });
    }, [addresses, isMapLoaded, onMarkerClick]);

    // Fonction pour partager une adresse
    const handleShareAddress = useCallback(
      async (address: Address) => {
        if (onShareAddress) {
          onShareAddress(address);
        } else {
          // Fallback: copier le lien dans le presse-papier
          const shareText = `${address.building_type || "Adresse"}: ${[
            address.house_number,
            address.street_name,
            address.quartier,
            address.commune,
          ]
            .filter(Boolean)
            .join(", ")}`;

          try {
            if (navigator.share) {
              await navigator.share({
                title: "Adresse Adrify",
                text: shareText,
                url: window.location.href,
              });
            } else {
              await navigator.clipboard.writeText(shareText);
              // Afficher un message de confirmation temporaire
              if (popupRef.current) {
                const popupElement = popupRef.current.getElement();
                const shareBtn = popupElement?.querySelector(".share-btn");
                if (shareBtn) {
                  const originalText = shareBtn.innerHTML;
                  shareBtn.innerHTML =
                    '<span class="copied-text">Copié!</span>';
                  setTimeout(() => {
                    shareBtn.innerHTML = "<span>Partager</span>";
                  }, 2000);
                }
              }
            }
          } catch (err) {
            console.error("Erreur lors du partage:", err);
          }
        }
      },
      [onShareAddress]
    );

    // Fonction pour afficher le popup avec le style compact
    const showPopup = useCallback(
      (addr: Address) => {
        if (!mapRef.current) return;

        // Fermer le popup existant
        if (popupRef.current) {
          popupRef.current.remove();
          popupRef.current = null;
        }

        // Utilisation de safeParseFloat pour les coordonnées
        const lng = safeParseFloat(addr.longitude, -13.5784);
        const lat = safeParseFloat(addr.latitude, 9.6412);

        // Calcul de l'adresse complète
        const fullAddress = [
          addr.house_number,
          addr.street_name,
          addr.quartier,
          addr.commune,
        ]
          .filter(Boolean)
          .join(", ");

        // Déterminer l'icône de type
        const typeIcon =
          addr.address_type === "résidentielle"
            ? "home"
            : addr.address_type === "commerciale"
            ? "building"
            : "map-pin";

        // Statut de validation
        const validationStatus =
          addr.is_validated === 1
            ? "validated"
            : addr.is_validated === 0
            ? "rejected"
            : "pending";

        // Icône de statut
        const statusIcon =
          validationStatus === "validated"
            ? "check-circle"
            : validationStatus === "pending"
            ? "clock"
            : "x-circle";

        // Couleur de statut
        const statusColor =
          validationStatus === "validated"
            ? "text-emerald-500"
            : validationStatus === "pending"
            ? "text-amber-500"
            : "text-red-500";

        // Date formatée
        const formattedDate = new Date(addr.created_at).toLocaleDateString(
          "fr-FR"
        );

        // HTML pour le popup style compact
        const html = `
        <div class="mapbox-popup compact">
          <div class="popup-content">
            <div class="compact-header">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                  ${
                    typeIcon === "home"
                      ? '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>'
                      : typeIcon === "building"
                      ? '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>'
                      : '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>'
                  }
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="truncate font-semibold text-gray-900 text-sm">
                    ${addr.building_type || "Adresse"}
                  </h3>
                  <p class="truncate text-xs text-gray-600">${fullAddress}</p>
                </div>
              </div>
              <div class="flex flex-col items-end gap-1">
                ${
                  validationStatus === "validated"
                    ? '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
                    : validationStatus === "pending"
                    ? '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>'
                    : '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'
                }
                <span class="text-xs text-gray-400">${formattedDate}</span>
              </div>
            </div>
            
            <div class="compact-actions mt-3 flex justify-between">
              <button class="action-btn view-btn" data-address-id="${addr.id}">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span>Voir</span>
              </button>
              <button class="action-btn verify-btn" data-address-id="${
                addr.id
              }">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>Vérifier</span>
              </button>
              <button class="action-btn share-btn" data-address-id="${addr.id}">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                  <polyline points="16 6 12 2 8 6"></polyline>
                  <line x1="12" y1="2" x2="12" y2="15"></line>
                </svg>
                <span>Partager</span>
              </button>
            </div>
          </div>
        </div>
      `;

        popupRef.current = new mapboxgl.Popup({
          closeOnClick: true,
          maxWidth: "320px",
          className: "custom-mapbox-popup",
        })
          .setLngLat([lng, lat])
          .setHTML(html)
          .addTo(mapRef.current);

        // Ajouter les événements aux boutons après que le popup soit rendu
        setTimeout(() => {
          const popupElement = popupRef.current?.getElement();
          if (popupElement) {
            // Bouton Voir
            popupElement
              .querySelector(".view-btn")
              ?.addEventListener("click", (e) => {
                e.stopPropagation();
                onViewAddress?.(addr);
              });

            // Bouton Vérifier
            popupElement
              .querySelector(".verify-btn")
              ?.addEventListener("click", (e) => {
                e.stopPropagation();
                onVerifyAddress?.(addr.id as any);
              });

            // Bouton Partager
            popupElement
              .querySelector(".share-btn")
              ?.addEventListener("click", (e) => {
                e.stopPropagation();
                handleShareAddress(addr);
              });
          }
        }, 100);
      },
      [
        onVerifyAddress,
        onShareAddress,
        onDeleteAddress,
        onViewAddress,
        handleShareAddress,
      ]
    );

    // Mettre à jour ou créer la route
    const updateRoute = useCallback(() => {
      if (!mapRef.current || !isMapLoaded || !route) return;

      // Vérifier si la carte est complètement chargée
      if (!mapRef.current.isStyleLoaded()) {
        pendingRouteRef.current = route;
        return;
      }

      const map = mapRef.current;

      try {
        // Vérifier si la source existe déjà
        const existingSource = map.getSource(routeSourceId);

        if (existingSource) {
          // Mettre à jour la source existante
          (existingSource as mapboxgl.GeoJSONSource).setData(route);
        } else {
          // Ajouter une nouvelle source et layer
          map.addSource(routeSourceId, {
            type: "geojson",
            data: route,
          });

          map.addLayer({
            id: routeLayerId,
            type: "line",
            source: routeSourceId,
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#FF5722",
              "line-width": 4,
              "line-opacity": 0.7,
            },
          });
        }
        pendingRouteRef.current = null;
      } catch (error) {
        console.error("Erreur lors de l'ajout de la route:", error);
        pendingRouteRef.current = route;
      }
    }, [route, isMapLoaded]);

    // Supprimer la route
    const removeRoute = useCallback(() => {
      if (!mapRef.current || !isMapLoaded) return;

      const map = mapRef.current;

      if (map.getLayer(routeLayerId)) {
        map.removeLayer(routeLayerId);
      }
      if (map.getSource(routeSourceId)) {
        map.removeSource(routeSourceId);
      }
      pendingRouteRef.current = null;
    }, [isMapLoaded]);

    // Initialisation de la carte
    const initializeMap = useCallback(() => {
      if (!mapContainerRef.current || mapRef.current) return;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [center.lng, center.lat],
        zoom: zoom,
        antialias: true,
        fadeDuration: 0,
        preserveDrawingBuffer: true,
        interactive: true,
      });

      mapRef.current = map;

      // Ajouter le CSS personnalisé pour les popups et le marker pulsant
      const style = document.createElement("style");
      style.textContent = `
        .custom-mapbox-popup .mapboxgl-popup-content {
          padding: 0;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          overflow: hidden;
        }
        
        .mapbox-popup {
          padding: 0;
          width: 280px;
          max-width: 100%;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .mapbox-popup.compact .popup-content {
          padding: 16px;
        }
        
        .compact-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        
        .compact-actions {
          display: flex;
          gap: 8px;
        }
        
        .action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 8px;
          border: none;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #f8fafc;
          color: #374151;
          min-width: 60px;
        }
        
        .action-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .action-btn svg {
          width: 16px;
          height: 16px;
        }
        
        .view-btn:hover { background: #e0f2fe; color: #0369a1; }
        .verify-btn:hover { background: #dcfce7; color: #16a34a; }
        .share-btn:hover { background: #e0e7ff; color: #4f46e5; }
        
        .copied-text {
          color: #16a34a;
          font-weight: 600;
        }

        /* Style pour l'indicateur de suivi actif */
        .mapboxgl-ctrl-geolocate.mapboxgl-ctrl-geolocate-active .mapboxgl-ctrl-icon {
          background-color: #3b82f6;
          color: white;
        }

        .mapboxgl-ctrl-geolocate.mapboxgl-ctrl-geolocate-active .mapboxgl-ctrl-icon:hover {
          background-color: #2563eb;
        }

        /* Styles pour le marker pulsant utilisateur */
        .user-pulse-marker {
          position: relative;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .pulse-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: #3b82f6;
          position: relative;
          z-index: 2;
          box-shadow: 0 0 0 rgba(59, 130, 246, 0.4);
          animation: pulse-dot 2s infinite;
        }
        
        .pulse-ring {
          position: absolute;
          width: 40px;
          height: 40px;
          border: 2px solid #3b82f6;
          border-radius: 50%;
          opacity: 0;
          animation: pulse-ring 3s infinite;
        }
        
        @keyframes pulse-dot {
          0% { 
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
          }
          70% {
            transform: scale(1.1);
            box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
          }
          100% { 
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }
        
        @keyframes pulse-ring {
          0% { 
            transform: scale(0.5);
            opacity: 1;
          }
          100% { 
            transform: scale(1.5);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);

      // Configuration des contrôles
      map.addControl(new mapboxgl.NavigationControl(), "top-right");
      map.addControl(new mapboxgl.FullscreenControl(), "top-right");

      // Gestion de la géolocalisation
      if (geolocateControl) {
        geolocateControlRef.current = new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserLocation: true,
          showAccuracyCircle: true,
        });

        geolocateControlRef.current.on("geolocate", (e) => {
          userLocationRef.current = new mapboxgl.LngLat(
            e.coords.longitude,
            e.coords.latitude
          );

          // Mettre à jour le marker pulsant
          if (
            showUserPulse &&
            userPulseMarkerRef.current &&
            userLocationRef.current
          ) {
            userPulseMarkerRef.current.setLngLat(userLocationRef.current);
          }

          // Si on suit l'utilisateur ET une route est disponible
          if (isTrackingUser && route) {
            map.flyTo({
              center: [e.coords.longitude, e.coords.latitude],
              essential: true,
              duration: 1000,
            });
          }

          onGeolocate?.(userLocationRef.current);
        });

        // Événement lorsque la géolocalisation démarre
        geolocateControlRef.current.on("trackuserlocationstart", () => {
          setIsTrackingUser(true);
        });

        // Événement lorsque la géolocalisation s'arrête
        geolocateControlRef.current.on("trackuserlocationend", () => {
          setIsTrackingUser(false);
        });

        map.addControl(geolocateControlRef.current, "bottom-right");
      }

      // Gestion du clic sur la carte
      if (onClick) {
        map.on("click", (e) => {
          onClick(e.lngLat);
        });
      }

      map.on("load", () => {
        setIsMapLoaded(true);

        // Animation initiale
        cancelCurrentAnimation();
        animationRef.current = requestAnimationFrame(() => {
          map.flyTo({
            center: [center.lng, center.lat],
            essential: true,
            duration: 1500,
            easing: (t) => t,
          });
        });

        // Ajouter les marqueurs après le chargement
        updateMarkers();

        // Ajouter la route si elle existe
        if (route) {
          updateRoute();
        }
      });

      // Gérer le rechargement du style
      map.on("styledata", () => {
        if (pendingRouteRef.current) {
          updateRoute();
        }
      });

      // Nettoyage des ressources lors du démontage
      return () => {
        cancelCurrentAnimation();
        clearAllMarkers();
        if (popupRef.current) {
          popupRef.current.remove();
        }
        if (userPulseMarkerRef.current) {
          userPulseMarkerRef.current.remove();
        }
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
        // Nettoyer le style ajouté
        if (style.parentNode) {
          style.parentNode.removeChild(style);
        }
      };
    }, [
      center.lat,
      center.lng,
      zoom,
      geolocateControl,
      onGeolocate,
      onClick,
      cancelCurrentAnimation,
      clearAllMarkers,
      updateMarkers,
      route,
      updateRoute,
      isTrackingUser,
      showUserPulse,
    ]);

    // Effet pour initialiser la carte
    useEffect(() => {
      const cleanup = initializeMap();
      return cleanup;
    }, [initializeMap]);

    // Mise à jour du centre (ne s'exécute pas si le suivi est activé)
    useEffect(() => {
      if (!mapRef.current || !isMapLoaded || isTrackingUser) return;

      cancelCurrentAnimation();
      animationRef.current = requestAnimationFrame(() => {
        mapRef.current?.flyTo({
          center: [center.lng, center.lat],
          essential: true,
          duration: 1500,
          easing: (t) => t,
        });
      });
    }, [center, isMapLoaded, cancelCurrentAnimation, isTrackingUser]);

    // Mise à jour des marqueurs lorsque les adresses changent
    useEffect(() => {
      if (isMapLoaded) {
        updateMarkers();
      }
    }, [addresses, isMapLoaded, updateMarkers]);

    // Mise à jour de la route
    useEffect(() => {
      if (!isMapLoaded) return;

      if (route) {
        updateRoute();
      } else {
        removeRoute();
      }
    }, [route, isMapLoaded, updateRoute, removeRoute]);

    // Si une adresse est sélectionnée depuis Sidebar → popup
    useEffect(() => {
      if (selectedAddress && isMapLoaded) {
        showPopup(selectedAddress);

        // Centrer la carte sur l'adresse sélectionnée
        const lng = safeParseFloat(selectedAddress.longitude, -13.5784);
        const lat = safeParseFloat(selectedAddress.latitude, 9.6412);

        mapRef.current?.flyTo({
          center: [lng, lat],
          essential: true,
          duration: 1000,
        });
      }
    }, [selectedAddress, isMapLoaded, showPopup]);

    // Nettoyage
    useEffect(() => {
      return () => {
        cancelCurrentAnimation();
        clearAllMarkers();
        if (popupRef.current) {
          popupRef.current.remove();
        }
        if (userPulseMarkerRef.current) {
          userPulseMarkerRef.current.remove();
        }
      };
    }, [cancelCurrentAnimation, clearAllMarkers]);

    return (
      <div
        ref={mapContainerRef}
        className={`mapbox-container ${className}`}
        style={{
          ...style,
          opacity: isMapLoaded ? 1 : 0,
          transition: "opacity 300ms ease",
        }}
      />
    );
  }
);

Mapbox.displayName = "Mapbox";
