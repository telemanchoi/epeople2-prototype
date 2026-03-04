import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  IApiResponse,
  ICorruptionReportSummary,
  CorruptionReportType,
  CorruptionReportStatus,
} from '@/types';

// ─── Types ───────────────────────────────────────────────────

interface SubmitReportPayload {
  type: CorruptionReportType;
  targetAgencyId: string;
  incidentDate?: string;
  locationFr?: string;
  locationAr?: string;
  contentFr: string;
  contentAr: string;
  attachmentIds: string[];
  isAnonymous: boolean;
  anonymousToken?: string;
}

interface ReportFilters {
  status?: CorruptionReportStatus;
  type?: CorruptionReportType;
  agencyId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
}

interface UpdateReportStatusPayload {
  id: string;
  status: CorruptionReportStatus;
  noteFr?: string;
  noteAr?: string;
}

interface TrackReportResponse {
  reportId: string;
  status: CorruptionReportStatus;
  lastUpdatedAt: string;
  statusMessage: {
    fr: string;
    ar: string;
  };
}

// ─── Mutations ───────────────────────────────────────────────

export function useSubmitReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SubmitReportPayload) => {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        throw new Error(`Failed to submit report: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

// ─── Queries ─────────────────────────────────────────────────

export function useTrackReport(code: string | undefined) {
  return useQuery({
    queryKey: ['reports', 'track', code],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (code) {
        params.set('token', code);
      }
      const res = await fetch(`/api/reports/track?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to track report: ${res.status}`);
      }
      const json: IApiResponse<TrackReportResponse> = await res.json();
      return json.data;
    },
    enabled: !!code,
    staleTime: 30_000,
  });
}

export function useReports(filters?: ReportFilters) {
  return useQuery({
    queryKey: ['reports', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          if (value !== undefined && value !== null && value !== '') {
            params.set(key, String(value));
          }
        }
      }
      const res = await fetch(`/api/reports?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch reports: ${res.status}`);
      }
      const json: IApiResponse<ICorruptionReportSummary[]> = await res.json();
      return json;
    },
    staleTime: 30_000,
  });
}

// ─── DGGPC Mutations ─────────────────────────────────────────

export function useUpdateReportStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateReportStatusPayload) => {
      const res = await fetch(`/api/reports/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`Failed to update report status: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}
