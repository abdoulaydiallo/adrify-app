"use client";

import {
  useEffect,
  useState,
  useRef,
  useCallback,
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

    const [isTrackingUser, setIsTrackingUser] = useState(false);
    const userLocationRef = useRef<mapboxgl.LngLat | null>(null);
    const userPulseMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const [showUserPulse, setShowUserPulse] = useState(false);

    useImperativeHandle(
      ref,
      () => ({
        flyTo: (newCenter: [number, number], newZoom?: number) => {
          if (mapRef.current) {
            setIsTrackingUser(false);
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

    const cancelCurrentAnimation = useCallback(() => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.stop();
      }
    }, []);

    const clearAllMarkers = useCallback(() => {
      Object.values(markersRef.current).forEach((marker) => marker.remove());
      markersRef.current = {};
    }, []);

    const createUserPulseMarker = useCallback(() => {
      const el = document.createElement("div");
      el.className =
        "relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center";
      el.innerHTML = `
        <div class="absolute w-3 h-3 rounded-full bg-[#1A73E8] z-10 animate-[pulse-dot_2s_infinite] shadow-[0_0_0_8px_rgba(26,115,232,0.3)]"></div>
        <div class="absolute w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-[#1A73E8] opacity-0 animate-[pulse-ring_3s_infinite]"></div>
        <div class="absolute w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-[#1A73E8] opacity-0 animate-[pulse-ring_3s_1s_infinite]"></div>
        <div class="absolute w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-[#1A73E8] opacity-0 animate-[pulse-ring_3s_2s_infinite]"></div>
      `;
      return el;
    }, []);

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

    const hideUserPulseMarker = useCallback(() => {
      if (userPulseMarkerRef.current) {
        userPulseMarkerRef.current.remove();
        userPulseMarkerRef.current = null;
      }
      setShowUserPulse(false);
    }, []);

    const updateMarkers = useCallback(() => {
      if (!mapRef.current || !isMapLoaded) return;

      const currentAddressIds = new Set(addresses.map((addr) => addr.id));

      Object.keys(markersRef.current).forEach((id) => {
        if (!currentAddressIds.has(id)) {
          markersRef.current[id].remove();
          delete markersRef.current[id];
        }
      });

      addresses.forEach((addr) => {
        if (!addr.latitude || !addr.longitude) return;

        const lng = safeParseFloat(addr.longitude, -13.5784);
        const lat = safeParseFloat(addr.latitude, 9.6412);

        if (markersRef.current[addr.id]) {
          markersRef.current[addr.id].setLngLat([lng, lat]);
        } else {
          const color =
            addr.is_validated === 1
              ? "#34A853"
              : addr.is_validated === 0
              ? "#EA4335"
              : "#FBBC05";

          const marker = new mapboxgl.Marker({ color })
            .setLngLat([lng, lat])
            .addTo(mapRef.current!);

          marker.getElement().addEventListener("click", () => {
            if (onMarkerClick) {
              onMarkerClick(addr);
            } else {
              //showPopup(addr);
            }
          });

          markersRef.current[addr.id] = marker;
        }
      });
    }, [addresses, isMapLoaded, onMarkerClick]);

    const handleShareAddress = useCallback(
      async (address: Address) => {
        if (onShareAddress) {
          onShareAddress(address);
        } else {
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
              if (popupRef.current) {
                const popupElement = popupRef.current.getElement();
                const shareBtn = popupElement?.querySelector(".share-btn");
                if (shareBtn) {
                  shareBtn.innerHTML =
                    '<span class="text-green-600 font-semibold">Copié !</span>';
                  setTimeout(() => {
                    shareBtn.innerHTML =
                      '<span class="text-[#202124] text-[10px] sm:text-xs">Partager</span>';
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

    const showPopup = useCallback(
      (addr: Address) => {
        if (!mapRef.current) return;

        if (popupRef.current) {
          popupRef.current.remove();
          popupRef.current = null;
        }

        const lng = safeParseFloat(addr.longitude, -13.5784);
        const lat = safeParseFloat(addr.latitude, 9.6412);

        const fullAddress = [
          addr.house_number,
          addr.street_name,
          addr.quartier,
          addr.commune,
        ]
          .filter(Boolean)
          .join(", ");

        const typeIcon =
          addr.address_type === "résidentielle"
            ? "home"
            : addr.address_type === "commerciale"
            ? "building"
            : "map-pin";

        const validationStatus =
          addr.is_validated === 1
            ? "validated"
            : addr.is_validated === 0
            ? "rejected"
            : "pending";

        const statusIcon =
          validationStatus === "validated"
            ? "check-circle"
            : validationStatus === "pending"
            ? "clock"
            : "x-circle";

        const statusColor =
          validationStatus === "validated"
            ? "text-[#34A853]"
            : validationStatus === "pending"
            ? "text-[#FBBC05]"
            : "text-[#EA4335]";

        const formattedDate = new Date(addr.created_at).toLocaleDateString(
          "fr-FR"
        );

        const html = `
          <div class="p-3 sm:p-4 bg-white rounded-xl shadow-md max-w-[260px] sm:max-w-[300px] font-roboto">
            <div class="flex justify-between items-start mb-2 sm:mb-3">
              <div class="flex items-center gap-2 sm:gap-3">
                <div class="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-[#F1F3F4] rounded-lg">
                  ${
                    typeIcon === "home"
                      ? '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 sm:w-5 h-4 sm:h-5 text-[#202124]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>'
                      : typeIcon === "building"
                      ? '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 sm:w-5 h-4 sm:h-5 text-[#202124]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>'
                      : '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 sm:w-5 h-4 sm:h-5 text-[#202124]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>'
                  }
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="truncate font-medium text-[#202124] text-xs sm:text-sm">
                    ${addr.building_type || "Adresse"}
                  </h3>
                  <p class="truncate text-[#5F6368] text-[10px] sm:text-xs">${fullAddress}</p>
                </div>
              </div>
              <div class="flex flex-col items-end gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 ${statusColor}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  ${
                    statusIcon === "check-circle"
                      ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'
                      : statusIcon === "clock"
                      ? '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>'
                      : '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>'
                  }
                </svg>
                <span class="text-[10px] text-[#5F6368]">${formattedDate}</span>
              </div>
            </div>
            <div class="flex justify-between gap-1 sm:gap-2">
              <button class="view-btn flex flex-col items-center gap-1 px-2 sm:px-3 py-1.5 bg-[#F1F3F4] rounded-lg text-[#202124] text-[10px] sm:text-xs font-medium hover:bg-[#E8F0FE] hover:text-[#1A73E8] transition-all duration-200" data-address-id="${
                addr.id
              }">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span>Voir</span>
              </button>
              <button class="verify-btn flex flex-col items-center gap-1 px-2 sm:px-3 py-1.5 bg-[#F1F3F4] rounded-lg text-[#202124] text-[10px] sm:text-xs font-medium hover:bg-[#E6F4EA] hover:text-[#34A853] transition-all duration-200" data-address-id="${
                addr.id
              }">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>Vérifier</span>
              </button>
              <button class="share-btn flex flex-col items-center gap-1 px-2 sm:px-3 py-1.5 bg-[#F1F3F4] rounded-lg text-[#202124] text-[10px] sm:text-xs font-medium hover:bg-[#E8F0FE] hover:text-[#1A73E8] transition-all duration-200" data-address-id="${
                addr.id
              }">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                  <polyline points="16 6 12 2 8 6"></polyline>
                  <line x1="12" y1="2" x2="12" y2="15"></line>
                </svg>
                <span>Partager</span>
              </button>
            </div>
          </div>
        `;

        popupRef.current = new mapboxgl.Popup({
          closeOnClick: true,
          maxWidth: "300px",
        })
          .setLngLat([lng, lat])
          .setHTML(html)
          .addTo(mapRef.current);

        setTimeout(() => {
          const popupElement = popupRef.current?.getElement();
          if (popupElement) {
            popupElement
              .querySelector(".view-btn")
              ?.addEventListener("click", (e) => {
                e.stopPropagation();
                onViewAddress?.(addr);
              });
            popupElement
              .querySelector(".verify-btn")
              ?.addEventListener("click", (e) => {
                e.stopPropagation();
                onVerifyAddress?.(addr.id as any);
              });
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

    const updateRoute = useCallback(() => {
      if (!mapRef.current || !isMapLoaded || !route) return;

      if (!mapRef.current.isStyleLoaded()) {
        pendingRouteRef.current = route;
        return;
      }

      const map = mapRef.current;

      try {
        const existingSource = map.getSource(routeSourceId);

        if (existingSource) {
          (existingSource as mapboxgl.GeoJSONSource).setData(route);
        } else {
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
              "line-color": "#1A73E8",
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

      map.addControl(new mapboxgl.NavigationControl(), "top-right");
      map.addControl(new mapboxgl.FullscreenControl(), "top-right");

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

          if (
            showUserPulse &&
            userPulseMarkerRef.current &&
            userLocationRef.current
          ) {
            userPulseMarkerRef.current.setLngLat(userLocationRef.current);
          }

          if (isTrackingUser && route) {
            map.flyTo({
              center: [e.coords.longitude, e.coords.latitude],
              essential: true,
              duration: 1000,
            });
          }

          onGeolocate?.(userLocationRef.current);
        });

        geolocateControlRef.current.on("trackuserlocationstart", () => {
          setIsTrackingUser(true);
        });

        geolocateControlRef.current.on("trackuserlocationend", () => {
          setIsTrackingUser(false);
        });

        map.addControl(geolocateControlRef.current, "bottom-right");
      }

      if (onClick) {
        map.on("click", (e) => {
          onClick(e.lngLat);
        });
      }

      map.on("load", () => {
        setIsMapLoaded(true);
        cancelCurrentAnimation();
        animationRef.current = requestAnimationFrame(() => {
          map.flyTo({
            center: [center.lng, center.lat],
            essential: true,
            duration: 1500,
            easing: (t) => t,
          });
        });

        updateMarkers();
        if (route) {
          updateRoute();
        }
      });

      map.on("styledata", () => {
        if (pendingRouteRef.current) {
          updateRoute();
        }
      });

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

    useEffect(() => {
      const cleanup = initializeMap();
      return cleanup;
    }, [initializeMap]);

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

    useEffect(() => {
      if (isMapLoaded) {
        updateMarkers();
      }
    }, [addresses, isMapLoaded, updateMarkers]);

    useEffect(() => {
      if (!isMapLoaded) return;

      if (route) {
        updateRoute();
      } else {
        removeRoute();
      }
    }, [route, isMapLoaded, updateRoute, removeRoute]);

    useEffect(() => {
      if (selectedAddress && isMapLoaded) {
        //showPopup(selectedAddress);
        const lng = safeParseFloat(selectedAddress.longitude, -13.5784);
        const lat = safeParseFloat(selectedAddress.latitude, 9.6412);
        mapRef.current?.flyTo({
          center: [lng, lat],
          essential: true,
          duration: 1000,
        });
      }
    }, [selectedAddress, isMapLoaded, showPopup]);

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
        className={`w-full h-full opacity-0 transition-opacity duration-300 ${
          isMapLoaded ? "opacity-100" : ""
        } ${className}`}
        style={style}
      />
    );
  }
);

Mapbox.displayName = "Mapbox";
