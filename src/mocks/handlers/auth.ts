import { http, HttpResponse, delay } from 'msw';
import type { IApiResponse, IApiError } from '@/types';
import usersData from '../data/users.json';

// SLA deadline map per complaint type (hours)
const MOCK_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJVU1ItMDAxIiwicm9sZSI6IkJSQ19PRkZJQ0VSIiwiaWF0IjoxNzA5MTk2ODAwfQ.mock_signature';
const MOCK_REFRESH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJVU1ItMDAxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3MDkxOTY4MDB9.mock_refresh';
const TEST_PASSWORD = 'test1234';

export const authHandlers = [
  // POST /api/auth/login
  http.post('/api/auth/login', async ({ request }) => {
    await delay(300);

    const body = (await request.json()) as { username?: string; password?: string };
    const { username, password } = body;

    if (!username || !password) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            messageFr: 'Nom d\'utilisateur et mot de passe requis.',
            messageAr: 'اسم المستخدم وكلمة المرور مطلوبان.',
          },
          timestamp: new Date().toISOString(),
        } satisfies IApiError,
        { status: 400 },
      );
    }

    if (password !== TEST_PASSWORD) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            messageFr: 'Identifiants incorrects.',
            messageAr: 'بيانات الاعتماد غير صحيحة.',
          },
          timestamp: new Date().toISOString(),
        } satisfies IApiError,
        { status: 401 },
      );
    }

    const user = usersData.find((u) => u.username === username);

    if (!user) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            messageFr: 'Identifiants incorrects.',
            messageAr: 'بيانات الاعتماد غير صحيحة.',
          },
          timestamp: new Date().toISOString(),
        } satisfies IApiError,
        { status: 401 },
      );
    }

    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

    return HttpResponse.json(
      {
        success: true,
        data: {
          accessToken: MOCK_ACCESS_TOKEN,
          refreshToken: MOCK_REFRESH_TOKEN,
          expiresIn: 3600,
          user: {
            id: user.id,
            name: user.name,
            nameAr: user.nameAr,
            role: user.role,
            ...(user.agency ? { agency: user.agency } : {}),
          },
          expiresAt,
        },
        timestamp: new Date().toISOString(),
      } satisfies IApiResponse<unknown>,
      { status: 200 },
    );
  }),

  // POST /api/auth/logout
  http.post('/api/auth/logout', async () => {
    await delay(200);

    return HttpResponse.json(
      {
        success: true,
        data: null,
        timestamp: new Date().toISOString(),
      } satisfies IApiResponse<null>,
      { status: 200 },
    );
  }),

  // POST /api/auth/refresh
  http.post('/api/auth/refresh', async () => {
    await delay(200);

    const newToken = `${MOCK_ACCESS_TOKEN}_refreshed_${Date.now()}`;

    return HttpResponse.json(
      {
        success: true,
        data: {
          accessToken: newToken,
          expiresIn: 3600,
        },
        timestamp: new Date().toISOString(),
      } satisfies IApiResponse<unknown>,
      { status: 200 },
    );
  }),

  // POST /api/auth/anonymous-token
  http.post('/api/auth/anonymous-token', async () => {
    await delay(200);

    const uuid = crypto.randomUUID();
    const token = `ANON-${uuid}`;
    const expiresAt = new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString();

    return HttpResponse.json(
      {
        success: true,
        data: {
          token,
          expiresAt,
          notice: 'Conservez ce jeton en lieu sûr. Il sera utilisé pour suivre votre signalement.',
        },
        timestamp: new Date().toISOString(),
      } satisfies IApiResponse<unknown>,
      { status: 201 },
    );
  }),

  // POST /api/auth/pki-callback
  http.post('/api/auth/pki-callback', async ({ request }) => {
    await delay(300);

    const body = (await request.json()) as { authCode?: string; provider?: string };
    const { authCode } = body;

    if (authCode !== 'TEST_PKI_CODE') {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            messageFr: 'Code d\'authentification PKI invalide.',
            messageAr: 'رمز المصادقة PKI غير صالح.',
          },
          timestamp: new Date().toISOString(),
        } satisfies IApiError,
        { status: 401 },
      );
    }

    // Return citizen user for PKI login simulation
    const citizen = usersData.find((u) => u.role === 'CITIZEN');
    if (!citizen) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'SERVER_ERROR',
            messageFr: 'Erreur interne du serveur.',
            messageAr: 'خطأ داخلي في الخادم.',
          },
          timestamp: new Date().toISOString(),
        } satisfies IApiError,
        { status: 500 },
      );
    }

    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

    return HttpResponse.json(
      {
        success: true,
        data: {
          accessToken: MOCK_ACCESS_TOKEN,
          refreshToken: MOCK_REFRESH_TOKEN,
          expiresIn: 3600,
          user: {
            id: citizen.id,
            name: citizen.name,
            nameAr: citizen.nameAr,
            role: citizen.role,
          },
          expiresAt,
        },
        timestamp: new Date().toISOString(),
      } satisfies IApiResponse<unknown>,
      { status: 200 },
    );
  }),
];
