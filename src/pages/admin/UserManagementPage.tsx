import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ChevronDown } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import type { Column, PaginationInfo } from '@/components/common/DataTable';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { cn } from '@/utils/cn';
import type { UserRole, IUser } from '@/types';

// ─── Mock user data (matching users.json) ─────────────────────

const MOCK_USERS: IUser[] = [
  {
    id: 'USR-000001',
    username: 'citizen@test.tn',
    name: 'Fatma Bouazizi',
    nameAr: '\u0641\u0627\u0637\u0645\u0629 \u0628\u0648\u0639\u0632\u064a\u0632\u064a',
    role: 'CITIZEN',
    isActive: true,
    lastLoginAt: '2024-04-10T08:15:00Z',
  },
  {
    id: 'USR-000002',
    username: 'officer@brc.tn',
    name: 'Mohamed Trabelsi',
    nameAr: '\u0645\u062d\u0645\u062f \u0627\u0644\u0637\u0631\u0627\u0628\u0644\u0633\u064a',
    role: 'BRC_OFFICER',
    agency: {
      id: 'BRC-ENV-TUN-001',
      nameFr: "BRC - Minist\u00e8re de l'Environnement - Tunis",
      nameAr: '\u0645\u0643\u062a\u0628 \u0627\u0644\u0639\u0644\u0627\u0642\u0627\u062a \u0645\u0639 \u0627\u0644\u0645\u0648\u0627\u0637\u0646 - \u0648\u0632\u0627\u0631\u0629 \u0627\u0644\u0628\u064a\u0626\u0629 - \u062a\u0648\u0646\u0633',
    },
    isActive: true,
    lastLoginAt: '2024-04-12T07:45:00Z',
  },
  {
    id: 'USR-000003',
    username: 'admin@bcrc.tn',
    name: 'Amine Khelifi',
    nameAr: '\u0623\u0645\u064a\u0646 \u0627\u0644\u062e\u0644\u064a\u0641\u064a',
    role: 'BCRC_ADMIN',
    agency: {
      id: 'BRC-BCRC-CEN-001',
      nameFr: 'Bureau Central des Relations avec le Citoyen',
      nameAr: '\u0627\u0644\u0645\u0643\u062a\u0628 \u0627\u0644\u0645\u0631\u0643\u0632\u064a \u0644\u0644\u0639\u0644\u0627\u0642\u0627\u062a \u0645\u0639 \u0627\u0644\u0645\u0648\u0627\u0637\u0646',
    },
    isActive: true,
    lastLoginAt: '2024-04-12T09:00:00Z',
  },
  {
    id: 'USR-000004',
    username: 'dggpc@gov.tn',
    name: 'Sami Gharbi',
    nameAr: '\u0633\u0627\u0645\u064a \u0627\u0644\u063a\u0631\u0628\u064a',
    role: 'DGGPC_OFFICER',
    agency: {
      id: 'BRC-DGGPC-CEN-001',
      nameFr: "Direction G\u00e9n\u00e9rale de la Gouvernance et de la Pr\u00e9vention de la Corruption",
      nameAr: '\u0627\u0644\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0639\u0627\u0645\u0629 \u0644\u0644\u062d\u0648\u0643\u0645\u0629 \u0648\u0645\u0643\u0627\u0641\u062d\u0629 \u0627\u0644\u0641\u0633\u0627\u062f',
    },
    isActive: true,
    lastLoginAt: '2024-04-11T14:30:00Z',
  },
  {
    id: 'USR-000005',
    username: 'manager@brc-edu.tn',
    name: 'Leila Hammami',
    nameAr: '\u0644\u064a\u0644\u0649 \u0627\u0644\u0647\u0645\u0627\u0645\u064a',
    role: 'BRC_MANAGER',
    agency: {
      id: 'BRC-EDU-TUN-001',
      nameFr: "BRC - Minist\u00e8re de l'\u00c9ducation - Tunis",
      nameAr: '\u0645\u0643\u062a\u0628 \u0627\u0644\u0639\u0644\u0627\u0642\u0627\u062a \u0645\u0639 \u0627\u0644\u0645\u0648\u0627\u0637\u0646 - \u0648\u0632\u0627\u0631\u0629 \u0627\u0644\u062a\u0631\u0628\u064a\u0629 - \u062a\u0648\u0646\u0633',
    },
    isActive: true,
    lastLoginAt: '2024-04-12T08:20:00Z',
  },
  {
    id: 'USR-000006',
    username: 'dggpc-mgr@gov.tn',
    name: 'Nabil Marzougui',
    nameAr: '\u0646\u0628\u064a\u0644 \u0627\u0644\u0645\u0631\u0632\u0648\u0642\u064a',
    role: 'DGGPC_MANAGER',
    agency: {
      id: 'BRC-DGGPC-CEN-001',
      nameFr: "Direction G\u00e9n\u00e9rale de la Gouvernance et de la Pr\u00e9vention de la Corruption",
      nameAr: '\u0627\u0644\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0639\u0627\u0645\u0629 \u0644\u0644\u062d\u0648\u0643\u0645\u0629 \u0648\u0645\u0643\u0627\u0641\u062d\u0629 \u0627\u0644\u0641\u0633\u0627\u062f',
    },
    isActive: true,
    lastLoginAt: '2024-04-10T16:00:00Z',
  },
  {
    id: 'USR-000007',
    username: 'sysadmin@epeople.tn',
    name: 'Youssef Ben Salah',
    nameAr: '\u064a\u0648\u0633\u0641 \u0628\u0646 \u0635\u0627\u0644\u062d',
    role: 'SYS_ADMIN',
    isActive: true,
    lastLoginAt: '2024-04-12T06:00:00Z',
  },
  {
    id: 'USR-000009',
    username: 'officer2@brc-san.tn',
    name: 'Hana Mansouri',
    nameAr: '\u0647\u0646\u0627\u0621 \u0627\u0644\u0645\u0646\u0635\u0648\u0631\u064a',
    role: 'BRC_OFFICER',
    agency: {
      id: 'BRC-SAN-TUN-001',
      nameFr: "BRC - Minist\u00e8re de la Sant\u00e9 - Tunis",
      nameAr: '\u0645\u0643\u062a\u0628 \u0627\u0644\u0639\u0644\u0627\u0642\u0627\u062a \u0645\u0639 \u0627\u0644\u0645\u0648\u0627\u0637\u0646 - \u0648\u0632\u0627\u0631\u0629 \u0627\u0644\u0635\u062d\u0629 - \u062a\u0648\u0646\u0633',
    },
    isActive: true,
    lastLoginAt: '2024-04-11T09:30:00Z',
  },
  {
    id: 'USR-000010',
    username: 'officer3@brc-trn.tn',
    name: 'Karim Jebali',
    nameAr: '\u0643\u0631\u064a\u0645 \u0627\u0644\u062c\u0628\u0627\u0644\u064a',
    role: 'BRC_OFFICER',
    agency: {
      id: 'BRC-TRN-TUN-001',
      nameFr: "BRC - Minist\u00e8re du Transport - Tunis",
      nameAr: '\u0645\u0643\u062a\u0628 \u0627\u0644\u0639\u0644\u0627\u0642\u0627\u062a \u0645\u0639 \u0627\u0644\u0645\u0648\u0627\u0637\u0646 - \u0648\u0632\u0627\u0631\u0629 \u0627\u0644\u0646\u0642\u0644 - \u062a\u0648\u0646\u0633',
    },
    isActive: true,
    lastLoginAt: '2024-04-12T07:00:00Z',
  },
  {
    id: 'USR-000011',
    username: 'citizen2@test.tn',
    name: 'Ahmed Chaabane',
    nameAr: '\u0623\u062d\u0645\u062f \u0634\u0639\u0628\u0627\u0646',
    role: 'CITIZEN',
    isActive: false,
    lastLoginAt: '2024-04-09T11:00:00Z',
  },
  {
    id: 'USR-000012',
    username: 'officer4@brc-int.tn',
    name: 'Rania Belhadj',
    nameAr: '\u0631\u0627\u0646\u064a\u0629 \u0628\u0627\u0644\u062d\u0627\u062c',
    role: 'BRC_OFFICER',
    agency: {
      id: 'BRC-INT-TUN-001',
      nameFr: "BRC - Minist\u00e8re de l'Int\u00e9rieur - Tunis",
      nameAr: '\u0645\u0643\u062a\u0628 \u0627\u0644\u0639\u0644\u0627\u0642\u0627\u062a \u0645\u0639 \u0627\u0644\u0645\u0648\u0627\u0637\u0646 - \u0648\u0632\u0627\u0631\u0629 \u0627\u0644\u062f\u0627\u062e\u0644\u064a\u0629 - \u062a\u0648\u0646\u0633',
    },
    isActive: true,
    lastLoginAt: '2024-04-11T13:45:00Z',
  },
];

