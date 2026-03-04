import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useTransferComplaint, useAgencies } from '@/hooks';
import { cn } from '@/utils/cn';

export interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaintId: string;
  currentTransferCount: number;
}

export function TransferModal({
  isOpen,
  onClose,
  complaintId,
  currentTransferCount,
}: TransferModalProps) {
  const { t, i18n } = useTranslation(['complaint', 'common']);
  const isRtl = i18n.language === 'ar';
  const lang = i18n.language as 'ar' | 'fr' | 'ko';

  const { data: agencies } = useAgencies();
  const transferComplaint = useTransferComplaint();

  const [transferAgencyId, setTransferAgencyId] = useState('');
  const [transferReason, setTransferReason] = useState('');

  const canTransfer = currentTransferCount < 3;

  const handleSubmit = () => {
    if (!canTransfer || !transferAgencyId || transferReason.length < 50) return;
    transferComplaint.mutate(
      {
        id: complaintId,
        targetAgencyId: transferAgencyId,
        reasonFr: transferReason,
      },
      {
        onSuccess: () => {
          handleClose();
        },
      }
    );
  };

  const handleClose = () => {
    setTransferAgencyId('');
    setTransferReason('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('complaint:process.transfer')}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>
            {t('common:buttons.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !canTransfer ||
              !transferAgencyId ||
              transferReason.length < 50
            }
            loading={transferComplaint.isPending}
          >
            {t('common:buttons.confirm')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* G-02: Transfer limit check */}
        {!canTransfer && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700 font-medium">
              {t('complaint:process.transferLimitReached')}
            </p>
          </div>
        )}

        {/* Target agency */}
        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="transfer-agency-select"
          >
            {t('complaint:process.targetAgency')}
          </label>
          <select
            id="transfer-agency-select"
            value={transferAgencyId}
            onChange={(e) => setTransferAgencyId(e.target.value)}
            disabled={!canTransfer}
            className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-100"
          >
            <option value="">{t('complaint:process.selectAgency')}</option>
            {agencies?.map((agency) => (
              <option key={agency.id} value={agency.id}>
                {lang === 'ar' ? agency.nameAr : agency.nameFr}
              </option>
            ))}
          </select>
        </div>

        {/* Reason */}
        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="transfer-reason-input"
          >
            {t('complaint:process.transferReasonLabel')}
          </label>
          <textarea
            id="transfer-reason-input"
            value={transferReason}
            onChange={(e) => setTransferReason(e.target.value)}
            disabled={!canTransfer}
            rows={4}
            placeholder={t('complaint:process.transferReasonHint')}
            className={cn(
              'w-full rounded-md border border-gray-300 p-3 text-sm focus:border-primary-500 focus:ring-primary-500 resize-y disabled:bg-gray-100',
              isRtl && 'text-right'
            )}
          />
          <p
            className={cn(
              'mt-1 text-xs',
              transferReason.length < 50
                ? 'text-orange-600'
                : 'text-green-600'
            )}
          >
            {t('complaint:process.transferCharsCount', {
              count: transferReason.length,
            })}
          </p>
        </div>
      </div>
    </Modal>
  );
}
