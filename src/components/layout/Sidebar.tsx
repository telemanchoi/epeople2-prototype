import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  ListTodo,
  BarChart3,
  Users,
  Building2,
  Headphones,
  X,
} from 'lucide-react';
import { useAuthStore, useUIStore } from '@/stores';
import { cn } from '@/utils/cn';
import type { UserRole } from '@/types';

interface MenuItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

export default function Sidebar() {
  const { t } = useTranslation('common');
  const { getUser } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const location = useLocation();

  const user = getUser();
  const userRole = user?.role;

  // Determine base path for menu items
  const isAdminRoute = location.pathname.startsWith('/admin');

  const menuItems: MenuItem[] = [
    {
      to: isAdminRoute ? '/admin' : '/backoffice',
      label: t('nav.backoffice'),
      icon: <LayoutDashboard size={20} />,
      roles: ['BRC_OFFICER', 'BRC_MANAGER', 'BCRC_ADMIN', 'DGGPC_OFFICER', 'DGGPC_MANAGER'],
    },
    {
      to: '/backoffice/worklist',
      label: t('nav.worklist'),
      icon: <ListTodo size={20} />,
      roles: ['BRC_OFFICER', 'BRC_MANAGER', 'BCRC_ADMIN'],
    },
    {
      to: '/backoffice/statistics',
      label: t('nav.statistics'),
      icon: <BarChart3 size={20} />,
      roles: ['BCRC_ADMIN'],
    },
    {
      to: '/backoffice/helpdesk',
      label: t('nav.helpdesk'),
      icon: <Headphones size={20} />,
      roles: ['BRC_OFFICER', 'BRC_MANAGER', 'BCRC_ADMIN'],
    },
    {
      to: '/admin/performance',
      label: t('nav.performance'),
      icon: <Building2 size={20} />,
      roles: ['BCRC_ADMIN'],
    },
    {
      to: '/admin/users',
      label: t('nav.users'),
      icon: <Users size={20} />,
      roles: ['BCRC_ADMIN'],
    },
  ];

  // DGGPC-specific items
  const dggpcItems: MenuItem[] = [
    {
      to: '/backoffice',
      label: t('nav.backoffice'),
      icon: <LayoutDashboard size={20} />,
      roles: ['DGGPC_OFFICER', 'DGGPC_MANAGER'],
    },
    {
      to: '/citizen/reports/new',
      label: t('nav.reports'),
      icon: <BarChart3 size={20} />,
      roles: ['DGGPC_OFFICER', 'DGGPC_MANAGER'],
    },
  ];

  const isDGGPC = userRole === 'DGGPC_OFFICER' || userRole === 'DGGPC_MANAGER';
  const visibleItems = isDGGPC
    ? dggpcItems
    : menuItems.filter((item) => userRole && item.roles.includes(userRole));

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 start-0 z-50 flex w-64 flex-col bg-white border-e border-gray-200 transition-transform duration-200 ease-in-out',
          sidebarOpen ? 'translate-x-0 rtl:-translate-x-0' : '-translate-x-full rtl:translate-x-full lg:translate-x-0 rtl:lg:-translate-x-0'
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
          <div className="flex items-center gap-2 rtl:gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-700 text-white font-bold text-xs">
              eP
            </div>
            <div>
              <h2 className="text-sm font-bold text-primary-700">{t('appName')}</h2>
              <p className="text-[10px] text-gray-500">{t('nav.backoffice')}</p>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {visibleItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/backoffice' || item.to === '/admin'}
                  onClick={() => {
                    // Close sidebar on mobile after navigation
                    if (window.innerWidth < 1024) {
                      toggleSidebar();
                    }
                  }}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rtl:gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-700 text-white'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer: User Info */}
        {user && (
          <div className="border-t border-gray-200 px-4 py-3">
            <div className="flex items-center gap-3 rtl:gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-semibold shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.role}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
