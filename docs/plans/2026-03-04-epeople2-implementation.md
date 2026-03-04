# e-People II Prototype Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete UI/UX prototype of Tunisia's e-People II citizen complaint platform with 23 screens, bilingual RTL support (AR/FR/KO), and MSW-powered mock APIs.

**Architecture:** Bottom-Up — project scaffolding → types → mock data → MSW handlers → stores → i18n → utilities → common components → layouts → pages (Phase 1→2→3). All data flows through TanStack Query backed by MSW. Zustand manages client-only state (auth, form wizard, UI).

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, React Router v6, Zustand, TanStack Query v5, i18next, Recharts, Lucide React, MSW v2, React Hook Form + Zod, react-dropzone, date-fns

---

## Task Group A: Project Scaffolding

### Task A1: Initialize Vite + React + TypeScript project

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `.eslintrc.cjs`
- Create: `src/main.tsx`
- Create: `src/vite-env.d.ts`

**Step 1: Scaffold project with Vite**

```bash
cd /Users/teleman/Documents/Tunisia
npm create vite@latest epeople2-prototype -- --template react-ts
```

Move contents up to project root if needed, or work inside `epeople2-prototype/`.

**Step 2: Install all dependencies**

```bash
cd epeople2-prototype
npm install react-router-dom zustand @tanstack/react-query i18next react-i18next recharts lucide-react @headlessui/react axios date-fns react-hook-form @hookform/resolvers zod react-dropzone clsx tailwind-merge
npm install -D tailwindcss postcss autoprefixer @tailwindcss/forms @tailwindcss/typography msw
npx tailwindcss init -p
```

**Step 3: Configure vite.config.ts with path aliases**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@mocks': path.resolve(__dirname, './src/mocks'),
      '@locales': path.resolve(__dirname, './src/locales'),
    },
  },
  server: {
    port: 3000,
  },
});
```

**Step 4: Configure tsconfig.json paths**

Add to `compilerOptions`:
```json
{
  "baseUrl": ".",
  "paths": {
    "@/*": ["src/*"],
    "@components/*": ["src/components/*"],
    "@pages/*": ["src/pages/*"],
    "@hooks/*": ["src/hooks/*"],
    "@stores/*": ["src/stores/*"],
    "@types/*": ["src/types/*"],
    "@utils/*": ["src/utils/*"],
    "@mocks/*": ["src/mocks/*"],
    "@locales/*": ["src/locales/*"]
  }
}
```

**Step 5: Configure tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EFF6FF', 100: '#DBEAFE', 200: '#BFDBFE', 300: '#93C5FD',
          400: '#60A5FA', 500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8',
          800: '#1E40AF', 900: '#1E3A8A',
        },
        epeople: { 500: '#0891B2', 600: '#0E7490', 700: '#155E75' },
      },
      fontFamily: {
        arabic: ['Noto Sans Arabic', 'Arial', 'sans-serif'],
        latin: ['Inter', 'Arial', 'sans-serif'],
        korean: ['Pretendard', 'Noto Sans KR', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
```

**Step 6: Set up src/index.css with Tailwind directives + Google Fonts imports**

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+Arabic:wght@300;400;500;600;700&family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-50 text-gray-800 antialiased;
  }
  .font-arabic body { line-height: 1.8; }
}
```

**Step 7: Create directory structure**

```bash
mkdir -p src/{app,components/{common,layout,features/{complaint,report,proposal,statistics}},pages/{auth,citizen/{complaints,reports,proposals},backoffice,admin},hooks,stores,mocks/{handlers,data},locales/{ar,fr,ko},types,utils}
```

**Step 8: Minimal src/main.tsx with MSW conditional init**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './index.css';

async function enableMocking() {
  const { worker } = await import('./mocks/browser');
  return worker.start({ onUnhandledRequest: 'bypass' });
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
```

**Step 9: Verify dev server starts**

```bash
npm run dev
```

Expected: Dev server on http://localhost:3000, blank page (no routes yet), no errors.

**Step 10: Commit**

```bash
git init
echo "node_modules\ndist\n.DS_Store" > .gitignore
git add -A
git commit -m "chore: scaffold epeople2-prototype with Vite + React + TS + Tailwind"
```

---

## Task Group B: Type Definitions

### Task B1: Common types (`src/types/common.ts`)

**Files:**
- Create: `src/types/common.ts`
- Create: `src/types/index.ts`

**Step 1: Write common.ts**

Implement verbatim from DATA_MODEL.md section 2.1:
- `AgencyType`
- `UserRole`
- `IRegion`
- `ILocalizedText`
- `IPagination`
- `IApiResponse<T>`
- `IApiError`

**Step 2: Create barrel export src/types/index.ts**

Re-export all types from all type files (add to this as each file is created).

**Step 3: Commit**

