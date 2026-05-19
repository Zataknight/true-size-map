import { useCallback, useEffect, useRef, useState } from "react";
import { useMapStore } from "../hooks/useMapStore";
import type { SelectedCountry } from "../types/country";

// --- Color resolution ---
const COLOR_MAP: Record<string, string> = {
  "chart-1": "oklch(0.75 0.18 195)",
  "chart-2": "oklch(0.65 0.22 310)",
  "chart-3": "oklch(0.65 0.22 40)",
  "chart-4": "oklch(0.75 0.18 145)",
  "chart-5": "oklch(0.7 0.2 70)",
  "chart-6": "oklch(0.68 0.18 280)",
};

// Equal-area: radius proportional to sqrt(area)
const SCALE_PX = 60; // px per sqrt(1M km²)
const MIN_RADIUS = 18;

function areaToRadius(areakm2: number): number {
  const r = Math.sqrt(areakm2 / 1_000_000) * SCALE_PX;
  return Math.max(r, MIN_RADIUS);
}

/** Mercator vertical scale factor at latitude φ (degrees).
 *  On a Mercator map, a circle appears stretched vertically by 1/cos(φ)
 *  compared to its equatorial size — higher latitudes look huge.
 *  We cap at lat 80° to avoid infinite distortion at poles. */
function mercatorStretch(latDeg: number): number {
  const phi = Math.min(Math.abs(latDeg), 80) * (Math.PI / 180);
  return 1 / Math.cos(phi);
}

