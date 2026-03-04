# e-People II Prototype Design Document

> **Date**: 2026-03-04
> **Approach**: Bottom-Up (infrastructure → components → pages)
> **Scope**: Phase 1~3, 23 screens total
> **Tech**: React 18 + TypeScript + Vite + Tailwind CSS + MSW

---

## 1. Foundation Layer

### 1.1 Project Initialization

```
epeople2-prototype/
├── index.html
├── package.json          # TECH_STACK.md dependencies
├── tsconfig.json
├── vite.config.ts        # @ path aliases
├── tailwind.config.js    # RTL, Arabic/Korean fonts, brand colors
├── postcss.config.js
├── .eslintrc.cjs
└── src/
    ├── main.tsx          # MSW init → React render
    └── app/
        ├── App.tsx       # QueryClient, i18n, Router providers
        └── routes.tsx    # Role-based layout routing
```

### 1.2 Type Definitions (`src/types/`)

All types from DATA_MODEL.md implemented verbatim:

| File | Key Types |
|------|-----------|
| `common.ts` | AgencyType, UserRole, IRegion, IPagination, IApiResponse, IApiError |
| `agency.ts` | ISLAConfig, IAgency, IAgencyPerformance |
| `complaint.ts` | ComplaintType, ComplaintStatus, IComplaint, IComplaintSummary, IComplaintHistory, IDeadlineExtensionRequest, IJointProcess, ISatisfactionScore, ICategory, ICategoryPath, IAttachment |
| `report.ts` | CorruptionReportType, CorruptionReportStatus, ICorruptionReport, ICorruptionReportSummary (fully separated from complaint) |
| `proposal.ts` | ProposalStatus, IProposal, IProposalSummary, IProposalReview, IImplementationUpdate |
| `user.ts` | IUser, IAuthSession, ISubstituteConfig |
| `statistics.ts` | IStatisticsOverview, ITrendDataPoint, ITypeDistribution, IRepeatedComplaintRecord, ILongOverdueComplaint |
| `notification.ts` | NotificationType, INotification |

### 1.3 Mock Data (`src/mocks/data/`)

| File | Count | Distribution Rules |
|------|-------|--------------------|
| `complaints.json` | 50+ | Status: received 10%, assigned 10%, processing 50%, completed 20%, closed 10%. Type: grievance 48%, inquiry 30%, suggestion 12%, proposal 6%, report 4%. D-Day spread across green/yellow/orange/red/overdue. transferCount: 0(35), 1(10), 2(3), 3(2) |
| `agencies.json` | 73 | All BRC agencies with SLA config |
| `categories.json` | L1:6, L2:20, L3:50+ | 3-level tree (Environment, Education, Transport, Urban, Tax, Other) |
| `statistics.json` | 12 months | Monthly trend + type distribution + agency performance |
| `proposals.json` | 20+ | All statuses (pending~implemented), varying like counts |
| `reports.json` | 10+ | Mix of named/anonymous, 5 corruption types |
| `users.json` | 10+ | All 8 roles, 4 test accounts |
| `notifications.json` | 15+ | Read/unread mix, 10 notification types |

All Arabic text uses real Arabic sentences (no transliteration).

### 1.4 MSW Handlers (`src/mocks/handlers/`)

| File | Endpoints |
|------|-----------|
| `auth.ts` | POST login, refresh, logout, anonymous-token, pki-callback |
| `complaints.ts` | GET list, POST create, GET :id, PATCH status, POST transfer (G-02 limit check), POST extend-deadline, POST joint-process, POST satisfaction, GET duplicate-check |
| `reports.ts` | POST create, GET track, GET list (DGGPC), PATCH status |
| `proposals.ts` | GET list, POST create, GET :id, POST like toggle, PATCH review |
| `statistics.ts` | GET overview, trend, by-type, by-agency, repeated-complaints (G-06), long-overdue |
| `agencies.ts` | GET list, GET :id/performance |
| `categories.ts` | GET tree, GET :code/agencies |
| `attachments.ts` | POST upload (mock response only) |
| `notifications.ts` | GET list, PATCH :id/read, PATCH read-all |

### 1.5 Zustand Stores (`src/stores/`)

**authStore.ts**: session, isAuthenticated, login/logout, hasRole selector
**complaintFormStore.ts**: currentStep (1~5), formData (type, category, title, content, attachments, consent), navigation actions, reset
**uiStore.ts**: language ('ar'|'fr'|'ko'), isRTL (true only for 'ar'), sidebarOpen, activeModal

### 1.6 i18n (`src/locales/`)

