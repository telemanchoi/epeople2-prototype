import { http, HttpResponse, delay } from 'msw';
import type { IApiResponse, IApiError, ICorruptionReport, ICorruptionReportSummary } from '@/types';
import reportsData from '../data/reports.json';
import { loadData, saveData, loadCounter, saveCounter } from '../persistence';

// Load from localStorage or fall back to JSON
let reports = loadData<ICorruptionReport>('reports', reportsData as unknown as ICorruptionReport[]);
let nextReportNumber = loadCounter('reports', reports.length + 1);

function generateReportId(): string {
  const id = `RPT-2024-${String(nextReportNumber).padStart(6, '0')}`;
  nextReportNumber++;
  return id;
}

function generateTrackingCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'TRK-RPT-2024-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function toSummary(r: ICorruptionReport): ICorruptionReportSummary {
  return {
    id: r.id,
    type: r.type,
    status: r.status,
    targetAgency: r.targetAgency,
    isAnonymous: r.isAnonymous,
    reporterMasked: r.reporterMasked,
    anonymousToken: r.anonymousToken,
    submittedAt: r.submittedAt,
    trackingCode: r.trackingCode,
  };
}

export const reportHandlers = [
  // POST /api/reports — Create corruption report
  http.post('/api/reports', async ({ request }) => {
    await delay(300);

    const body = (await request.json()) as {
      type: string;
      targetAgencyId: string;
      incidentDate?: string;
      locationFr?: string;
      locationAr?: string;
      contentFr: string;
      contentAr: string;
      attachmentIds?: string[];
      isAnonymous: boolean;
      anonymousToken?: string;
    };

    if (!body.contentFr || !body.contentAr || !body.type) {
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

    const id = generateReportId();
    const trackingCode = generateTrackingCode();
    const now = new Date().toISOString();

    const newReport: ICorruptionReport = {
      id,
      type: body.type as ICorruptionReport['type'],
      status: 'received',
      targetAgency: {
        id: body.targetAgencyId,
        nameFr: 'Target Agency',
        nameAr: 'الجهة المستهدفة',
      },
      isAnonymous: body.isAnonymous,
      ...(body.isAnonymous
        ? { anonymousToken: body.anonymousToken ?? `ANON-TK-${Date.now()}` }
        : { reporterMasked: '***@***.tn' }),
      submittedAt: now,
      trackingCode,
      contentFr: body.contentFr,
      contentAr: body.contentAr,
      incidentDate: body.incidentDate,
      locationFr: body.locationFr,
      locationAr: body.locationAr,
      attachments: (body.attachmentIds ?? []).map((attId, idx) => ({
        id: attId,
        filename: `att_rpt_${idx}.pdf`,
        originalName: `file_${idx}.pdf`,
        sizeBytes: 100000,
        mimeType: 'application/pdf',
        uploadedAt: now,
      })),
      history: [
        {
          id: `RHIST-NEW-${Date.now()}`,
          action: 'received',
          actionLabelFr: 'Signalement reçu',
          actionLabelAr: 'تم استلام البلاغ',
          timestamp: now,
          noteFr: body.isAnonymous
            ? 'Signalement anonyme reçu via le portail'
            : 'Signalement reçu via le portail',
          noteAr: body.isAnonymous
            ? 'بلاغ مجهول الهوية مستلم عبر البوابة'
            : 'بلاغ مستلم عبر البوابة',
        },
      ],
    };

    reports.push(newReport);
    saveData('reports', reports);
    saveCounter('reports', nextReportNumber);

    return HttpResponse.json(
      {
        success: true,
        data: {
          reportId: id,
          status: 'received',
          trackingCode,
          message: {
            fr: 'Votre signalement a été enregistré. Conservez ce code de suivi.',
            ar: 'تم تسجيل بلاغكم. احتفظ بهذا الرمز للمتابعة.',
          },
        },
        timestamp: new Date().toISOString(),
      } satisfies IApiResponse<unknown>,
      { status: 201 },
    );
  }),

  // GET /api/reports/track — Track report by tracking code or anonymous token
  http.get('/api/reports/track', async ({ request }) => {
    await delay(200);

    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const token = url.searchParams.get('token');

    let report: ICorruptionReport | undefined;

    if (code) {
      report = reports.find((r) => r.trackingCode === code);
    } else if (token) {
      report = reports.find((r) => r.anonymousToken === token);
    }

    if (!report) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            messageFr: 'Signalement introuvable.',
            messageAr: 'لم يتم العثور على البلاغ.',
          },
          timestamp: new Date().toISOString(),
        } satisfies IApiError,
        { status: 404 },
      );
    }

    const statusMessages: Record<string, { fr: string; ar: string }> = {
      received: {
        fr: 'Votre signalement a été reçu et sera examiné prochainement.',
        ar: 'تم استلام بلاغكم وسيتم فحصه قريبًا.',
      },
      preliminary_review: {
        fr: "Votre signalement est en cours d'examen préliminaire.",
        ar: 'بلاغكم قيد الفحص الأولي.',
      },
      under_investigation: {
        fr: "Votre signalement est en cours d'instruction.",
        ar: 'بلاغكم قيد التحقيق.',
      },
      completed: {
        fr: "L'enquête relative à votre signalement est terminée.",
        ar: 'انتهى التحقيق المتعلق ببلاغكم.',
      },
      dismissed: {
        fr: 'Votre signalement a été classé sans suite.',
        ar: 'تم حفظ بلاغكم.',
      },
    };

    return HttpResponse.json(
      {
        success: true,
        data: {
          reportId: report.id,
          status: report.status,
          lastUpdatedAt: report.history[report.history.length - 1]?.timestamp ?? report.submittedAt,
          statusMessage: statusMessages[report.status] ?? statusMessages.received,
        },
        timestamp: new Date().toISOString(),
      } satisfies IApiResponse<unknown>,
    );
  }),

  // GET /api/reports — List all reports (DGGPC view)
  http.get('/api/reports', async ({ request }) => {
    await delay(250);

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');
    const agencyId = url.searchParams.get('agencyId');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
    const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get('perPage') ?? '10', 10)));

    let filtered = [...reports];

    if (status) {
      filtered = filtered.filter((r) => r.status === status);
    }
    if (type) {
      filtered = filtered.filter((r) => r.type === type);
    }
    if (agencyId) {
      filtered = filtered.filter((r) => r.targetAgency.id === agencyId);
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      filtered = filtered.filter((r) => new Date(r.submittedAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      filtered = filtered.filter((r) => new Date(r.submittedAt) <= to);
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
      } satisfies IApiResponse<ICorruptionReportSummary[]>,
    );
  }),

  // PATCH /api/reports/:id/status — Update report status
  http.patch('/api/reports/:id/status', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const reportIndex = reports.findIndex((r) => r.id === id);

    if (reportIndex === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            messageFr: 'Signalement introuvable.',
            messageAr: 'لم يتم العثور على البلاغ.',
          },
          timestamp: new Date().toISOString(),
        } satisfies IApiError,
        { status: 404 },
      );
    }

    const body = (await request.json()) as {
      status: string;
      noteFr?: string;
      noteAr?: string;
    };

    const report = reports[reportIndex];

    const historyEntry = {
      id: `RHIST-${Date.now()}`,
      action: body.status,
      actionLabelFr: `Statut changé en "${body.status}"`,
      actionLabelAr: `تم تغيير الحالة إلى "${body.status}"`,
      timestamp: new Date().toISOString(),
      noteFr: body.noteFr,
      noteAr: body.noteAr,
    };

    const updated: ICorruptionReport = {
      ...report,
      status: body.status as ICorruptionReport['status'],
      history: [...report.history, historyEntry],
    };

    reports[reportIndex] = updated;
    saveData('reports', reports);

    return HttpResponse.json(
      {
        success: true,
        data: toSummary(updated),
        timestamp: new Date().toISOString(),
      } satisfies IApiResponse<ICorruptionReportSummary>,
    );
  }),
];
