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

function getMetricValue(c: SelectedCountry, metric: ComparisonMetric): number {
  if (metric === "area") return c.area;
  if (metric === "population") return c.population;
  return c.gdp;
}

function formatMetricValue(val: number, metric: ComparisonMetric): string {
  if (metric === "area") {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M km²`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k km²`;
    return `${val} km²`;
  }
  if (metric === "population") {
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(2)}B`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    return `${(val / 1_000).toFixed(0)}k`;
  }
  // gdp
  if (val >= 1000) return `$${(val / 1000).toFixed(2)}T`;
  return `$${val.toFixed(0)}B`;
}

const METRIC_LABELS: Record<ComparisonMetric, string> = {
  area: "Alan",
  population: "Nüfus",
  gdp: "GSYİH",
};

const BAR_HEIGHT = 32;
const BAR_GAP = 12;
const LABEL_WIDTH = 160;
const VALUE_WIDTH = 80;
const PADDING = 16;

export function ComparisonChart() {
  const { selectedCountries, comparisonMetric } = useMapStore();

  const sorted = [...selectedCountries].sort(
    (a, b) =>
      getMetricValue(b, comparisonMetric) - getMetricValue(a, comparisonMetric),
  );

  if (sorted.length === 0) {
    return (
      <div
        className="flex-1 flex items-center justify-center bg-background"
        data-ocid="comparison_chart.empty_state"
      >
        <div className="text-center">
          <p className="text-sm font-mono text-muted-foreground">
            Grafik için ülke ekleyin
          </p>
          <p className="text-xs font-mono text-muted-foreground/60 mt-1">
            Üstteki arama kutusundan ülke seçin
          </p>
        </div>
      </div>
    );
  }

  const maxVal = Math.max(
    ...sorted.map((c) => getMetricValue(c, comparisonMetric)),
  );

  return (
    <div
      className="flex-1 overflow-auto bg-background flex flex-col"
      data-ocid="comparison_chart"
    >
      <div className="px-6 pt-5 pb-2">
        <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          {METRIC_LABELS[comparisonMetric]} Karşılaştırması
        </h2>
      </div>
      <div className="flex-1 px-6 pb-6">
        <svg
          width="100%"
          height={sorted.length * (BAR_HEIGHT + BAR_GAP) + PADDING * 2}
          className="overflow-visible"
          aria-label="Ülke karşılaştırma grafiği"
          role="img"
        >
          {sorted.map((country, i) => {
            const val = getMetricValue(country, comparisonMetric);
            const barColor = COLOR_MAP[country.color] ?? COLOR_MAP["chart-1"];
            const y = PADDING + i * (BAR_HEIGHT + BAR_GAP);

            return (
              <g key={country.id} data-ocid={`comparison_chart.item.${i + 1}`}>
                {/* Flag + Name label */}
                <foreignObject
                  x={0}
                  y={y + 4}
                  width={LABEL_WIDTH}
                  height={BAR_HEIGHT}
                >
                  <div className="flex items-center gap-1.5 h-full">
                    <span className="text-base leading-none shrink-0">
                      {country.flag}
                    </span>
                    <span className="text-xs font-mono text-foreground truncate">
                      {country.name}
                    </span>
                  </div>
                </foreignObject>

                {/* Bar background */}
                <rect
                  x={LABEL_WIDTH}
                  y={y}
                  width="100%"
                  height={BAR_HEIGHT}
                  fill="oklch(0.22 0.02 260 / 0.4)"
                  rx={3}
                />

                {/* Bar fill — use foreignObject for percentage width */}
                <foreignObject
                  x={LABEL_WIDTH}
                  y={y}
                  width={`calc(100% - ${LABEL_WIDTH + VALUE_WIDTH}px)`}
                  height={BAR_HEIGHT}
                >
                  <div className="w-full h-full overflow-hidden rounded-sm">
                    <div
                      style={{
                        width: maxVal > 0 ? `${(val / maxVal) * 100}%` : "0%",
                        height: "100%",
                        background: barColor,
                        opacity: 0.7,
                        borderRadius: 3,
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                </foreignObject>

                {/* Value label */}
                <foreignObject
                  x={`calc(100% - ${VALUE_WIDTH}px)`}
                  y={y + 4}
                  width={VALUE_WIDTH}
                  height={BAR_HEIGHT}
                >
                  <div className="flex items-center justify-end h-full pr-1">
                    <span className="text-[11px] font-mono text-foreground/80 whitespace-nowrap">
                      {formatMetricValue(val, comparisonMetric)}
                    </span>
                  </div>
                </foreignObject>
              </g>
            );
          })}

          {/* x-axis line */}
          <line
            x1={LABEL_WIDTH}
            y1={PADDING + sorted.length * (BAR_HEIGHT + BAR_GAP) - BAR_GAP}
            x2="100%"
            y2={PADDING + sorted.length * (BAR_HEIGHT + BAR_GAP) - BAR_GAP}
            stroke="oklch(0.35 0.02 260)"
            strokeWidth={1}
          />
        </svg>
      </div>

      <div className="px-6 pb-4 flex items-center gap-2">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          Metrik:
        </span>
        <span className="text-[10px] font-mono text-primary uppercase tracking-wider">
          {METRIC_LABELS[comparisonMetric]}
        </span>
        <span className="text-[10px] font-mono text-muted-foreground ml-2">
          (üst çubukta metrik değiştirin)
        </span>
      </div>
    </div>
  );
}
