import { http, HttpResponse, delay } from 'msw';
import type { IApiResponse, IApiError, IAttachment } from '@/types';

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

let attachmentCounter = 100;

export const attachmentHandlers = [
  // POST /api/attachments/upload — Mock file upload
  http.post('/api/attachments/upload', async ({ request }) => {
    await delay(500); // Simulate upload latency

    // Try to extract file info from the multipart form data
    let filename = 'uploaded_file.pdf';
    let originalName = 'document.pdf';
    let sizeBytes = 125000;
    let mimeType = 'application/pdf';

    try {
      const formData = await request.formData();
      const file = formData.get('file');

      if (file instanceof File) {
        originalName = file.name;
        filename = `att_${Date.now()}_${originalName.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        sizeBytes = file.size;
        mimeType = file.type || 'application/octet-stream';

        // Validate file size
        if (sizeBytes > MAX_FILE_SIZE) {
          return HttpResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                messageFr: 'La taille du fichier dépasse la limite de 10 Mo.',
                messageAr: 'حجم الملف يتجاوز الحد الأقصى 10 ميغابايت.',
              },
              timestamp: new Date().toISOString(),
            } satisfies IApiError,
            { status: 400 },
          );
        }

        // Validate MIME type
        if (!ALLOWED_MIME_TYPES.some((allowed) => mimeType.startsWith(allowed.split('/')[0]) || mimeType === allowed)) {
          return HttpResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                messageFr: 'Type de fichier non autorisé. Types acceptés : JPEG, PNG, PDF, Word, Excel.',
                messageAr: 'نوع الملف غير مسموح به. الأنواع المقبولة: JPEG، PNG، PDF، Word، Excel.',
              },
              timestamp: new Date().toISOString(),
            } satisfies IApiError,
            { status: 400 },
          );
        }
      }
    } catch {
      // If formData parsing fails, use defaults (mock mode)
    }

    attachmentCounter++;
    const attachmentId = `ATT-${String(attachmentCounter).padStart(6, '0')}`;

    const attachment: IAttachment = {
      id: attachmentId,
      filename,
      originalName,
      sizeBytes,
      mimeType,
      uploadedAt: new Date().toISOString(),
    };

    return HttpResponse.json(
      {
        success: true,
        data: attachment,
        timestamp: new Date().toISOString(),
      } satisfies IApiResponse<IAttachment>,
      { status: 201 },
    );
  }),
];
