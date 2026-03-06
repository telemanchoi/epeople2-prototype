import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function Footer() {
  const { t } = useTranslation('common');

  return (
    <footer className="bg-gray-800 text-gray-200">
      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Column 1: BCRC Contact */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {t('footer.contact')}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-gray-300">BCRC - Bureau Central des Relations avec le Citoyen</span>
              </li>
              <li>
                <span className="text-gray-300">Kasbah, Tunis 1006</span>
              </li>
              <li>
                <a
                  href="tel:+21671000000"
                  className="inline-block py-1 text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer"
                >
                  +216 71 000 000
                </a>
              </li>
              <li>
                <a
                  href="mailto:contact@bcrc.gov.tn"
                  className="inline-block py-1 text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer"
                >
                  contact@bcrc.gov.tn
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {t('footer.quickLinks') || t('nav.home')}
            </h3>
            <ul className="space-y-1 text-sm">
              <li>
                <Link
                  to="/citizen/complaints/new"
                  className="inline-block py-1.5 text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer"
                >
                  {t('buttons.newComplaint')}
                </Link>
              </li>
              <li>
                <Link
                  to="/citizen/reports/new"
                  className="inline-block py-1.5 text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer"
                >
                  {t('buttons.newReport')}
                </Link>
              </li>
              <li>
                <Link
                  to="/citizen/proposals"
                  className="inline-block py-1.5 text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer"
                >
                  {t('nav.proposals')}
                </Link>
              </li>
              <li>
                <Link
                  to="/citizen/complaints"
                  className="inline-block py-1.5 text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer"
                >
                  {t('nav.complaints')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {t('footer.accessibility')}
            </h3>
            <ul className="space-y-1 text-sm">
              <li>
                <Link
                  to="#"
                  className="inline-block py-1.5 text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer"
                >
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="inline-block py-1.5 text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer"
                >
                  {t('footer.accessibility')}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-gray-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-sm text-gray-400 text-center">
            {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
}
