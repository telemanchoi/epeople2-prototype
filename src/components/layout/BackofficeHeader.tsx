import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, Bell, Globe, ChevronDown, LogOut } from 'lucide-react';
import { useAuthStore, useUIStore } from '@/stores';
import { cn } from '@/utils/cn';

const languages = [
  { code: 'ar' as const, label: 'العربية' },
  { code: 'fr' as const, label: 'Français' },
  { code: 'ko' as const, label: '한국어' },
];

/** Map route segments to breadcrumb labels (i18n keys) */
const BREADCRUMB_MAP: Record<string, string> = {
  backoffice: 'nav.backoffice',
  admin: 'nav.admin',
  worklist: 'nav.worklist',
  statistics: 'nav.statistics',
  complaints: 'nav.complaints',
  helpdesk: 'nav.helpdesk',
  performance: 'nav.performance',
  users: 'nav.users',
};

export default function BackofficeHeader() {
  const { t } = useTranslation('common');
  const { getUser, logout } = useAuthStore();
  const { language, setLanguage, toggleSidebar } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const user = getUser();

  // Unread notification count (mock)
  const unreadCount = 3;

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdowns on Escape
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setLangDropdownOpen(false);
      setUserDropdownOpen(false);
    }
  }, []);

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    navigate('/auth/login');
  };

  // Build breadcrumb from pathname
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    const labelKey = BREADCRUMB_MAP[segment];
    const label = labelKey ? t(labelKey) : segment;
    const isLast = index === pathSegments.length - 1;
    return { label, path, isLast };
  });

  const currentLang = languages.find((l) => l.code === language);

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6" onKeyDown={handleKeyDown}>
      <div className="flex h-16 items-center justify-between">
        {/* Left: Sidebar toggle + Breadcrumb */}
        <div className="flex items-center gap-3 rtl:gap-3">
          <button
            onClick={toggleSidebar}
            className="lg:hidden flex items-center justify-center min-w-[44px] min-h-[44px] rounded-md text-gray-600 hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
            aria-label={t('buttons.toggleSidebar') || 'Toggle sidebar'}
          >
            <Menu size={20} aria-hidden="true" />
          </button>

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="hidden sm:block">
            <ol className="flex items-center gap-1.5 rtl:gap-1.5 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.path} className="flex items-center gap-1.5 rtl:gap-1.5">
                  {index > 0 && (
                    <span className="text-gray-300 rtl:rotate-180" aria-hidden="true">/</span>
                  )}
                  {crumb.isLast ? (
                    <span className="font-medium text-gray-900" aria-current="page">{crumb.label}</span>
                  ) : (
                    <span className="text-gray-600">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* Right: Notifications + Language + User */}
        <div className="flex items-center gap-2 rtl:gap-2">
          {/* Notification Bell */}
          <button
            className="relative flex items-center justify-center min-w-[44px] min-h-[44px] rounded-md text-gray-600 hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
            aria-label={`${t('nav.notifications') || 'Notifications'} (${unreadCount})`}
          >
            <Bell size={20} aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white" aria-hidden="true">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Language Switcher */}
          <div ref={langRef} className="relative">
            <button
              onClick={() => setLangDropdownOpen((v) => !v)}
              className="flex items-center gap-1.5 rtl:gap-1.5 min-h-[44px] px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
              aria-label={`${t('language.' + language)} — ${t('buttons.changeLanguage') || 'Change language'}`}
              aria-expanded={langDropdownOpen}
              aria-haspopup="listbox"
            >
              <Globe size={16} aria-hidden="true" />
              <span className="hidden sm:inline">{currentLang?.label}</span>
              <ChevronDown size={14} aria-hidden="true" />
            </button>
            {langDropdownOpen && (
              <div className="absolute end-0 mt-1 w-40 rounded-md bg-white shadow-lg ring-1 ring-black/5 z-50" role="listbox" aria-label={t('buttons.changeLanguage') || 'Language'}>
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    role="option"
                    aria-selected={language === lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setLangDropdownOpen(false);
                    }}
                    className={cn(
                      'block w-full px-4 py-2.5 text-sm text-start transition-colors duration-200 cursor-pointer',
                      language === lang.code
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Dropdown */}
          {user && (
            <div ref={userRef} className="relative">
              <button
                onClick={() => setUserDropdownOpen((v) => !v)}
                className="flex items-center gap-2 rtl:gap-2 min-h-[44px] px-2 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                aria-label={`${user.name} — ${t('buttons.userMenu') || 'User menu'}`}
                aria-expanded={userDropdownOpen}
                aria-haspopup="menu"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-start">
                  <p className="text-sm font-medium leading-tight">{user.name}</p>
                  <p className="text-xs text-gray-600 leading-tight">{user.role}</p>
                </div>
                <ChevronDown size={14} aria-hidden="true" />
              </button>
              {userDropdownOpen && (
                <div className="absolute end-0 mt-1 w-48 rounded-md bg-white shadow-lg ring-1 ring-black/5 z-50" role="menu">
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      role="menuitem"
                      className="flex w-full items-center gap-2 rtl:gap-2 px-4 py-2.5 text-sm text-red-700 hover:bg-red-50 transition-colors duration-200 text-start cursor-pointer"
                    >
                      <LogOut size={16} aria-hidden="true" />
                      {t('buttons.logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
