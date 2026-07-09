import { useQuery } from "@tanstack/react-query";

export interface CompanyInfo {
  name: string;
  address: string;
  street: string;
  zip: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  contactPerson: string;
  mapsQuery: string;
}

function buildPublicApiUrl(path: string) {
  const baseUrl = import.meta.env.VITE_PUBLIC_API_BASE_URL?.trim();
  if (!baseUrl) return path;
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

export function useCompany() {
  return useQuery<CompanyInfo>({
    queryKey: [buildPublicApiUrl("/api/company")],
    queryFn: async () => {
      const res = await fetch(buildPublicApiUrl("/api/company"));
      if (!res.ok) throw new Error("Company info not available");
      return res.json();
    },
    staleTime: 60 * 60 * 1000,
  });
}
