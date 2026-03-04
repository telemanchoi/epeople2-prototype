# CLAUDE.md — e-People II 프로토타입 개발 지침

> **프로젝트**: 튀니지 e-People II (국민신문고 고도화) UI/UX 프로토타입  
> **목적**: 현지 PC1(시스템 개발업체)에게 목표 시스템의 화면 구조·흐름·기능을 시각적으로 전달  
> **발주**: KOICA ODA (2024–2028, 600만 달러) | 수원기관: 튀니지 총리실 BCRC

---

## 🗂 참고 문서 (작업 전 반드시 읽을 것)

| 순서 | 문서 | 경로 | 핵심 내용 |
|------|------|------|-----------|
| 1 | **기능 내역서** | `docs/기능내역서_v2.md` | 구현할 124개 기능 전체 목록 |
| 2 | **SRS** | `docs/SRS.md` | 기능·비기능 요구사항, 화면 목록 |
| 3 | **데이터 모델** | `docs/DATA_MODEL.md` | ⚠️ 타입 정의·ERD·목 데이터 설계 — 구현 전 필독 |
| 4 | **API 명세** | `docs/API_SPEC.md` | 전체 엔드포인트·요청·응답 형식, MSW 구현 기준 |
| 5 | **갭 분석** | `docs/GAP_ANALYSIS.md` | 국민신문고 벤치마킹, 갭추가 기능 설계 배경 |
| 6 | **기술 스택** | `docs/TECH_STACK.md` | 기술 선택 근거, 패키지 구성, 코드 예시 |
| 7 | **UI 가이드** | `docs/UI_GUIDELINES.md` | 디자인 시스템, 컴포넌트 명세, 레이아웃 |

---

## 🛠 기술 스택

```
Language  : TypeScript
Framework : React 18
Build     : Vite
Styling   : Tailwind CSS
Router    : React Router v6
State     : Zustand + TanStack Query v5
i18n      : i18next + react-i18next  ← 아랍어 RTL 필수
Charts    : Recharts
Icons     : Lucide React
Forms     : React Hook Form + Zod
Mock API  : MSW (Mock Service Worker) v2
```

---

## 📁 디렉토리 구조

```
epeople2-prototype/
├── CLAUDE.md
├── docs/                        # 설계 문서 (읽기 전용)
│   ├── 기능내역서_v2.md
│   ├── SRS.md
│   ├── GAP_ANALYSIS.md
│   ├── TECH_STACK.md
│   └── UI_GUIDELINES.md
├── src/
│   ├── app/
│   │   ├── App.tsx              # 라우터, 전역 프로바이더
│   │   └── routes.tsx
│   ├── components/
│   │   ├── common/              # Button, Badge, DataTable, Modal,
│   │   │                        # StepWizard, Timeline, FileUploadZone,
│   │   │                        # KpiCard, DeadlineBadge, EmptyState, Skeleton
│   │   ├── layout/              # CitizenLayout, BackofficeLayout,
│   │   │                        # Sidebar, Header, Footer
│   │   └── features/            # complaint/, report/, proposal/, statistics/
│   ├── pages/
│   │   ├── auth/                # LoginPage
│   │   ├── citizen/             # CitizenHomePage, complaints/, reports/, proposals/
│   │   ├── backoffice/          # DashboardPage, WorklistPage, ComplaintProcessPage, StatisticsPage
│   │   └── admin/               # AdminDashboardPage, PerformancePage
│   ├── hooks/                   # useComplaints, useAuth, useStatistics
│   ├── stores/                  # authStore, complaintFormStore (Step Wizard), uiStore
│   ├── mocks/
│   │   ├── browser.ts           # MSW 설정
│   │   ├── handlers/            # complaints, reports, proposals, agencies, statistics
│   │   └── data/                # complaints.json(50건+), agencies.json(73개),
│   │                            # categories.json, statistics.json, proposals.json
│   ├── locales/
│   │   ├── ar/                  # 아랍어 번역 (common, complaint, auth, admin)
│   │   └── fr/                  # 프랑스어 번역
│   ├── types/                   # complaint.ts, user.ts, agency.ts, api.ts
│   └── utils/                   # date.ts, deadline.ts, cn.ts
```

---

## 🚀 구현 우선순위

