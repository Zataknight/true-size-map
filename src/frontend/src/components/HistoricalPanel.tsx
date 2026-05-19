import { useState } from "react";
import { useMapStore } from "../hooks/useMapStore";

const COLOR_MAP: Record<string, string> = {
  "chart-1": "oklch(0.75 0.18 195)",
  "chart-2": "oklch(0.65 0.22 310)",
  "chart-3": "oklch(0.65 0.22 40)",
  "chart-4": "oklch(0.75 0.18 145)",
  "chart-5": "oklch(0.7 0.2 70)",
  "chart-6": "oklch(0.68 0.18 280)",
};

const YEARS = [2000, 2005, 2010, 2015, 2020, 2023];

// GDP in billions USD, population in millions
interface HistoricalRecord {
  gdp: number[]; // index matches YEARS
  pop: number[]; // index matches YEARS, in millions
}

const HISTORICAL_DATA: Record<string, HistoricalRecord> = {
  us: {
    gdp: [10252, 13094, 15049, 18225, 21060, 27360],
    pop: [282, 296, 309, 321, 331, 335],
  },
  cn: {
    gdp: [1214, 2286, 6100, 11065, 14723, 17960],
    pop: [1267, 1303, 1341, 1376, 1412, 1409],
  },
  jp: {
    gdp: [4888, 4755, 5700, 4445, 5050, 4230],
    pop: [127, 128, 128, 127, 125, 124],
  },
  de: {
    gdp: [1946, 2861, 3417, 3376, 3890, 4456],
    pop: [82, 82, 81, 82, 84, 84],
  },
  gb: {
    gdp: [1663, 2487, 2490, 2896, 2700, 3090],
    pop: [59, 60, 63, 65, 67, 68],
  },
  fr: {
    gdp: [1362, 2200, 2648, 2434, 2700, 2920],
    pop: [61, 63, 65, 67, 68, 68],
  },
  in: {
    gdp: [477, 820, 1706, 2103, 2700, 3730],
    pop: [1053, 1134, 1230, 1310, 1393, 1429],
  },
  it: {
    gdp: [1137, 1850, 2126, 1835, 1890, 2170],
    pop: [57, 58, 60, 61, 60, 59],
  },
  br: {
    gdp: [644, 882, 2209, 1802, 1445, 2180],
    pop: [174, 186, 198, 207, 213, 214],
  },
  ca: {
    gdp: [742, 1164, 1617, 1558, 1650, 2090],
    pop: [31, 32, 34, 36, 38, 40],
  },
  ru: {
    gdp: [260, 764, 1525, 1363, 1480, 2240],
    pop: [146, 143, 142, 144, 145, 145],
  },
  au: {
    gdp: [414, 727, 1143, 1348, 1330, 1690],
    pop: [19, 20, 22, 24, 26, 26],
  },
  es: {
    gdp: [595, 1158, 1421, 1197, 1280, 1580],
    pop: [40, 43, 47, 47, 47, 47],
  },
  kr: {
    gdp: [533, 898, 1094, 1383, 1644, 1710],
    pop: [47, 48, 49, 51, 52, 52],
  },
  mx: {
    gdp: [581, 866, 1058, 1170, 1090, 1322],
    pop: [98, 106, 113, 121, 126, 130],
  },
  id: {
    gdp: [165, 286, 755, 861, 1060, 1370],
    pop: [212, 225, 244, 259, 274, 276],
  },
  nl: { gdp: [415, 673, 836, 756, 910, 1100], pop: [16, 16, 17, 17, 17, 18] },
  sa: { gdp: [189, 316, 528, 654, 700, 1069], pop: [22, 24, 28, 31, 35, 36] },
  tr: { gdp: [200, 483, 771, 862, 720, 1108], pop: [68, 72, 74, 78, 83, 85] },
  ch: { gdp: [265, 372, 523, 664, 750, 870], pop: [7, 7, 8, 8, 9, 9] },
  ar: { gdp: [284, 181, 423, 583, 385, 621], pop: [37, 39, 40, 43, 45, 46] },
  pl: { gdp: [172, 304, 481, 477, 596, 750], pop: [38, 38, 38, 38, 38, 38] },
  se: { gdp: [257, 371, 489, 493, 540, 594], pop: [9, 9, 9, 10, 10, 10] },
  no: { gdp: [168, 303, 420, 388, 366, 499], pop: [4, 5, 5, 5, 5, 5] },
  za: { gdp: [133, 247, 375, 315, 302, 378], pop: [46, 49, 52, 55, 59, 60] },
  eg: { gdp: [100, 90, 219, 330, 364, 404], pop: [69, 76, 84, 93, 102, 105] },
  ng: {
    gdp: [47, 112, 369, 494, 432, 477],
    pop: [124, 140, 159, 182, 206, 219],
  },
  pk: {
    gdp: [74, 110, 177, 270, 263, 341],
    pop: [144, 156, 170, 189, 220, 231],
  },
  bd: {
    gdp: [48, 61, 115, 195, 330, 437],
    pop: [131, 142, 152, 163, 170, 174],
  },
  vn: { gdp: [31, 54, 116, 193, 271, 430], pop: [78, 83, 87, 92, 97, 99] },
  th: { gdp: [126, 176, 341, 401, 499, 512], pop: [64, 67, 69, 71, 71, 72] },
};

