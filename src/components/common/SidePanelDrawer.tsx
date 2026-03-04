import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';

export interface SidePanelDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  width?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

const widthStyles: Record<NonNullable<SidePanelDrawerProps['width']>, string> = {
  sm: 'w-80',  // 320px
  md: 'w-[480px]',
  lg: 'w-[640px]',
};

export function SidePanelDrawer({
  isOpen,
  onClose,
  title,
  width = 'md',
  children,
  className,
}: SidePanelDrawerProps) {
  const { t, i18n } = useTranslation('common');
  const isRtl = i18n.language === 'ar';
  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscape);

      requestAnimationFrame(() => {
        panelRef.current?.focus();
      });
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);

      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex"
      onClick={handleOverlayClick}
      role="presentation"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        dir={isRtl ? 'rtl' : 'ltr'}
        className={cn(
          'fixed top-0 bottom-0 z-50 flex flex-col bg-white shadow-xl',
          'focus:outline-none',
          'transition-transform duration-300 ease-in-out',
          widthStyles[width],
          // LTR: slide from right; RTL: slide from left
          isRtl ? 'left-0' : 'right-0',
          className
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0',
            isRtl && 'flex-row-reverse'
          )}
        >
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label={t('buttons.close')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
