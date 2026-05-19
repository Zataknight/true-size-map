import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { COUNTRIES } from "../data/countries";
import { COUNTRY_SHAPES } from "../data/countryShapes";
import { useDragCountry } from "../hooks/useDragCountry";
import {
  LATITUDE_LINES,
  latToY,
  mercatorStretch,
  useMapProjection,
} from "../hooks/useMapProjection";
import type { ProjectionMode } from "../hooks/useMapProjection";
import { useMapStore } from "../hooks/useMapStore";
import type { WorldCountry } from "../types/country";

// Chart colors matching index.css design system
const CHART_COLORS: Record<string, { fill: string; stroke: string }> = {
  "chart-1": { fill: "oklch(0.7 0.2 195)", stroke: "oklch(0.78 0.22 195)" },
  "chart-2": { fill: "oklch(0.7 0.2 310)", stroke: "oklch(0.78 0.22 310)" },
  "chart-3": { fill: "oklch(0.7 0.2 40)", stroke: "oklch(0.78 0.22 40)" },
  "chart-4": { fill: "oklch(0.7 0.2 145)", stroke: "oklch(0.78 0.22 145)" },
  "chart-5": { fill: "oklch(0.7 0.2 70)", stroke: "oklch(0.78 0.22 70)" },
  "chart-6": { fill: "oklch(0.7 0.2 280)", stroke: "oklch(0.78 0.22 280)" },
};

const COUNTRY_FILL = "oklch(0.42 0.04 260 / 0.5)";
const COUNTRY_STROKE = "oklch(0.58 0.06 260 / 0.85)";
const COUNTRY_HOVER_STROKE = "oklch(0.78 0.12 260)";

/** Convert longitude to canvas X. Always linear regardless of projection. */
function lngToX(lng: number, cx: number, canvasW: number): number {
  return cx + (lng / 180) * (canvasW / 2);
}

