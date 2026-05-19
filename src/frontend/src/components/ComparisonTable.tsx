import { useMapStore } from "../hooks/useMapStore";
import type { ComparisonMetric, SelectedCountry } from "../types/country";

const COLOR_MAP: Record<string, string> = {
  "chart-1": "oklch(0.75 0.18 195)",
  "chart-2": "oklch(0.65 0.22 310)",
  "chart-3": "oklch(0.65 0.22 40)",
  "chart-4": "oklch(0.75 0.18 145)",
  "chart-5": "oklch(0.7 0.2 70)",
  "chart-6": "oklch(0.68 0.18 280)",
};

function formatArea(km2: number): string {
  return `${km2.toLocaleString("tr-TR")} km²`;
}

function formatPop(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return `${n}`;
}

function formatGdp(gdpBillions: number): string {
  if (gdpBillions >= 1000) return `$${(gdpBillions / 1000).toFixed(2)}T`;
  if (gdpBillions >= 1) return `$${gdpBillions.toFixed(0)}B`;
  return `$${(gdpBillions * 1000).toFixed(0)}M`;
}

function formatDensity(pop: number, area: number): string {
  if (area === 0) return "—";
  const d = pop / area;
  if (d >= 10) return `${Math.round(d)}/km²`;
  return `${d.toFixed(1)}/km²`;
}

interface Column {
  key: string;
  label: string;
  metric?: ComparisonMetric;
  align: "left" | "right";
  getValue: (c: SelectedCountry) => number | string;
}

const COLUMNS: Column[] = [
  {
    key: "name",
    label: "Ülke",
    align: "left",
    getValue: (c) => c.name,
  },
  {
    key: "area",
    label: "Alan (km²)",
    metric: "area",
    align: "right",
    getValue: (c) => c.area,
  },
  {
    key: "population",
    label: "Nüfus",
    metric: "population",
    align: "right",
    getValue: (c) => c.population,
  },
  {
    key: "gdp",
    label: "GSYİH (milyar $)",
    metric: "gdp",
    align: "right",
    getValue: (c) => c.gdp,
  },
  {
    key: "density",
    label: "Yoğunluk (kişi/km²)",
    align: "right",
    getValue: (c) => (c.area > 0 ? c.population / c.area : 0),
  },
];

function formatValue(col: Column, country: SelectedCountry): string {
  if (col.key === "name") return `${country.flag} ${country.name}`;
  if (col.key === "area") return formatArea(country.area);
  if (col.key === "population") return formatPop(country.population);
  if (col.key === "gdp") return formatGdp(country.gdp);
  if (col.key === "density")
    return formatDensity(country.population, country.area);
  return "";
}

export function ComparisonTable() {
  const { selectedCountries, comparisonMetric } = useMapStore();

  const sorted = [...selectedCountries].sort((a, b) => {
    if (comparisonMetric === "area") return b.area - a.area;
    if (comparisonMetric === "population") return b.population - a.population;
    return b.gdp - a.gdp;
  });

  if (sorted.length === 0) {
    return (
      <div
        className="flex-1 flex items-center justify-center bg-background"
        data-ocid="comparison_table.empty_state"
      >
        <div className="text-center">
          <p className="text-sm font-mono text-muted-foreground">
            Karşılaştırma tablosu için ülke ekleyin
          </p>
          <p className="text-xs font-mono text-muted-foreground/60 mt-1">
            Üstteki arama kutusundan ülke seçin
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-auto bg-background p-4"
      data-ocid="comparison_table"
    >
      <table className="w-full text-sm font-mono border-collapse">
        <thead>
          <tr className="border-b border-border">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className={[
                  "py-2 px-3 text-[11px] uppercase tracking-wider font-semibold",
                  col.align === "right" ? "text-right" : "text-left",
                  col.metric === comparisonMetric
                    ? "text-primary"
                    : "text-muted-foreground",
                ].join(" ")}
              >
                {col.label}
                {col.metric === comparisonMetric && (
                  <span className="ml-1 text-primary">↓</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((country, i) => {
            const color = COLOR_MAP[country.color] ?? COLOR_MAP["chart-1"];
            return (
              <tr
                key={country.id}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                data-ocid={`comparison_table.item.${i + 1}`}
              >
                {COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    className={[
                      "py-2.5 px-3 text-[12px]",
                      col.align === "right" ? "text-right" : "text-left",
                      col.key === "name"
                        ? "text-foreground font-medium"
                        : col.metric === comparisonMetric
                          ? "text-foreground font-semibold"
                          : "text-foreground/70",
                    ].join(" ")}
                    style={
                      col.key === "name"
                        ? {
                            borderLeftColor: color,
                            borderLeftWidth: 3,
                            paddingLeft: 12,
                          }
                        : {}
                    }
                  >
                    {formatValue(col, country)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
