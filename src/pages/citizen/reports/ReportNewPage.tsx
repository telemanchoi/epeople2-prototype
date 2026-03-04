import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, ShieldOff, AlertTriangle, Copy, Check, FileSearch } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { FileUploadZone } from '@/components/common/FileUploadZone';
import type { UploadedFile } from '@/components/common/FileUploadZone';
import { useSubmitReport, useAgencies } from '@/hooks';
import { cn } from '@/utils/cn';
import type { CorruptionReportType } from '@/types';

type Step = 'identity' | 'form' | 'success';

interface ReportFormData {
  isAnonymous: boolean;
  type: CorruptionReportType | '';
  targetAgencyId: string;
  incidentDate: string;
  locationFr: string;
  locationAr: string;
  contentFr: string;
  contentAr: string;
  attachments: UploadedFile[];
}

const CORRUPTION_TYPES: CorruptionReportType[] = [
  'bribery',
  'embezzlement',
  'abuse_of_power',
  'nepotism',
  'other',
];

export default function ReportNewPage() {
  const { t, i18n } = useTranslation(['report', 'common']);
  const isRtl = i18n.language === 'ar';
  const lang = i18n.language as 'ar' | 'fr' | 'ko';

  const [step, setStep] = useState<Step>('identity');
  const [formData, setFormData] = useState<ReportFormData>({
    isAnonymous: false,
    type: '',
    targetAgencyId: '',
    incidentDate: '',
    locationFr: '',
    locationAr: '',
    contentFr: '',
    contentAr: '',
    attachments: [],
  });
  const [resultData, setResultData] = useState<{
    reportId: string;
    trackingCode: string;
    anonymousToken?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: agencies } = useAgencies();
  const submitMutation = useSubmitReport();

  const handleIdentityChoice = (anonymous: boolean) => {
    setFormData((prev) => ({ ...prev, isAnonymous: anonymous }));
    setStep('form');
  };

  const handleTypeSelect = (type: CorruptionReportType) => {
    setFormData((prev) => ({ ...prev, type }));
  };

  const handleUpload = useCallback((files: File[]) => {
    const uploaded: UploadedFile[] = files.map((f, idx) => ({
      id: `upload-${Date.now()}-${idx}`,
      name: f.name,
      size: f.size,
      type: f.type,
    }));
    setFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...uploaded],
    }));
  }, []);

  const handleRemoveFile = useCallback((fileId: string) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((f) => f.id !== fileId),
    }));
  }, []);

  const handleSubmit = async () => {
    if (!formData.type) return;
    try {
      const response = await submitMutation.mutateAsync({
        type: formData.type as CorruptionReportType,
        targetAgencyId: formData.targetAgencyId,
        incidentDate: formData.incidentDate || undefined,
        locationFr: formData.locationFr || undefined,
        locationAr: formData.locationAr || undefined,
        contentFr: formData.contentFr,
        contentAr: formData.contentAr,
        attachmentIds: formData.attachments.map((a) => a.id),
        isAnonymous: formData.isAnonymous,
      });
      setResultData(response.data ?? response);
      setStep('success');
    } catch {
      // error handled by mutation
    }
  };

  const handleCopyToken = () => {
    const token = resultData?.anonymousToken ?? resultData?.trackingCode ?? '';
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isFormValid =
    formData.type !== '' &&
    formData.targetAgencyId !== '' &&
    formData.contentFr.trim().length > 0;

  return (
    <div
      className="max-w-3xl mx-auto p-6 space-y-6"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Title */}
      <div className={isRtl ? 'text-right' : 'text-left'}>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('report:title')}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {t('report:subtitle')}
        </p>
      </div>

      {/* Step 1: Identity Choice */}
      {step === 'identity' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Named Card */}
          <button
            type="button"
            onClick={() => handleIdentityChoice(false)}
            className={cn(
              'flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all',
              'hover:border-primary-500 hover:shadow-md',
              'border-gray-200 bg-white'
            )}
          >
            <div className="p-3 rounded-full bg-green-50">
              <Shield size={32} className="text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t('report:form.named')}
            </h3>
            <p className="text-sm text-gray-500 text-center">
              {t('report:form.namedDescription')}
            </p>
          </button>

          {/* Anonymous Card */}
          <button
            type="button"
            onClick={() => handleIdentityChoice(true)}
            className={cn(
              'flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all',
              'hover:border-primary-500 hover:shadow-md',
              'border-gray-200 bg-white'
            )}
          >
            <div className="p-3 rounded-full bg-amber-50">
              <ShieldOff size={32} className="text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t('report:form.anonymous')}
            </h3>
            <p className="text-sm text-gray-500 text-center">
              {t('report:form.anonymousDescription')}
            </p>
          </button>
        </div>
      )}

      {/* Step 2: Form */}
      {step === 'form' && (
        <div className="space-y-6">
          {/* Anonymous Warning */}
          {formData.isAnonymous && (
            <div
              className={cn(
                'flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg',
                isRtl && 'flex-row-reverse'
              )}
            >
              <AlertTriangle
                size={20}
                className="text-amber-600 shrink-0 mt-0.5"
              />
              <p className="text-sm text-amber-800">
                {t('report:form.anonymousWarning')}
              </p>
            </div>
          )}

          {/* Corruption Type Cards */}
          <fieldset>
            <legend
              className={cn(
                'text-sm font-medium text-gray-700 mb-3',
                isRtl ? 'text-right' : 'text-left'
              )}
            >
              {t('report:form.corruptionType')}
            </legend>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {CORRUPTION_TYPES.map((ct) => (
                <button
                  key={ct}
                  type="button"
                  onClick={() => handleTypeSelect(ct)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all text-center',
                    formData.type === ct
                      ? 'border-primary-600 bg-primary-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  )}
                >
                  <span className="text-sm font-medium text-gray-900">
                    {t(`report:types.${ct}`)}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          {/* Target Agency */}
          <div>
            <label
              htmlFor="targetAgency"
              className={cn(
                'block text-sm font-medium text-gray-700 mb-1',
                isRtl ? 'text-right' : 'text-left'
              )}
            >
              {t('report:form.targetAgency')}
            </label>
            <select
              id="targetAgency"
              value={formData.targetAgencyId}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  targetAgencyId: e.target.value,
                }))
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">{t('report:form.selectAgency')}</option>
              {(agencies ?? []).map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {lang === 'ar' ? ag.nameAr : ag.nameFr}
                </option>
              ))}
            </select>
          </div>

          {/* Incident Date + Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="incidentDate"
                className={cn(
                  'block text-sm font-medium text-gray-700 mb-1',
                  isRtl ? 'text-right' : 'text-left'
                )}
              >
                {t('report:form.incidentDate')}
              </label>
              <input
                id="incidentDate"
                type="date"
                value={formData.incidentDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    incidentDate: e.target.value,
                  }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="location"
                className={cn(
                  'block text-sm font-medium text-gray-700 mb-1',
                  isRtl ? 'text-right' : 'text-left'
                )}
              >
                {t('report:form.location')}
              </label>
              <input
                id="location"
                type="text"
                value={isRtl ? formData.locationAr : formData.locationFr}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    [isRtl ? 'locationAr' : 'locationFr']: e.target.value,
                  }))
                }
                placeholder={t('report:form.locationPlaceholder')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
          </div>

          {/* Content */}
          <div>
            <label
              htmlFor="content"
              className={cn(
                'block text-sm font-medium text-gray-700 mb-1',
                isRtl ? 'text-right' : 'text-left'
              )}
            >
              {t('report:form.content')}
            </label>
            <textarea
              id="content"
              rows={6}
              value={isRtl ? formData.contentAr : formData.contentFr}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  [isRtl ? 'contentAr' : 'contentFr']: e.target.value,
                }))
              }
              placeholder={t('report:form.contentPlaceholder')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
            />
          </div>

          {/* Evidence Upload */}
          <div>
            <label
              className={cn(
                'block text-sm font-medium text-gray-700 mb-1',
                isRtl ? 'text-right' : 'text-left'
              )}
            >
              {t('report:form.evidence')}
            </label>
            <p
              className={cn(
                'text-xs text-gray-500 mb-2',
                isRtl ? 'text-right' : 'text-left'
              )}
            >
              {t('report:form.evidenceHint')}
            </p>
            <FileUploadZone
              maxFiles={5}
              maxSizeMB={10}
              onUpload={handleUpload}
              files={formData.attachments}
              onRemove={handleRemoveFile}
            />
          </div>

          {/* Submit Button */}
          <div
            className={cn(
              'flex gap-3',
              isRtl ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            <Button
              variant="ghost"
              onClick={() => setStep('identity')}
            >
              {t('common:buttons.back')}
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={submitMutation.isPending}
              disabled={!isFormValid}
            >
              {t('report:form.submit')}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 'success' && resultData && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
            <Check size={32} className="text-green-600" />
          </div>

          <h2 className="text-xl font-bold text-gray-900">
            {t('report:form.submitSuccess')}
          </h2>

          <div className="space-y-4 max-w-md mx-auto">
            {/* Report ID */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                {t('report:form.reportId')}
              </p>
              <p className="text-lg font-mono font-bold text-gray-900">
                {resultData.reportId}
              </p>
            </div>

            {/* Tracking Code */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                {t('report:form.trackingCode')}
              </p>
              <div
                className={cn(
                  'flex items-center justify-center gap-2',
                  isRtl && 'flex-row-reverse'
                )}
              >
                <p className="text-lg font-mono font-bold text-gray-900">
                  {resultData.trackingCode}
                </p>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                  title={t('report:form.copyToken')}
                >
                  {copied ? (
                    <Check size={16} className="text-green-600" />
                  ) : (
                    <Copy size={16} className="text-gray-400" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t('report:form.trackingCodeHint')}
              </p>
            </div>

            {/* Anonymous Token (strong warning) */}
            {formData.isAnonymous && resultData.anonymousToken && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <AlertTriangle
                    size={16}
                    className="text-amber-600"
                  />
                  <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                    {t('report:form.trackingCode')}
                  </p>
                </div>
                <div
                  className={cn(
                    'flex items-center justify-center gap-2',
                    isRtl && 'flex-row-reverse'
                  )}
                >
                  <p className="text-lg font-mono font-bold text-amber-900">
                    {resultData.anonymousToken}
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyToken}
                    className="p-1.5 rounded hover:bg-amber-100 transition-colors"
                    title={t('report:form.copyToken')}
                  >
                    {copied ? (
                      <Check size={16} className="text-green-600" />
                    ) : (
                      <Copy size={16} className="text-amber-600" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-amber-700 mt-2 font-medium">
                  {t('report:form.anonymousTokenHint')}
                </p>
              </div>
            )}
          </div>

          {/* Track Report Button */}
          <Button
            variant="primary"
            leftIcon={<FileSearch size={16} />}
            onClick={() => {
              // Navigate to track page would go here
            }}
          >
            {t('report:form.trackMyReport')}
          </Button>
        </div>
      )}
    </div>
  );
}
