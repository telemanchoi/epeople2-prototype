import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  IApiResponse,
  IComplaintSummary,
  IComplaint,
  ComplaintStatus,
  ComplaintType,
} from '@/types';
import type { ComplaintFormData } from '@/stores';

// ─── Filter types ─────────────────────────────────────────────
export interface ComplaintFilters {
  status?: ComplaintStatus;
  type?: ComplaintType;
  agencyId?: string;
  overdue?: boolean;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface StatusUpdatePayload {
  id: string;
  status: ComplaintStatus;
  answerFr?: string;
  answerAr?: string;
}

interface TransferPayload {
  id: string;
  targetAgencyId: string;
  reasonFr: string;
  reasonAr?: string;
}

interface ExtendDeadlinePayload {
  id: string;
  requestedAdditionalDays: number;
  reasonFr: string;
  reasonAr?: string;
}

interface JointProcessPayload {
  id: string;
  cooperatingAgencyIds: string[];
  reasonFr: string;
}

interface SatisfactionPayload {
  id: string;
  score: 1 | 2 | 3 | 4 | 5;
  commentFr?: string;
  commentAr?: string;
}

interface DuplicateCheckParams {
  categoryL2: string;
  regionCode: string;
}

// ─── Queries ─────────────────────────────────────────────────

export function useComplaints(filters?: ComplaintFilters) {
  return useQuery({
    queryKey: ['complaints', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          if (value !== undefined && value !== null && value !== '') {
            params.set(key, String(value));
          }
        }
      }
      const res = await fetch(`/api/complaints?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch complaints: ${res.status}`);
      }
      const json: IApiResponse<IComplaintSummary[]> = await res.json();
      return json;
    },
    staleTime: 30_000,
  });
}

export function useComplaint(id: string | undefined) {
  return useQuery({
    queryKey: ['complaints', id],
    queryFn: async () => {
      const res = await fetch(`/api/complaints/${id}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch complaint: ${res.status}`);
      }
      const json: IApiResponse<IComplaint> = await res.json();
      return json.data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

// ─── Mutations ───────────────────────────────────────────────

export function useSubmitComplaint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ComplaintFormData) => {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        throw new Error(`Failed to submit complaint: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
    },
  });
}

export function useUpdateComplaintStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: StatusUpdatePayload) => {
      const res = await fetch(`/api/complaints/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`Failed to update complaint status: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      queryClient.invalidateQueries({
        queryKey: ['complaints', variables.id],
      });
    },
  });
}

export function useTransferComplaint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: TransferPayload) => {
      const res = await fetch(`/api/complaints/${id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`Failed to transfer complaint: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      queryClient.invalidateQueries({
        queryKey: ['complaints', variables.id],
      });
    },
  });
}

export function useExtendDeadline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: ExtendDeadlinePayload) => {
      const res = await fetch(`/api/complaints/${id}/extend-deadline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`Failed to extend deadline: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      queryClient.invalidateQueries({
        queryKey: ['complaints', variables.id],
      });
    },
  });
}

export function useJointProcess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: JointProcessPayload) => {
      const res = await fetch(`/api/complaints/${id}/joint-process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`Failed to start joint process: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      queryClient.invalidateQueries({
        queryKey: ['complaints', variables.id],
      });
    },
  });
}

export function useSubmitSatisfaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: SatisfactionPayload) => {
      const res = await fetch(`/api/complaints/${id}/satisfaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`Failed to submit satisfaction: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      queryClient.invalidateQueries({
        queryKey: ['complaints', variables.id],
      });
    },
  });
}

export function useDuplicateCheck(params: DuplicateCheckParams | undefined) {
  return useQuery({
    queryKey: ['complaints', 'duplicate-check', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params) {
        searchParams.set('categoryL2', params.categoryL2);
        searchParams.set('regionCode', params.regionCode);
      }
      const res = await fetch(
        `/api/complaints/duplicate-check?${searchParams.toString()}`
      );
      if (!res.ok) {
        throw new Error(`Failed to check duplicates: ${res.status}`);
      }
      return res.json();
    },
    enabled: !!params?.categoryL2 && !!params?.regionCode,
    staleTime: 30_000,
  });
}
