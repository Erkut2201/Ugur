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

export function useCompany() {
  return useQuery<CompanyInfo>({
    queryKey: ["/api/company"],
    queryFn: async () => {
      const res = await fetch("/api/company");
      if (!res.ok) throw new Error("Company info not available");
      return res.json();
    },
    staleTime: 60 * 60 * 1000, // cache 1h — rarely changes
  });
}