```
locales/
├── ar/  →  common, complaint, auth, admin, report, proposal
├── fr/  →  same structure
└── ko/  →  same structure
```

Language switching: AR (RTL) / FR (LTR) / KO (LTR).

Font mapping:
- ar → Noto Sans Arabic
- fr → Inter
- ko → Pretendard / Noto Sans KR

### 1.7 Utilities (`src/utils/`)

| File | Contents |
|------|----------|
| `cn.ts` | clsx + tailwind-merge wrapper |
| `date.ts` | date-fns based formatting with AR/FR/KO locale |
| `deadline.ts` | getDeadlineColor(), getDaysRemaining() |
| `complaint.ts` | STATUS_STYLES, TYPE_CONFIG mappings |

---

## 2. Common Components (`src/components/common/`)

### 2.1 Button
- Variants: primary, secondary, outline, ghost, danger
- Sizes: sm, md, lg
- Props: leftIcon, rightIcon, loading (spinner), disabled, fullWidth
- RTL: icon positions auto-flip

### 2.2 Badge (StatusBadge, ComplaintTypeBadge, DeadlineBadge)
- StatusBadge: ComplaintStatus → color + translated label
- ComplaintTypeBadge: ComplaintType → icon + color + SLA
- DeadlineBadge: deadline string → D-Day calc → auto color (green/yellow/orange/red)

### 2.3 DataTable
- Props: columns (ColumnDef[]), data, loading, emptyMessage, onRowClick, pagination
- Features: column sorting, row click, pagination, Skeleton loading
- RTL: table direction auto-switch

### 2.4 Modal
- Props: isOpen, onClose, title, size (sm/md/lg), children, footer
- Features: outside click close, ESC close, focus trap, body scroll lock
- Uses: transfer request, deadline extension, confirmation dialogs

### 2.5 StepWizard
- Props: steps[], currentStep, onStepClick?
- Visual: ●━━━●━━━○━━━○━━━○ (done/current/pending)
- Uses: 5-step complaint submission

### 2.6 Timeline
- Props: items[] with action, agency, note, timestamp, variant
- Variants: default, transfer, warning, completed
- Uses: complaint detail history, corruption report history

### 2.7 KpiCard
- Props: title, value, change (±%), icon, color (blue/green/amber/red)
- Features: up/down arrow indicator, click to navigate

### 2.8 FileUploadZone
- Props: maxFiles(5), maxSizeMB(10), acceptedTypes, onUpload, files[]
- States: idle → dragover → uploading → complete/error
- Uses react-dropzone, file list with name/size/delete

### 2.9 SidePanelDrawer
- Props: isOpen, onClose, title, width (sm/md/lg: 320/480/640px)
- LTR: slides from right. RTL: slides from left
- Internal scroll, outside click close

### 2.10 EmptyState
- Props: icon, title, description, actionLabel?, onAction?
- Centered layout with optional CTA button

### 2.11 Skeleton
- Variants: table (5 rows), card, text (3 lines), kpi
- animate-pulse gray placeholders

---

## 3. Layouts (`src/components/layout/`)

### 3.1 CitizenLayout
- Header: logo, nav (home/complaints/reports/proposals), language switcher (AR/FR/KO), login/username
- Main: page content (max-w-7xl centered)
- Footer: BCRC contact, privacy policy, accessibility

### 3.2 BackofficeLayout
- Sidebar (w-64): role-filtered menu items, collapsible on mobile
- Header: username, notification bell with unread count, language, logout
- Main: page content (p-6, max-w-7xl)

---

## 4. Pages — Phase 1 (12 screens, core flow)

### 4.1 LoginPage (`/auth/login`)
Standard login form + PKI simulation button. Role-based redirect. Dev test account hints.

### 4.2 CitizenHomePage (`/citizen`)
Hero + 4 quick menu buttons + recent notices (3 cards) + KPI summary (4 cards).

### 4.3–4.7 ComplaintNewPage (`/citizen/complaints/new`)
5-step StepWizard using complaintFormStore:
- Step 1: 5 type cards (G-01) with icon, description, SLA
- Step 2: Cascading L1→L2→L3 dropdown + agency auto-suggestion
- Step 3: Title (200ch), content (2000ch + counter), region, incident date
- Step 4: FileUploadZone (drag & drop)
- Step 5: Full summary + privacy consent → submit → completion (complaint ID + deadline)

### 4.8 ComplaintListPage (`/citizen/complaints`)
DataTable with filters (status, type, date range), search (title/ID), pagination (10/page). StatusBadge, DeadlineBadge per row.

### 4.9 ComplaintDetailPage (`/citizen/complaints/:id`)
Basic info + Timeline + attachments + answer (if completed) + satisfaction rating (1-5, within 7 days) + appeal button.

