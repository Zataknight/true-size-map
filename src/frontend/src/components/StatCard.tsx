import { X } from "lucide-react";
import { useMapStore } from "../hooks/useMapStore";
import type { SelectedCountry } from "../types/country";

const COLOR_MAP: Record<string, string> = {
  "chart-1": "oklch(var(--chart-1))",
  "chart-2": "oklch(var(--chart-2))",
  "chart-3": "oklch(var(--chart-3))",
  "chart-4": "oklch(var(--chart-4))",
  "chart-5": "oklch(var(--chart-5))",
  "chart-6": "oklch(0.68 0.18 280)",
};

function formatArea(km2: number): string {
  if (km2 >= 1_000_000) return `${(km2 / 1_000_000).toFixed(2)}M km²`;
  if (km2 >= 1_000) return `${(km2 / 1_000).toFixed(0)}k km²`;
  return `${km2} km²`;
}

function formatPop(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return `${n}`;
}

function formatDensity(pop: number, area: number): string {
  if (area === 0) return "—";
  const density = pop / area;
  if (density >= 1000) return `${(density / 1000).toFixed(1)}k/km²`;
  if (density >= 10) return `${Math.round(density)}/km²`;
  return `${density.toFixed(1)}/km²`;
}

function formatGdp(gdpBillions: number): string {
  if (gdpBillions >= 1000) return `$${(gdpBillions / 1000).toFixed(2)}T`;
  if (gdpBillions >= 1) return `$${gdpBillions.toFixed(0)}B`;
  return `$${(gdpBillions * 1000).toFixed(0)}M`;
}

interface StatCardProps {
  country: SelectedCountry;
  index: number;
}

export function StatCard({ country, index }: StatCardProps) {
  const { removeCountry, comparisonMetric } = useMapStore();
  const accentColor = COLOR_MAP[country.color] ?? COLOR_MAP["chart-1"];

  return (
    <div
      className="relative flex flex-col gap-1 bg-card border border-border px-3 py-2 rounded-sm shrink-0 w-44 group"
      style={{ borderLeftColor: accentColor, borderLeftWidth: 3 }}
      data-ocid={`stat_card.item.${index + 1}`}
    >
      {/* Remove button */}
      <button
        type="button"
        onClick={() => removeCountry(country.id)}
        className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
        aria-label={`Kaldır ${country.name}`}
        data-ocid={`stat_card.delete_button.${index + 1}`}
      >
        <X size={12} />
      </button>

      {/* Flag + Name */}
      <div className="flex items-center gap-1.5 pr-4">
        <span className="text-lg leading-none">{country.flag}</span>
        <span className="text-xs font-display font-semibold text-foreground truncate leading-tight">
          {country.name}
        </span>
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-[10px] font-mono uppercase tracking-wider ${comparisonMetric === "area" ? "text-primary" : "text-muted-foreground"}`}
          >
            Alan
          </span>
          <span className="text-[11px] font-mono text-foreground">
            {formatArea(country.area)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-[10px] font-mono uppercase tracking-wider ${comparisonMetric === "population" ? "text-primary" : "text-muted-foreground"}`}
          >
            Nüfus
          </span>
          <span className="text-[11px] font-mono text-foreground">
            {formatPop(country.population)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-[10px] font-mono uppercase tracking-wider ${comparisonMetric === "gdp" ? "text-primary" : "text-muted-foreground"}`}
          >
            GSYİH
          </span>
          <span className="text-[11px] font-mono text-foreground">
            {formatGdp(country.gdp)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            Yoğunluk
          </span>
          <span className="text-[11px] font-mono text-foreground">
            {formatDensity(country.population, country.area)}
          </span>
        </div>
      </div>

      {/* Color dot */}
      <div
        className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full"
        style={{ background: accentColor }}
      />
    </div>
  );
}