### Phase 1 — 핵심 흐름 (먼저 완성할 것)

```
1.  /auth/login                  로그인 (표준 + PKI 버튼 시뮬레이션)
2.  /citizen                     시민 포털 메인 (Hero, 빠른메뉴, 공지, KPI)
3.  /citizen/complaints/new      민원 신청 Step 1: 5유형 카드     ← G-01 핵심
4.                               민원 신청 Step 2: 분류 선택 (대→중→소 Cascading)
5.                               민원 신청 Step 3: 내용 작성
6.                               민원 신청 Step 4: 파일 첨부 (Drag & Drop)
7.                               민원 신청 Step 5: 확인·제출 → 완료
8.  /citizen/complaints          내 민원 목록 (상태 필터, D-Day 배지)
9.  /citizen/complaints/:id      민원 상세 (처리 상태 타임라인)
10. /backoffice                  BO 대시보드 (KPI 4개, 기한 임박 목록)
11. /backoffice/worklist         워크리스트 (D-Day 색상, 이관 횟수 경고)  ← G-02
12. /backoffice/complaints/:id   민원 처리 (좌우 2컬럼, 답변·이관·완료)
```

### Phase 2 — 핵심 관리 기능

```
13. /backoffice/statistics       통계 (추이 차트, 파이, 기관별 바, 반복민원) ← G-06
14. /citizen/reports/new         부패 신고 (실명/익명 분기, 토큰 발급)
15. /admin                       BCRC 통합 현황 + 기관 성과 테이블       ← G-11
16. /citizen/proposals           국민제안 게시판 (공감 기능)              ← G-05
17. /citizen/proposals/new       제안 작성
18. /citizen/proposals/:id       제안 상세·심사 결과
```

### Phase 3 — 부가 기능

```
19. 헬프데스크 Ticket 목록
20. 사용자·권한 관리
21. 기한 연장 신청 모달          ← G-04
22. 유사 선례 검색 사이드 패널   ← G-07
23. 모바일 최적화 뷰
```

---

## ⚙️ 핵심 개발 규칙

### 절대 금지
```
❌ UI 텍스트 하드코딩       → 반드시 t('key') 사용
❌ TypeScript any 사용       → unknown 또는 명시적 타입
❌ console.log (프로덕션)    → 개발 디버그만 허용
❌ 인라인 style={{}} 남용    → Tailwind 클래스 우선
❌ 컴포넌트 props 타입 미정의 → interface 필수
```

### RTL 아랍어 레이아웃 필수 처리

```tsx
// HTML 루트에 언어/방향 설정
<html lang={i18n.language} dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>

// Tailwind RTL 변형 활용
<div className="ml-4 rtl:ml-0 rtl:mr-4 text-left rtl:text-right">

// 아랍어 폰트 적용
<body className={i18n.language === 'ar' ? 'font-arabic' : 'font-latin'}>
```

### 핵심 타입 정의

```typescript
// types/complaint.ts
export type ComplaintType =
  | 'grievance'    // 고충민원 — 권리침해 구제
  | 'proposal'     // 제안 — 정책 개선
  | 'inquiry'      // 질의 — 법령 문의
  | 'suggestion'   // 건의 — 행정 개선
  | 'report';      // 신고 — 위법행위

export type ComplaintStatus =
  | 'received' | 'assigned' | 'processing' | 'completed' | 'closed';

export interface IComplaint {
  id: string;               // 'CMP-2024-000001'
  type: ComplaintType;
  title: string;
  status: ComplaintStatus;
  deadline: string;         // ISO 8601
  transferCount: number;    // 이관 횟수 ← G-02 통제 기준
  history: IComplaintHistory[];
  attachments: IAttachment[];
  satisfactionScore?: 1|2|3|4|5;
}
```

### 상태·유형 색상 유틸

