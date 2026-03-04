import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import all translation files
import arCommon from './locales/ar/common.json';
import arComplaint from './locales/ar/complaint.json';
import arAuth from './locales/ar/auth.json';
import arAdmin from './locales/ar/admin.json';
import arReport from './locales/ar/report.json';
import arProposal from './locales/ar/proposal.json';

import frCommon from './locales/fr/common.json';
import frComplaint from './locales/fr/complaint.json';
import frAuth from './locales/fr/auth.json';
import frAdmin from './locales/fr/admin.json';
import frReport from './locales/fr/report.json';
import frProposal from './locales/fr/proposal.json';

import koCommon from './locales/ko/common.json';
import koComplaint from './locales/ko/complaint.json';
import koAuth from './locales/ko/auth.json';
import koAdmin from './locales/ko/admin.json';
import koReport from './locales/ko/report.json';
import koProposal from './locales/ko/proposal.json';

const storedLang = localStorage.getItem('epeople2-lang');
const initialLng = storedLang === 'ar' || storedLang === 'fr' || storedLang === 'ko'
  ? storedLang
  : 'fr';

i18n.use(initReactI18next).init({
  resources: {
    ar: { common: arCommon, complaint: arComplaint, auth: arAuth, admin: arAdmin, report: arReport, proposal: arProposal },
    fr: { common: frCommon, complaint: frComplaint, auth: frAuth, admin: frAdmin, report: frReport, proposal: frProposal },
    ko: { common: koCommon, complaint: koComplaint, auth: koAuth, admin: koAdmin, report: koReport, proposal: koProposal },
  },
  lng: initialLng,
  fallbackLng: 'fr',
  ns: ['common', 'complaint', 'auth', 'admin', 'report', 'proposal'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});

export default i18n;
