import { useMapStore } from "../hooks/useMapStore";
import { StatCard } from "./StatCard";

export function StatBar() {
  const { selectedCountries } = useMapStore();

  if (selectedCountries.length === 0) {
    return (
      <footer
        className="flex items-center justify-center h-12 bg-card border-t border-border shrink-0 px-4"
        data-ocid="statbar"
      >
        <p className="text-xs font-mono text-muted-foreground tracking-wider uppercase">
          Gerçek boyutlarını karşılaştırmak için ülke ara ve ekle
        </p>
      </footer>
    );
  }

  return (
    <footer
      className="flex items-center gap-3 h-[88px] bg-card border-t border-border shrink-0 px-4 overflow-x-auto scrollbar-thin"
      data-ocid="statbar"
    >
      {selectedCountries.map((country, i) => (
        <StatCard key={country.id} country={country} index={i} />
      ))}

      {selectedCountries.length < 6 && (
        <div className="flex items-center justify-center w-40 h-16 border border-dashed border-border rounded-sm shrink-0">
          <span className="text-xs font-mono text-muted-foreground">
            + ülke ekle
          </span>
        </div>
      )}
    </footer>
  );
}
