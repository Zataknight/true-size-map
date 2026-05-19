import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createActor } from "../backend";
import type { ComparisonMetric, FavoriteEntry } from "../types/country";
import { useMapStore } from "./useMapStore";

/** Load favorites from backend on mount; fall back to localStorage (already in store). */
export function useFavorites() {
  const { actor, isFetching } = useActor(createActor);
  const { setFavorites } = useMapStore();

  const query = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      if (!actor) return null;
      const result = await actor.getFavorites();
      return result.map((f) => ({
        id: f.id,
        name: f.name,
        countryIds: f.countryIds,
        metric: f.metric as ComparisonMetric,
        createdAt: Number(f.createdAt),
      }));
    },
    enabled: !!actor && !isFetching,
  });

  // Sync backend favorites into store when loaded
  useEffect(() => {
    if (query.data) {
      setFavorites(query.data);
    }
  }, [query.data, setFavorites]);

  return query;
}

export function useSaveFavorite() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const { addFavoriteLocal, selectedCountries, comparisonMetric } =
    useMapStore();

  return useMutation({
    mutationFn: async (name: string) => {
      const countryIds = selectedCountries.map((c) => c.id);
      const newFav: FavoriteEntry = {
        id: `local-${Date.now()}`,
        name,
        countryIds,
        metric: comparisonMetric,
        createdAt: Date.now(),
      };

      if (actor) {
        try {
          const id = await actor.saveFavorite(
            name,
            countryIds,
            comparisonMetric,
          );
          newFav.id = id;
        } catch {
          // fallback to local ID
        }
      }

      addFavoriteLocal(newFav);
      return newFav;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}

export function useDeleteFavorite() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const { deleteFavoriteLocal } = useMapStore();

  return useMutation({
    mutationFn: async (id: string) => {
      deleteFavoriteLocal(id);
      if (actor && !id.startsWith("local-")) {
        try {
          await actor.deleteFavorite(id);
        } catch {
          // ignore backend error — already removed locally
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}
