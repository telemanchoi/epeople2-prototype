import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Phone, Mail, Globe, Search } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import type { Column, PaginationInfo } from '@/components/common/DataTable';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/utils/cn';

// ─── Types ────────────────────────────────────────────────────

type TicketChannel = 'phone' | 'email' | 'online';
type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
type TicketType = 'complaint_assist' | 'general_inquiry' | 'technical_issue' | 'status_inquiry' | 'other';

interface HelpdeskTicket {
  id: string;
  channel: TicketChannel;
  type: TicketType;
  status: TicketStatus;
  assignedAgent: string;
}

// ─── Mock data ────────────────────────────────────────────────

const MOCK_TICKETS: HelpdeskTicket[] = [
  { id: 'HLP-0001', channel: 'phone', type: 'complaint_assist', status: 'open', assignedAgent: 'Mohamed Trabelsi' },
  { id: 'HLP-0002', channel: 'email', type: 'general_inquiry', status: 'in_progress', assignedAgent: 'Hana Mansouri' },
  { id: 'HLP-0003', channel: 'online', type: 'technical_issue', status: 'resolved', assignedAgent: 'Karim Jebali' },
  { id: 'HLP-0004', channel: 'phone', type: 'status_inquiry', status: 'closed', assignedAgent: 'Leila Hammami' },
  { id: 'HLP-0005', channel: 'email', type: 'complaint_assist', status: 'open', assignedAgent: 'Mohamed Trabelsi' },
  { id: 'HLP-0006', channel: 'online', type: 'general_inquiry', status: 'in_progress', assignedAgent: 'Hana Mansouri' },
  { id: 'HLP-0007', channel: 'phone', type: 'other', status: 'open', assignedAgent: 'Karim Jebali' },
  { id: 'HLP-0008', channel: 'email', type: 'technical_issue', status: 'resolved', assignedAgent: 'Leila Hammami' },
  { id: 'HLP-0009', channel: 'online', type: 'status_inquiry', status: 'closed', assignedAgent: 'Mohamed Trabelsi' },
  { id: 'HLP-0010', channel: 'phone', type: 'complaint_assist', status: 'in_progress', assignedAgent: 'Hana Mansouri' },
  { id: 'HLP-0011', channel: 'email', type: 'general_inquiry', status: 'open', assignedAgent: 'Karim Jebali' },
  { id: 'HLP-0012', channel: 'online', type: 'other', status: 'resolved', assignedAgent: 'Leila Hammami' },
  { id: 'HLP-0013', channel: 'phone', type: 'technical_issue', status: 'open', assignedAgent: 'Mohamed Trabelsi' },
  { id: 'HLP-0014', channel: 'email', type: 'status_inquiry', status: 'in_progress', assignedAgent: 'Hana Mansouri' },
  { id: 'HLP-0015', channel: 'online', type: 'complaint_assist', status: 'closed', assignedAgent: 'Karim Jebali' },
];

// ─── Status badge config ──────────────────────────────────────

const STATUS_BADGE_VARIANT: Record<TicketStatus, 'info' | 'warning' | 'success' | 'neutral'> = {
  open: 'info',
  in_progress: 'warning',
  resolved: 'success',
  closed: 'neutral',
};

// ─── Channel icon ─────────────────────────────────────────────

function ChannelIcon({ channel }: { channel: TicketChannel }) {
  switch (channel) {
    case 'phone':
      return <Phone size={16} className="text-blue-600" />;
    case 'email':
      return <Mail size={16} className="text-amber-600" />;
    case 'online':
      return <Globe size={16} className="text-green-600" />;
  }
}

// ─── Component ────────────────────────────────────────────────

const PER_PAGE = 10;

export default function HelpdeskListPage() {
  const { t, i18n } = useTranslation(['admin', 'common']);
  const isRtl = i18n.language === 'ar';

  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<TicketChannel | ''>('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  const [page, setPage] = useState(1);

  // Filter logic
  const filtered = useMemo(() => {
    return MOCK_TICKETS.filter((ticket) => {
      if (channelFilter && ticket.channel !== channelFilter) return false;
      if (statusFilter && ticket.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !ticket.id.toLowerCase().includes(q) &&
          !t(`admin:helpdesk.types.${ticket.type}`).toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [search, channelFilter, statusFilter, t]);

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

  // Column definitions
  const columns: Column<HelpdeskTicket>[] = useMemo(
    () => [
      {
        key: 'id',
        header: t('admin:helpdesk.ticketNumber'),
        sortable: true,
        width: '120px',
        render: (ticket) => (
          <span className="font-mono text-sm font-medium text-primary-700">
            {ticket.id}
          </span>
        ),
      },
      {
        key: 'channel',
        header: t('admin:helpdesk.channel'),
        width: '140px',
        render: (ticket) => (
          <span className={cn('inline-flex items-center gap-2', isRtl && 'flex-row-reverse')}>
            <ChannelIcon channel={ticket.channel} />
            <span className="text-sm">
              {t(`admin:helpdesk.channels.${ticket.channel}`)}
            </span>
          </span>
        ),
      },
      {
        key: 'type',
        header: t('admin:helpdesk.type'),
        render: (ticket) => (
          <span className="text-sm text-gray-700">
            {t(`admin:helpdesk.types.${ticket.type}`)}
          </span>
        ),
      },
      {
        key: 'status',
        header: t('admin:helpdesk.status'),
        width: '130px',
        render: (ticket) => (
          <Badge variant={STATUS_BADGE_VARIANT[ticket.status]}>
            {t(`admin:helpdesk.statuses.${ticket.status}`)}
          </Badge>
        ),
      },
      {
        key: 'assignedAgent',
        header: t('admin:helpdesk.assignedAgent'),
        render: (ticket) => (
          <span className="text-sm text-gray-700">{ticket.assignedAgent}</span>
        ),
      },
    ],
    [t, isRtl]
  );

  return (
    <div className="p-6 space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <h1 className={cn('text-xl font-bold text-gray-900', isRtl ? 'text-right' : 'text-left')}>
        {t('admin:helpdesk.title')}
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
            placeholder={t('admin:helpdesk.searchPlaceholder')}
            className={cn(
              'w-full rounded-md border border-gray-300 py-2 text-sm focus:border-primary-500 focus:ring-primary-500',
              isRtl ? 'pr-10 pl-3' : 'pl-10 pr-3'
            )}
          />
        </div>

        {/* Channel filter */}
        <select
          value={channelFilter}
          onChange={(e) => {
            setChannelFilter(e.target.value as TicketChannel | '');
            setPage(1);
          }}
          className="rounded-md border border-gray-300 py-2 px-3 text-sm focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="">{t('admin:helpdesk.allChannels')}</option>
          <option value="phone">{t('admin:helpdesk.channels.phone')}</option>
          <option value="email">{t('admin:helpdesk.channels.email')}</option>
          <option value="online">{t('admin:helpdesk.channels.online')}</option>
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as TicketStatus | '');
            setPage(1);
          }}
          className="rounded-md border border-gray-300 py-2 px-3 text-sm focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="">{t('admin:helpdesk.allStatuses')}</option>
          <option value="open">{t('admin:helpdesk.statuses.open')}</option>
          <option value="in_progress">{t('admin:helpdesk.statuses.in_progress')}</option>
          <option value="resolved">{t('admin:helpdesk.statuses.resolved')}</option>
          <option value="closed">{t('admin:helpdesk.statuses.closed')}</option>
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={paged}
        keyExtractor={(t) => t.id}
        emptyMessage={t('admin:helpdesk.noTickets')}
        pagination={pagination}
        onPageChange={setPage}
      />
    </div>
  );
}