```typescript
// utils/complaint.ts
export const STATUS_STYLES: Record<ComplaintStatus, string> = {
  received:   'bg-blue-100 text-blue-800',
  assigned:   'bg-violet-100 text-violet-800',
  processing: 'bg-amber-100 text-amber-800',
  completed:  'bg-green-100 text-green-800',
  closed:     'bg-slate-100 text-slate-600',
};

export const TYPE_CONFIG: Record<ComplaintType, { style: string; icon: string; sla: string }> = {
  grievance:  { style: 'bg-red-100 text-red-800',      icon: 'AlertCircle',   sla: '60일' },
  proposal:   { style: 'bg-blue-100 text-blue-800',    icon: 'Lightbulb',     sla: '30일' },
  inquiry:    { style: 'bg-purple-100 text-purple-800',icon: 'HelpCircle',    sla: '7일'  },
  suggestion: { style: 'bg-orange-100 text-orange-800',icon: 'MessageSquare', sla: '30일' },
  report:     { style: 'bg-pink-100 text-pink-800',    icon: 'Flag',          sla: '15일' },
};
```

### D-Day 계산

```typescript
// utils/deadline.ts
export const getDeadlineColor = (deadline: string): string => {
  const days = differenceInDays(parseISO(deadline), new Date());
  if (days < 0)  return 'bg-red-100 text-red-800';
  if (days <= 1) return 'bg-red-100 text-red-800';
  if (days <= 3) return 'bg-orange-100 text-orange-800';
  if (days <= 7) return 'bg-yellow-100 text-yellow-800';
  return 'bg-gray-100 text-gray-600';
};
```

---

## 🌐 라우팅 구조

```tsx
// 역할별 레이아웃 분기
/auth/*          → 인증 없음 (공개)
/citizen/*       → CitizenLayout (헤더 + 푸터, 사이드바 없음)
/backoffice/*    → BackofficeLayout (사이드바 + 헤더)
/admin/*         → BackofficeLayout (BCRC 관리자 전용 메뉴)
```

---

## 📊 목 데이터 샘플

```json
// complaints.json 샘플 1건
{
  "id": "CMP-2024-000042",
  "type": "grievance",
  "titleAr": "مشكلة في توصيل المياه",
  "titleFr": "Problème de raccordement d'eau",
  "status": "processing",
  "transferCount": 1,
  "deadline": "2024-04-30T23:59:59Z",
  "assignedAgency": {
    "id": "BRC-ENV-TUN-001",
    "nameFr": "BRC - Ministère de l'Environnement - Tunis"
  }
}

// agencies.json 샘플 1건
{
  "id": "BRC-ENV-TUN-001",
  "nameFr": "Bureau des Relations avec le Citoyen - Ministère de l'Environnement",
  "complaintCount": 234,
  "completionRate": 87.3,
  "avgProcessingDays": 12.4,
  "satisfactionScore": 4.1
}
```

---

## 🔑 갭 기능 구현 핵심 포인트

| 갭 ID | 화면 | 구현 방법 |
|--------|------|-----------|
| G-01 | 민원 신청 Step 1 | 5개 유형 카드 그리드. 카드에 유형명·설명·SLA·아이콘 표시. 선택 시 primary 테두리 강조 |
| G-02 | BO 워크리스트 | `transferCount >= 2`이면 주황 경고 아이콘. `>= 3`이면 빨간 배지 + "BCRC 보고 필요" 표시 |
| G-04 | BO 워크리스트 | `DeadlineBadge` 컴포넌트로 D-Day 자동 색상 변환 |
| G-05 | 시민 제안 목록 | 제안 카드에 `👍 공감 (N)` 버튼. 로그인 필요. Zustand로 공감 상태 관리 |
| G-06 | BO 통계 | "반복 민원 TOP 10" 테이블 섹션. 동일 시민이 3회+ 접수한 민원 목록 |
| G-11 | BCRC 성과 | BRC 성과 테이블. `completionRate < 80%` 행은 빨간색 강조 |

---

## 🏃 실행 방법

```bash
npm install      # 의존성 설치
npm run dev      # 개발 서버 → http://localhost:3000
npm run build    # 프로덕션 빌드
npm run typecheck # TypeScript 검사
npm run lint     # ESLint 검사
```

### 테스트 계정 (MSW 목 인증)

| 역할 | ID | 비밀번호 |
|------|----|---------|
| 시민 | citizen@test.tn | test1234 |
| BRC 담당자 | officer@brc.tn | test1234 |
| BCRC 관리자 | admin@bcrc.tn | test1234 |
| DGGPC 담당자 | dggpc@gov.tn | test1234 |

---

*CLAUDE.md v1.1 | e-People II Prototype | KOICA ODA Tunisia*
