import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/utils/api';
import type {
  IApiResponse,
  IProposalSummary,
  IProposal,
  ProposalStatus,
} from '@/types';

// ─── Types ───────────────────────────────────────────────────

export interface ProposalFilters {
  status?: ProposalStatus;
  categoryL1?: string;
  sortBy?: 'createdAt' | 'likeCount' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  perPage?: number;
}

interface SubmitProposalPayload {
  titleFr: string;
  titleAr: string;
  contentFr: string;
  contentAr: string;
  categoryL1: string;
  attachmentIds: string[];
}

interface ReviewProposalPayload {
  id: string;
  result: 'accepted' | 'rejected';
  reviewCommentFr: string;
  reviewCommentAr: string;
  implementationPlanFr?: string;
  implementationPlanAr?: string;
}

// ─── Queries ─────────────────────────────────────────────────

export function useProposals(filters?: ProposalFilters) {
  return useQuery({
    queryKey: ['proposals', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          if (value !== undefined && value !== null && value !== '') {
            params.set(key, String(value));
          }
        }
      }
      const res = await apiFetch(`/api/proposals?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch proposals: ${res.status}`);
      }
      const json: IApiResponse<IProposalSummary[]> = await res.json();
      return json;
    },
    staleTime: 30_000,
  });
}

export function useProposal(id: string | undefined) {
  return useQuery({
    queryKey: ['proposals', id],
    queryFn: async () => {
      const res = await apiFetch(`/api/proposals/${id}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch proposal: ${res.status}`);
      }
      const json: IApiResponse<IProposal> = await res.json();
      return json.data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

// ─── Mutations ───────────────────────────────────────────────

export function useSubmitProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SubmitProposalPayload) => {
      const res = await apiFetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        throw new Error(`Failed to submit proposal: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
    },
  });
}

export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/proposals/${id}/like`, {
        method: 'POST',
      });
      if (!res.ok) {
        throw new Error(`Failed to toggle like: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
    },
  });
}

export function useReviewProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: ReviewProposalPayload) => {
      const res = await apiFetch(`/api/proposals/${id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`Failed to review proposal: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({
        queryKey: ['proposals', variables.id],
      });
    },
  });
}
