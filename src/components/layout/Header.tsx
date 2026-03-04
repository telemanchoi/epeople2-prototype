import { useState, useRef, useEffect } from 'react';
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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 rtl:gap-3">
            <Link to="/citizen" className="flex items-center gap-2 rtl:gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-700 text-white font-bold text-sm">
                eP
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-primary-700 leading-tight">
                  {t('appName')}
                </h1>
                <p className="text-[10px] text-gray-500 leading-tight">
                  {t('appSubtitle')}
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 rtl:gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
                className="flex items-center gap-1.5 rtl:gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label={t('language.' + language)}
              >
                <Globe size={16} />
                <span className="hidden sm:inline">{currentLang?.label}</span>
                <ChevronDown size={14} />
              </button>
              {langDropdownOpen && (
                <div className="absolute end-0 mt-1 w-40 rounded-md bg-white shadow-lg ring-1 ring-black/5 z-50">
                  <div className="py-1">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setLangDropdownOpen(false);
                        }}
                        className={cn(
                          'block w-full px-4 py-2 text-sm text-start transition-colors',
                          language === lang.code
                            ? 'bg-primary-50 text-primary-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        )}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Auth Button / User Dropdown */}
            {isAuthenticated && user ? (
              <div ref={userRef} className="relative">
                <button
                  onClick={() => setUserDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 rtl:gap-2 px-3 py-1.5 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline font-medium">{user.name}</span>
                  <ChevronDown size={14} />
                </button>
                {userDropdownOpen && (
                  <div className="absolute end-0 mt-1 w-48 rounded-md bg-white shadow-lg ring-1 ring-black/5 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.role}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rtl:gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-start"
                      >
                        <LogOut size={16} />
                        {t('buttons.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth/login"
                className="flex items-center gap-1.5 rtl:gap-1.5 px-4 py-2 rounded-md bg-primary-700 text-white text-sm font-medium hover:bg-primary-800 transition-colors"
              >
                <User size={16} />
                <span>{t('buttons.login')}</span>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <nav className="px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'block px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
