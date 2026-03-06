import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { FileUploadZone } from '@/components/common/FileUploadZone';
import type { UploadedFile } from '@/components/common/FileUploadZone';
import { Skeleton } from '@/components/common/Skeleton';
import { useCategories, useSubmitProposal } from '@/hooks';
import { cn } from '@/utils/cn';

const TITLE_MAX = 200;
const CONTENT_MAX = 5000;

export default function ProposalNewPage() {
  const { t, i18n } = useTranslation(['proposal', 'common']);
  const isRtl = i18n.language === 'ar';
  const lang = i18n.language as 'ar' | 'fr' | 'ko';
  const navigate = useNavigate();

  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const submitProposal = useSubmitProposal();

  // Form state
  const [title, setTitle] = useState('');
  const [categoryL1, setCategoryL1] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);

  // Success state
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  // Validation
  const titleError = title.length > 0 && title.length > TITLE_MAX;
  const contentError = content.length > 0 && content.length > CONTENT_MAX;
  const isValid =
    title.trim().length > 0 &&
    title.length <= TITLE_MAX &&
    categoryL1 !== '' &&
    content.trim().length > 0 &&
    content.length <= CONTENT_MAX;

  // File handlers
  const handleUpload = useCallback((newFiles: File[]) => {
    const uploaded: UploadedFile[] = newFiles.map((f, i) => ({
      id: `file-${Date.now()}-${i}`,
      name: f.name,
      size: f.size,
      type: f.type,
    }));
    setFiles((prev) => [...prev, ...uploaded]);
  }, []);

  const handleRemoveFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  // Submit handler
  const handleSubmit = () => {
    if (!isValid) return;
    submitProposal.mutate(
      {
        titleFr: title,
        titleAr: title,
        contentFr: content,
        contentAr: content,
        categoryL1,
        attachmentIds: files.map((f) => f.id),
      },
      {
        onSuccess: (response) => {
          const id =
            response?.data?.id ?? `PRO-${Date.now().toString().slice(-6)}`;
          setSubmittedId(id);
        },
      }
    );
  };

  // L1 categories (top level only)
  const l1Categories = categories ?? [];

  // Success screen
  if (submittedId) {
    return (
      <div
        className="p-6 flex items-center justify-center min-h-[60vh]"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="text-center max-w-md space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            {t('proposal:form.submitSuccess')}
          </h2>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">
              {t('proposal:form.proposalId')}
            </p>
            <p className="text-lg font-mono font-bold text-primary-700">
              {submittedId}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/citizen/proposals')}
          >
            {t('proposal:form.backToList')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <h1
        className={cn(
          'text-xl font-bold text-gray-900',
          isRtl ? 'text-right' : 'text-left'
        )}
      >
        {t('proposal:form.title')}
      </h1>

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
        {/* Title input */}
        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="proposal-title"
          >
            {t('proposal:form.proposalTitle')} *
          </label>
          <input
            id="proposal-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={TITLE_MAX + 10}
            placeholder={t('proposal:form.titlePlaceholder')}
            className={cn(
              'w-full rounded-md border py-2 px-3 text-sm focus:ring-primary-500',
              titleError
                ? 'border-red-300 focus:border-red-500'
                : 'border-gray-300 focus:border-primary-500',
              isRtl && 'text-right'
            )}
          />
          <p
            className={cn(
              'mt-1 text-sm',
              title.length > TITLE_MAX ? 'text-red-600' : 'text-gray-400'
            )}
          >
            {t('proposal:form.charCount', {
              current: title.length,
              max: TITLE_MAX,
            })}
          </p>
        </div>

        {/* Category select */}
        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="proposal-category"
          >
            {t('proposal:form.category')} *
          </label>
          {categoriesLoading ? (
            <Skeleton variant="text" count={1} />
          ) : (
            <select
              id="proposal-category"
              value={categoryL1}
              onChange={(e) => setCategoryL1(e.target.value)}
              className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="">{t('common:form.selectOption')}</option>
              {l1Categories.map((cat) => (
                <option key={cat.code} value={cat.code}>
                  {lang === 'ar' ? cat.nameAr : cat.nameFr}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Content textarea */}
        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="proposal-content"
          >
            {t('proposal:form.content')} *
          </label>
          <textarea
            id="proposal-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            placeholder={t('proposal:form.contentPlaceholder')}
            className={cn(
              'w-full rounded-md border p-3 text-sm focus:ring-primary-500 resize-y',
              contentError
                ? 'border-red-300 focus:border-red-500'
                : 'border-gray-300 focus:border-primary-500',
              isRtl && 'text-right'
            )}
          />
          <p
            className={cn(
              'mt-1 text-sm',
              content.length > CONTENT_MAX ? 'text-red-600' : 'text-gray-400'
            )}
          >
            {t('proposal:form.charCount', {
              current: content.length,
              max: CONTENT_MAX,
            })}
          </p>
        </div>

        {/* File upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('proposal:form.attachments')}
          </label>
          <FileUploadZone
            onUpload={handleUpload}
            files={files}
            onRemove={handleRemoveFile}
            maxFiles={5}
            maxSizeMB={10}
          />
        </div>

        {/* Submit button */}
        <div
          className={cn(
            'flex items-center gap-3 pt-2',
            isRtl ? 'flex-row-reverse' : ''
          )}
        >
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => navigate('/citizen/proposals')}
          >
            {t('common:buttons.cancel')}
          </Button>
          <Button
            variant="primary"
            className="cursor-pointer"
            onClick={handleSubmit}
            disabled={!isValid}
            loading={submitProposal.isPending}
          >
            {submitProposal.isPending
              ? t('proposal:form.submitting')
              : t('proposal:form.submit')}
          </Button>
        </div>
      </div>
    </div>
  );
}
