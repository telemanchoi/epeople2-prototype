import { http, HttpResponse, delay } from 'msw';
import type { IApiResponse, IApiError, IAgency, IAgencyPerformance } from '@/types';
import agenciesData from '../data/agencies.json';
import statisticsData from '../data/statistics.json';

const agencies = agenciesData as unknown as IAgency[];
const { byAgency } = statisticsData;

export const agencyHandlers = [
  // GET /api/agencies — List all agencies
  http.get('/api/agencies', async ({ request }) => {
    await delay(200);

    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const region = url.searchParams.get('region');
    const isActive = url.searchParams.get('isActive');
    const search = url.searchParams.get('search');

    let filtered = [...agencies];

    if (type) {
      filtered = filtered.filter((a) => a.type === type);
    }
    if (region) {
      filtered = filtered.filter((a) => a.regionCode === region);
    }
    if (isActive !== null && isActive !== undefined) {
      const active = isActive === 'true';
      filtered = filtered.filter((a) => a.isActive === active);
    }
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.nameFr.toLowerCase().includes(lowerSearch) ||
          a.nameAr.includes(search) ||
          a.id.toLowerCase().includes(lowerSearch),
      );
    }

    return HttpResponse.json(
      {
        success: true,
        data: filtered,
        timestamp: new Date().toISOString(),
      } satisfies IApiResponse<IAgency[]>,
    );
  }),

  // GET /api/agencies/:id/performance — Agency performance detail
  http.get('/api/agencies/:id/performance', async ({ params }) => {
    await delay(250);

    const { id } = params;
    const agency = agencies.find((a) => a.id === id);

    if (!agency) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            messageFr: 'Organisme introuvable.',
            messageAr: 'لم يتم العثور على الهيئة.',
          },
          timestamp: new Date().toISOString(),
        } satisfies IApiError,
        { status: 404 },
      );
    }

    // Find performance data from statistics
    const perfData = (byAgency as unknown as IAgencyPerformance[]).find(
      (ap) => ap.agency.id === id,
    );

    if (perfData) {
      return HttpResponse.json(
        {
          success: true,
          data: perfData,
          timestamp: new Date().toISOString(),
        } satisfies IApiResponse<IAgencyPerformance>,
      );
    }

    // Generate default performance if not in statistics
    const defaultPerf: IAgencyPerformance = {
      agency: { id: agency.id, nameFr: agency.nameFr, nameAr: agency.nameAr },
      received: 0,
      completed: 0,
      completionRate: 0,
      avgProcessingDays: 0,
      slaComplianceRate: 0,
      satisfactionScore: 0,
      transferCount: 0,
      overdueCount: 0,
    };

    return HttpResponse.json(
      {
        success: true,
        data: defaultPerf,
        timestamp: new Date().toISOString(),
      } satisfies IApiResponse<IAgencyPerformance>,
    );
  }),
];
