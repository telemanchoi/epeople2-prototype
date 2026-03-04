import { http, HttpResponse, delay } from 'msw';
import type {
  IApiResponse,
  IStatisticsOverview,
  ITrendDataPoint,
  ITypeDistribution,
  IRepeatedComplaintRecord,
  ILongOverdueComplaint,
  IAgencyPerformance,
} from '@/types';
import statisticsData from '../data/statistics.json';

const { overview, trend, byType, byAgency, repeatedComplaints, longOverdue } = statisticsData;

export const statisticsHandlers = [
  // GET /api/statistics/overview
  http.get('/api/statistics/overview', async () => {
    await delay(200);

    return HttpResponse.json(
      {
        success: true,
        data: overview as IStatisticsOverview,
        timestamp: new Date().toISOString(),
      } satisfies IApiResponse<IStatisticsOverview>,
    );
  }),

  // GET /api/statistics/trend
  http.get('/api/statistics/trend', async () => {
    await delay(200);

    return HttpResponse.json(
      {
        success: true,
        data: trend as ITrendDataPoint[],
        timestamp: new Date().toISOString(),
      } satisfies IApiResponse<ITrendDataPoint[]>,
    );
  }),

  // GET /api/statistics/by-type
  http.get('/api/statistics/by-type', async () => {
    await delay(200);

    return HttpResponse.json(
      {
        success: true,
        data: byType as unknown as ITypeDistribution[],
        timestamp: new Date().toISOString(),
      } satisfies IApiResponse<ITypeDistribution[]>,
    );
  }),

  // GET /api/statistics/by-agency
  http.get('/api/statistics/by-agency', async ({ request }) => {
    await delay(250);

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);

    const limited = (byAgency as unknown as IAgencyPerformance[]).slice(0, limit);

    return HttpResponse.json(
      {
        success: true,
        data: limited,
        timestamp: new Date().toISOString(),
      } satisfies IApiResponse<IAgencyPerformance[]>,
    );
  }),

  // GET /api/statistics/repeated-complaints (G-06)
  http.get('/api/statistics/repeated-complaints', async ({ request }) => {
    await delay(200);

    const url = new URL(request.url);
    const minRepeatCount = parseInt(url.searchParams.get('minRepeatCount') ?? '3', 10);

    const filtered = (repeatedComplaints as IRepeatedComplaintRecord[]).filter(
      (rc) => rc.repeatCount >= minRepeatCount,
    );

    return HttpResponse.json(
      {
        success: true,
        data: filtered,
        timestamp: new Date().toISOString(),
      } satisfies IApiResponse<IRepeatedComplaintRecord[]>,
    );
  }),

  // GET /api/statistics/long-overdue
  http.get('/api/statistics/long-overdue', async ({ request }) => {
    await delay(200);

    const url = new URL(request.url);
    const minDays = parseInt(url.searchParams.get('minDays') ?? '0', 10);

    const filtered = (longOverdue as unknown as ILongOverdueComplaint[]).filter(
      (lo) => lo.daysOverdue >= minDays,
    );

    return HttpResponse.json(
      {
        success: true,
        data: filtered,
        timestamp: new Date().toISOString(),
      } satisfies IApiResponse<ILongOverdueComplaint[]>,
    );
  }),
];
