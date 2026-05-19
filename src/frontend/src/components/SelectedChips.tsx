import { X } from "lucide-react";
import { useMapStore } from "../hooks/useMapStore";
import type { SelectedCountry } from "../types/country";

const COLOR_MAP: Record<string, string> = {
  "chart-1": "oklch(0.75 0.18 195)",
  "chart-2": "oklch(0.65 0.22 310)",
  "chart-3": "oklch(0.65 0.22 40)",
  "chart-4": "oklch(0.75 0.18 145)",
  "chart-5": "oklch(0.7 0.2 70)",
  "chart-6": "oklch(0.68 0.18 280)",
};

interface ChipProps {
  country: SelectedCountry;
  index: number;
}

function CountryChip({ country, index }: ChipProps) {
  const { removeCountry } = useMapStore();
  const color = COLOR_MAP[country.color] ?? COLOR_MAP["chart-1"];

  return (
    <div
      className="flex items-center gap-1.5 bg-secondary border border-border px-2 h-7 rounded-sm shrink-0 group"
      style={{ borderLeftColor: color, borderLeftWidth: 2 }}
      data-ocid={`selected_chip.item.${index + 1}`}
    >
      <span className="text-sm leading-none">{country.flag}</span>
      <span className="text-xs font-body text-foreground truncate max-w-[90px]">
        {country.name}
      </span>
      <button
        type="button"
        onClick={() => removeCountry(country.id)}
        className="text-muted-foreground hover:text-destructive transition-colors ml-0.5"
        aria-label={`Kaldır ${country.name}`}
        data-ocid={`selected_chip.delete_button.${index + 1}`}
      >
        <X size={10} />
      </button>
    </div>
  );
}

export function SelectedChips() {
  const { selectedCountries } = useMapStore();

  if (selectedCountries.length === 0) return null;

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 bg-background border-b border-border overflow-x-auto shrink-0"
      data-ocid="selected_chips"
    >
      {selectedCountries.map((country, i) => (
        <CountryChip key={country.id} country={country} index={i} />
      ))}
      <span className="text-[10px] font-mono text-muted-foreground shrink-0 ml-auto">
        {selectedCountries.length}/6 ülke
      </span>
    </div>
  );
}
