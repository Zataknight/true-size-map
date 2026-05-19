export type Continent =
  | "Africa"
  | "Antarctica"
  | "Asia"
  | "Europe"
  | "North America"
  | "Oceania"
  | "South America";

export type ComparisonMetric = "area" | "population" | "gdp";

export interface CountryData {
  id: string;
  name: string;
  area: number; // km²
  population: number;
  gdp: number; // USD billions (World Bank ~2023)
  flag: string;
  continent: Continent;
  lat: number; // approximate centroid latitude (degrees) for Mercator distortion
}

export type ChartColor =
  | "chart-1"
  | "chart-2"
  | "chart-3"
  | "chart-4"
  | "chart-5"
  | "chart-6";

export interface SelectedCountry extends CountryData {
  color: ChartColor;
  position: { lng: number; lat: number }; // geographic offset from original position
  zIndex: number;
}

export interface WorldCountry {
  id: string;
  position: { lng: number; lat: number }; // geographic offset (lng/lat degrees)
  zIndex: number;
  isDragging: boolean;
}

export interface FavoriteEntry {
  id: string;
  name: string;
  countryIds: string[];
  metric: ComparisonMetric;
  createdAt: number; // timestamp ms
}
