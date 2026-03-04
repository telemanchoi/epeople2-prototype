import { create } from 'zustand';
import i18n from '@/i18n';

type Language = 'ar' | 'fr' | 'ko';
type ModalType =
  | 'transfer'
  | 'deadlineExtension'
  | 'jointProcess'
  | 'confirmation'
  | null;

interface UIState {
  language: Language;
  isRTL: boolean;
  sidebarOpen: boolean;
  activeModal: ModalType;
  setLanguage: (lang: Language) => void;
  toggleSidebar: () => void;
  openModal: (modal: NonNullable<ModalType>) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  language: 'fr',
  isRTL: false,
  sidebarOpen: true,
  activeModal: null,

  setLanguage: (lang) => {
    i18n.changeLanguage(lang);
    const isRTL = lang === 'ar';
    document.documentElement.lang = lang;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.body.className = isRTL
      ? 'font-arabic'
      : lang === 'ko'
        ? 'font-korean'
        : 'font-latin';
    set({ language: lang, isRTL });
  },

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  openModal: (modal) => set({ activeModal: modal }),

  closeModal: () => set({ activeModal: null }),
}));
