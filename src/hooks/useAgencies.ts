import { useQuery } from '@tanstack/react-query';
import type { IApiResponse, IAgency } from '@/types';

export function useAgencies() {
  return useQuery({
    queryKey: ['agencies'],
    queryFn: async () => {
      const res = await fetch('/api/agencies');
      if (!res.ok) {
        throw new Error(`Failed to fetch agencies: ${res.status}`);
      }
      const json: IApiResponse<IAgency[]> = await res.json();
      return json.data;
    },
    staleTime: 30_000,
  });
}