```bash
git add src/types/
git commit -m "feat: add common type definitions"
```

### Task B2: Agency types (`src/types/agency.ts`)

**Files:**
- Create: `src/types/agency.ts`

Implement from DATA_MODEL.md section 2.2: `ISLAConfig`, `IAgency`, `IAgencyPerformance`.

**Commit:** `"feat: add agency type definitions"`

### Task B3: Complaint types (`src/types/complaint.ts`)

**Files:**
- Create: `src/types/complaint.ts`

Implement from DATA_MODEL.md section 2.3 — the largest type file:
- `ComplaintType`, `ComplaintStatus`, `ComplaintHistoryAction`
- `ICategory`, `ICategoryPath`, `IAttachment`
- `IComplaintHistory`, `IDeadlineExtensionRequest`, `IJointProcess`
- `ISatisfactionScore`, `IComplaintSummary`, `IComplaint`

**Commit:** `"feat: add complaint type definitions"`

### Task B4: Report types (`src/types/report.ts`)

**Files:**
- Create: `src/types/report.ts`

Implement from DATA_MODEL.md section 2.4 — fully separated from complaint:
- `CorruptionReportType`, `CorruptionReportStatus`
- `ICorruptionReportSummary`, `ICorruptionReport`, `ICorruptionReportHistory`

**Commit:** `"feat: add corruption report type definitions"`

### Task B5: Proposal types (`src/types/proposal.ts`)

**Files:**
- Create: `src/types/proposal.ts`

Implement from DATA_MODEL.md section 2.5:
- `ProposalStatus`, `IProposalReview`, `IImplementationUpdate`
- `IProposalSummary`, `IProposal`

**Commit:** `"feat: add proposal type definitions"`

### Task B6: User, Statistics, Notification types

**Files:**
- Create: `src/types/user.ts`
- Create: `src/types/statistics.ts`
- Create: `src/types/notification.ts`

Implement from DATA_MODEL.md sections 2.6, 2.7, 2.8.

**Commit:** `"feat: add user, statistics, notification type definitions"`

### Task B7: Update barrel export

**Files:**
- Modify: `src/types/index.ts`

Re-export everything from all 7 type files.

**Commit:** `"chore: update types barrel export"`

---

## Task Group C: Utilities

### Task C1: cn utility (`src/utils/cn.ts`)

**Files:**
- Create: `src/utils/cn.ts`

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Task C2: Complaint style mappings (`src/utils/complaint.ts`)

**Files:**
- Create: `src/utils/complaint.ts`

Implement `STATUS_STYLES` and `TYPE_CONFIG` mappings from CLAUDE.md. Include icon name strings that map to Lucide icons.

### Task C3: Deadline utilities (`src/utils/deadline.ts`)

**Files:**
- Create: `src/utils/deadline.ts`

Implement `getDeadlineColor()` and `getDaysRemaining()` using date-fns `differenceInDays` and `parseISO`.

### Task C4: Date formatting (`src/utils/date.ts`)

**Files:**
- Create: `src/utils/date.ts`

Date formatting helpers using date-fns with AR/FR/KO locale support. Functions: `formatDate()`, `formatDateTime()`, `formatRelative()`.

### Task C5: Barrel export + commit

**Files:**
- Create: `src/utils/index.ts`

```bash
git add src/utils/
git commit -m "feat: add utility functions (cn, complaint styles, deadline, date)"
```

---

## Task Group D: i18n Setup

### Task D1: i18n configuration

**Files:**
- Create: `src/i18n.ts`

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import arCommon from './locales/ar/common.json';
import frCommon from './locales/fr/common.json';
import koCommon from './locales/ko/common.json';
// ... all namespace imports