### 4.10 DashboardPage (`/backoffice`)
4 KPI cards (pending/urgent/completed today/SLA rate) + deadline alert list (D-1 and below) + recent 5 assigned complaints.

### 4.11 WorklistPage (`/backoffice/worklist`)
DataTable with D-Day coloring. G-02: transferCount≥2 orange warning icon, ≥3 red badge + "BCRC report required". Filters, bulk status change.

### 4.12 ComplaintProcessPage (`/backoffice/complaints/:id`)
2-column: Left (col-3) complaint content + attachments + timeline. Right (col-2) status dropdown, answer editor, similar cases button, template select, transfer button, deadline extension button, internal consultation button, complete button. Transfer modal with 50-char minimum reason.

---

## 5. Pages — Phase 2 (6 screens, management features)

### 5.1 StatisticsPage (`/backoffice/statistics`)
Period selector + LineChart/BarChart trend + DonutChart by type + horizontal BarChart by agency. G-06: repeated complaints TOP 10 table + long-overdue list (30/60 days).

### 5.2 ReportNewPage (`/citizen/reports/new`)
Named/anonymous branch. Anonymous: token issuance + copy/save prompt. Form: corruption type (5), target agency, time/location, content, evidence. Post-submit: report ID + tracking code.

### 5.3 AdminDashboardPage (`/admin`)
G-11: BCRC integrated KPI + agency performance bar chart + daily trend + type pie + transfer warning list.

### 5.4 PerformancePage (`/admin/performance`)
73 BRC DataTable: agency, received, completed, rate, avg days, SLA compliance, satisfaction, transfers. G-11: rows with completionRate<80% highlighted red. All columns sortable.

### 5.5 ProposalListPage (`/citizen/proposals`)
Proposal cards: title, category, author, like count, status badge. Sort: newest/most liked/in-review. Category filter.

### 5.6 ProposalDetailPage (`/citizen/proposals/:id`)
Full proposal text + G-05 like button (login required, Zustand state) + agency review (accepted/rejected + reason) + implementation updates with progress bar.

---

## 6. Pages — Phase 3 (5 screens + modals/panels)

### 6.1 HelpdeskListPage (`/backoffice/helpdesk`)
Ticket DataTable: ticket#, channel (phone/email/online), type, status, assigned agent.

### 6.2 UserManagementPage (`/admin/users`)
User DataTable: name, role, agency, active status. Role change, active/inactive toggle.

### 6.3 Deadline Extension Modal (G-04)
Opens from ComplaintProcessPage. Reason (required), requested days, current/requested deadline display. Submits to pending_approval state.

### 6.4 Similar Cases SidePanelDrawer (G-07)
Opens from ComplaintProcessPage. Auto-searches by current complaint's category/keywords. Card list of past similar complaints (title, result summary, agency). "Copy to answer" button.

### 6.5 ProposalNewPage (`/citizen/proposals/new`)
Proposal form: title, category select, content, attachments. Post-submit confirmation.

---

## 7. Gap Feature Implementation Summary

| Gap ID | Screen | Implementation |
|--------|--------|---------------|
| G-01 | ComplaintNew Step 1 | 5 type cards with icon, description, SLA. Primary border on selection |
| G-02 | WorklistPage | transferCount≥2 orange warning, ≥3 red badge + "BCRC report required" |
| G-04 | Deadline Extension Modal | Extension request workflow with approval state |
| G-05 | ProposalList/Detail | Like button (login required), Zustand state management |
| G-06 | StatisticsPage | Repeated complaints TOP 10 table + long-overdue list |
| G-07 | Similar Cases Panel | Side panel with keyword search + copy to answer |
| G-11 | AdminDashboard + Performance | BRC performance table, completionRate<80% red highlight |

---

## 8. Key Design Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| D-01 | Complaint and CorruptionReport fully separated | Security, BCRC/DGGPC separation per DATA_MODEL.md |
| D-02 | Bilingual field suffix (titleFr/titleAr) | JSON serialization, type safety |
| D-03 | Korean added as 3rd language | Stakeholder communication, LTR like French |
| D-04 | Bottom-Up build order | Complete foundation enables rapid page assembly |
| D-05 | All UI text via t('key') | No hardcoded text, i18n mandatory |
| D-06 | MSW for all API mocking | Frontend-independent development |
| D-07 | Zustand for form/auth/UI state | Minimal boilerplate vs Redux |
| D-08 | TanStack Query for server state | Caching, loading states, error handling |

---

*Design Document v1.0 | e-People II Prototype | 2026-03-04*
