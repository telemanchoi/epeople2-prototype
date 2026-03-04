import { useEffect, useMemo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertCircle,
  Lightbulb,
  HelpCircle,
  MessageSquare,
  Flag,
  CheckCircle2,
  CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { StepWizard } from '@/components/common/StepWizard';
import { FileUploadZone } from '@/components/common/FileUploadZone';
import type { UploadedFile } from '@/components/common/FileUploadZone';
import { Skeleton } from '@/components/common/Skeleton';
import { useCategories, useSubmitComplaint } from '@/hooks';
import { useComplaintFormStore } from '@/stores';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/date';
import type { ComplaintType, ICategory } from '@/types';

// ─── Type card config ────────────────────────────────────────
const ICON_MAP: Record<ComplaintType, React.ComponentType<{ size?: number; className?: string }>> = {
  grievance: AlertCircle,
  proposal: Lightbulb,
  inquiry: HelpCircle,
  suggestion: MessageSquare,
  report: Flag,
};

const TYPE_STYLE: Record<ComplaintType, string> = {
  grievance: 'border-red-300 bg-red-50 hover:border-red-500',
  proposal: 'border-blue-300 bg-blue-50 hover:border-blue-500',
  inquiry: 'border-purple-300 bg-purple-50 hover:border-purple-500',
  suggestion: 'border-orange-300 bg-orange-50 hover:border-orange-500',
  report: 'border-pink-300 bg-pink-50 hover:border-pink-500',
};

const TYPE_SELECTED: Record<ComplaintType, string> = {
  grievance: 'border-red-600 ring-2 ring-red-200',
  proposal: 'border-blue-600 ring-2 ring-blue-200',
  inquiry: 'border-purple-600 ring-2 ring-purple-200',
  suggestion: 'border-orange-600 ring-2 ring-orange-200',
  report: 'border-pink-600 ring-2 ring-pink-200',
};

const TYPE_ICON_COLOR: Record<ComplaintType, string> = {
  grievance: 'text-red-600',
  proposal: 'text-blue-600',
  inquiry: 'text-purple-600',
  suggestion: 'text-orange-600',
  report: 'text-pink-600',
};

const COMPLAINT_TYPES: ComplaintType[] = [
  'grievance',
  'proposal',
  'inquiry',
  'suggestion',
  'report',
];

// ─── Tunisian regions (mock) ─────────────────────────────────
const REGIONS = [
  { code: 'TUN', nameFr: 'Tunis', nameAr: 'تونس' },
  { code: 'ARI', nameFr: 'Ariana', nameAr: 'أريانة' },
  { code: 'BNA', nameFr: 'Ben Arous', nameAr: 'بن عروس' },
  { code: 'MAN', nameFr: 'Manouba', nameAr: 'منوبة' },
  { code: 'NAB', nameFr: 'Nabeul', nameAr: 'نابل' },
  { code: 'ZAG', nameFr: 'Zaghouan', nameAr: 'زغوان' },
  { code: 'BIZ', nameFr: 'Bizerte', nameAr: 'بنزرت' },
  { code: 'BEJ', nameFr: 'Béja', nameAr: 'باجة' },
  { code: 'JEN', nameFr: 'Jendouba', nameAr: 'جندوبة' },
  { code: 'KEF', nameFr: 'Le Kef', nameAr: 'الكاف' },
  { code: 'SIL', nameFr: 'Siliana', nameAr: 'سليانة' },
  { code: 'SOU', nameFr: 'Sousse', nameAr: 'سوسة' },
  { code: 'MON', nameFr: 'Monastir', nameAr: 'المنستير' },
  { code: 'MAH', nameFr: 'Mahdia', nameAr: 'المهدية' },
  { code: 'SFA', nameFr: 'Sfax', nameAr: 'صفاقس' },
  { code: 'KAI', nameFr: 'Kairouan', nameAr: 'القيروان' },
  { code: 'KAS', nameFr: 'Kasserine', nameAr: 'القصرين' },
  { code: 'SBZ', nameFr: 'Sidi Bouzid', nameAr: 'سيدي بوزيد' },
  { code: 'GAB', nameFr: 'Gabès', nameAr: 'قابس' },
  { code: 'MED', nameFr: 'Médenine', nameAr: 'مدنين' },
  { code: 'TAT', nameFr: 'Tataouine', nameAr: 'تطاوين' },
  { code: 'GAF', nameFr: 'Gafsa', nameAr: 'قفصة' },
  { code: 'TOZ', nameFr: 'Tozeur', nameAr: 'توزر' },
  { code: 'KEB', nameFr: 'Kébili', nameAr: 'قبلي' },
];

// ─── Zod schema for Step 3 ───────────────────────────────────
const step3Schema = z.object({
  titleFr: z.string().min(1).max(200),
  contentFr: z.string().min(1).max(2000),
  regionCode: z.string().min(1),
  incidentDate: z.string().optional(),
});

type Step3FormData = z.infer<typeof step3Schema>;

// ─── Main Component ──────────────────────────────────────────
export default function ComplaintNewPage() {
  const { t: tC } = useTranslation('complaint');
  const { t: tCommon } = useTranslation('common');
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const lang = i18n.language as 'ar' | 'fr' | 'ko';

  const {
    currentStep,
    formData,
    isSubmitting,
    submittedComplaintId,
    setStep,
    nextStep,
    prevStep,
    setSubmitting,
    setSubmittedId,
    reset,
  } = useComplaintFormStore();

  const submitMutation = useSubmitComplaint();

  // Reset form on mount
  useEffect(() => {
    reset();
  }, [reset]);

  const steps = [
    tC('steps.step1'),
    tC('steps.step2'),
    tC('steps.step3'),
    tC('steps.step4'),
    tC('steps.step5'),
  ];

  // ─── Step navigation validations ──────────────────────────
  const canGoNext = useMemo(() => {
    switch (currentStep) {
      case 1:
        return formData.type !== null;
      case 2:
        return formData.categoryL1 !== '' && formData.categoryL2 !== '';
      case 3:
        return formData.titleFr.trim() !== '' && formData.contentFr.trim() !== '' && formData.regionCode !== '';
      case 4:
        return true; // Files are optional
      case 5:
        return formData.consentGiven;
      default:
        return false;
    }
  }, [currentStep, formData]);

  const handleNext = () => {
    if (canGoNext) nextStep();
  };

  const handleSubmit = () => {
    if (!formData.consentGiven) return;
    setSubmitting(true);
    submitMutation.mutate(formData, {
      onSuccess: (response) => {
        const id = response?.data?.id ?? `CMP-2024-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`;
        setSubmittedId(id);
        setSubmitting(false);
      },
      onError: () => {
        setSubmitting(false);
      },
    });
  };

  // If submitted, show success screen
  if (submittedComplaintId) {
    return <SuccessScreen complaintId={submittedComplaintId} lang={lang} isRtl={isRtl} />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Step Wizard */}
      <StepWizard
        steps={steps}
        currentStep={currentStep}
        onStepClick={(step) => {
          if (step < currentStep) setStep(step);
        }}
      />

      {/* Step Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        {currentStep === 1 && <Step1TypeSelection />}
        {currentStep === 2 && <Step2CategorySelection />}
        {currentStep === 3 && <Step3ContentEntry />}
        {currentStep === 4 && <Step4FileUpload />}
        {currentStep === 5 && <Step5Confirmation />}
      </div>

      {/* Navigation Buttons */}
      <div
        className={cn(
          'flex items-center gap-3',
          currentStep === 1 ? 'justify-end' : 'justify-between',
          isRtl && 'flex-row-reverse'
        )}
      >
        {currentStep > 1 && (
          <Button variant="outline" onClick={prevStep}>
            {tCommon('buttons.previous')}
          </Button>
        )}
        {currentStep < 5 ? (
          <Button variant="primary" onClick={handleNext} disabled={!canGoNext}>
            {tCommon('buttons.next')}
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!canGoNext || isSubmitting}
            loading={isSubmitting}
          >
            {tCommon('buttons.submit')}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Step 1: Type Selection (G-01) ──────────────────────────
function Step1TypeSelection() {
  const { t: tC } = useTranslation('complaint');
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { formData, updateFormData } = useComplaintFormStore();

  return (
    <div>
      <h2
        className={cn(
          'text-lg font-semibold text-gray-900 mb-2',
          isRtl ? 'text-right' : 'text-left'
        )}
      >
        {tC('form.selectType')}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {COMPLAINT_TYPES.map((type) => {
          const Icon = ICON_MAP[type];
          const isSelected = formData.type === type;

          return (
            <button
              key={type}
              type="button"
              onClick={() => updateFormData({ type })}
              className={cn(
                'flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all text-center',
                TYPE_STYLE[type],
                isSelected && TYPE_SELECTED[type]
              )}
            >
              <Icon
                size={32}
                className={cn(TYPE_ICON_COLOR[type])}
              />
              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  {tC(`types.${type}`)}
                </p>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  {tC(`typeDescriptions.${type}`)}
                </p>
                <p className="text-xs font-medium text-gray-500 mt-2">
                  SLA: {tC(`sla.${type}`)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 2: Category Selection (Cascading) ──────────────────
function Step2CategorySelection() {
  const { t: tC } = useTranslation('complaint');
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const lang = i18n.language as 'ar' | 'fr' | 'ko';
  const { formData, updateFormData } = useComplaintFormStore();
  const { data: categories, isLoading } = useCategories();

  const l1Options = useMemo(() => categories ?? [], [categories]);

  const l2Options = useMemo(() => {
    if (!formData.categoryL1 || !categories) return [];
    const parent = categories.find((c) => c.code === formData.categoryL1);
    return parent?.children ?? [];
  }, [formData.categoryL1, categories]);

  const l3Options = useMemo(() => {
    if (!formData.categoryL2 || !l2Options.length) return [];
    const parent = l2Options.find((c) => c.code === formData.categoryL2);
    return parent?.children ?? [];
  }, [formData.categoryL2, l2Options]);

  const getLabel = (cat: ICategory) => {
    return lang === 'ar' ? cat.nameAr : cat.nameFr;
  };

  // Find suggested agency name (mock: just show a BRC name based on L1)
  const suggestedAgency = useMemo(() => {
    if (!formData.categoryL1) return '';
    const l1 = categories?.find((c) => c.code === formData.categoryL1);
    if (!l1) return '';
    return `BRC - ${l1.nameFr}`;
  }, [formData.categoryL1, categories]);

  if (isLoading) return <Skeleton variant="text" count={6} />;

  const selectClass = cn(
    'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white',
    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
    isRtl ? 'text-right' : 'text-left'
  );

  return (
    <div className="space-y-5">
      <h2
        className={cn(
          'text-lg font-semibold text-gray-900 mb-2',
          isRtl ? 'text-right' : 'text-left'
        )}
      >
        {tC('form.selectCategory')}
      </h2>

      {/* L1 */}
      <div>
        <label
          className={cn(
            'block text-sm font-medium text-gray-700 mb-1',
            isRtl ? 'text-right' : 'text-left'
          )}
        >
          {tC('form.categoryL1')}
        </label>
        <select
          value={formData.categoryL1}
          onChange={(e) =>
            updateFormData({
              categoryL1: e.target.value,
              categoryL2: '',
              categoryL3: '',
            })
          }
          className={selectClass}
        >
          <option value="">{tC('form.selectCategory')}</option>
          {l1Options.map((cat) => (
            <option key={cat.code} value={cat.code}>
              {getLabel(cat)}
            </option>
          ))}
        </select>
      </div>

      {/* L2 */}
      {l2Options.length > 0 && (
        <div>
          <label
            className={cn(
              'block text-sm font-medium text-gray-700 mb-1',
              isRtl ? 'text-right' : 'text-left'
            )}
          >
            {tC('form.categoryL2')}
          </label>
          <select
            value={formData.categoryL2}
            onChange={(e) =>
              updateFormData({
                categoryL2: e.target.value,
                categoryL3: '',
              })
            }
            className={selectClass}
          >
            <option value="">{tC('form.selectCategory')}</option>
            {l2Options.map((cat) => (
              <option key={cat.code} value={cat.code}>
                {getLabel(cat)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* L3 */}
      {l3Options.length > 0 && (
        <div>
          <label
            className={cn(
              'block text-sm font-medium text-gray-700 mb-1',
              isRtl ? 'text-right' : 'text-left'
            )}
          >
            {tC('form.categoryL3')}
          </label>
          <select
            value={formData.categoryL3}
            onChange={(e) =>
              updateFormData({ categoryL3: e.target.value })
            }
            className={selectClass}
          >
            <option value="">{tC('form.selectCategory')}</option>
            {l3Options.map((cat) => (
              <option key={cat.code} value={cat.code}>
                {getLabel(cat)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Suggested agency */}
      {suggestedAgency && (
        <div className={cn(
          'bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800',
          isRtl ? 'text-right' : 'text-left'
        )}>
          <span className="font-medium">{tC('table.agency')}: </span>
          {suggestedAgency}
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Content Entry ───────────────────────────────────
function Step3ContentEntry() {
  const { t: tC } = useTranslation('complaint');
  const { t: tCommon } = useTranslation('common');
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const lang = i18n.language as 'ar' | 'fr' | 'ko';
  const { formData, updateFormData } = useComplaintFormStore();

  const {
    register,
    formState: { errors },
    watch,
  } = useForm<Step3FormData>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      titleFr: formData.titleFr,
      contentFr: formData.contentFr,
      regionCode: formData.regionCode,
      incidentDate: formData.incidentDate,
    },
    mode: 'onChange',
  });

  const titleValue = watch('titleFr') ?? formData.titleFr;
  const contentValue = watch('contentFr') ?? formData.contentFr;

  const inputClass = cn(
    'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm',
    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
    'placeholder:text-gray-400',
    isRtl ? 'text-right' : 'text-left'
  );

  const labelClass = cn(
    'block text-sm font-medium text-gray-700 mb-1',
    isRtl ? 'text-right' : 'text-left'
  );

  return (
    <div className="space-y-5">
      <h2
        className={cn(
          'text-lg font-semibold text-gray-900 mb-2',
          isRtl ? 'text-right' : 'text-left'
        )}
      >
        {tC('steps.step3')}
      </h2>

      {/* Title */}
      <div>
        <label htmlFor="titleFr" className={labelClass}>
          {tC('form.title')} *
        </label>
        <input
          id="titleFr"
          type="text"
          maxLength={200}
          placeholder={tC('form.titlePlaceholder')}
          className={cn(inputClass, errors.titleFr && 'border-red-500')}
          {...register('titleFr', {
            onChange: (e) => updateFormData({ titleFr: e.target.value }),
          })}
        />
        <div
          className={cn(
            'flex items-center justify-between mt-1',
            isRtl && 'flex-row-reverse'
          )}
        >
          {errors.titleFr && (
            <span className="text-xs text-red-600">{tCommon('form.required')}</span>
          )}
          <span className={cn('text-xs text-gray-400', !errors.titleFr && 'ml-auto rtl:mr-auto rtl:ml-0')}>
            {titleValue.length}/200
          </span>
        </div>
      </div>

      {/* Content */}
      <div>
        <label htmlFor="contentFr" className={labelClass}>
          {tC('form.content')} *
        </label>
        <textarea
          id="contentFr"
          rows={6}
          maxLength={2000}
          placeholder={tC('form.contentPlaceholder')}
          className={cn(inputClass, 'resize-none', errors.contentFr && 'border-red-500')}
          {...register('contentFr', {
            onChange: (e) => updateFormData({ contentFr: e.target.value }),
          })}
        />
        <div
          className={cn(
            'flex items-center justify-between mt-1',
            isRtl && 'flex-row-reverse'
          )}
        >
          {errors.contentFr && (
            <span className="text-xs text-red-600">{tCommon('form.required')}</span>
          )}
          <span className={cn('text-xs text-gray-400', !errors.contentFr && 'ml-auto rtl:mr-auto rtl:ml-0')}>
            {contentValue.length}/2000
          </span>
        </div>
      </div>

      {/* Region */}
      <div>
        <label htmlFor="regionCode" className={labelClass}>
          {tC('form.region')} *
        </label>
        <select
          id="regionCode"
          className={cn(inputClass, 'bg-white', errors.regionCode && 'border-red-500')}
          {...register('regionCode', {
            onChange: (e) => updateFormData({ regionCode: e.target.value }),
          })}
        >
          <option value="">{tCommon('form.selectOption')}</option>
          {REGIONS.map((r) => (
            <option key={r.code} value={r.code}>
              {lang === 'ar' ? r.nameAr : r.nameFr}
            </option>
          ))}
        </select>
        {errors.regionCode && (
          <span className="text-xs text-red-600 mt-1 block">
            {tCommon('form.required')}
          </span>
        )}
      </div>

      {/* Incident Date */}
      <div>
        <label htmlFor="incidentDate" className={labelClass}>
          {tC('form.incidentDate')}
        </label>
        <div className="relative">
          <input
            id="incidentDate"
            type="date"
            className={cn(inputClass, 'bg-white')}
            {...register('incidentDate', {
              onChange: (e) => updateFormData({ incidentDate: e.target.value }),
            })}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Step 4: File Upload ─────────────────────────────────────
function Step4FileUpload() {
  const { t: tC } = useTranslation('complaint');
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { formData, updateFormData } = useComplaintFormStore();

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(
    formData.uploadedAttachments.map((a) => ({
      id: a.id,
      name: a.originalName,
      size: a.sizeBytes,
      type: a.mimeType,
    }))
  );

  const handleUpload = useCallback(
    (files: File[]) => {
      const newFiles: UploadedFile[] = files.map((f, i) => ({
        id: `file-${Date.now()}-${i}`,
        name: f.name,
        size: f.size,
        type: f.type,
      }));
      const updated = [...uploadedFiles, ...newFiles].slice(0, 5);
      setUploadedFiles(updated);
      updateFormData({
        attachmentIds: updated.map((f) => f.id),
        uploadedAttachments: updated.map((f) => ({
          id: f.id,
          filename: f.name,
          originalName: f.name,
          sizeBytes: f.size,
          mimeType: f.type,
          uploadedAt: new Date().toISOString(),
        })),
      });
    },
    [uploadedFiles, updateFormData]
  );

  const handleRemove = useCallback(
    (fileId: string) => {
      const updated = uploadedFiles.filter((f) => f.id !== fileId);
      setUploadedFiles(updated);
      updateFormData({
        attachmentIds: updated.map((f) => f.id),
        uploadedAttachments: updated.map((f) => ({
          id: f.id,
          filename: f.name,
          originalName: f.name,
          sizeBytes: f.size,
          mimeType: f.type,
          uploadedAt: new Date().toISOString(),
        })),
      });
    },
    [uploadedFiles, updateFormData]
  );

  return (
    <div>
      <h2
        className={cn(
          'text-lg font-semibold text-gray-900 mb-4',
          isRtl ? 'text-right' : 'text-left'
        )}
      >
        {tC('steps.step4')}
      </h2>
      <FileUploadZone
        maxFiles={5}
        maxSizeMB={10}
        onUpload={handleUpload}
        files={uploadedFiles}
        onRemove={handleRemove}
      />
    </div>
  );
}

// ─── Step 5: Confirmation & Submit ───────────────────────────
function Step5Confirmation() {
  const { t: tC } = useTranslation('complaint');
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const lang = i18n.language as 'ar' | 'fr' | 'ko';
  const { formData, updateFormData } = useComplaintFormStore();
  const { data: categories } = useCategories();

  // Resolve category names
  const categoryPath = useMemo(() => {
    if (!categories) return '';
    const l1 = categories.find((c) => c.code === formData.categoryL1);
    const l2 = l1?.children?.find((c) => c.code === formData.categoryL2);
    const l3 = l2?.children?.find((c) => c.code === formData.categoryL3);
    const getName = (cat: ICategory | undefined) =>
      cat ? (lang === 'ar' ? cat.nameAr : cat.nameFr) : '';
    return [getName(l1), getName(l2), getName(l3)].filter(Boolean).join(' > ');
  }, [categories, formData, lang]);

  const regionName = useMemo(() => {
    const r = REGIONS.find((r) => r.code === formData.regionCode);
    return r ? (lang === 'ar' ? r.nameAr : r.nameFr) : formData.regionCode;
  }, [formData.regionCode, lang]);

  const summaryRows: Array<{ label: string; value: string }> = [
    { label: tC('table.type'), value: formData.type ? tC(`types.${formData.type}`) : '' },
    { label: tC('form.categoryL1'), value: categoryPath },
    { label: tC('form.title'), value: formData.titleFr },
    { label: tC('form.content'), value: formData.contentFr },
    { label: tC('form.region'), value: regionName },
  ];

  if (formData.incidentDate) {
    summaryRows.push({
      label: tC('form.incidentDate'),
      value: formData.incidentDate,
    });
  }

  if (formData.uploadedAttachments.length > 0) {
    summaryRows.push({
      label: tC('form.attachments'),
      value: formData.uploadedAttachments.map((a) => a.originalName).join(', '),
    });
  }

  return (
    <div className="space-y-5">
      <h2
        className={cn(
          'text-lg font-semibold text-gray-900 mb-2',
          isRtl ? 'text-right' : 'text-left'
        )}
      >
        {tC('form.summary')}
      </h2>

      <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
        {summaryRows.map((row) => (
          <div
            key={row.label}
            className={cn(
              'flex gap-4 px-4 py-3',
              isRtl && 'flex-row-reverse'
            )}
          >
            <span className="text-sm font-medium text-gray-500 w-36 shrink-0">
              {row.label}
            </span>
            <span className="text-sm text-gray-900 break-words min-w-0">
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* Consent */}
      <label
        className={cn(
          'flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer',
          isRtl && 'flex-row-reverse'
        )}
      >
        <input
          type="checkbox"
          checked={formData.consentGiven}
          onChange={(e) => updateFormData({ consentGiven: e.target.checked })}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <span className={cn('text-sm text-gray-700', isRtl ? 'text-right' : 'text-left')}>
          {tC('form.consent')}
        </span>
      </label>
    </div>
  );
}

// ─── Success Screen ──────────────────────────────────────────
function SuccessScreen({
  complaintId,
  lang,
  isRtl,
}: {
  complaintId: string;
  lang: 'ar' | 'fr' | 'ko';
  isRtl: boolean;
}) {
  const { t: tC } = useTranslation('complaint');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();
  const { reset } = useComplaintFormStore();

  // Calculate expected deadline (60 days from now as default max SLA)
  const deadlineDate = new Date();
  deadlineDate.setDate(deadlineDate.getDate() + 60);
  const deadline = formatDate(deadlineDate.toISOString(), lang);

  const handleGoToList = () => {
    reset();
    navigate('/citizen/complaints');
  };

  const handleNewComplaint = () => {
    reset();
  };

  return (
    <div
      className="max-w-lg mx-auto text-center py-12"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
        <CheckCircle2 className="h-10 w-10 text-green-600" />
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-2">
        {tC('form.submitSuccess')}
      </h2>

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 mt-6 space-y-3">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase">
            {tC('form.complaintId')}
          </p>
          <p className="text-lg font-bold text-primary-700 font-mono mt-1">
            {complaintId}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase">
            {tC('form.expectedDeadline')}
          </p>
          <p className="text-sm text-gray-900 mt-1 inline-flex items-center gap-1.5">
            <CalendarDays size={14} className="text-gray-400" />
            {deadline}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 mt-8">
        <Button variant="outline" onClick={handleNewComplaint}>
          {tCommon('buttons.newComplaint')}
        </Button>
        <Button variant="primary" onClick={handleGoToList}>
          {tCommon('nav.complaints')}
        </Button>
      </div>
    </div>
  );
}
