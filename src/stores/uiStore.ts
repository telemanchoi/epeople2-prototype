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

const storedLang = (typeof window !== 'undefined'
  ? localStorage.getItem('epeople2-lang')
  : null) as Language | null;
const initialLang: Language = storedLang === 'ar' || storedLang === 'fr' || storedLang === 'ko'
  ? storedLang
  : 'fr';

export const useUIStore = create<UIState>((set) => ({
  language: initialLang,
  isRTL: initialLang === 'ar',
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
    localStorage.setItem('epeople2-lang', lang);
    set({ language: lang, isRTL });
  },

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  openModal: (modal) => set({ activeModal: modal }),

  closeModal: () => set({ activeModal: null }),
}));
