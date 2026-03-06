import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/utils/api';
import type {
  IApiResponse,
  IStatisticsOverview,
  ITrendDataPoint,
  ITypeDistribution,
  IAgencyPerformance,
  IRepeatedComplaintRecord,
  ILongOverdueComplaint,
} from '@/types';

// ─── Shared filter types ─────────────────────────────────────

interface StatisticsFilters {
  dateFrom?: string;
  dateTo?: string;
  agencyId?: string;
}

interface TrendFilters extends StatisticsFilters {
  period?: 'daily' | 'monthly';
}

// ─── Queries ─────────────────────────────────────────────────

export function useStatisticsOverview(filters?: StatisticsFilters) {
  return useQuery({
    queryKey: ['statistics', 'overview', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          if (value !== undefined && value !== null && value !== '') {
            params.set(key, String(value));
          }
        }
      }
      const res = await apiFetch(
        `/api/statistics/overview?${params.toString()}`
      );
      if (!res.ok) {
        throw new Error(
          `Failed to fetch statistics overview: ${res.status}`
        );
      }
      const json: IApiResponse<IStatisticsOverview> = await res.json();
      return json.data;
    },
    staleTime: 30_000,
  });
}

export function useTrend(filters?: TrendFilters) {
  return useQuery({
    queryKey: ['statistics', 'trend', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          if (value !== undefined && value !== null && value !== '') {
            params.set(key, String(value));
          }
        }
      }
      const res = await apiFetch(
        `/api/statistics/trend?${params.toString()}`
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch trend data: ${res.status}`);
      }
      const json: IApiResponse<ITrendDataPoint[]> = await res.json();
      return json.data;
    },
    staleTime: 30_000,
  });
}

export function useByType(filters?: StatisticsFilters) {
  return useQuery({
    queryKey: ['statistics', 'by-type', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          if (value !== undefined && value !== null && value !== '') {
            params.set(key, String(value));
          }
        }
      }
      const res = await apiFetch(
        `/api/statistics/by-type?${params.toString()}`
      );
      if (!res.ok) {
        throw new Error(
          `Failed to fetch type distribution: ${res.status}`
        );
      }
      const json: IApiResponse<ITypeDistribution[]> = await res.json();
      return json.data;
    },
    staleTime: 30_000,
  });
}

export function useByAgency(filters?: StatisticsFilters) {
  return useQuery({
    queryKey: ['statistics', 'by-agency', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          if (value !== undefined && value !== null && value !== '') {
            params.set(key, String(value));
          }
        }
      }
      const res = await apiFetch(
        `/api/statistics/by-agency?${params.toString()}`
      );
      if (!res.ok) {
        throw new Error(
          `Failed to fetch agency statistics: ${res.status}`
        );
      }
      const json: IApiResponse<IAgencyPerformance[]> = await res.json();
      return json.data;
    },
    staleTime: 30_000,
  });
}

export function useRepeatedComplaints(filters?: StatisticsFilters) {
  return useQuery({
    queryKey: ['statistics', 'repeated-complaints', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          if (value !== undefined && value !== null && value !== '') {
            params.set(key, String(value));
          }
        }
      }
      const res = await apiFetch(
        `/api/statistics/repeated-complaints?${params.toString()}`
      );
      if (!res.ok) {
        throw new Error(
          `Failed to fetch repeated complaints: ${res.status}`
        );
      }
      const json: IApiResponse<IRepeatedComplaintRecord[]> =
        await res.json();
      return json.data;
    },
    staleTime: 30_000,
  });
}

export function useLongOverdue(filters?: StatisticsFilters) {
  return useQuery({
    queryKey: ['statistics', 'long-overdue', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          if (value !== undefined && value !== null && value !== '') {
            params.set(key, String(value));
          }
        }
      }
      const res = await apiFetch(
        `/api/statistics/long-overdue?${params.toString()}`
      );
      if (!res.ok) {
        throw new Error(
          `Failed to fetch long overdue complaints: ${res.status}`
        );
      }
      const json: IApiResponse<ILongOverdueComplaint[]> =
        await res.json();
      return json.data;
    },
    staleTime: 30_000,
  });
}
