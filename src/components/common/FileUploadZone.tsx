import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface FileUploadZoneProps {
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  onUpload: (files: File[]) => void;
  files: UploadedFile[];
  onRemove: (fileId: string) => void;
  error?: string;
  className?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploadZone({
  maxFiles = 5,
  maxSizeMB = 10,
  acceptedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.docx', '.xlsx'],
  onUpload,
  files,
  onRemove,
  error,
  className,
}: FileUploadZoneProps) {
  const { t, i18n } = useTranslation('complaint');
  const isRtl = i18n.language === 'ar';

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onUpload(acceptedFiles);
    },
    [onUpload]
  );

  const accept: Record<string, string[]> = {};
  for (const ext of acceptedTypes) {
    const mimeMap: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
    const mime = mimeMap[ext];
    if (mime) {
      if (!accept[mime]) accept[mime] = [];
      accept[mime].push(ext);
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: maxFiles - files.length,
    maxSize: maxSizeMB * 1024 * 1024,
    disabled: files.length >= maxFiles,
  });

  const canUpload = files.length < maxFiles;

  return (
    <div className={cn('space-y-3', className)} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Drop Zone */}
      {canUpload && (
        <div
          {...getRootProps()}
          className={cn(
            'flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
            isDragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100',
            error && 'border-red-300 bg-red-50'
          )}
        >
          <input {...getInputProps()} />
          <Upload
            size={24}
            className={cn(
              'mb-2',
              isDragActive ? 'text-primary-600' : 'text-gray-400'
            )}
            aria-hidden="true"
          />
          <p className="text-sm text-gray-600 text-center">
            {t('form.attachmentsHint')}
          </p>
          <p className="mt-1 text-xs text-gray-400 text-center">
            {acceptedTypes.map((e) => e.replace('.', '').toUpperCase()).join(', ')}
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          className="flex items-center gap-2 text-sm text-red-600"
          role="alert"
        >
          <AlertCircle size={16} className="shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <ul className="space-y-2" aria-label={t('form.attachments')}>
          {files.map((file) => (
            <li
              key={file.id}
              className={cn(
                'flex items-center justify-between gap-3 px-3 py-2 bg-white border border-gray-200 rounded-lg',
                isRtl && 'flex-row-reverse'
              )}
            >
              <div
                className={cn(
                  'flex items-center gap-2 min-w-0',
                  isRtl && 'flex-row-reverse'
                )}
              >
                <FileText size={16} className="text-gray-400 shrink-0" aria-hidden="true" />
                <span className="text-sm text-gray-800 truncate">{file.name}</span>
                <span className="text-xs text-gray-400 shrink-0">
                  {formatFileSize(file.size)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemove(file.id)}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors shrink-0"
                aria-label={`${t('form.attachments')} - ${file.name}`}
              >
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
