import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { addDays, parseISO, format } from 'date-fns';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useExtendDeadline } from '@/hooks';
import { formatDate } from '@/utils/date';
import { cn } from '@/utils/cn';

export interface DeadlineExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaintId: string;
  currentDeadline: string;
}

export function DeadlineExtensionModal({
  isOpen,
  onClose,
  complaintId,
  currentDeadline,
}: DeadlineExtensionModalProps) {
  const { t, i18n } = useTranslation(['complaint', 'common']);
  const isRtl = i18n.language === 'ar';
  const lang = i18n.language as 'ar' | 'fr' | 'ko';

  const extendDeadline = useExtendDeadline();

  const [extensionDays, setExtensionDays] = useState(7);
  const [extensionReason, setExtensionReason] = useState('');

  const MIN_REASON_CHARS = 50;

  const newDeadline = useMemo(() => {
    if (!currentDeadline) return '';
    try {
      const d = addDays(parseISO(currentDeadline), extensionDays);
      return format(d, 'yyyy-MM-dd');
    } catch {
      return '';
    }
  }, [currentDeadline, extensionDays]);

  const handleSubmit = () => {
    if (!extensionReason || extensionReason.length < MIN_REASON_CHARS || extensionDays <= 0) return;
    extendDeadline.mutate(
      {
        id: complaintId,
        requestedAdditionalDays: extensionDays,
        reasonFr: extensionReason,
      },
      {
        onSuccess: () => {
          handleClose();
        },
      }
    );
  };

  const handleClose = () => {
    setExtensionDays(7);
    setExtensionReason('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('complaint:process.extendDeadline')}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>
            {t('common:buttons.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !extensionReason ||
              extensionReason.length < MIN_REASON_CHARS ||
              extensionDays <= 0
            }
            loading={extendDeadline.isPending}
          >
            {t('common:buttons.confirm')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Current deadline */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('complaint:process.currentDeadline')}
          </label>
          <p className="text-sm text-gray-800 bg-gray-50 rounded-md px-3 py-2 border border-gray-200">
            {currentDeadline ? formatDate(currentDeadline, lang) : '-'}
          </p>
        </div>

        {/* Additional days */}
        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="extension-days-input"
          >
            {t('complaint:process.additionalDays')}
          </label>
          <input
            id="extension-days-input"
            type="number"
            min={1}
            max={60}
            value={extensionDays}
            onChange={(e) =>
              setExtensionDays(
                Math.min(60, Math.max(1, parseInt(e.target.value, 10) || 1))
              )
            }
            className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>

        {/* New deadline */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('complaint:process.newDeadline')}
          </label>
          <p className="text-sm text-primary-700 bg-primary-50 rounded-md px-3 py-2 border border-primary-200 font-medium">
            {newDeadline || '-'}
          </p>
        </div>

        {/* Reason */}
        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="extension-reason-input"
          >
            {t('complaint:process.extensionReason')}
          </label>
          <textarea
            id="extension-reason-input"
            value={extensionReason}
            onChange={(e) => setExtensionReason(e.target.value)}
            rows={3}
            placeholder={t('complaint:process.extensionReasonPlaceholder')}
            className={cn(
              'w-full rounded-md border border-gray-300 p-3 text-sm focus:border-primary-500 focus:ring-primary-500 resize-y',
              isRtl && 'text-right'
            )}
          />
          <p
            className={cn(
              'mt-1 text-xs',
              extensionReason.length < MIN_REASON_CHARS
                ? 'text-orange-600'
                : 'text-green-600'
            )}
          >
            {t('complaint:process.extensionMinChars', {
              count: MIN_REASON_CHARS,
              current: extensionReason.length,
            })}
          </p>
        </div>
      </div>
    </Modal>
  );
}
