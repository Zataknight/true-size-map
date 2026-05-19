import { useMapStore } from "../hooks/useMapStore";
import type { ComparisonMetric, SelectedCountry } from "../types/country";

function formatRatio(ratio: number): string {
  if (ratio >= 100) return `${Math.round(ratio)}×`;
  if (ratio >= 10) return `${ratio.toFixed(1)}×`;
  return `${ratio.toFixed(2)}×`;
}

function buildSentence(
  a: SelectedCountry,
  b: SelectedCountry,
  metric: ComparisonMetric,
): string {
  let valA: number;
  let valB: number;

  if (metric === "area") {
    valA = a.area;
    valB = b.area;
  } else if (metric === "population") {
    valA = a.population;
    valB = b.population;
  } else {
    valA = a.gdp;
    valB = b.gdp;
  }

  if (valA === valB)
    return `${a.flag} ${a.name} ve ${b.flag} ${b.name} eşit büyüklükte`;

  const larger = valA > valB ? a : b;
  const smaller = valA > valB ? b : a;
  const largerVal = valA > valB ? valA : valB;
  const smallerVal = valA > valB ? valB : valA;

  if (smallerVal === 0)
    return `${larger.flag} ${larger.name} en yüksek değere sahip`;

  const ratio = largerVal / smallerVal;
  const ratioStr = formatRatio(ratio);

  if (metric === "area") {
    return `${larger.flag} ${larger.name}, ${smaller.flag} ${smaller.name}'den ${ratioStr} büyük`;
  }
  if (metric === "population") {
    return `${larger.flag} ${larger.name}'nin nüfusu ${smaller.flag} ${smaller.name}'nin ${ratioStr} katı`;
  }
  return `${larger.flag} ${larger.name}'nin GSYİH'si ${smaller.flag} ${smaller.name}'nin ${ratioStr} katı`;
}

export function ComparisonRow() {
  const { selectedCountries, comparisonMetric } = useMapStore();

  if (selectedCountries.length < 2) return null;

  const sorted = [...selectedCountries].sort((a, b) => {
    if (comparisonMetric === "area") return b.area - a.area;
    if (comparisonMetric === "population") return b.population - a.population;
    return b.gdp - a.gdp;
  });

  const comparisons: string[] = [];
  const largest = sorted[0];
  const smallest = sorted[sorted.length - 1];

  if (largest && smallest && largest.id !== smallest.id) {
    comparisons.push(buildSentence(largest, smallest, comparisonMetric));
  }

  for (let i = 0; i < Math.min(sorted.length - 1, 2); i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (a && b && !(a.id === largest?.id && b.id === smallest?.id)) {
      comparisons.push(buildSentence(a, b, comparisonMetric));
    }
  }

  return (
    <div
      className="flex items-center gap-4 px-4 py-1.5 bg-muted/40 border-t border-border overflow-x-auto shrink-0"
      data-ocid="comparison_row"
    >
      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider shrink-0">
        Karşılaştır
      </span>
      {comparisons.slice(0, 3).map((text, i) => (
        <span
          key={`${i}-${text.slice(0, 10)}`}
          className="text-[11px] font-mono text-foreground/80 shrink-0 whitespace-nowrap"
          data-ocid={`comparison_row.item.${i + 1}`}
        >
          {text}
        </span>
      ))}
    </div>
  );
}