const ALL_ROLES: UserRole[] = [
  'CITIZEN',
  'BRC_OFFICER',
  'BRC_MANAGER',
  'BCRC_ADMIN',
  'DGGPC_OFFICER',
  'DGGPC_MANAGER',
  'SYS_ADMIN',
];

const ROLE_BADGE_VARIANT: Record<UserRole, 'info' | 'success' | 'warning' | 'error' | 'neutral'> = {
  CITIZEN: 'neutral',
  ANONYMOUS: 'neutral',
  BRC_OFFICER: 'info',
  BRC_MANAGER: 'success',
  BCRC_ADMIN: 'warning',
  DGGPC_OFFICER: 'info',
  DGGPC_MANAGER: 'success',
  SYS_ADMIN: 'error',
};

// ─── Component ────────────────────────────────────────────────

const PER_PAGE = 10;

export default function UserManagementPage() {
  const { t, i18n } = useTranslation(['admin', 'common']);
  const isRtl = i18n.language === 'ar';
  const lang = i18n.language as 'ar' | 'fr' | 'ko';

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [page, setPage] = useState(1);

  // Local user state for toggle simulation
  const [users, setUsers] = useState(MOCK_USERS);

  // Role change dropdown: track which user ID is showing the dropdown
  const [roleDropdownUserId, setRoleDropdownUserId] = useState<string | null>(null);

  // Filter logic
  const filtered = useMemo(() => {
    return users.filter((user) => {
      if (roleFilter && user.role !== roleFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !user.name.toLowerCase().includes(q) &&
          !user.nameAr.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [users, search, roleFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const pagination: PaginationInfo = {
    page: currentPage,
    perPage: PER_PAGE,
    total: filtered.length,
    totalPages,
  };

  // Toggle active status (mock)
  const handleToggleStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, isActive: !u.isActive } : u
      )
    );
    console.log(`Toggled active status for user ${userId}`);
  };

  // Change role (mock)
  const handleChangeRole = (userId: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, role: newRole } : u
      )
    );
    setRoleDropdownUserId(null);
    console.log(`Changed role for user ${userId} to ${newRole}`);
  };

  // Column definitions
  const columns: Column<IUser>[] = useMemo(
    () => [
      {
        key: 'name',
        header: t('admin:users.name'),
        sortable: true,
        render: (user) => (
          <div className={cn(isRtl ? 'text-right' : 'text-left')}>
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
          </div>
        ),
      },
      {
        key: 'nameAr',
        header: t('admin:users.nameAr'),
        render: (user) => (
          <span className="text-sm text-gray-700" dir="rtl">
            {user.nameAr}
          </span>
        ),
      },
      {
        key: 'role',
        header: t('admin:users.role'),
        width: '160px',
        render: (user) => (
          <Badge variant={ROLE_BADGE_VARIANT[user.role]}>
            {t(`admin:users.roles.${user.role}`)}
          </Badge>
        ),
      },
      {
        key: 'agency',
        header: t('admin:users.agency'),
        render: (user) => (
          <span className="text-sm text-gray-600 truncate block max-w-[200px]">
            {user.agency
              ? lang === 'ar'
                ? user.agency.nameAr
                : user.agency.nameFr
              : '-'}
          </span>
        ),
      },
      {
        key: 'isActive',
        header: t('admin:users.status'),
        width: '100px',
        render: (user) => (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleStatus(user.id);
            }}
            className={cn(
              'inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full transition-colors cursor-pointer',
              user.isActive
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            )}
            title={t('admin:users.toggleStatus')}
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                user.isActive ? 'bg-green-500' : 'bg-gray-400'
              )}
            />
            {user.isActive
              ? t('admin:users.active')
              : t('admin:users.inactive')}
          </button>
        ),
      },
      {
        key: 'actions',
        header: t('admin:users.actions'),
        width: '160px',
        render: (user) => (
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              rightIcon={<ChevronDown size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                setRoleDropdownUserId(
                  roleDropdownUserId === user.id ? null : user.id
                );
              }}
            >
              {t('admin:users.changeRole')}
            </Button>
            {roleDropdownUserId === user.id && (
              <div
                className={cn(
                  'absolute z-20 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1',
                  isRtl ? 'left-0' : 'right-0'
                )}
              >
                {ALL_ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChangeRole(user.id, role);
                    }}
                    className={cn(
                      'w-full px-3 py-2 text-sm hover:bg-gray-50 transition-colors',
                      isRtl ? 'text-right' : 'text-left',
                      user.role === role && 'bg-primary-50 text-primary-700 font-medium'
                    )}
                  >
                    {t(`admin:users.roles.${role}`)}
                  </button>
                ))}
              </div>
            )}
          </div>
        ),
      },
    ],
    [t, lang, isRtl, roleDropdownUserId]
  );

  return (
    <div
      className="p-6 space-y-6"
      dir={isRtl ? 'rtl' : 'ltr'}
      onClick={() => setRoleDropdownUserId(null)}
    >
      {/* Header */}
      <h1 className={cn('text-xl font-bold text-gray-900', isRtl ? 'text-right' : 'text-left')}>
        {t('admin:users.title')}
      </h1>

      {/* Filters */}
      <div
        className={cn(
          'flex flex-wrap items-center gap-3',
          isRtl && 'flex-row-reverse'
        )}
      >
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            size={16}
            className={cn(
              'absolute top-1/2 -translate-y-1/2 text-gray-400',
              isRtl ? 'right-3' : 'left-3'
            )}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t('admin:users.searchPlaceholder')}
            className={cn(
              'w-full rounded-md border border-gray-300 py-2 text-sm focus:border-primary-500 focus:ring-primary-500',
              isRtl ? 'pr-10 pl-3' : 'pl-10 pr-3'
            )}
          />
        </div>

        {/* Role filter */}
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value as UserRole | '');
            setPage(1);
          }}
          className="rounded-md border border-gray-300 py-2 px-3 text-sm focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="">{t('admin:users.allRoles')}</option>
          {ALL_ROLES.map((role) => (
            <option key={role} value={role}>
              {t(`admin:users.roles.${role}`)}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={paged}
        keyExtractor={(u) => u.id}
        pagination={pagination}
        onPageChange={setPage}
      />
    </div>
  );
}
