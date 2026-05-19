import { create } from "zustand";
import { COUNTRIES } from "../data/countries";
import type {
  ChartColor,
  ComparisonMetric,
  FavoriteEntry,
  SelectedCountry,
  WorldCountry,
} from "../types/country";
import type { CountryData } from "../types/country";

const CHART_COLORS: ChartColor[] = [
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "chart-6",
];

const LS_KEY = "truesize_favorites";

function loadFavoritesFromLS(): FavoriteEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FavoriteEntry[];
  } catch {
    return [];
  }
}

function saveFavoritesToLS(favs: FavoriteEntry[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(favs));
  } catch {
    // ignore
  }
}

interface MapState {
  selectedCountries: SelectedCountry[];
  worldCountries: WorldCountry[];
  zCounter: number;
  worldZCounter: number;
  comparisonMetric: ComparisonMetric;
  favorites: FavoriteEntry[];
  // Selected country actions
  addCountry: (country: CountryData) => void;
  removeCountry: (id: string) => void;
  updatePosition: (id: string, lng: number, lat: number) => void;
  bringToFront: (id: string) => void;
  clearAll: () => void;
  // World map actions
  initWorldMap: () => void;
  updateWorldPosition: (
    id: string,
    position: { lng: number; lat: number },
  ) => void;
  bringWorldCountryToFront: (id: string) => void;
  // Metric actions
  setMetric: (metric: ComparisonMetric) => void;
  // Favorites actions
  setFavorites: (favs: FavoriteEntry[]) => void;
  addFavoriteLocal: (fav: FavoriteEntry) => void;
  deleteFavoriteLocal: (id: string) => void;
  loadFavorite: (fav: FavoriteEntry) => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  selectedCountries: [],
  worldCountries: [],
  zCounter: 1,
  worldZCounter: 1,
  comparisonMetric: "area",
  favorites: loadFavoritesFromLS(),

  addCountry: (country) => {
    const { selectedCountries, zCounter } = get();
    if (selectedCountries.length >= 6) return;
    if (selectedCountries.some((c) => c.id === country.id)) return;

    const usedColors = selectedCountries.map((c) => c.color);
    const color =
      CHART_COLORS.find((c) => !usedColors.includes(c)) ?? "chart-1";

    const newCountry: SelectedCountry = {
      ...country,
      color,
      position: { lng: 0, lat: 0 },
      zIndex: zCounter,
    };

    set({
      selectedCountries: [...selectedCountries, newCountry],
      zCounter: zCounter + 1,
    });
  },

  removeCountry: (id) => {
    set((state) => ({
      selectedCountries: state.selectedCountries.filter((c) => c.id !== id),
    }));
  },

  updatePosition: (id, lng, lat) => {
    set((state) => ({
      selectedCountries: state.selectedCountries.map((c) =>
        c.id === id ? { ...c, position: { lng, lat } } : c,
      ),
    }));
  },

  bringToFront: (id) => {
    const { zCounter } = get();
    set((state) => ({
      selectedCountries: state.selectedCountries.map((c) =>
        c.id === id ? { ...c, zIndex: zCounter } : c,
      ),
      zCounter: zCounter + 1,
    }));
  },

  clearAll: () => {
    set({ selectedCountries: [], zCounter: 1 });
  },

  initWorldMap: () => {
    if (get().worldCountries.length > 0) return;
    const worldCountries: WorldCountry[] = COUNTRIES.map((c, i) => ({
      id: c.id,
      position: { lng: 0, lat: 0 },
      zIndex: i,
      isDragging: false,
    }));
    set({ worldCountries, worldZCounter: COUNTRIES.length });
  },

  updateWorldPosition: (id, position) => {
    set((state) => ({
      worldCountries: state.worldCountries.map((c) =>
        c.id === id ? { ...c, position } : c,
      ),
    }));
  },

  bringWorldCountryToFront: (id) => {
    const { worldZCounter } = get();
    set((state) => ({
      worldCountries: state.worldCountries.map((c) =>
        c.id === id ? { ...c, zIndex: worldZCounter } : c,
      ),
      worldZCounter: worldZCounter + 1,
    }));
  },

  setMetric: (metric) => {
    set({ comparisonMetric: metric });
  },

  setFavorites: (favs) => {
    set({ favorites: favs });
    saveFavoritesToLS(favs);
  },

  addFavoriteLocal: (fav) => {
    const updated = [...get().favorites, fav];
    set({ favorites: updated });
    saveFavoritesToLS(updated);
  },

  deleteFavoriteLocal: (id) => {
    const updated = get().favorites.filter((f) => f.id !== id);
    set({ favorites: updated });
    saveFavoritesToLS(updated);
  },

  loadFavorite: (fav) => {
    const countryMap = new Map(COUNTRIES.map((c) => [c.id, c]));
    // Clear and reload
    set({ selectedCountries: [], zCounter: 1, comparisonMetric: fav.metric });
    const store = get();
    for (const id of fav.countryIds) {
      const c = countryMap.get(id);
      if (c) store.addCountry(c);
    }
  },
}));
