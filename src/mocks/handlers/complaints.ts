import { http, HttpResponse, delay } from 'msw';
import type { IApiResponse, IApiError, IComplaint, IComplaintSummary } from '@/types';
import complaintsData from '../data/complaints.json';
import agenciesData from '../data/agencies.json';

// Mutable copy so we can add/modify complaints at runtime
let complaints = [...complaintsData] as unknown as IComplaint[];

// SLA days by complaint type
const SLA_DAYS: Record<string, number> = {
  grievance: 60,
  proposal: 30,
  inquiry: 7,
  suggestion: 30,
  report: 15,
};

// Counter for new complaint IDs
let nextComplaintNumber = complaints.length + 1;

// Helper: generate complaint ID
function generateComplaintId(): string {
  const id = `CMP-2024-${String(nextComplaintNumber).padStart(6, '0')}`;
  nextComplaintNumber++;
  return id;
}

// Helper: calculate days remaining
function calcDaysRemaining(deadline: string): number {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  return Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// Helper: extract summary fields from a complaint
function toSummary(c: IComplaint): IComplaintSummary {
  return {
    id: c.id,
    type: c.type,
    titleFr: c.titleFr,
    titleAr: c.titleAr,
    status: c.status,
    categoryPath: c.categoryPath,
    assignedAgency: c.assignedAgency,
    submittedAt: c.submittedAt,
    deadline: c.deadline,
    daysRemaining: calcDaysRemaining(c.deadline),
    transferCount: c.transferCount,
    hasAttachments: c.hasAttachments,
    satisfactionScore: c.satisfactionScore,
  };
}

export const complaintHandlers = [
  // GET /api/complaints — List with filters and pagination
  http.get('/api/complaints', async ({ request }) => {
    await delay(250);

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');
    const agencyId = url.searchParams.get('agencyId');
    const overdue = url.searchParams.get('overdue');
    const search = url.searchParams.get('search');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
    const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get('perPage') ?? '10', 10)));

    let filtered = [...complaints];

    // Apply filters
    if (status) {
      filtered = filtered.filter((c) => c.status === status);
    }
    if (type) {
      filtered = filtered.filter((c) => c.type === type);
    }
    if (agencyId) {
      filtered = filtered.filter((c) => c.assignedAgency?.id === agencyId);
    }
    if (overdue === 'true') {
      filtered = filtered.filter((c) => calcDaysRemaining(c.deadline) < 0);
    }
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.titleFr.toLowerCase().includes(lowerSearch) ||
          c.titleAr.includes(search) ||
          c.id.toLowerCase().includes(lowerSearch),
      );
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      filtered = filtered.filter((c) => new Date(c.submittedAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      filtered = filtered.filter((c) => new Date(c.submittedAt) <= to);
    }

    // Sort by submittedAt descending
    filtered.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

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
      } satisfies IApiResponse<IComplaintSummary[]>,
    );
  }),

  // POST /api/complaints — Create new complaint
  http.post('/api/complaints', async ({ request }) => {
    await delay(300);

    const body = (await request.json()) as Record<string, unknown>;
    const {
      type,
      categoryL1,
      categoryL2,
      categoryL3,
      titleAr,
      titleFr,
      contentAr,
      contentFr,
      regionCode,
      incidentDate,
      attachmentIds,
    } = body as {
      type: string;
      categoryL1: string;
      categoryL2: string;
      categoryL3?: string;
      titleAr: string;
      titleFr: string;
      contentAr: string;
      contentFr: string;
      regionCode: string;
      incidentDate?: string;
      attachmentIds?: string[];
    };

    if (!type || !titleFr || !titleAr || !contentFr || !contentAr) {
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

    const slaDays = SLA_DAYS[type] ?? 30;
    const now = new Date();
    const deadline = new Date(now.getTime() + slaDays * 24 * 60 * 60 * 1000);
    const id = generateComplaintId();

    // Pick an agency based on the first matching one
    const agency = agenciesData.find((a) => a.type === 'BRC' && a.isActive) ?? agenciesData[2];

    const newComplaint: IComplaint = {
      id,
      type: type as IComplaint['type'],
      titleFr: titleFr as string,
      titleAr: titleAr as string,
      contentFr: contentFr as string,
      contentAr: contentAr as string,
      status: 'received',
      categoryPath: {
        l1: { code: categoryL1 as string, nameFr: '', nameAr: '' },
        l2: { code: categoryL2 as string, nameFr: '', nameAr: '' },
        ...(categoryL3 ? { l3: { code: categoryL3, nameFr: '', nameAr: '' } } : {}),
      },
      regionCode: regionCode as string,
      incidentDate: incidentDate as string | undefined,
      citizenId: 'CIT-***newuser***',
      isAnonymous: false,
      assignedAgency: {
        id: agency.id,
        nameFr: agency.nameFr,
        nameAr: agency.nameAr,
      },
      submittedAt: now.toISOString(),
      deadline: deadline.toISOString(),
      daysRemaining: slaDays,
      transferCount: 0,
      hasAttachments: Array.isArray(attachmentIds) && attachmentIds.length > 0,
      satisfactionScore: null,
      attachments: (attachmentIds ?? []).map((attId: string, idx: number) => ({
        id: attId,
        filename: `uploaded_${idx}.pdf`,
        originalName: `file_${idx}.pdf`,
        sizeBytes: 100000,
        mimeType: 'application/pdf',
        uploadedAt: now.toISOString(),
      })),
      history: [
        {
          id: `HIST-NEW-${Date.now()}`,
          action: 'received',
          actionLabelFr: 'Plainte reçue',
          actionLabelAr: 'استلام الشكوى',
          timestamp: now.toISOString(),
          noteFr: 'Dépôt en ligne via le portail e-People',
          noteAr: 'تقديم إلكتروني عبر بوابة الشعب الإلكترونية',
        },
      ],
    };

    complaints.push(newComplaint);

    return HttpResponse.json(
      {
        success: true,
        data: {
          id,
          status: 'received',
          submittedAt: now.toISOString(),
          deadline: deadline.toISOString(),
          assignedAgency: newComplaint.assignedAgency,
          message: {
            fr: 'Votre plainte a été enregistrée avec succès.',
            ar: 'تم تسجيل شكواكم بنجاح.',
          },
        },
        timestamp: new Date().toISOString(),
      } satisfies IApiResponse<unknown>,
      { status: 201 },
    );
  }),

  // GET /api/complaints/duplicate-check — Check for similar complaints
  http.get('/api/complaints/duplicate-check', async ({ request }) => {
    await delay(200);

    const url = new URL(request.url);
    const categoryL2 = url.searchParams.get('categoryL2');
    const regionCode = url.searchParams.get('regionCode');

    let similar = complaints.filter((c) => {
      const matchesCategory = categoryL2 && c.categoryPath?.l2?.code === categoryL2;
      const matchesRegion = !regionCode || c.regionCode === regionCode;
      if (matchesCategory && matchesRegion) return true;
      return false;
    });

    similar = similar.slice(0, 5);

    return HttpResponse.json(
      {
        success: true,
        data: {
          hasSimilar: similar.length > 0,
          similarComplaints: similar.map((c) => ({
            id: c.id,
            titleFr: c.titleFr,
            status: c.status,
            submittedAt: c.submittedAt,
          })),
          message: similar.length > 0
            ? {
                fr: 'Des plaintes similaires ont déjà été soumises. Souhaitez-vous rejoindre la plainte collective ?',
                ar: 'تم تقديم شكاوى مماثلة بالفعل. هل تريد الانضمام إلى الشكوى الجماعية؟',
              }
            : { fr: 'Aucune plainte similaire trouvée.', ar: 'لم يتم العثور على شكاوى مماثلة.' },
        },
        timestamp: new Date().toISOString(),
      } satisfies IApiResponse<unknown>,
    );
  }),

  // GET /api/complaints/:id — Get complaint detail
  http.get('/api/complaints/:id', async ({ params }) => {
    await delay(200);

    const { id } = params;
    const complaint = complaints.find((c) => c.id === id);

    if (!complaint) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            messageFr: 'Plainte introuvable.',
            messageAr: 'لم يتم العثور على الشكوى.',
          },
          timestamp: new Date().toISOString(),
        } satisfies IApiError,
        { status: 404 },
      );
    }

    // Recalculate daysRemaining dynamically
    const fullComplaint: IComplaint = {
      ...complaint,
      daysRemaining: calcDaysRemaining(complaint.deadline),
    };

    return HttpResponse.json(
      {
        success: true,
        data: fullComplaint,
        timestamp: new Date().toISOString(),
      } satisfies IApiResponse<IComplaint>,
    );
  }),

  // PATCH /api/complaints/:id/status — Update complaint status
  http.patch('/api/complaints/:id/status', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const complaintIndex = complaints.findIndex((c) => c.id === id);

    if (complaintIndex === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            messageFr: 'Plainte introuvable.',
            messageAr: 'لم يتم العثور على الشكوى.',
          },
          timestamp: new Date().toISOString(),
        } satisfies IApiError,
        { status: 404 },
      );
    }

    const body = (await request.json()) as {
      status: string;
      answerFr?: string;
      answerAr?: string;
    };

    const complaint = complaints[complaintIndex];

    const historyEntry = {
      id: `HIST-${Date.now()}`,
      action: body.status as IComplaint['history'][number]['action'],
      actionLabelFr: `Statut changé en "${body.status}"`,
      actionLabelAr: `تم تغيير الحالة إلى "${body.status}"`,
      timestamp: new Date().toISOString(),
    };

    const updated: IComplaint = {
      ...complaint,
      status: body.status as IComplaint['status'],
      history: [...complaint.history, historyEntry],
      ...(body.answerFr && body.answerAr
        ? {
            answer: {
              contentFr: body.answerFr,
              contentAr: body.answerAr,
              answeredAt: new Date().toISOString(),
              answeredBy: 'Current Officer',
            },
          }
        : {}),
    };

    complaints[complaintIndex] = updated;

    return HttpResponse.json(
      {
        success: true,
        data: { ...updated, daysRemaining: calcDaysRemaining(updated.deadline) },
        timestamp: new Date().toISOString(),
      } satisfies IApiResponse<IComplaint>,
    );
  }),

  // POST /api/complaints/:id/transfer — Transfer complaint (G-02)
  http.post('/api/complaints/:id/transfer', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const complaintIndex = complaints.findIndex((c) => c.id === id);

    if (complaintIndex === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            messageFr: 'Plainte introuvable.',
            messageAr: 'لم يتم العثور على الشكوى.',
          },
          timestamp: new Date().toISOString(),
        } satisfies IApiError,
        { status: 404 },
      );
    }

    const complaint = complaints[complaintIndex];

    // G-02: Transfer limit check (transferCount >= 3)
    if (complaint.transferCount >= 3) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'TRANSFER_LIMIT_EXCEEDED',
            messageFr: `Cette plainte a déjà été transférée ${complaint.transferCount} fois. Signalement automatique au BCRC.`,
            messageAr: `تم تحويل هذه الشكوى ${complaint.transferCount} مرات. إشعار تلقائي إلى BCRC.`,
          },
          timestamp: new Date().toISOString(),
        } satisfies IApiError,
        { status: 422 },
      );
    }

    const body = (await request.json()) as {
      targetAgencyId: string;
      reasonFr: string;
      reasonAr?: string;
    };

    const targetAgency = agenciesData.find((a) => a.id === body.targetAgencyId);
    const targetAgencyInfo = targetAgency
      ? { id: targetAgency.id, nameFr: targetAgency.nameFr, nameAr: targetAgency.nameAr }
      : { id: body.targetAgencyId, nameFr: 'Unknown Agency', nameAr: 'وكالة غير معروفة' };

    const historyEntry = {
      id: `HIST-TR-${Date.now()}`,
      action: 'transferred' as const,
      actionLabelFr: 'Transférée',
      actionLabelAr: 'محوّلة',
      fromAgency: complaint.assignedAgency,
      toAgency: targetAgencyInfo,
      reasonFr: body.reasonFr,
      reasonAr: body.reasonAr ?? '',
      timestamp: new Date().toISOString(),
    };

    const updated: IComplaint = {
      ...complaint,
      assignedAgency: targetAgencyInfo,
      transferCount: complaint.transferCount + 1,
      history: [...complaint.history, historyEntry],
    };

    complaints[complaintIndex] = updated;

    return HttpResponse.json(
      {
        success: true,
        data: { ...updated, daysRemaining: calcDaysRemaining(updated.deadline) },
        timestamp: new Date().toISOString(),
      } satisfies IApiResponse<IComplaint>,
    );
  }),

  // POST /api/complaints/:id/extend-deadline — Request deadline extension (G-04)
  http.post('/api/complaints/:id/extend-deadline', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const complaint = complaints.find((c) => c.id === id);

    if (!complaint) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            messageFr: 'Plainte introuvable.',
            messageAr: 'لم يتم العثور على الشكوى.',
          },
          timestamp: new Date().toISOString(),
        } satisfies IApiError,
        { status: 404 },
      );
    }

    const body = (await request.json()) as {
      requestedAdditionalDays: number;
      reasonFr: string;
      reasonAr?: string;
    };

    const currentDeadline = new Date(complaint.deadline);
    const requestedDeadline = new Date(
      currentDeadline.getTime() + body.requestedAdditionalDays * 24 * 60 * 60 * 1000,
    );

    const extensionRequest = {
      extensionRequestId: `EXT-${Date.now()}`,
      status: 'pending_approval' as const,
      currentDeadline: complaint.deadline,
      requestedDeadline: requestedDeadline.toISOString(),
      requestedAdditionalDays: body.requestedAdditionalDays,
    };

    return HttpResponse.json(
      {
        success: true,
        data: extensionRequest,
        timestamp: new Date().toISOString(),
      } satisfies IApiResponse<unknown>,
      { status: 201 },
    );
  }),

  // POST /api/complaints/:id/joint-process — Start joint processing (G-03)
  http.post('/api/complaints/:id/joint-process', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const complaint = complaints.find((c) => c.id === id);

    if (!complaint) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            messageFr: 'Plainte introuvable.',
            messageAr: 'لم يتم العثور على الشكوى.',
          },
          timestamp: new Date().toISOString(),
        } satisfies IApiError,
        { status: 404 },
      );
    }

    const body = (await request.json()) as {
      cooperatingAgencyIds: string[];
      reasonFr?: string;
    };

    const cooperatingAgencies = body.cooperatingAgencyIds.map((agId) => {
      const ag = agenciesData.find((a) => a.id === agId);
      return {
        agency: ag
          ? { id: ag.id, nameFr: ag.nameFr, nameAr: ag.nameAr }
          : { id: agId, nameFr: 'Unknown', nameAr: 'غير معروف' },
        status: 'pending' as const,
      };
    });

    const jointProcess = {
      id: `JP-${Date.now()}`,
      complaintId: complaint.id,
      leadAgency: complaint.assignedAgency,
      cooperatingAgencies,
      startedAt: new Date().toISOString(),
    };

    return HttpResponse.json(
      {
        success: true,
        data: jointProcess,
        timestamp: new Date().toISOString(),
      } satisfies IApiResponse<unknown>,
      { status: 201 },
    );
  }),

  // POST /api/complaints/:id/satisfaction — Submit satisfaction score
  http.post('/api/complaints/:id/satisfaction', async ({ params, request }) => {
    await delay(200);

    const { id } = params;
    const complaintIndex = complaints.findIndex((c) => c.id === id);

    if (complaintIndex === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            messageFr: 'Plainte introuvable.',
            messageAr: 'لم يتم العثور على الشكوى.',
          },
          timestamp: new Date().toISOString(),
        } satisfies IApiError,
        { status: 404 },
      );
    }

    const body = (await request.json()) as {
      score: number;
      commentFr?: string;
    };

    complaints[complaintIndex] = {
      ...complaints[complaintIndex],
      satisfactionScore: body.score,
      satisfactionDetail: {
        score: body.score as 1 | 2 | 3 | 4 | 5,
        commentFr: body.commentFr,
        submittedAt: new Date().toISOString(),
      },
    };

    return HttpResponse.json(
      {
        success: true,
        data: null,
        timestamp: new Date().toISOString(),
      } satisfies IApiResponse<null>,
      { status: 201 },
    );
  }),
];
