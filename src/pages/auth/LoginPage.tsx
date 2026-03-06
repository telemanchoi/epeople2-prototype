import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, LogIn, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useLogin } from '@/hooks';
import { useUIStore } from '@/stores';
import { cn } from '@/utils/cn';

const TEST_ACCOUNTS = [
  { id: 'citizen@test.tn', password: 'test1234', roleKey: 'CITIZEN' },
  { id: 'officer@brc.tn', password: 'test1234', roleKey: 'BRC_OFFICER' },
  { id: 'admin@bcrc.tn', password: 'test1234', roleKey: 'BCRC_ADMIN' },
  { id: 'dggpc@gov.tn', password: 'test1234', roleKey: 'DGGPC_OFFICER' },
] as const;

export default function LoginPage() {
  const { t: tAuth } = useTranslation('auth');
  const { t: tCommon } = useTranslation('common');
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const setLanguage = useUIStore((s) => s.setLanguage);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const isRtl = i18n.language === 'ar';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    loginMutation.mutate(
      { username, password },
      {
        onSuccess: (data) => {
          const role = data.user.role;
          if (role === 'CITIZEN' || role === 'ANONYMOUS') {
            navigate('/citizen');
          } else if (role === 'BCRC_ADMIN' || role === 'SYS_ADMIN') {
            navigate('/admin');
          } else {
            navigate('/backoffice');
          }
        },
        onError: () => {
          setError(tAuth('login.error'));
        },
      }
    );
  };

  const handlePkiLogin = () => {
    loginMutation.mutate(
      { username: 'citizen@test.tn', password: 'test1234' },
      {
        onSuccess: () => {
          navigate('/citizen');
        },
        onError: () => {
          setError(tAuth('login.error'));
        },
      }
    );
  };

  const handleTestAccountClick = (account: typeof TEST_ACCOUNTS[number]) => {
    setUsername(account.id);
    setPassword(account.password);
    setError('');
  };

  const handleLanguageChange = (lang: 'ar' | 'fr' | 'ko') => {
    setLanguage(lang);
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-gradient-to-br from-primary-50 via-white to-epeople-50"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Language Switcher */}
      <div className={cn('absolute top-4', isRtl ? 'left-4' : 'right-4')}>
        <div className="flex items-center gap-1 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
          {(['ar', 'fr', 'ko'] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => handleLanguageChange(lang)}
              aria-pressed={i18n.language === lang}
              className={cn(
                'min-w-[44px] min-h-[44px] px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer',
                i18n.language === lang
                  ? 'bg-primary-700 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {tCommon(`language.${lang}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Login Card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-700 rounded-2xl mb-4">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {tCommon('appName')}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {tAuth('login.subtitle')}
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">
              {tAuth('login.title')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label
                  htmlFor="username"
                  className={cn(
                    'block text-sm font-medium text-gray-700 mb-1',
                    isRtl ? 'text-right' : 'text-left'
                  )}
                >
                  {tAuth('login.username')}
                </label>
                <input
                  id="username"
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={tAuth('login.usernamePlaceholder')}
                  required
                  autoComplete="username"
                  className={cn(
                    'w-full px-3 py-2 border border-gray-300 rounded-lg text-base',
                    'placeholder:text-gray-400',
                    isRtl ? 'text-right' : 'text-left'
                  )}
                  dir="ltr"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className={cn(
                    'block text-sm font-medium text-gray-700 mb-1',
                    isRtl ? 'text-right' : 'text-left'
                  )}
                >
                  {tAuth('login.password')}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={tAuth('login.passwordPlaceholder')}
                    required
                    autoComplete="current-password"
                    className={cn(
                      'w-full px-3 py-2 border border-gray-300 rounded-lg text-base',
                      'placeholder:text-gray-400',
                      isRtl ? 'text-right pr-3 pl-10' : 'text-left pl-3 pr-10'
                    )}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? tAuth('login.hidePassword') : tAuth('login.showPassword')}
                    aria-pressed={showPassword}
                    className={cn(
                      'absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer',
                      isRtl ? 'left-3' : 'right-3'
                    )}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div
                  className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
                  role="alert"
                >
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loginMutation.isPending}
                leftIcon={<LogIn size={18} />}
              >
                {tAuth('login.submit')}
              </Button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-gray-600 uppercase">
                    {tCommon('form.selectOption')}
                  </span>
                </div>
              </div>

              {/* PKI Button */}
              <Button
                type="button"
                variant="outline"
                size="lg"
                fullWidth
                leftIcon={<ShieldCheck size={18} />}
                onClick={handlePkiLogin}
              >
                {tAuth('login.pki')}
              </Button>
            </form>
          </div>

          {/* Test Accounts */}
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-3">
              {tAuth('login.testAccounts')}
            </h3>
            <div className="space-y-2">
              {TEST_ACCOUNTS.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => handleTestAccountClick(account)}
                  aria-label={tAuth('login.fillTestAccount', { id: account.id, role: tAuth(`roles.${account.roleKey}`) })}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-amber-200',
                    'text-xs hover:bg-amber-100 transition-colors cursor-pointer',
                    isRtl && 'flex-row-reverse'
                  )}
                >
                  <span className="font-mono text-gray-700">{account.id}</span>
                  <span className="text-amber-700 font-medium">
                    {tAuth(`roles.${account.roleKey}`)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