i18n.use(initReactI18next).init({
  resources: {
    ar: { common: arCommon, complaint: arComplaint, auth: arAuth, admin: arAdmin, report: arReport, proposal: arProposal },
    fr: { common: frCommon, ... },
    ko: { common: koCommon, ... },
  },
  lng: 'fr',
  fallbackLng: 'fr',
  ns: ['common', 'complaint', 'auth', 'admin', 'report', 'proposal'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});

export default i18n;
```

### Task D2: French translation files

**Files:**
- Create: `src/locales/fr/common.json` — nav, buttons, pagination, form labels, errors
- Create: `src/locales/fr/complaint.json` — types, statuses, form, steps, table headers
- Create: `src/locales/fr/auth.json` — login, logout, roles
- Create: `src/locales/fr/admin.json` — dashboard, performance, codes, users
- Create: `src/locales/fr/report.json` — corruption types, statuses, form
- Create: `src/locales/fr/proposal.json` — statuses, form, like, review

Complete translations covering every UI string across 23 screens. Use SRS.md section 7 (용어 정의) for official French terms.

### Task D3: Arabic translation files

**Files:**
- Create: `src/locales/ar/common.json` through `ar/proposal.json`

Same structure as FR. Real Arabic text (no transliteration). Reference SRS.md section 7 for official Arabic terms.

### Task D4: Korean translation files

**Files:**
- Create: `src/locales/ko/common.json` through `ko/proposal.json`

Same structure as FR/AR. Reference CLAUDE.md and 기능내역서 for Korean terms.

### Task D5: Commit

```bash
git add src/i18n.ts src/locales/
git commit -m "feat: add i18n setup with AR/FR/KO translations"
```

---

## Task Group E: Mock Data

### Task E1: Users mock data (`src/mocks/data/users.json`)

**Files:**
- Create: `src/mocks/data/users.json`

10+ users covering all 8 roles. Must include the 4 test accounts:
- citizen@test.tn (CITIZEN)
- officer@brc.tn (BRC_OFFICER)
- admin@bcrc.tn (BCRC_ADMIN)
- dggpc@gov.tn (DGGPC_OFFICER)

Each user has: id (USR-NNNNNN), username, name, nameAr, role, agency, isActive, lastLoginAt.

### Task E2: Agencies mock data (`src/mocks/data/agencies.json`)

**Files:**
- Create: `src/mocks/data/agencies.json`

73 BRC agencies + BCRC + DGGPC. Each with: id (BRC-XXX-YYY-NNN), nameFr, nameAr, type, parentId, regionCode, isActive, contactEmail, slaConfig (5 values in hours).

Use real Tunisian ministry names in French and Arabic. Group by: Environment, Education, Transport, Health, Interior, Finance, Agriculture, Justice, etc.

### Task E3: Categories mock data (`src/mocks/data/categories.json`)

**Files:**
- Create: `src/mocks/data/categories.json`

3-level tree: 6 L1 categories, ~20 L2, 50+ L3. Each node: code, nameFr, nameAr, children[].

L1 categories: Environnement, Éducation, Transport, Urbanisme, Fiscalité, Autres.

### Task E4: Complaints mock data (`src/mocks/data/complaints.json`)

**Files:**
- Create: `src/mocks/data/complaints.json`

50+ complaints following DATA_MODEL.md section 3.2 distribution:
- Status: received(5), assigned(5), processing(25), completed(10), closed(5)
- Type: grievance(24), inquiry(15), suggestion(6), proposal(3), report(2)
- D-Day: spread across 14+, 4-13, 2-3, 0-1, overdue
- transferCount: 0(35), 1(10), 2(3), 3(2)

Each complaint follows IComplaint structure with full history[], attachments[], categoryPath, assignedAgency, assignedOfficer. Use real Arabic and French content.

### Task E5: Reports mock data (`src/mocks/data/reports.json`)

**Files:**
- Create: `src/mocks/data/reports.json`

10+ corruption reports. Mix of anonymous/named. 5 types (bribery, embezzlement, abuse_of_power, nepotism, other). Various statuses. Each with history[], attachments[].

### Task E6: Proposals mock data (`src/mocks/data/proposals.json`)

**Files:**
- Create: `src/mocks/data/proposals.json`

20+ proposals across all statuses (pending, under_review, accepted, rejected, implemented). Varying likeCount (0~500). Some with review results and implementation updates.

### Task E7: Statistics mock data (`src/mocks/data/statistics.json`)

**Files:**
- Create: `src/mocks/data/statistics.json`

Structure with: overview (KPI summary), trend (12 monthly data points), byType (5 types), byAgency (top 20 agencies with performance), repeatedComplaints (10 records), longOverdue (8 records).

### Task E8: Notifications mock data (`src/mocks/data/notifications.json`)

**Files:**
- Create: `src/mocks/data/notifications.json`

15+ notifications covering all 10 NotificationType values. Mix of read/unread. Each with titleFr, titleAr, messageFr, messageAr, relatedId.

### Task E9: Commit

```bash
git add src/mocks/data/
git commit -m "feat: add comprehensive mock data (50+ complaints, 73 agencies, categories, statistics)"
```

---

## Task Group F: MSW Handlers

### Task F1: MSW browser setup (`src/mocks/browser.ts`)

**Files:**
- Create: `src/mocks/browser.ts`
- Create: `src/mocks/handlers/index.ts`

```typescript
// browser.ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';
export const worker = setupWorker(...handlers);

// handlers/index.ts — barrel export combining all handler arrays
```

Run `npx msw init public/` to generate the service worker file.

### Task F2: Auth handlers (`src/mocks/handlers/auth.ts`)

Endpoints: POST /api/auth/login, /api/auth/refresh, /api/auth/logout, /api/auth/anonymous-token, /api/auth/pki-callback.

Login checks username against test accounts in users.json. Returns JWT-like token + user object. Anonymous token returns UUID-based token.

### Task F3: Complaints handlers (`src/mocks/handlers/complaints.ts`)

Endpoints:
- GET /api/complaints — filter by status, type, agencyId, overdue, search, dateFrom/dateTo. Paginate.
- POST /api/complaints — create new, return with generated ID + deadline.
- GET /api/complaints/:id — return full complaint with history, attachments.
- PATCH /api/complaints/:id/status — update status, add history entry.
- POST /api/complaints/:id/transfer — check transferCount, return 422 if ≥3 (G-02).
- POST /api/complaints/:id/extend-deadline — create extension request (G-04).
- POST /api/complaints/:id/joint-process — create joint process record (G-03).
- POST /api/complaints/:id/satisfaction — add satisfaction score.
- GET /api/complaints/duplicate-check — return similar complaints.

### Task F4: Reports handlers (`src/mocks/handlers/reports.ts`)

Endpoints: POST /api/reports, GET /api/reports/track, GET /api/reports (DGGPC), PATCH /api/reports/:id/status.

Anonymous tracking via token query parameter. DGGPC list masks reporter info.

### Task F5: Proposals handlers (`src/mocks/handlers/proposals.ts`)

Endpoints: GET /api/proposals, POST /api/proposals, GET /api/proposals/:id, POST /api/proposals/:id/like (toggle), PATCH /api/proposals/:id/review.

Like toggle flips isLikedByMe and increments/decrements likeCount.

### Task F6: Statistics handlers (`src/mocks/handlers/statistics.ts`)

Endpoints: GET /api/statistics/overview, /trend, /by-type, /by-agency, /repeated-complaints, /long-overdue.

All return data from statistics.json. Support dateFrom/dateTo query params.

### Task F7: Agencies, Categories, Attachments, Notifications handlers

**Files:**
- Create: `src/mocks/handlers/agencies.ts` — GET /api/agencies, GET /api/agencies/:id/performance
- Create: `src/mocks/handlers/categories.ts` — GET /api/categories, GET /api/categories/:code/agencies
- Create: `src/mocks/handlers/attachments.ts` — POST /api/attachments/upload (mock response)
- Create: `src/mocks/handlers/notifications.ts` — GET /api/notifications, PATCH /api/notifications/:id/read, PATCH /api/notifications/read-all

### Task F8: Update handler barrel + commit

Update `src/mocks/handlers/index.ts` to combine all handler arrays. Verify MSW intercepts by checking browser console on dev server.

```bash
git add src/mocks/ public/mockServiceWorker.js
git commit -m "feat: add MSW handlers for all API endpoints"
```

---

## Task Group G: Zustand Stores

### Task G1: Auth store (`src/stores/authStore.ts`)

**Files:**
- Create: `src/stores/authStore.ts`

Per DATA_MODEL.md section 4.1. State: session (IAuthSession | null), isAuthenticated. Actions: login, logout, updateToken. Selector: hasRole(role).

### Task G2: Complaint form store (`src/stores/complaintFormStore.ts`)

**Files:**
- Create: `src/stores/complaintFormStore.ts`

Per DATA_MODEL.md section 4.2. State: currentStep (1-5), formData (ComplaintFormData), isSubmitting, submittedComplaintId. Actions: setStep, nextStep, prevStep, updateFormData, setSubmitting, setSubmittedId, reset.

### Task G3: UI store (`src/stores/uiStore.ts`)

**Files:**
- Create: `src/stores/uiStore.ts`

State: language ('ar'|'fr'|'ko'), isRTL (computed from language === 'ar'), sidebarOpen, activeModal. Actions: setLanguage (also updates i18n.changeLanguage and document dir/lang), toggleSidebar, openModal, closeModal.

### Task G4: Barrel export + commit

**Files:**
- Create: `src/stores/index.ts`

```bash
git add src/stores/
git commit -m "feat: add Zustand stores (auth, complaintForm, ui)"
```

---

## Task Group H: React Query Hooks

### Task H1: API client + query hooks

**Files:**
- Create: `src/hooks/useAuth.ts` — useLogin mutation, useLogout
- Create: `src/hooks/useComplaints.ts` — useComplaints (list), useComplaint (detail), useSubmitComplaint, useTransferComplaint, useExtendDeadline
- Create: `src/hooks/useReports.ts` — useSubmitReport, useTrackReport
- Create: `src/hooks/useProposals.ts` — useProposals, useProposal, useSubmitProposal, useToggleLike
- Create: `src/hooks/useStatistics.ts` — useStatisticsOverview, useTrend, useByType, useByAgency, useRepeatedComplaints, useLongOverdue
- Create: `src/hooks/useAgencies.ts` — useAgencies
- Create: `src/hooks/useCategories.ts` — useCategories
- Create: `src/hooks/useNotifications.ts` — useNotifications, useMarkRead
- Create: `src/hooks/index.ts`

Each hook wraps useQuery/useMutation with proper queryKeys, staleTime (30s for lists), and invalidation on mutations.

```bash
git add src/hooks/
git commit -m "feat: add TanStack Query hooks for all API endpoints"
```

---

## Task Group I: Common Components

### Task I1: Button component

**Files:**
- Create: `src/components/common/Button.tsx`

Variants (primary/secondary/outline/ghost/danger), sizes (sm/md/lg), leftIcon, rightIcon, loading spinner, disabled, fullWidth. RTL icon flip via `rtl:flex-row-reverse`.

### Task I2: Badge components

**Files:**
- Create: `src/components/common/Badge.tsx` — generic base Badge
- Create: `src/components/common/StatusBadge.tsx` — ComplaintStatus → auto color + translated label
- Create: `src/components/common/ComplaintTypeBadge.tsx` — ComplaintType → icon + color + SLA
- Create: `src/components/common/DeadlineBadge.tsx` — deadline → D-Day auto color

### Task I3: DataTable component

**Files:**
- Create: `src/components/common/DataTable.tsx`

Generic typed table with ColumnDef[], sorting, row click, pagination, loading skeleton, empty state. RTL direction auto-switch.

### Task I4: Modal component

**Files:**
- Create: `src/components/common/Modal.tsx`

Using @headlessui/react Dialog. isOpen, onClose, title, size, children, footer. Focus trap, ESC close, outside click, body scroll lock.

### Task I5: StepWizard component

**Files:**
- Create: `src/components/common/StepWizard.tsx`

Horizontal step indicator. Steps with id, label, description. States: done (filled primary), current (outline primary), pending (gray). Connected lines. Responsive.

### Task I6: Timeline component

**Files:**
- Create: `src/components/common/Timeline.tsx`

Vertical timeline with items. Variants: default, transfer (warning icon), warning, completed. Shows action label, agency, note, timestamp. RTL support.

### Task I7: KpiCard component

**Files:**
- Create: `src/components/common/KpiCard.tsx`

Title, value, change (±%), icon, color. Up/down arrow with green/red. Optional onClick for navigation.

### Task I8: FileUploadZone component

**Files:**
- Create: `src/components/common/FileUploadZone.tsx`

Using react-dropzone. States: idle, dragover, uploading, error. File list with name, size, delete button. Max 5 files, 10MB each. Accepted types display.

### Task I9: SidePanelDrawer component

**Files:**
- Create: `src/components/common/SidePanelDrawer.tsx`

Slide from right (LTR) or left (RTL). Overlay background. Internal scroll. Width: sm(320)/md(480)/lg(640). Outside click + ESC close. Transition animation.

### Task I10: EmptyState + Skeleton components

**Files:**
- Create: `src/components/common/EmptyState.tsx`
- Create: `src/components/common/Skeleton.tsx`

EmptyState: centered icon + title + description + optional CTA. Skeleton: variants table(5 rows), card, text(3 lines), kpi. animate-pulse.

### Task I11: Barrel export + commit

**Files:**
- Create: `src/components/common/index.ts`

```bash
git add src/components/common/
git commit -m "feat: add 11 common UI components (Button, Badge, DataTable, Modal, StepWizard, Timeline, KpiCard, FileUpload, SidePanel, EmptyState, Skeleton)"
```

---

## Task Group J: Layouts

### Task J1: CitizenLayout

**Files:**
- Create: `src/components/layout/Header.tsx` — Logo, nav links, language switcher (AR/FR/KO), auth button
- Create: `src/components/layout/Footer.tsx` — BCRC contact, privacy, accessibility
- Create: `src/components/layout/LanguageSwitcher.tsx` — 3 buttons with active highlight, triggers uiStore.setLanguage
- Create: `src/components/layout/CitizenLayout.tsx` — Header + Outlet + Footer

### Task J2: BackofficeLayout

**Files:**
- Create: `src/components/layout/Sidebar.tsx` — Role-filtered menu, collapsible, active item highlight
- Create: `src/components/layout/BackofficeHeader.tsx` — Username, notification bell (unread count), language, logout
- Create: `src/components/layout/BackofficeLayout.tsx` — Sidebar + Header + Outlet
- Create: `src/components/layout/NotificationDropdown.tsx` — Bell click → dropdown with recent notifications

### Task J3: App.tsx + routes.tsx

**Files:**
- Create: `src/app/App.tsx` — QueryClientProvider + i18n import + RouterProvider + html dir/lang sync
- Create: `src/app/routes.tsx` — createBrowserRouter with:
  - /auth/login (public)
  - /citizen/* wrapped in CitizenLayout (CITIZEN guard)
  - /backoffice/* wrapped in BackofficeLayout (BRC_OFFICER+ guard)
  - /admin/* wrapped in BackofficeLayout (BCRC_ADMIN guard)
- Create: `src/components/layout/AuthGuard.tsx` — checks authStore, redirects to login if needed

### Task J4: Commit

```bash
git add src/components/layout/ src/app/
git commit -m "feat: add CitizenLayout, BackofficeLayout, routing with auth guards"
```

---

## Task Group K: Phase 1 Pages — Auth + Citizen Portal

### Task K1: LoginPage

**Files:**
- Create: `src/pages/auth/LoginPage.tsx`

Standard login form (React Hook Form + Zod validation). PKI simulation button. Test account hints (dev only). Role-based redirect after login. Language switcher on page.

**Commit:** `"feat: add LoginPage with standard + PKI login"`

### Task K2: CitizenHomePage

**Files:**
- Create: `src/pages/citizen/CitizenHomePage.tsx`

Hero section with welcome message. 4 quick menu cards (FileText, ShieldAlert, Lightbulb, Search icons). Recent notices section (3 cards, static mock). KPI row (4 KpiCards from useStatisticsOverview).

**Commit:** `"feat: add CitizenHomePage with hero, quick menu, KPI"`

### Task K3: ComplaintNewPage — Step 1 (Type Selection)

**Files:**
- Create: `src/pages/citizen/complaints/ComplaintNewPage.tsx` — main page with StepWizard + step routing
- Create: `src/components/features/complaint/TypeSelectionStep.tsx`

5 type cards in grid. Each shows icon (from TYPE_CONFIG), name, description, SLA badge. Selected card gets primary border + check. Updates complaintFormStore.

**Commit:** `"feat: add complaint step 1 — type selection (G-01)"`

### Task K4: ComplaintNewPage — Step 2 (Category Selection)

**Files:**
- Create: `src/components/features/complaint/CategorySelectionStep.tsx`

3 cascading dropdowns (L1→L2→L3) using useCategories data. Agency auto-recommendation below based on selected category (calls GET /categories/:code/agencies). Search fallback option.

**Commit:** `"feat: add complaint step 2 — cascading category selection"`

### Task K5: ComplaintNewPage — Step 3 (Content)

**Files:**
- Create: `src/components/features/complaint/ContentStep.tsx`

React Hook Form: title (max 200, required), content (max 2000 + live char counter), region selector (dropdown from agencies regions), incident date (optional date picker). Zod validation. Real-time validation display.

**Commit:** `"feat: add complaint step 3 — content form with validation"`

### Task K6: ComplaintNewPage — Step 4 (Attachments)

**Files:**
- Create: `src/components/features/complaint/AttachmentStep.tsx`

FileUploadZone integration. Upload calls POST /api/attachments/upload (mock). Shows file list with progress. Skip button if no attachments.

**Commit:** `"feat: add complaint step 4 — file upload"`

### Task K7: ComplaintNewPage — Step 5 (Review + Submit)

**Files:**
- Create: `src/components/features/complaint/ReviewSubmitStep.tsx`
- Create: `src/pages/citizen/complaints/ComplaintCompletePage.tsx`

Summary of all steps with edit links. Privacy consent checkbox. Submit button → useSubmitComplaint mutation → success → navigate to completion page showing complaint ID + expected deadline + how to track.

**Commit:** `"feat: add complaint step 5 — review, submit, completion"`

### Task K8: ComplaintListPage

**Files:**
- Create: `src/pages/citizen/complaints/ComplaintListPage.tsx`

useComplaints with filters. DataTable with columns: id (monospace), type (ComplaintTypeBadge), title, submittedAt (formatted), deadline (DeadlineBadge), status (StatusBadge). Filter bar: status dropdown, type dropdown, date range. Search input. Pagination. Row click → navigate to detail.

**Commit:** `"feat: add ComplaintListPage with filters and pagination"`

### Task K9: ComplaintDetailPage

**Files:**
- Create: `src/pages/citizen/complaints/ComplaintDetailPage.tsx`

useComplaint(id). Info card (number, type badge, category path, dates). Timeline component for history[]. Attachments list. Answer section (if completed). Satisfaction rating (1-5 star/button, if completed within 7 days, uses useSubmitSatisfaction). Appeal button (if completed within 7 days).

**Commit:** `"feat: add ComplaintDetailPage with timeline and satisfaction"`

---

## Task Group L: Phase 1 Pages — Back Office

### Task L1: DashboardPage

**Files:**
- Create: `src/pages/backoffice/DashboardPage.tsx`

4 KpiCards: pending complaints (with urgent count), completed today, weekly SLA rate, deadline alerts count. Deadline alert table (complaints with daysRemaining ≤ 1). Recent 5 assigned complaints mini-table. All from useComplaints with appropriate filters.

**Commit:** `"feat: add BO DashboardPage with KPI and deadline alerts"`

### Task L2: WorklistPage

**Files:**
- Create: `src/pages/backoffice/WorklistPage.tsx`

DataTable with D-Day color coding in DeadlineBadge column. Transfer count column with G-02 logic:
- transferCount ≥ 2: orange AlertTriangle icon
- transferCount ≥ 3: red badge "BCRC 보고 필요" / "Signalement BCRC requis"

Filter bar, bulk selection checkboxes, bulk status change dropdown. Row click → navigate to process page.

**Commit:** `"feat: add WorklistPage with D-Day colors and transfer warnings (G-02)"`

### Task L3: ComplaintProcessPage

**Files:**
- Create: `src/pages/backoffice/ComplaintProcessPage.tsx`
- Create: `src/components/features/complaint/TransferModal.tsx`

2-column layout. Left: complaint info + citizen content + attachment previews + Timeline. Right panel:
- Status change dropdown
- Answer textarea (rich text or large textarea)
- Template select dropdown
- Button row: Similar Cases (opens SidePanelDrawer placeholder), Transfer (opens TransferModal), Extend Deadline (opens Modal placeholder), Internal Consult (placeholder), Complete

TransferModal: target agency select, reason textarea (min 50 chars, Zod), transfer count warning display. Calls useTransferComplaint. Shows 422 error if limit exceeded.

**Commit:** `"feat: add ComplaintProcessPage with 2-column layout and transfer modal"`

### Task L4: Phase 1 commit

```bash
git add src/pages/ src/components/features/
git commit -m "feat: complete Phase 1 — 12 core screens"
```

---

## Task Group M: Phase 2 Pages

### Task M1: StatisticsPage

**Files:**
- Create: `src/pages/backoffice/StatisticsPage.tsx`
- Create: `src/components/features/statistics/TrendChart.tsx` — LineChart + BarChart combo (Recharts)
- Create: `src/components/features/statistics/TypeDistributionChart.tsx` — DonutChart
- Create: `src/components/features/statistics/AgencyPerformanceChart.tsx` — Horizontal BarChart
- Create: `src/components/features/statistics/RepeatedComplaintsTable.tsx` — G-06 TOP 10
- Create: `src/components/features/statistics/LongOverdueTable.tsx` — G-06 30/60 day

Period selector (tabs: daily/weekly/monthly/quarterly/yearly). All charts use data from useStatistics hooks. Export buttons (display only in prototype).

**Commit:** `"feat: add StatisticsPage with charts and repeated complaints (G-06)"`

### Task M2: ReportNewPage

**Files:**
- Create: `src/pages/citizen/reports/ReportNewPage.tsx`
- Create: `src/components/features/report/ReportTypeSelector.tsx`
- Create: `src/components/features/report/AnonymousTokenDisplay.tsx`

Named/anonymous branch toggle. Anonymous: calls POST /api/auth/anonymous-token → displays token with copy button + save warning. Form: corruption type (5 radio cards), target agency (dropdown), incident date, location, content, evidence upload. Submit → tracking code display.

**Commit:** `"feat: add ReportNewPage with anonymous token flow"`

### Task M3: AdminDashboardPage

**Files:**
- Create: `src/pages/admin/AdminDashboardPage.tsx`

KPI row (4 cards from useStatisticsOverview). Agency bar chart (Top 10 / Bottom 10 toggle). Daily trend line chart. Type distribution pie. Transfer warning list (complaints with transferCount ≥ 3).

**Commit:** `"feat: add AdminDashboardPage with BCRC overview (G-11)"`

### Task M4: PerformancePage

**Files:**
- Create: `src/pages/admin/PerformancePage.tsx`

DataTable of 73 BRC agencies from useByAgency. Columns: agency name, received, completed, completionRate, avgDays, slaComplianceRate, satisfactionScore, transferCount. All columns sortable. G-11: rows where completionRate < 80% get `bg-red-50 text-red-800` highlight.

**Commit:** `"feat: add PerformancePage with BRC performance table (G-11)"`

### Task M5: ProposalListPage + ProposalNewPage

**Files:**
- Create: `src/pages/citizen/proposals/ProposalListPage.tsx`
- Create: `src/pages/citizen/proposals/ProposalNewPage.tsx`

List: proposal cards (title, category, author, likeCount with heart icon, status badge). Sort tabs (newest/most liked/in review). Category filter dropdown.

New: form with title, category select, content, attachments. Submit → confirmation.

**Commit:** `"feat: add ProposalListPage and ProposalNewPage"`

### Task M6: ProposalDetailPage

**Files:**
- Create: `src/pages/citizen/proposals/ProposalDetailPage.tsx`

Full proposal content. G-05: Like button (heart icon + count), toggles via useToggleLike, requires login (show login prompt if not). Agency review section (accepted/rejected badge + comment). Implementation updates list with progress bars.

**Commit:** `"feat: add ProposalDetailPage with like and review (G-05)"`

---

## Task Group N: Phase 3 Pages + Modals/Panels

### Task N1: HelpdeskListPage

**Files:**
- Create: `src/pages/backoffice/HelpdeskListPage.tsx`

DataTable: ticket number, channel icon (Phone/Mail/Globe), type, status badge, assigned agent, created date. Static mock data (simple list). Filter by channel and status.

**Commit:** `"feat: add HelpdeskListPage"`

### Task N2: UserManagementPage

**Files:**
- Create: `src/pages/admin/UserManagementPage.tsx`

DataTable from users.json: name, nameAr, role badge, agency, active toggle switch. Role change dropdown (display only). Search by name.

**Commit:** `"feat: add UserManagementPage"`

### Task N3: Deadline Extension Modal (G-04)

**Files:**
- Create: `src/components/features/complaint/DeadlineExtensionModal.tsx`

Modal opened from ComplaintProcessPage. Shows current deadline. Form: reason (required textarea), requested additional days (number input). Displays new projected deadline. Submit → useExtendDeadline → shows pending_approval status.

Update ComplaintProcessPage to wire this modal.

**Commit:** `"feat: add deadline extension modal (G-04)"`

### Task N4: Similar Cases SidePanelDrawer (G-07)

**Files:**
- Create: `src/components/features/complaint/SimilarCasesPanel.tsx`

SidePanelDrawer opened from ComplaintProcessPage. Auto-loads similar complaints based on current complaint's categoryPath. Card list: title, status, result summary, agency. "Copy to answer" button copies answer text to clipboard / answer editor.

Update ComplaintProcessPage to wire this panel.

**Commit:** `"feat: add similar cases side panel (G-07)"`

### Task N5: ProposalNewPage (if not done in M5)

Already covered in Task M5.

### Task N6: Code Management Page (optional, lightweight)

**Files:**
- Create: `src/pages/admin/CodeManagementPage.tsx`

Simple tree view of categories from useCategories. Display only (view codes, no CRUD in prototype). Placeholder for SLA settings.

**Commit:** `"feat: add CodeManagementPage placeholder"`

---

## Task Group O: Polish + Final Integration

### Task O1: Mobile responsive pass

Review all 23 pages for responsive behavior:
- Citizen pages: single column on mobile
- BackofficeLayout sidebar: hamburger collapse on `<lg`
- ComplaintProcessPage: stack columns on `<lg`
- DataTable: horizontal scroll on small screens
- StepWizard: compact labels on `<sm`

**Commit:** `"fix: mobile responsive adjustments across all pages"`

### Task O2: RTL verification pass

Switch to Arabic and verify:
- All layouts flip correctly
- Sidebar moves to right
- Text alignment correct
- Icons that indicate direction (arrows) flip
- Charts render correctly in RTL
- DeadlineBadge, Timeline, StepWizard all work

**Commit:** `"fix: RTL layout adjustments for Arabic"`

### Task O3: Korean language verification

Switch to Korean and verify:
- All translation keys have Korean values
- Font (Pretendard/Noto Sans KR) renders correctly
- LTR layout works same as French
- Date formatting uses Korean locale

**Commit:** `"fix: Korean language polish"`

### Task O4: Navigation flow verification

Test complete user journeys:
1. Citizen: login → home → new complaint (5 steps) → list → detail → satisfaction
2. Officer: login → dashboard → worklist → process complaint → transfer → extend deadline
3. Admin: login → dashboard → performance → statistics → users
4. Report: anonymous token → submit report → track by token
5. Proposal: list → new → detail → like

Fix any broken navigation or missing redirects.

**Commit:** `"fix: navigation flow corrections"`

### Task O5: Final commit + build verification

```bash
npm run typecheck   # TypeScript check
npm run lint        # ESLint check
npm run build       # Production build
npm run preview     # Preview production build
```

Fix any type errors, lint warnings, or build failures.

**Commit:** `"chore: fix type/lint errors, verify production build"`

---

## Summary

| Group | Tasks | Description |
|-------|-------|-------------|
| A | 1 task | Project scaffolding |
| B | 7 tasks | Type definitions |
| C | 5 tasks | Utilities |
| D | 5 tasks | i18n (AR/FR/KO) |
| E | 9 tasks | Mock data |
| F | 8 tasks | MSW handlers |
| G | 4 tasks | Zustand stores |
| H | 1 task | React Query hooks |
| I | 11 tasks | Common components |
| J | 4 tasks | Layouts + routing |
| K | 9 tasks | Phase 1 citizen pages |
| L | 4 tasks | Phase 1 backoffice pages |
| M | 6 tasks | Phase 2 pages |
| N | 6 tasks | Phase 3 pages + modals |
| O | 5 tasks | Polish + verification |

**Total: ~85 tasks across 15 groups**

---

*Implementation Plan v1.0 | e-People II Prototype | 2026-03-04*