function drawCountry(
  ctx: CanvasRenderingContext2D,
  country: SelectedCountry,
  cx: number,
  cy: number,
  isMercator: boolean,
  isHovered: boolean,
) {
  const r = areaToRadius(country.area);
  const x = cx + country.position.lng;
  const y = cy + country.position.lat;
  const color = COLOR_MAP[country.color] ?? COLOR_MAP["chart-1"];

  // In Mercator mode, stretch the y-axis to simulate the projection distortion
  const stretch = isMercator ? mercatorStretch(country.lat) : 1;
  const rx = r;
  const ry = r * stretch;

  ctx.save();

  // Filled ellipse
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = color.replace(")", " / 0.18)");
  ctx.fill();

  // Border
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = isHovered ? 2.5 : 1.5;
  ctx.stroke();

  // In Mercator mode: show distortion annotation
  if (isMercator && stretch > 1.15) {
    const pct = Math.round((stretch - 1) * 100);
    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.fillStyle = color.replace(")", " / 0.85)");
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(`+${pct}% tall`, x, y - ry - 2);
  }

  // Flag emoji
  const fontSize = Math.max(12, Math.min(r * 0.7, 32));
  ctx.font = `${fontSize}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(country.flag, x, y);

  // Name label
  const labelSize = Math.max(9, Math.min(r * 0.22, 13));
  ctx.font = `${labelSize}px 'Space Grotesk', sans-serif`;
  ctx.fillStyle = "oklch(0.95 0.01 260 / 0.85)";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(country.name, x, y + ry + 4);
  ctx.font = `${labelSize - 1}px 'JetBrains Mono', monospace`;
  ctx.fillStyle = "oklch(0.55 0.01 260 / 0.8)";
  const areaLabel =
    country.area >= 1_000_000
      ? `${(country.area / 1_000_000).toFixed(1)}M km²`
      : `${(country.area / 1_000).toFixed(0)}k km²`;
  ctx.fillText(areaLabel, x, y + ry + 4 + labelSize + 2);

  ctx.restore();
}

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.strokeStyle = "oklch(0.28 0.02 260 / 0.35)";
  ctx.lineWidth = 1;
  const step = 80;
  for (let x = 0; x < w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawScaleRef(ctx: CanvasRenderingContext2D, h: number) {
  const refR = areaToRadius(1_000_000);
  const rx = 60;
  const ry = h - 60;
  ctx.save();
  ctx.beginPath();
  ctx.arc(rx, ry, refR, 0, Math.PI * 2);
  ctx.strokeStyle = "oklch(0.4 0.01 260 / 0.45)";
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.font = "9px 'JetBrains Mono', monospace";
  ctx.fillStyle = "oklch(0.4 0.01 260 / 0.6)";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("= 1M km²", rx, ry - refR - 4);
  ctx.restore();
}

function drawCrosshair(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.strokeStyle = "oklch(0.32 0.02 260 / 0.45)";
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(cx, cy - 20);
  ctx.lineTo(cx, cy + 20);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 20, cy);
  ctx.lineTo(cx + 20, cy);
  ctx.stroke();
  ctx.restore();
}

function drawMercatorEquatorHint(
  ctx: CanvasRenderingContext2D,
  w: number,
  cy: number,
) {
  ctx.save();
  ctx.strokeStyle = "oklch(0.65 0.22 40 / 0.3)";
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 4]);
  ctx.beginPath();
  ctx.moveTo(0, cy);
  ctx.lineTo(w, cy);
  ctx.stroke();
  ctx.font = "9px 'JetBrains Mono', monospace";
  ctx.fillStyle = "oklch(0.65 0.22 40 / 0.5)";
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText("EKVATOR (0°)", w - 8, cy - 3);
  ctx.restore();
}

interface DragState {
  id: string;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

export default function MapCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { selectedCountries, updatePosition, bringToFront } = useMapStore();
  const [hovered, setHovered] = useState<string | null>(null);
  const [isMercator, setIsMercator] = useState(false);
  const drag = useRef<DragState | null>(null);

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

    if (isMercator) {
      drawMercatorEquatorHint(ctx, w, cy);
    } else {
      drawCrosshair(ctx, cx, cy);
    }

    drawScaleRef(ctx, h);

    const sorted = [...selectedCountries].sort((a, b) => a.zIndex - b.zIndex);
    for (const country of sorted) {
      drawCountry(ctx, country, cx, cy, isMercator, hovered === country.id);
    }

    if (selectedCountries.length === 0) {
      ctx.save();
      ctx.font = "13px 'Space Grotesk', sans-serif";
      ctx.fillStyle = "oklch(0.35 0.02 260 / 0.7)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Search a country above to compare true sizes", cx, cy + 28);
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillStyle = "oklch(0.28 0.02 260 / 0.55)";
      ctx.fillText(
        "Drag countries to reposition — toggle Mercator to see distortion",
        cx,
        cy + 46,
      );
      ctx.restore();
    }
  }, [selectedCountries, hovered, isMercator]);

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

  function hitTest(clientX: number, clientY: number): SelectedCountry | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const sorted = [...selectedCountries].sort((a, b) => b.zIndex - a.zIndex);
    for (const country of sorted) {
      const rx = areaToRadius(country.area);
      const stretch = isMercator ? mercatorStretch(country.lat) : 1;
      const ry = rx * stretch;
      const dx = mx - (cx + country.position.lng);
      const dy = my - (cy + country.position.lat);
      // ellipse hit test: (dx/rx)^2 + (dy/ry)^2 <= 1
      if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1) return country;
    }
    return null;
  }

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const country = hitTest(e.clientX, e.clientY);
    if (!country) return;
    bringToFront(country.id);
    drag.current = {
      id: country.id,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: country.position.lng,
      offsetY: country.position.lat,
    };
    e.preventDefault();
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (drag.current) {
      const d = drag.current;
      updatePosition(
        d.id,
        d.offsetX + (e.clientX - d.startX),
        d.offsetY + (e.clientY - d.startY),
      );
    } else {
      const hit = hitTest(e.clientX, e.clientY);
      setHovered(hit?.id ?? null);
      if (canvasRef.current)
        canvasRef.current.style.cursor = hit ? "grab" : "default";
    }
  }

  function onMouseUp() {
    drag.current = null;
  }

  function onMouseLeave() {
    drag.current = null;
    setHovered(null);
  }

  function onTouchStart(e: React.TouchEvent<HTMLCanvasElement>) {
    const touch = e.touches[0];
    const country = hitTest(touch.clientX, touch.clientY);
    if (!country) return;
    bringToFront(country.id);
    drag.current = {
      id: country.id,
      startX: touch.clientX,
      startY: touch.clientY,
      offsetX: country.position.lng,
      offsetY: country.position.lat,
    };
    e.preventDefault();
  }

  function onTouchMove(e: React.TouchEvent<HTMLCanvasElement>) {
    if (!drag.current) return;
    const touch = e.touches[0];
    const d = drag.current;
    updatePosition(
      d.id,
      d.offsetX + (touch.clientX - d.startX),
      d.offsetY + (touch.clientY - d.startY),
    );
    e.preventDefault();
  }

  function onTouchEnd() {
    drag.current = null;
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden bg-background"
      data-ocid="map_canvas"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        data-ocid="canvas_target"
      />

      {/* Projection toggle */}
      <div className="absolute top-3 right-3 flex items-center gap-0 border border-border rounded-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setIsMercator(false)}
          className={[
            "px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider transition-colors",
            !isMercator
              ? "bg-primary text-background"
              : "bg-card text-muted-foreground hover:text-foreground",
          ].join(" ")}
          data-ocid="projection.equal_area.tab"
        >
          Equal Area
        </button>
        <button
          type="button"
          onClick={() => setIsMercator(true)}
          className={[
            "px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider transition-colors border-l border-border",
            isMercator
              ? "bg-primary text-background"
              : "bg-card text-muted-foreground hover:text-foreground",
          ].join(" ")}
          data-ocid="projection.mercator.tab"
        >
          Mercator
        </button>
      </div>

      {/* Mode label */}
      {isMercator && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none">
          <span className="text-[10px] font-mono text-muted-foreground bg-card border border-border px-2 py-1 rounded-sm opacity-70 tracking-wider uppercase">
            Mercator distortion — countries near poles appear artificially tall
          </span>
        </div>
      )}

      {/* Drag hint */}
      {selectedCountries.length > 0 && (
        <div className="absolute bottom-3 right-3 pointer-events-none">
          <span className="text-[10px] font-mono text-muted-foreground opacity-40 tracking-wider uppercase">
            Drag to reposition
          </span>
        </div>
      )}
    </div>
  );
}
