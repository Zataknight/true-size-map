import { Bookmark, Download, Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ComparisonChart } from "../components/ComparisonChart";
import { ComparisonRow } from "../components/ComparisonRow";
import { ComparisonTable } from "../components/ComparisonTable";
import { CountrySearch } from "../components/CountrySearch";
import { FavoritesPanel } from "../components/FavoritesPanel";
import { HistoricalPanel } from "../components/HistoricalPanel";
import MapCanvas from "../components/MapCanvas";
import { SelectedChips } from "../components/SelectedChips";
import { StatBar } from "../components/StatBar";
import { COUNTRIES } from "../data/countries";
import { useMapStore } from "../hooks/useMapStore";
import type { ComparisonMetric } from "../types/country";

const METRICS: { value: ComparisonMetric; label: string }[] = [
  { value: "area", label: "Alan km²" },
  { value: "population", label: "Nüfus" },
  { value: "gdp", label: "GSYİH" },
];

type ViewMode = "map" | "table" | "chart" | "historical";

const VIEW_MODES: { value: ViewMode; label: string }[] = [
  { value: "map", label: "Harita" },
  { value: "table", label: "Tablo" },
  { value: "chart", label: "Grafik" },
  { value: "historical", label: "Tarihsel" },
];

function loadFromUrlParams(
  addCountry: (c: (typeof COUNTRIES)[number]) => void,
  setMetric: (m: ComparisonMetric) => void,
) {
  const params = new URLSearchParams(window.location.search);
  const countriesParam = params.get("countries");
  const metricParam = params.get("metric") as ComparisonMetric | null;

  if (metricParam && ["area", "population", "gdp"].includes(metricParam)) {
    setMetric(metricParam);
  }

  if (countriesParam) {
    const ids = countriesParam.split(",").filter(Boolean);
    const countryMap = new Map(COUNTRIES.map((c) => [c.id, c]));
    for (const id of ids.slice(0, 6)) {
      const c = countryMap.get(id.toLowerCase());
      if (c) addCountry(c);
    }
  }
}

export default function MapPage() {
  const {
    selectedCountries,
    clearAll,
    updatePosition,
    initWorldMap,
    comparisonMetric,
    setMetric,
    addCountry,
  } = useMapStore();
  const [showFavorites, setShowFavorites] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("map");

  const urlLoadedRef = useRef(false);

  useEffect(() => {
    initWorldMap();
    if (!urlLoadedRef.current) {
      urlLoadedRef.current = true;
      loadFromUrlParams(addCountry, setMetric);
    }
  }, [initWorldMap, addCountry, setMetric]);

  const resetPositions = () => {
    for (const c of selectedCountries) {
      updatePosition(c.id, 0, 0);
    }
  };

  const handleExportPng = () => {
    const canvas = document.querySelector<HTMLCanvasElement>(
      "[data-ocid='canvas_target']",
    );
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "gercek-boyut-harita.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className="flex flex-col h-full w-full overflow-hidden"
      data-ocid="map_page"
    >
      {/* Header — no overflow-x-auto so dropdown is not clipped */}
      <header
        className="flex items-center gap-3 px-4 h-14 bg-card border-b border-border shrink-0"
        data-ocid="topbar"
      >
        {/* Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <Globe size={18} className="text-primary" />
          <span className="font-display font-bold text-sm tracking-widest uppercase text-foreground whitespace-nowrap">
            Gerçek Boyut
          </span>
        </div>

        <div className="w-px h-5 bg-border shrink-0" />

        {/* Search */}
        <CountrySearch />

        {/* Country counter */}
        <span className="text-xs font-mono text-muted-foreground shrink-0">
          {selectedCountries.length}/6
        </span>

        {/* Metric toggle */}
        <div
          className="flex items-center gap-0 border border-border rounded-sm overflow-hidden shrink-0"
          data-ocid="metric.toggle"
        >
          {METRICS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMetric(m.value)}
              className={[
                "px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider transition-colors border-r border-border last:border-r-0",
                comparisonMetric === m.value
                  ? "bg-primary text-background"
                  : "bg-card text-muted-foreground hover:text-foreground",
              ].join(" ")}
              data-ocid={`metric.${m.value}.tab`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* View mode toggle */}
        <div
          className="flex items-center gap-0 border border-border rounded-sm overflow-hidden shrink-0"
          data-ocid="view_mode.toggle"
        >
          {VIEW_MODES.map((v) => (
            <button
              key={v.value}
              type="button"
              onClick={() => setViewMode(v.value)}
              className={[
                "px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider transition-colors border-r border-border last:border-r-0",
                viewMode === v.value
                  ? "bg-primary text-background"
                  : "bg-card text-muted-foreground hover:text-foreground",
              ].join(" ")}
              data-ocid={`view_mode.${v.value}.tab`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-border shrink-0" />

        {/* Favorites button */}
        <button
          type="button"
          onClick={() => setShowFavorites((v) => !v)}
          className={[
            "flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider transition-colors shrink-0 px-2 py-1 rounded-sm border border-border",
            showFavorites
              ? "bg-primary/10 text-primary border-primary/30"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
          data-ocid="favorites.open_modal_button"
        >
          <Bookmark size={12} />
          Favoriler
        </button>

        {/* PNG export — only relevant in map view */}
        {viewMode === "map" && (
          <button
            type="button"
            onClick={handleExportPng}
            className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors shrink-0 px-2 py-1 rounded-sm border border-border"
            data-ocid="export_png_button"
          >
            <Download size={12} />
            PNG İndir
          </button>
        )}

        {/* Reset / clear buttons */}
        {selectedCountries.length > 0 && (
          <>
            <button
              type="button"
              onClick={resetPositions}
              className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors shrink-0"
              data-ocid="reset_positions_button"
            >
              SIFIRLA
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-mono text-muted-foreground hover:text-destructive transition-colors shrink-0"
              data-ocid="clear_all_button"
            >
              TÜMÜNÜ TEMİZLE
            </button>
          </>
        )}
      </header>

      {/* Selected country chips */}
      <SelectedChips />

      {/* Main area */}
      <div className="flex-1 relative overflow-hidden flex">
        {viewMode === "map" && <MapCanvas />}
        {viewMode === "table" && <ComparisonTable />}
        {viewMode === "chart" && <ComparisonChart />}
        {viewMode === "historical" && <HistoricalPanel />}
        {showFavorites && (
          <FavoritesPanel onClose={() => setShowFavorites(false)} />
        )}
      </div>

      {/* Comparison row */}
      <ComparisonRow />

      {/* Stats bar */}
      <StatBar />

      {/* Footer */}
      <footer className="shrink-0 flex items-center justify-center h-7 bg-card border-t border-border">
        <span className="text-[10px] font-mono text-muted-foreground tracking-wider">
          Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </span>
      </footer>
    </div>
  );
}
