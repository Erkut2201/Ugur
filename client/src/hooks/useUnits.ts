// client/src/hooks/useUnits.ts
// Shared hook to fetch the units catalog from the API.
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.js";

export interface UnitEntry {
  id: number;
  name: string;
  sortOrder: number;
}

export function useUnits() {
  const { data, isLoading } = useQuery<UnitEntry[]>({
    queryKey: ["/api/units"],
    queryFn: () => api.get<UnitEntry[]>("/api/units"),
    staleTime: 60_000,
  });
  return { units: data ?? [], isLoading };
}
