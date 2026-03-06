import { useState, useRef, useEffect, useCallback } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, ChevronDown, Globe, LogOut, User } from 'lucide-react';
import { useAuthStore, useUIStore } from '@/stores';
import { cn } from '@/utils/cn';

const languages = [
  { code: 'ar' as const, label: 'العربية' },
  { code: 'fr' as const, label: 'Français' },
  { code: 'ko' as const, label: '한국어' },
];

export default function Header() {
  const { t } = useTranslation('common');
  const { isAuthenticated, getUser, logout } = useAuthStore();
  const { language, setLanguage } = useUIStore();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const user = getUser();

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

  const navItems = [
    { to: '/citizen', label: t('nav.home'), end: true },
    { to: '/citizen/complaints', label: t('nav.complaints'), end: false },
    { to: '/citizen/reports/new', label: t('nav.reports'), end: false },
    { to: '/citizen/proposals', label: t('nav.proposals'), end: false },
  ];

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    navigate('/auth/login');
  };

  const currentLang = languages.find((l) => l.code === language);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40" onKeyDown={handleKeyDown}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo — use span instead of h1 to avoid duplicate h1 */}
          <div className="flex items-center gap-3 rtl:gap-3">
            <Link to="/citizen" className="flex items-center gap-2 rtl:gap-2 cursor-pointer">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-700 text-white font-bold text-sm">
                eP
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-bold text-primary-700 leading-tight block">
                  {t('appName')}
                </span>
                <span className="text-xs text-gray-600 leading-tight block">
                  {t('appSubtitle')}
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 rtl:gap-1" aria-label={t('nav.home')}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer',
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right Side: Language + Auth */}
          <div className="flex items-center gap-2 rtl:gap-2">
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

            {/* Auth Button / User Dropdown */}
            {isAuthenticated && user ? (
              <div ref={userRef} className="relative">
                <button
                  onClick={() => setUserDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 rtl:gap-2 min-h-[44px] px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                  aria-label={`${user.name} — ${t('buttons.userMenu') || 'User menu'}`}
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="menu"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline font-medium">{user.name}</span>
                  <ChevronDown size={14} aria-hidden="true" />
                </button>
                {userDropdownOpen && (
                  <div className="absolute end-0 mt-1 w-48 rounded-md bg-white shadow-lg ring-1 ring-black/5 z-50" role="menu">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-600">{user.role}</p>
                    </div>
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
            ) : (
              <Link
                to="/auth/login"
                className="flex items-center gap-1.5 rtl:gap-1.5 min-h-[44px] px-4 py-2 rounded-md bg-cta-500 text-white text-sm font-medium hover:bg-cta-600 transition-colors duration-200 cursor-pointer"
              >
                <User size={16} aria-hidden="true" />
                <span>{t('buttons.login')}</span>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden flex items-center justify-center min-w-[44px] min-h-[44px] rounded-md text-gray-700 hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
              aria-label={mobileMenuOpen ? t('buttons.closeMenu') || 'Close menu' : t('buttons.openMenu') || 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav"
            >
              {mobileMenuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div id="mobile-nav" className="md:hidden border-t border-gray-200 bg-white">
          <nav className="px-4 py-3 space-y-1" aria-label={t('nav.home')}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'block px-3 py-3 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer',
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