function drawLatLines(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cy: number,
  mode: ProjectionMode,
) {
  ctx.save();
  for (const line of LATITUDE_LINES) {
    const yOff = latToY(line.lat, h, mode);
    const y = cy + yOff;

    ctx.beginPath();
    if (line.dashed) ctx.setLineDash([6, 5]);
    else ctx.setLineDash([]);
    ctx.strokeStyle = line.color;
    ctx.lineWidth = line.lat === 0 ? 1.5 : 1;
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.fillStyle =
      line.lat === 0
        ? "oklch(0.75 0.18 195 / 0.8)"
        : line.lat === 23.5 || line.lat === -23.5
          ? "oklch(0.65 0.22 40 / 0.7)"
          : "oklch(0.65 0.15 220 / 0.6)";
    ctx.textAlign = "right";
    ctx.textBaseline = line.lat >= 0 ? "bottom" : "top";
    ctx.fillText(line.label, w - 10, y + (line.lat >= 0 ? -3 : 3));

    if (mode === "mercator" && Math.abs(line.lat) > 5) {
      const stretch = mercatorStretch(line.lat);
      const pct = Math.round((stretch - 1) * 100);
      ctx.font = "8px 'JetBrains Mono', monospace";
      ctx.fillStyle = "oklch(0.65 0.22 40 / 0.6)";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText(`+${pct}% dikey`, 10, y - 2);
    }
  }
  ctx.restore();
}

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.strokeStyle = "oklch(0.28 0.02 260 / 0.18)";
  ctx.lineWidth = 1;
  const step = 80;
  for (let x = 0; x < w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCountryShape(
  ctx: CanvasRenderingContext2D,
  wc: WorldCountry,
  cx: number,
  cy: number,
  canvasW: number,
  canvasH: number,
  mode: ProjectionMode,
  fillColor: string,
  strokeColor: string,
  lineWidth: number,
  fillAlpha: number,
) {
  const shape = COUNTRY_SHAPES.find((s) => s.id === wc.id);
  if (!shape) return;

  const geoOffsetLng = wc.position.lng;
  const geoOffsetLat = wc.position.lat;

  ctx.save();

  for (const polygon of shape.polygons) {
    if (polygon.length < 2) continue;

    ctx.beginPath();
    let first = true;
    for (const point of polygon) {
      const lng = point[0] + geoOffsetLng;
      const lat = point[1] + geoOffsetLat;
      const x = lngToX(lng, cx, canvasW);
      const y = cy + latToY(lat, canvasH, mode);
      if (first) {
        ctx.moveTo(x, y);
        first = false;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();

    ctx.globalAlpha = fillAlpha;
    ctx.fillStyle = fillColor;
    ctx.fill();

    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  ctx.restore();
}

function drawCountryLabel(
  ctx: CanvasRenderingContext2D,
  wc: WorldCountry,
  cx: number,
  cy: number,
  canvasW: number,
  canvasH: number,
  mode: ProjectionMode,
  name: string,
  flag: string,
  color: string,
) {
  const shape = COUNTRY_SHAPES.find((s) => s.id === wc.id);
  const cLng = (shape ? shape.centroid[0] : 0) + wc.position.lng;
  const cLat = (shape ? shape.centroid[1] : 0) + wc.position.lat;

  const x = lngToX(cLng, cx, canvasW);
  const y = cy + latToY(cLat, canvasH, mode);

  ctx.save();
  ctx.font = "18px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(flag, x, y);

  ctx.font = "10px 'Space Grotesk', sans-serif";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(name, x, y + 12);
  ctx.restore();
}

export default function MapCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { selectedCountries, worldCountries } = useMapStore();
  const [hovered, setHovered] = useState<string | null>(null);
  const { mode, setEqualArea, setMercator } = useMapProjection();

  const dragHandlers = useDragCountry(canvasRef, mode, setHovered);

  const selectedById = useMemo(
    () => new Map(selectedCountries.map((c) => [c.id, c])),
    [selectedCountries],
  );
  const selectedIds = useMemo(
    () => new Set(selectedCountries.map((c) => c.id)),
    [selectedCountries],
  );
  const countryDataById = useMemo(
    () => new Map(COUNTRIES.map((c) => [c.id, c])),
    [],
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "oklch(0.145 0.014 260)";
    ctx.fillRect(0, 0, w, h);

    drawGrid(ctx, w, h);
    drawLatLines(ctx, w, h, cy, mode);

    const sorted = [...worldCountries].sort((a, b) => a.zIndex - b.zIndex);

    // Layer 1: unselected world countries
    for (const wc of sorted) {
      if (selectedIds.has(wc.id)) continue;
      const countryData = countryDataById.get(wc.id);
      if (!countryData) continue;

      const isHov = hovered === wc.id;
      drawCountryShape(
        ctx,
        wc,
        cx,
        cy,
        w,
        h,
        mode,
        COUNTRY_FILL,
        isHov ? COUNTRY_HOVER_STROKE : COUNTRY_STROKE,
        isHov ? 1.5 : 0.8,
        0.5,
      );
    }

    // Layer 2: selected countries on top with chart colors
    for (const wc of sorted) {
      const sel = selectedById.get(wc.id);
      if (!sel) continue;
      const countryData = countryDataById.get(wc.id);
      if (!countryData) continue;

      const chartColors = CHART_COLORS[sel.color] ?? CHART_COLORS["chart-1"];
      drawCountryShape(
        ctx,
        wc,
        cx,
        cy,
        w,
        h,
        mode,
        chartColors.fill,
        chartColors.stroke,
        2.0,
        0.35,
      );
      drawCountryLabel(
        ctx,
        wc,
        cx,
        cy,
        w,
        h,
        mode,
        sel.name,
        sel.flag,
        chartColors.stroke,
      );
    }
  }, [
    worldCountries,
    hovered,
    mode,
    selectedIds,
    selectedById,
    countryDataById,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      render();
    });
    ro.observe(container);
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    return () => ro.disconnect();
  }, [render]);

  useEffect(() => {
    render();
  }, [render]);

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden bg-background"
      data-ocid="map_canvas"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        {...dragHandlers}
        data-ocid="canvas_target"
      />

      {/* Projection toggle */}
      <div className="absolute top-3 right-3 flex items-center gap-0 border border-border rounded-sm overflow-hidden z-10">
        <button
          type="button"
          onClick={setEqualArea}
          className={[
            "px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider transition-colors",
            mode === "equal-area"
              ? "bg-primary text-background"
              : "bg-card text-muted-foreground hover:text-foreground",
          ].join(" ")}
          data-ocid="projection.equal_area.tab"
        >
          Eşit Alan
        </button>
        <button
          type="button"
          onClick={setMercator}
          className={[
            "px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider transition-colors border-l border-border",
            mode === "mercator"
              ? "bg-primary text-background"
              : "bg-card text-muted-foreground hover:text-foreground",
          ].join(" ")}
          data-ocid="projection.mercator.tab"
        >
          Mercator
        </button>
      </div>

      {/* Mercator info badge */}
      {mode === "mercator" && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none z-10">
          <span className="text-[10px] font-mono text-muted-foreground bg-card border border-border px-2 py-1 rounded-sm opacity-80 tracking-wider uppercase">
            Mercator — kutuplar yapay olarak uzatılmış görünür
          </span>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 pointer-events-none flex flex-col gap-1 z-10">
        <div className="flex items-center gap-1.5">
          <div
            className="w-4 h-px"
            style={{ backgroundColor: "oklch(0.75 0.18 195 / 0.6)" }}
          />
          <span className="text-[9px] font-mono text-muted-foreground opacity-70">
            EKVATOR
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-4 h-px border-t border-dashed"
            style={{ borderColor: "oklch(0.65 0.22 40 / 0.6)" }}
          />
          <span className="text-[9px] font-mono text-muted-foreground opacity-70">
            Dönenceleri ±23.5°
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-4 h-px border-t border-dashed"
            style={{ borderColor: "oklch(0.65 0.15 220 / 0.5)" }}
          />
          <span className="text-[9px] font-mono text-muted-foreground opacity-70">
            Kutup Noktaları ±66.5°
          </span>
        </div>
      </div>

      {/* Drag hint */}
      <div className="absolute bottom-3 right-3 pointer-events-none z-10">
        <span className="text-[10px] font-mono text-muted-foreground opacity-40 tracking-wider uppercase">
          Yeniden konumlandırmak için herhangi bir ülkeyi sürükle
        </span>
      </div>
    </div>
  );
}