type HistoricMetric = "gdp" | "pop";

interface LineChartProps {
  data: {
    country: { id: string; name: string; flag: string; color: string };
    values: number[];
  }[];
  years: number[];
  unit: string;
  formatVal: (v: number) => string;
}

function LineChart({ data, years, unit, formatVal }: LineChartProps) {
  const WIDTH = 600;
  const HEIGHT = 200;
  const PAD_L = 60;
  const PAD_R = 20;
  const PAD_T = 16;
  const PAD_B = 32;

  const allVals = data.flatMap((d) => d.values).filter((v) => v > 0);
  const minVal = 0;
  const maxVal = Math.max(...allVals) * 1.1;
  const chartW = WIDTH - PAD_L - PAD_R;
  const chartH = HEIGHT - PAD_T - PAD_B;

  function px(yearIdx: number, val: number) {
    const x = PAD_L + (yearIdx / (years.length - 1)) * chartW;
    const y = PAD_T + chartH - ((val - minVal) / (maxVal - minVal)) * chartH;
    return { x, y };
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full min-w-[300px]"
        style={{ height: HEIGHT }}
        role="img"
        aria-label="Tarihsel veri çizgi grafiği"
      >
        {/* Y axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const val = minVal + frac * (maxVal - minVal);
          const y = PAD_T + chartH - frac * chartH;
          return (
            <g key={frac}>
              <line
                x1={PAD_L}
                y1={y}
                x2={WIDTH - PAD_R}
                y2={y}
                stroke="oklch(0.28 0.02 260 / 0.3)"
                strokeWidth={1}
              />
              <text
                x={PAD_L - 4}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={9}
                fill="oklch(0.55 0.03 260)"
              >
                {formatVal(val)}
              </text>
            </g>
          );
        })}

        {/* X axis labels */}
        {years.map((yr, i) => {
          const { x } = px(i, 0);
          return (
            <text
              key={yr}
              x={x}
              y={HEIGHT - PAD_B + 14}
              textAnchor="middle"
              fontSize={9}
              fill="oklch(0.55 0.03 260)"
            >
              {yr}
            </text>
          );
        })}

        {/* Lines */}
        {data.map(({ country, values }) => {
          const color = COLOR_MAP[country.color] ?? COLOR_MAP["chart-1"];
          const points = values.map((v, i) => px(i, v));
          const d = points
            .map(
              (p, i) =>
                `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`,
            )
            .join(" ");
          return (
            <g key={country.id}>
              <path
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {points.map((p, i) => (
                <circle
                  key={`${country.id}-pt-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={3}
                  fill={color}
                />
              ))}
            </g>
          );
        })}

        {/* Unit label */}
        <text x={4} y={PAD_T} fontSize={9} fill="oklch(0.55 0.03 260)">
          {unit}
        </text>
      </svg>
    </div>
  );
}

export function HistoricalPanel() {
  const { selectedCountries } = useMapStore();
  const [activeMetric, setActiveMetric] = useState<HistoricMetric>("gdp");

  if (selectedCountries.length === 0) {
    return (
      <div
        className="flex-1 flex items-center justify-center bg-background"
        data-ocid="historical_panel.empty_state"
      >
        <div className="text-center">
          <p className="text-sm font-mono text-muted-foreground">
            Tarihsel veri için ülke ekleyin
          </p>
          <p className="text-xs font-mono text-muted-foreground/60 mt-1">
            Üstteki arama kutusundan ülke seçin
          </p>
        </div>
      </div>
    );
  }

  const countriesWithData = selectedCountries.filter(
    (c) => c.id in HISTORICAL_DATA,
  );
  const missingCountries = selectedCountries.filter(
    (c) => !(c.id in HISTORICAL_DATA),
  );

  const gdpData = countriesWithData.map((c) => ({
    country: c,
    values: HISTORICAL_DATA[c.id]!.gdp,
  }));

  const popData = countriesWithData.map((c) => ({
    country: c,
    values: HISTORICAL_DATA[c.id]!.pop,
  }));

  return (
    <div
      className="flex-1 overflow-auto bg-background p-5"
      data-ocid="historical_panel"
    >
      {/* Metric toggle */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Göster:
        </span>
        <div className="flex items-center gap-0 border border-border rounded-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setActiveMetric("gdp")}
            className={[
              "px-3 py-1 text-[11px] font-mono uppercase tracking-wider transition-colors",
              activeMetric === "gdp"
                ? "bg-primary text-background"
                : "bg-card text-muted-foreground hover:text-foreground",
            ].join(" ")}
            data-ocid="historical_panel.gdp.tab"
          >
            GSYİH Trendi
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric("pop")}
            className={[
              "px-3 py-1 text-[11px] font-mono uppercase tracking-wider transition-colors border-l border-border",
              activeMetric === "pop"
                ? "bg-primary text-background"
                : "bg-card text-muted-foreground hover:text-foreground",
            ].join(" ")}
            data-ocid="historical_panel.pop.tab"
          >
            Nüfus Trendi
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        {countriesWithData.map((c) => {
          const color = COLOR_MAP[c.color] ?? COLOR_MAP["chart-1"];
          return (
            <div key={c.id} className="flex items-center gap-1.5">
              <div
                className="w-6 h-0.5 rounded"
                style={{ background: color }}
              />
              <span className="text-xs font-mono text-foreground/70">
                {c.flag} {c.name}
              </span>
            </div>
          );
        })}
      </div>

      {countriesWithData.length === 0 ? (
        <div className="p-4 bg-muted/30 rounded-sm border border-border">
          <p className="text-xs font-mono text-muted-foreground">
            Seçili ülkeler için tarihsel veri mevcut değil.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-card border border-border rounded-sm p-4 mb-4">
            <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">
              {activeMetric === "gdp" ? "GSYİH Trendi" : "Nüfus Trendi"}
              <span className="ml-2 text-primary/70">
                ({activeMetric === "gdp" ? "Milyar $" : "Milyon kişi"})
              </span>
            </h3>
            {activeMetric === "gdp" ? (
              <LineChart
                data={gdpData}
                years={YEARS}
                unit="Milyar $"
                formatVal={(v) =>
                  v >= 1000
                    ? `$${(v / 1000).toFixed(1)}T`
                    : `$${Math.round(v)}B`
                }
              />
            ) : (
              <LineChart
                data={popData}
                years={YEARS}
                unit="Milyon kişi"
                formatVal={(v) => `${Math.round(v)}M`}
              />
            )}
          </div>

          {/* Data table */}
          <div className="bg-card border border-border rounded-sm overflow-hidden">
            <div className="px-3 py-2 border-b border-border">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                {activeMetric === "gdp" ? "GSYİH (Milyar $)" : "Nüfus (Milyon)"}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="py-1.5 px-3 text-left text-[10px] text-muted-foreground">
                      Ülke
                    </th>
                    {YEARS.map((yr) => (
                      <th
                        key={yr}
                        className="py-1.5 px-3 text-right text-[10px] text-muted-foreground"
                      >
                        {yr}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(activeMetric === "gdp" ? gdpData : popData).map(
                    ({ country, values }, ri) => {
                      const color =
                        COLOR_MAP[country.color] ?? COLOR_MAP["chart-1"];
                      return (
                        <tr
                          key={country.id}
                          className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                          data-ocid={`historical_panel.item.${ri + 1}`}
                        >
                          <td
                            className="py-1.5 px-3 text-foreground/80"
                            style={{
                              borderLeftColor: color,
                              borderLeftWidth: 2,
                              paddingLeft: 10,
                            }}
                          >
                            {country.flag} {country.name}
                          </td>
                          {values.map((v, vi) => (
                            <td
                              key={YEARS[vi]}
                              className="py-1.5 px-3 text-right text-foreground/70"
                            >
                              {activeMetric === "gdp"
                                ? v >= 1000
                                  ? `$${(v / 1000).toFixed(1)}T`
                                  : `$${v}B`
                                : `${v}M`}
                            </td>
                          ))}
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {missingCountries.length > 0 && (
        <div className="mt-3 px-3 py-2 bg-muted/20 border border-border/50 rounded-sm">
          <p className="text-[10px] font-mono text-muted-foreground">
            Tarihsel veri bulunamayan ülkeler:{" "}
            {missingCountries.map((c) => `${c.flag} ${c.name}`).join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}
