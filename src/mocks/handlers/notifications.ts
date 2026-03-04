import { http, HttpResponse, delay } from 'msw';
import type { IApiResponse, IApiError, INotification } from '@/types';
import notificationsData from '../data/notifications.json';
import { loadData, saveData } from '../persistence';

// Load from localStorage or fall back to JSON
let notifications = loadData<INotification>('notifications', notificationsData as INotification[]);

export const notificationHandlers = [
  // GET /api/notifications — List notifications
  http.get('/api/notifications', async ({ request }) => {
    await delay(200);

    const url = new URL(request.url);
    const isRead = url.searchParams.get('isRead');
    const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);

    let filtered = [...notifications];

    if (isRead === 'true') {
      filtered = filtered.filter((n) => n.isRead);
    } else if (isRead === 'false') {
      filtered = filtered.filter((n) => !n.isRead);
    }

    // Sort by createdAt descending (most recent first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const limited = filtered.slice(0, limit);
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return HttpResponse.json(
      {
        success: true,
        data: limited,
        unreadCount,
        timestamp: new Date().toISOString(),
      } as IApiResponse<INotification[]> & { unreadCount: number },
    );
  }),

  // PATCH /api/notifications/:id/read — Mark single notification as read
  http.patch('/api/notifications/:id/read', async ({ params }) => {
    await delay(200);

    const { id } = params;
    const notifIndex = notifications.findIndex((n) => n.id === id);

    if (notifIndex === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            messageFr: 'Notification introuvable.',
            messageAr: 'لم يتم العثور على الإشعار.',
          },
          timestamp: new Date().toISOString(),
        } satisfies IApiError,
        { status: 404 },
      );
    }

    notifications[notifIndex] = {
      ...notifications[notifIndex],
      isRead: true,
    };
    saveData('notifications', notifications);

    return HttpResponse.json(
      {
        success: true,
        data: null,
        timestamp: new Date().toISOString(),
      } satisfies IApiResponse<null>,
    );
  }),

  // PATCH /api/notifications/read-all — Mark all notifications as read
  http.patch('/api/notifications/read-all', async () => {
    await delay(200);

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    notifications = notifications.map((n) => ({
      ...n,
      isRead: true,
    }));
    saveData('notifications', notifications);

    return HttpResponse.json(
      {
        success: true,
        data: { updatedCount: unreadCount },
        timestamp: new Date().toISOString(),
      } satisfies IApiResponse<{ updatedCount: number }>,
    );
  }),
];
