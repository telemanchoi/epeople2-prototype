import { http, HttpResponse, delay } from 'msw';
import type { IApiResponse, IApiError, IProposal, IProposalSummary } from '@/types';
import proposalsData from '../data/proposals.json';

// Mutable copy
let proposals = [...proposalsData] as unknown as IProposal[];
let nextProposalNumber = proposals.length + 1;

function generateProposalId(): string {
  const id = `PRP-2024-${String(nextProposalNumber).padStart(6, '0')}`;
  nextProposalNumber++;
  return id;
}

function toSummary(p: IProposal): IProposalSummary {
  return {
    id: p.id,
    titleFr: p.titleFr,
    titleAr: p.titleAr,
    status: p.status,
    categoryPath: p.categoryPath,
    assignedAgency: p.assignedAgency,
    likeCount: p.likeCount,
    isLikedByMe: p.isLikedByMe,
    submittedAt: p.submittedAt,
    reviewResult: p.reviewResult,
  };
}

export const proposalHandlers = [
  // GET /api/proposals — List proposals with sorting and filtering
  http.get('/api/proposals', async ({ request }) => {
    await delay(250);

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const categoryL1 = url.searchParams.get('categoryL1');
    const sortBy = url.searchParams.get('sortBy') ?? 'createdAt';
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
    const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get('perPage') ?? '10', 10)));

    let filtered = [...proposals];

    if (status) {
      filtered = filtered.filter((p) => p.status === status);
    }
    if (categoryL1) {
      filtered = filtered.filter((p) => p.categoryPath.l1.code === categoryL1);
    }

    // Sorting
    if (sortBy === 'mostLiked' || sortBy === 'likeCount') {
      filtered.sort((a, b) => b.likeCount - a.likeCount);
    } else if (sortBy === 'status') {
      const statusOrder: Record<string, number> = {
        pending: 0,
        under_review: 1,
        accepted: 2,
        implemented: 3,
        rejected: 4,
      };
      filtered.sort((a, b) => (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5));
    } else {
      // Default: newest first (createdAt -> submittedAt)
      filtered.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / perPage);
    const startIndex = (page - 1) * perPage;
    const paged = filtered.slice(startIndex, startIndex + perPage);
    const summaries = paged.map(toSummary);

    return HttpResponse.json(
      {
        success: true,
        data: summaries,
        pagination: { page, perPage, total, totalPages },
        timestamp: new Date().toISOString(),
      } satisfies IApiResponse<IProposalSummary[]>,
    );
  }),

  // POST /api/proposals — Create new proposal
  http.post('/api/proposals', async ({ request }) => {
    await delay(300);

    const body = (await request.json()) as {
      titleFr: string;
      titleAr: string;
      contentFr: string;
      contentAr: string;
      categoryL1: string;
      attachmentIds?: string[];
    };

    if (!body.titleFr || !body.titleAr || !body.contentFr || !body.contentAr) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            messageFr: 'Les champs obligatoires sont manquants.',
            messageAr: 'الحقول المطلوبة مفقودة.',
          },
          timestamp: new Date().toISOString(),
        } satisfies IApiError,
        { status: 400 },
      );
    }

    const id = generateProposalId();
    const now = new Date().toISOString();

    const newProposal: IProposal = {
      id,
      titleFr: body.titleFr,
      titleAr: body.titleAr,
      contentFr: body.contentFr,
      contentAr: body.contentAr,
      status: 'pending',
      categoryPath: {
        l1: { code: body.categoryL1, nameFr: '', nameAr: '' },
        l2: { code: '', nameFr: '', nameAr: '' },
      },
      likeCount: 0,
      isLikedByMe: false,
      submittedAt: now,
      attachments: (body.attachmentIds ?? []).map((attId, idx) => ({
        id: attId,
        filename: `att_prp_${idx}.pdf`,
        originalName: `file_${idx}.pdf`,
        sizeBytes: 100000,
        mimeType: 'application/pdf',
        uploadedAt: now,
      })),
      implementationUpdates: [],
    };

    proposals.push(newProposal);

    return HttpResponse.json(
      {
        success: true,
        data: newProposal,
        timestamp: new Date().toISOString(),
      } satisfies IApiResponse<IProposal>,
      { status: 201 },
    );
  }),

  // GET /api/proposals/:id — Get proposal detail
  http.get('/api/proposals/:id', async ({ params }) => {
    await delay(200);

    const { id } = params;
    const proposal = proposals.find((p) => p.id === id);

    if (!proposal) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            messageFr: 'Proposition introuvable.',
            messageAr: 'لم يتم العثور على الاقتراح.',
          },
          timestamp: new Date().toISOString(),
        } satisfies IApiError,
        { status: 404 },
      );
    }

    return HttpResponse.json(
      {
        success: true,
        data: proposal,
        timestamp: new Date().toISOString(),
      } satisfies IApiResponse<IProposal>,
    );
  }),

  // POST /api/proposals/:id/like — Toggle like (G-05)
  http.post('/api/proposals/:id/like', async ({ params }) => {
    await delay(200);

    const { id } = params;
    const proposalIndex = proposals.findIndex((p) => p.id === id);

    if (proposalIndex === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            messageFr: 'Proposition introuvable.',
            messageAr: 'لم يتم العثور على الاقتراح.',
          },
          timestamp: new Date().toISOString(),
        } satisfies IApiError,
        { status: 404 },
      );
    }

    const proposal = proposals[proposalIndex];
    const wasLiked = proposal.isLikedByMe;
    const newLikeCount = wasLiked ? proposal.likeCount - 1 : proposal.likeCount + 1;

    proposals[proposalIndex] = {
      ...proposal,
      isLikedByMe: !wasLiked,
      likeCount: newLikeCount,
    };

    return HttpResponse.json(
      {
        success: true,
        data: {
          liked: !wasLiked,
          likeCount: newLikeCount,
        },
        timestamp: new Date().toISOString(),
      } satisfies IApiResponse<{ liked: boolean; likeCount: number }>,
    );
  }),

  // PATCH /api/proposals/:id/review — Add review result
  http.patch('/api/proposals/:id/review', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const proposalIndex = proposals.findIndex((p) => p.id === id);

    if (proposalIndex === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            messageFr: 'Proposition introuvable.',
            messageAr: 'لم يتم العثور على الاقتراح.',
          },
          timestamp: new Date().toISOString(),
        } satisfies IApiError,
        { status: 404 },
      );
    }

    const body = (await request.json()) as {
      result: 'accepted' | 'rejected';
      reviewCommentFr: string;
      reviewCommentAr: string;
      implementationPlanFr?: string;
      implementationPlanAr?: string;
    };

    const proposal = proposals[proposalIndex];
    const now = new Date().toISOString();

    const review = {
      result: body.result,
      reviewCommentFr: body.reviewCommentFr,
      reviewCommentAr: body.reviewCommentAr,
      reviewedAt: now,
      reviewedBy: 'BCRC Admin',
      ...(body.implementationPlanFr
        ? { implementationPlanFr: body.implementationPlanFr, implementationPlanAr: body.implementationPlanAr }
        : {}),
    };

    proposals[proposalIndex] = {
      ...proposal,
      status: body.result,
      review,
      reviewResult: { result: body.result, reviewedAt: now },
    };

    return HttpResponse.json(
      {
        success: true,
        data: proposals[proposalIndex],
        timestamp: new Date().toISOString(),
      } satisfies IApiResponse<IProposal>,
    );
  }),
];
