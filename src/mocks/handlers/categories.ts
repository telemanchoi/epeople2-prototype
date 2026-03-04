import { http, HttpResponse, delay } from 'msw';
import type { IApiResponse, IApiError, ICategory, IAgency } from '@/types';
import categoriesData from '../data/categories.json';
import agenciesData from '../data/agencies.json';

const categories = categoriesData as ICategory[];
const agencies = agenciesData as unknown as IAgency[];

// Mapping of category L1 codes to default agency prefixes
const categoryAgencyMap: Record<string, string> = {
  '01': 'BRC-ENV',      // Environment
  '02': 'BRC-EDU',      // Education
  '03': 'BRC-TRN',      // Transport
  '04': 'BRC-SAN',      // Health
  '05': 'BRC-FIN',      // Finance
  '06': 'BRC-INT',      // Interior / Other admin
  '07': 'BRC-EQP',      // Equipment / Housing
  '08': 'BRC-AGR',      // Agriculture
  '09': 'BRC-COM',      // Commerce
  '10': 'BRC-JUS',      // Justice
};

export const categoryHandlers = [
  // GET /api/categories — Full category tree
  http.get('/api/categories', async () => {
    await delay(200);

    return HttpResponse.json(
      {
        success: true,
        data: categories,
        timestamp: new Date().toISOString(),
      } satisfies IApiResponse<ICategory[]>,
    );
  }),

  // GET /api/categories/:code/agencies — Agencies for a category
  http.get('/api/categories/:code/agencies', async ({ params }) => {
    await delay(200);

    const { code } = params;
    const codeStr = String(code);

    // Get the L1 code (first 2 digits)
    const l1Code = codeStr.substring(0, 2);

    // Find primary agency based on category
    const agencyPrefix = categoryAgencyMap[l1Code];
    let primaryAgency: IAgency | undefined;
    const alternativeAgencies: Array<Pick<IAgency, 'id' | 'nameFr' | 'nameAr'>> = [];

    if (agencyPrefix) {
      primaryAgency = agencies.find(
        (a) => a.id.startsWith(agencyPrefix) && a.type === 'BRC' && a.isActive,
      );
    }

    if (!primaryAgency) {
      // Fallback: first active BRC
      primaryAgency = agencies.find((a) => a.type === 'BRC' && a.isActive);
    }

    if (!primaryAgency) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            messageFr: 'Aucun organisme trouvé pour cette catégorie.',
            messageAr: 'لم يتم العثور على هيئة لهذا التصنيف.',
          },
          timestamp: new Date().toISOString(),
        } satisfies IApiError,
        { status: 404 },
      );
    }

    return HttpResponse.json(
      {
        success: true,
        data: {
          primaryAgency: {
            id: primaryAgency.id,
            nameFr: primaryAgency.nameFr,
            nameAr: primaryAgency.nameAr,
          },
          alternativeAgencies,
        },
        timestamp: new Date().toISOString(),
      } satisfies IApiResponse<unknown>,
    );
  }),
];
