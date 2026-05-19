import { Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { searchCountries } from "../data/countries";
import { useMapStore } from "../hooks/useMapStore";
import type { CountryData } from "../types/country";

export function CountrySearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CountryData[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { addCountry, selectedCountries } = useMapStore();

  useEffect(() => {
    if (query.length > 0) {
      setResults(searchCountries(query));
      setOpen(true);
      setActiveIdx(-1);
    } else {
      setResults([]);
      setOpen(false);
    }
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = useCallback(
    (country: CountryData) => {
      addCountry(country);
      setQuery("");
      setOpen(false);
      inputRef.current?.blur();
    },
    [addCountry],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open || results.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && activeIdx >= 0) {
        e.preventDefault();
        const c = results[activeIdx];
        const isSelected = selectedCountries.some((sc) => sc.id === c.id);
        const isFull = selectedCountries.length >= 6;
        if (!isSelected && !isFull) handleSelect(c);
      } else if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    },
    [open, results, activeIdx, selectedCountries, handleSelect],
  );

  return (
    <div
      ref={wrapperRef}
      className="relative flex-1 max-w-sm"
      data-ocid="country_search"
      style={{ overflow: "visible" }}
    >
      <div className="flex items-center gap-2 bg-secondary border border-border px-3 h-9 rounded-sm">
        <Search size={14} className="text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Ülke ara…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
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
            aria-label="Aramayı temizle"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="fixed bg-card border border-border rounded-sm z-[9999] max-h-64 overflow-y-auto shadow-lg"
          style={{
            top: wrapperRef.current
              ? wrapperRef.current.getBoundingClientRect().bottom + 4
              : 0,
            left: wrapperRef.current
              ? wrapperRef.current.getBoundingClientRect().left
              : 0,
            width: wrapperRef.current
              ? wrapperRef.current.getBoundingClientRect().width
              : "auto",
          }}
          data-ocid="search_dropdown"
        >
          {results.map((country, idx) => {
            const isSelected = selectedCountries.some(
              (c) => c.id === country.id,
            );
            const isFull = selectedCountries.length >= 6 && !isSelected;
            return (
              <button
                type="button"
                key={country.id}
                onClick={() => !isFull && !isSelected && handleSelect(country)}
                disabled={isFull || isSelected}
                className={[
                  "w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors",
                  idx === activeIdx ? "bg-muted" : "",
                  isSelected
                    ? "opacity-40 cursor-default"
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
                  <span className="text-xs text-primary shrink-0">Eklendi</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
