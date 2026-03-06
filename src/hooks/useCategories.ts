import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/utils/api';
import type { IApiResponse, ICategory } from '@/types';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiFetch('/api/categories');
      if (!res.ok) {
        throw new Error(`Failed to fetch categories: ${res.status}`);
      }
      const json: IApiResponse<ICategory[]> = await res.json();
      return json.data;
    },
    staleTime: 30_000,
  });
}
