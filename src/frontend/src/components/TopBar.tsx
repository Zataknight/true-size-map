import { Globe, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { searchCountries } from "../data/countries";
import { useMapStore } from "../hooks/useMapStore";
import type { CountryData } from "../types/country";

export function TopBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CountryData[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { addCountry, clearAll, selectedCountries } = useMapStore();

  useEffect(() => {
    if (query.length > 0) {
      setResults(searchCountries(query));
      setOpen(true);
    } else {
      setResults([]);
      setOpen(false);
    }
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(country: CountryData) {
    addCountry(country);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  return (
    <header
      className="flex items-center gap-4 px-4 h-14 bg-card border-b border-border shrink-0"
      data-ocid="topbar"
    >
      {/* Brand */}
      <div className="flex items-center gap-2 shrink-0">
        <Globe size={18} className="text-primary" />
        <span className="font-display font-bold text-sm tracking-widest uppercase text-foreground">
          True Size Map
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-border shrink-0" />

      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <div className="flex items-center gap-2 bg-secondary border border-border px-3 h-9 rounded-sm">
          <Search size={14} className="text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search country…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length > 0 && setOpen(true)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-body min-w-0"
            data-ocid="search_input"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setOpen(false);
              }}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {open && results.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute top-full mt-1 left-0 right-0 bg-card border border-border rounded-sm z-50 max-h-64 overflow-y-auto"
            data-ocid="search_dropdown"
          >
            {results.map((country) => {
              const isSelected = selectedCountries.some(
                (c) => c.id === country.id,
              );
              const isFull = selectedCountries.length >= 6 && !isSelected;
              return (
                <button
                  type="button"
                  key={country.id}
                  onClick={() =>
                    !isFull && !isSelected && handleSelect(country)
                  }
                  disabled={isFull || isSelected}
                  className={[
                    "w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors",
                    isSelected
                      ? "opacity-40 cursor-default bg-muted"
                      : isFull
                        ? "opacity-30 cursor-not-allowed"
                        : "hover:bg-muted cursor-pointer",
                  ].join(" ")}
                  data-ocid={`search_result.${country.id}`}
                >
                  <span className="text-base leading-none">{country.flag}</span>
                  <span className="flex-1 font-body text-foreground truncate">
                    {country.name}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono shrink-0">
                    {(country.area / 1000).toFixed(0)}k km²
                  </span>
                  {isSelected && (
                    <span className="text-xs text-primary shrink-0">Added</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Count indicator */}
      <span className="text-xs font-mono text-muted-foreground shrink-0">
        {selectedCountries.length}/6
      </span>

      {/* Clear all */}
      {selectedCountries.length > 0 && (
        <button
          type="button"
          onClick={clearAll}
          className="text-xs font-mono text-muted-foreground hover:text-destructive transition-colors shrink-0"
          data-ocid="clear_all_button"
        >
          CLEAR ALL
        </button>
      )}
    </header>
  );
}
