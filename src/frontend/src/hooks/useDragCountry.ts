import { useCallback, useRef } from "react";
import { COUNTRY_SHAPES } from "../data/countryShapes";
import { canvasXToLng, canvasYToLat, latToY } from "./useMapProjection";
import type { ProjectionMode } from "./useMapProjection";
import { useMapStore } from "./useMapStore";

export interface DragState {
  id: string;
  startX: number;
  startY: number;
  startGeoLng: number;
  startGeoLat: number;
}

// Keep areaToRadius exported for any legacy usage
const SCALE_PX = 60;
const MIN_RADIUS = 18;
export function areaToRadius(areakm2: number): number {
  const r = Math.sqrt(areakm2 / 1_000_000) * SCALE_PX;
  return Math.max(r, MIN_RADIUS);
}

/** Point-in-polygon ray casting algorithm */
function pointInPolygon(px: number, py: number, polygon: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];
    const intersect =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Convert canvas pixel coords to geographic [lng, lat],
 *  accounting for the given country's geographic position offset.
 *  Uses the correct inverse for the current projection mode. */
function canvasToGeo(
  mx: number,
  my: number,
  cx: number,
  cy: number,
  canvasW: number,
  canvasH: number,
  mode: ProjectionMode,
  geoOffsetLng: number,
  geoOffsetLat: number,
): [number, number] {
  // Reverse canvas center offset to get relative canvas position
  const relX = mx - cx;
  const relY = my - cy;

  // Invert canvas to base geographic coords using current projection
  const baseLng = canvasXToLng(relX, canvasW);
  const baseLat = canvasYToLat(relY, canvasH, mode);

  // Subtract the country's geo position offset to get shape-local coords
  const lng = baseLng - geoOffsetLng;
  const lat = baseLat - geoOffsetLat;

  return [lng, lat];
}

export function useDragCountry(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  mode: ProjectionMode,
  onHoverChange: (id: string | null) => void,
) {
  const { worldCountries, updateWorldPosition, bringWorldCountryToFront } =
    useMapStore();
  const drag = useRef<DragState | null>(null);

  const hitTest = useCallback(
    (clientX: number, clientY: number): string | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const mx = clientX - rect.left;
      const my = clientY - rect.top;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const w = canvas.width;
      const h = canvas.height;

      const sorted = [...worldCountries].sort((a, b) => b.zIndex - a.zIndex);

      for (const wc of sorted) {
        const shape = COUNTRY_SHAPES.find((s) => s.id === wc.id);
        if (!shape) continue;

        // Convert mouse position to geo coords accounting for this country's geo offset
        const [geoLng, geoLat] = canvasToGeo(
          mx,
          my,
          cx,
          cy,
          w,
          h,
          mode,
          wc.position.lng,
          wc.position.lat,
        );

        for (const polygon of shape.polygons) {
          if (pointInPolygon(geoLng, geoLat, polygon)) {
            return wc.id;
          }
        }
      }
      return null;
    },
    [canvasRef, worldCountries, mode],
  );

  const getWorldCountry = useCallback(
    (id: string) => worldCountries.find((c) => c.id === id),
    [worldCountries],
  );

  /** Convert canvas pixel position to geographic coords using current projection */
  const pixelToGeo = useCallback(
    (clientX: number, clientY: number): { lng: number; lat: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { lng: 0, lat: 0 };
      const rect = canvas.getBoundingClientRect();
      const mx = clientX - rect.left;
      const my = clientY - rect.top;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const relX = mx - cx;
      const relY = my - cy;
      return {
        lng: canvasXToLng(relX, canvas.width),
        lat: canvasYToLat(relY, canvas.height, mode),
      };
    },
    [canvasRef, mode],
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const id = hitTest(e.clientX, e.clientY);
      if (!id) return;
      bringWorldCountryToFront(id);
      const wc = getWorldCountry(id);
      const geo = pixelToGeo(e.clientX, e.clientY);
      drag.current = {
        id,
        startX: e.clientX,
        startY: e.clientY,
        // Store where the drag started in geo minus the country's current offset
        // so we can compute the new offset as: new_offset = current_geo - initial_geo_without_offset
        startGeoLng: geo.lng - (wc?.position.lng ?? 0),
        startGeoLat: geo.lat - (wc?.position.lat ?? 0),
      };
      e.preventDefault();
    },
    [hitTest, bringWorldCountryToFront, getWorldCountry, pixelToGeo],
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (drag.current) {
        const d = drag.current;
        const geo = pixelToGeo(e.clientX, e.clientY);
        updateWorldPosition(d.id, {
          lng: geo.lng - d.startGeoLng,
          lat: geo.lat - d.startGeoLat,
        });
        if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
      } else {
        const id = hitTest(e.clientX, e.clientY);
        onHoverChange(id ?? null);
        if (canvasRef.current)
          canvasRef.current.style.cursor = id ? "grab" : "default";
      }
    },
    [hitTest, updateWorldPosition, onHoverChange, canvasRef, pixelToGeo],
  );

  const onMouseUp = useCallback(() => {
    drag.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = "default";
  }, [canvasRef]);

  const onMouseLeave = useCallback(() => {
    drag.current = null;
    onHoverChange(null);
    if (canvasRef.current) canvasRef.current.style.cursor = "default";
  }, [onHoverChange, canvasRef]);

  const onTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      const touch = e.touches[0];
      const id = hitTest(touch.clientX, touch.clientY);
      if (!id) return;
      bringWorldCountryToFront(id);
      const wc = getWorldCountry(id);
      const geo = pixelToGeo(touch.clientX, touch.clientY);
      drag.current = {
        id,
        startX: touch.clientX,
        startY: touch.clientY,
        startGeoLng: geo.lng - (wc?.position.lng ?? 0),
        startGeoLat: geo.lat - (wc?.position.lat ?? 0),
      };
      e.preventDefault();
    },
    [hitTest, bringWorldCountryToFront, getWorldCountry, pixelToGeo],
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!drag.current) return;
      const touch = e.touches[0];
      const d = drag.current;
      const geo = pixelToGeo(touch.clientX, touch.clientY);
      updateWorldPosition(d.id, {
        lng: geo.lng - d.startGeoLng,
        lat: geo.lat - d.startGeoLat,
      });
      e.preventDefault();
    },
    [updateWorldPosition, pixelToGeo],
  );

  const onTouchEnd = useCallback(() => {
    drag.current = null;
  }, []);

  return {
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
