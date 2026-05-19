import { useCallback, useState } from "react";

export type ProjectionMode = "equal-area" | "mercator";

export interface LatitudeLine {
  lat: number;
  label: string;
  color: string;
  dashed: boolean;
}

// Reference latitude lines to draw across the canvas
export const LATITUDE_LINES: LatitudeLine[] = [
  {
    lat: 66.5,
    label: "KUTUP NOKTASI (66.5°K)",
    color: "oklch(0.65 0.15 220 / 0.35)",
    dashed: true,
  },
  {
    lat: 23.5,
    label: "YENGEÇ DÖNENCESİ (23.5°K)",
    color: "oklch(0.65 0.22 40 / 0.45)",
    dashed: true,
  },
  {
    lat: 0,
    label: "EKVATOR",
    color: "oklch(0.75 0.18 195 / 0.55)",
    dashed: false,
  },
  {
    lat: -23.5,
    label: "OĞLAK DÖNENCESİ (23.5°G)",
    color: "oklch(0.65 0.22 40 / 0.45)",
    dashed: true,
  },
  {
    lat: -66.5,
    label: "KUTUP NOKTASI (66.5°G)",
    color: "oklch(0.65 0.15 220 / 0.35)",
    dashed: true,
  },
];

/** Mercator vertical scale factor at latitude φ (degrees).
 *  For display info only — NOT used for vertex projection. */
export function mercatorStretch(latDeg: number): number {
  const phi = Math.min(Math.abs(latDeg), 80) * (Math.PI / 180);
  return 1 / Math.cos(phi);
}

/** Max Mercator Y value (at ±85°) for normalisation. */
const MAX_MERC_Y = Math.log(Math.tan(Math.PI / 4 + (85 * Math.PI) / 360));

/** Map a geographic latitude to a canvas Y offset from center.
 *  Equal-area: linear (full height = 180° latitude span).
 *  Mercator: proper log-tan Web Mercator projection per vertex. */
export function latToY(
  latDeg: number,
  canvasHeight: number,
  mode: ProjectionMode,
): number {
  const span = canvasHeight;
  if (mode === "equal-area") {
    return -(latDeg / 90) * (span / 2);
  }
  // Web Mercator: clamp to avoid poles blowing up
  const clampedLat = Math.max(-85, Math.min(85, latDeg));
  const phi = clampedLat * (Math.PI / 180);
  const mercY = Math.log(Math.tan(Math.PI / 4 + phi / 2));
  return -(mercY / MAX_MERC_Y) * (span / 2) * 0.85;
}

/** Inverse of latToY — convert canvas Y offset back to latitude.
 *  Used for hit-testing and drag delta calculation. */
export function canvasYToLat(
  yOffset: number,
  canvasHeight: number,
  mode: ProjectionMode,
): number {
  const span = canvasHeight;
  if (mode === "equal-area") {
    return -(yOffset / (span / 2)) * 90;
  }
  // Inverse Web Mercator
  const mercY = -(yOffset / ((span / 2) * 0.85)) * MAX_MERC_Y;
  const lat = (2 * Math.atan(Math.exp(mercY)) - Math.PI / 2) * (180 / Math.PI);
  return Math.max(-85, Math.min(85, lat));
}

/** Convert canvas X offset to longitude. */
export function canvasXToLng(xOffset: number, canvasWidth: number): number {
  return (xOffset / (canvasWidth / 2)) * 180;
}

export function useMapProjection() {
  const [mode, setMode] = useState<ProjectionMode>("equal-area");

  const toggleMode = useCallback(() => {
    setMode((m) => (m === "equal-area" ? "mercator" : "equal-area"));
  }, []);

  const setEqualArea = useCallback(() => setMode("equal-area"), []);
  const setMercator = useCallback(() => setMode("mercator"), []);

  return { mode, toggleMode, setEqualArea, setMercator };
}
