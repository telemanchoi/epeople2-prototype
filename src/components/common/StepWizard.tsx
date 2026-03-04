import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface StepWizardProps {
  steps: string[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  className?: string;
}

export function StepWizard({
  steps,
  currentStep,
  onStepClick,
  className,
}: StepWizardProps) {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <nav
      aria-label="Progress"
      className={cn('w-full', className)}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <ol className="flex items-center w-full">
        {steps.map((label, index) => {
          const stepNum = index + 1;
          const isDone = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          const isPending = stepNum > currentStep;
          const isLast = index === steps.length - 1;
          const isClickable = onStepClick && isDone;

          return (
            <li
              key={index}
              className={cn('flex items-center', !isLast && 'flex-1')}
            >
              <button
                type="button"
                onClick={isClickable ? () => onStepClick(stepNum) : undefined}
                disabled={!isClickable}
                className={cn(
                  'flex flex-col items-center gap-1.5 group',
                  isClickable && 'cursor-pointer'
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {/* Circle */}
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors shrink-0',
                    isDone && 'bg-primary-700 text-white',
                    isCurrent && 'bg-white border-2 border-primary-700 text-primary-700',
                    isPending && 'bg-gray-200 text-gray-400'
                  )}
                >
                  {isDone ? (
                    <Check size={16} aria-hidden="true" />
                  ) : (
                    stepNum
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    'text-xs text-center max-w-[80px] leading-tight',
                    isDone && 'text-primary-700 font-medium',
                    isCurrent && 'text-primary-700 font-medium',
                    isPending && 'text-gray-400'
                  )}
                >
                  {label}
                </span>
              </button>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 mt-[-20px]',
                    isDone ? 'bg-primary-700' : 'bg-gray-200'
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
