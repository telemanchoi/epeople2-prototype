# UI_GUIDELINES.md — 디자인 시스템 및 컴포넌트 가이드

> e-People II 프로토타입 | PMC AA 전문가 작성

---

## 1. 디자인 원칙

| 원칙 | 설명 |
|------|------|
| **신뢰성(Trust)** | 정부 서비스답게 안정적·권위 있는 시각 언어. 과도한 장식 배제 |
| **접근성(Accessibility)** | 튀니지 전 연령·장애 유형 시민이 사용 가능한 포용적 설계 |
| **명확성(Clarity)** | 1개 화면 1개 목적. 불필요한 정보 제거, 행동 유도(CTA) 명확화 |
| **현지화(Localization)** | 아랍어 RTL + 프랑스어 LTR 완전 지원. 튀니지 문화 컨텍스트 반영 |
| **경량성(Performance)** | 3G 환경 최적화. 이미지 lazy-load, 코드 스플리팅 |

---

## 2. 색상 시스템

### 2.1 브랜드 컬러

```css
/* Primary — 신뢰·정부 */
--color-primary-50:  #EFF6FF;
--color-primary-100: #DBEAFE;
--color-primary-500: #3B82F6;
--color-primary-600: #2563EB;
--color-primary-700: #1D4ED8;  /* 주 사용 */
--color-primary-800: #1E40AF;
--color-primary-900: #1E3A8A;

/* e-People Brand — 청록 */
--color-brand-500: #0891B2;
--color-brand-600: #0E7490;    /* 주 사용 */
--color-brand-700: #155E75;

/* Neutral */
--color-gray-50:  #F8FAFC;    /* 페이지 배경 */
--color-gray-100: #F1F5F9;    /* 카드 배경 */
--color-gray-200: #E2E8F0;    /* 테두리 */
--color-gray-500: #64748B;    /* 보조 텍스트 */
--color-gray-800: #1E293B;    /* 본문 텍스트 */
--color-gray-900: #0F172A;    /* 제목 텍스트 */
```

### 2.2 시맨틱 컬러

```css
--color-success:  #16A34A;  /* 처리 완료, 성공 */
--color-warning:  #D97706;  /* 기한 임박, 주의 */
--color-danger:   #DC2626;  /* 오류, 기한 초과, 긴급 */
--color-info:     #0284C7;  /* 정보, 안내 */
```

### 2.3 민원 상태 컬러

| 상태 | 배경 | 텍스트 | Tailwind 클래스 |
|------|------|--------|----------------|
| 접수(received) | `#DBEAFE` | `#1E40AF` | `bg-blue-100 text-blue-800` |
| 배분(assigned) | `#EDE9FE` | `#5B21B6` | `bg-violet-100 text-violet-800` |
| 처리중(processing) | `#FEF3C7` | `#92400E` | `bg-amber-100 text-amber-800` |
| 완료(completed) | `#DCFCE7` | `#166534` | `bg-green-100 text-green-800` |
| 종결(closed) | `#F1F5F9` | `#475569` | `bg-slate-100 text-slate-600` |
| 기한초과(overdue) | `#FEE2E2` | `#991B1B` | `bg-red-100 text-red-800` |

### 2.4 민원 유형 컬러

| 유형 | 배경 | 텍스트 | 아이콘 |
|------|------|--------|--------|
| 고충민원(grievance) | `bg-red-100` | `text-red-800` | AlertCircle |
| 제안(proposal) | `bg-blue-100` | `text-blue-800` | Lightbulb |
| 질의(inquiry) | `bg-purple-100` | `text-purple-800` | HelpCircle |
| 건의(suggestion) | `bg-orange-100` | `text-orange-800` | MessageSquare |
| 신고(report) | `bg-pink-100` | `text-pink-800` | Flag |

---

## 3. 타이포그래피

### 3.1 폰트 패밀리

```css
/* 아랍어 */
font-family: 'Noto Sans Arabic', 'Cairo', 'Amiri', Arial, sans-serif;

/* 프랑스어 / 라틴 */
font-family: 'Inter', 'Roboto', Arial, sans-serif;

/* 숫자 (아랍어 환경에서도 서양식 숫자 사용 권장) */
font-feature-settings: "tnum"; /* tabular numbers */
```

### 3.2 타이포그래피 스케일

| 역할 | 크기 | 굵기 | 줄 간격 | Tailwind |
|------|------|------|---------|----------|
| 페이지 제목 (H1) | 28px | 700 | 1.3 | `text-3xl font-bold` |
| 섹션 제목 (H2) | 22px | 600 | 1.4 | `text-2xl font-semibold` |
| 카드 제목 (H3) | 18px | 600 | 1.4 | `text-lg font-semibold` |
| 본문 | 15px | 400 | 1.6 | `text-sm leading-relaxed` |
| 보조 텍스트 | 13px | 400 | 1.5 | `text-xs text-gray-500` |
| 라벨 | 13px | 500 | 1.4 | `text-xs font-medium` |
| 버튼 텍스트 | 14px | 500 | 1 | `text-sm font-medium` |

### 3.3 아랍어 특수 규칙
- 아랍어는 기본 폰트 크기를 **1px 크게** 설정 (가독성)
- 줄 간격은 프랑스어 대비 **1.2배** 넓게 설정
- 아랍어 숫자(`٠١٢٣`) 대신 서양식 숫자(`0123`) 사용 권장

---

## 4. 간격 및 레이아웃

### 4.1 간격 시스템 (4px 기반)

```
4px  (space-1)  — 내부 미세 간격
8px  (space-2)  — 아이콘-텍스트 간격
12px (space-3)  — 컴포넌트 내부 패딩 (소)
16px (space-4)  — 컴포넌트 내부 패딩 (중), 카드 패딩
24px (space-6)  — 섹션 간 간격
32px (space-8)  — 페이지 섹션 간 간격
48px (space-12) — 페이지 상단 여백
```

### 4.2 그리드 레이아웃

```tsx
// 페이지 래퍼
<div className="min-h-screen bg-gray-50">
  {/* 사이드바 + 메인 콘텐츠 */}
  <div className="flex">
    <Sidebar className="w-64 shrink-0" />
    <main className="flex-1 p-6 max-w-7xl">
      {/* 페이지 콘텐츠 */}
    </main>
  </div>
</div>

// 카드 그리드 (대시보드 KPI)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <KpiCard />
</div>

// 2컬럼 레이아웃 (민원 처리 화면)
<div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
  <div className="lg:col-span-3">민원 내용</div>
  <div className="lg:col-span-2">처리 패널</div>
</div>
```

### 4.3 반응형 브레이크포인트

| 이름 | 최소 너비 | 대상 기기 |
|------|-----------|----------|
| (기본) | 0px | 소형 스마트폰 |
| `sm:` | 640px | 스마트폰 가로 |
| `md:` | 768px | 태블릿 |
| `lg:` | 1024px | 데스크탑 |
| `xl:` | 1280px | 와이드 데스크탑 |

---

## 5. 공통 컴포넌트 명세

### 5.1 Button

```tsx
// 변형(variant)
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

// 사용 예시
<Button variant="primary" size="md" onClick={handleSubmit}>
  {t('complaint.submit')}
</Button>

<Button variant="outline" size="sm" leftIcon={<Download size={16} />}>
  {t('common.export')}
</Button>

<Button variant="danger" loading={isDeleting}>
  {t('common.delete')}
</Button>
```

**Tailwind 클래스 기준**:
```
primary : bg-primary-700 text-white hover:bg-primary-800
secondary: bg-brand-600  text-white hover:bg-brand-700
outline : border border-primary-700 text-primary-700 hover:bg-primary-50
ghost   : text-gray-600 hover:bg-gray-100
danger  : bg-red-600 text-white hover:bg-red-700

sm : px-3 py-1.5 text-xs rounded
md : px-4 py-2   text-sm rounded-md
lg : px-6 py-3   text-base rounded-lg
```

---

### 5.2 StatusBadge (상태 배지)

```tsx
interface StatusBadgeProps {
  status: ComplaintStatus;
  size?: 'sm' | 'md';
}

// 렌더 예시
<StatusBadge status="processing" />
// → <span class="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs font-medium">처리중</span>
```

---

### 5.3 ComplaintTypeBadge (민원 유형 배지)

```tsx
// 유형별 아이콘 + 색상 자동 적용
<ComplaintTypeBadge type="grievance" />
// → AlertCircle 아이콘 + "고충민원" 텍스트
```

---

### 5.4 DataTable (데이터 테이블)

```tsx
interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  pagination?: PaginationProps;
}

// 컬럼 정의 예시
const columns: ColumnDef<IComplaint>[] = [
  {
    key: 'id',
    header: t('table.id'),
    width: '140px',
    render: (row) => (
      <span className="font-mono text-xs text-primary-700">{row.id}</span>
    ),
  },
  {
    key: 'type',
    header: t('table.type'),
    width: '120px',
    render: (row) => <ComplaintTypeBadge type={row.type} />,
  },
  {
    key: 'title',
    header: t('table.title'),
    render: (row) => (
      <span className="line-clamp-2">{row.title}</span>
    ),
  },
  {
    key: 'deadline',
    header: t('table.deadline'),
    width: '120px',
    render: (row) => <DeadlineBadge deadline={row.deadline} />,
  },
  {
    key: 'status',
    header: t('table.status'),
    width: '110px',
    render: (row) => <StatusBadge status={row.status} />,
  },
];
```

---

### 5.5 StepWizard (단계 진행 표시기)

```tsx
interface StepWizardProps {
  steps: { id: number; label: string; description?: string }[];
  currentStep: number;
}

// 렌더 구조
// ●━━━●━━━○━━━○━━━○
// 완료 완료 현재 대기 대기

// Step 상태별 스타일
// 완료(done)   : bg-primary-700 text-white
// 현재(current): bg-white border-2 border-primary-700 text-primary-700
// 대기(pending): bg-gray-200 text-gray-400
```

---

### 5.6 TimelineItem (처리 이력 타임라인)

```tsx
interface TimelineItemProps {
  action: string;
  agency?: string;
  officer?: string;
  note?: string;
  timestamp: string;
  isLast?: boolean;
  variant?: 'default' | 'transfer' | 'warning' | 'completed';
}

// 렌더 구조
/*
  ● [아이콘]  접수 완료                      2024-03-01 09:30
  │           환경부 민원실 배분
  │
  ● [아이콘]  처리 중                         2024-03-02 10:00
  │
  ⚠ [아이콘]  이관 — 지역청 환경과            2024-03-03 14:00
  │           이관 사유: 관할 기관 변경
  │
  ○ [아이콘]  처리 완료 (예정)               2024-04-30
*/
```

---

### 5.7 KpiCard (KPI 지표 카드)

```tsx
interface KpiCardProps {
  title: string;
  value: number | string;
  change?: number;        // +12, -3 형태
  changeLabel?: string;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'amber' | 'red';
  onClick?: () => void;
}

// 렌더 예시
<KpiCard
  title={t('dashboard.totalReceived')}
  value={1284}
  change={+12}
  changeLabel={t('dashboard.vsLastMonth')}
  icon={<Inbox size={20} />}
  color="blue"
/>
```

---

### 5.8 DeadlineBadge (처리기한 배지)

```tsx
// 남은 일수에 따라 자동 색상 변경
const DeadlineBadge = ({ deadline }: { deadline: string }) => {
  const daysRemaining = differenceInDays(parseISO(deadline), new Date());
  
  if (daysRemaining < 0) return <Badge color="red">D+{Math.abs(daysRemaining)} {t('deadline.overdue')}</Badge>;
  if (daysRemaining <= 1) return <Badge color="red">D-{daysRemaining}</Badge>;
  if (daysRemaining <= 3) return <Badge color="orange">D-{daysRemaining}</Badge>;
  if (daysRemaining <= 7) return <Badge color="yellow">D-{daysRemaining}</Badge>;
  return <Badge color="gray">D-{daysRemaining}</Badge>;
};
```

---

### 5.9 FileUploadZone (파일 업로드 영역)

```tsx
// Drag & Drop + 클릭 업로드
// 렌더 상태: idle | dragover | uploading | error

// idle 상태
/*
  ┌─────────────────────────────────────┐
  │  ⬆  파일을 여기에 끌어다 놓거나     │
  │     클릭하여 선택하세요             │
  │                                     │
  │  PDF, JPG, PNG, DOCX, XLSX          │
  │  최대 10MB / 최대 5개               │
  └─────────────────────────────────────┘
*/

// 파일 목록
/*
  📄 민원서류.pdf          1.2 MB  [×]
  🖼 사진1.jpg             850 KB  [×]
*/
```

---

### 5.10 SidePanelDrawer (사이드 패널)

```tsx
// 오른쪽 또는 왼쪽(RTL)에서 슬라이드 인
interface SidePanelDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  width?: 'sm' | 'md' | 'lg'; // 320px / 480px / 640px
  children: React.ReactNode;
}

// 내부 스크롤 가능, 외부 클릭 시 닫힘
// RTL에서 왼쪽, LTR에서 오른쪽에서 등장
```

---

## 6. 페이지별 레이아웃 명세

### 6.1 시민 포털 레이아웃

```
┌─────────────────────────────────────────────────────────┐
│  Header: e-People II 로고 | 언어선택(AR/FR) | 로그인    │
├─────────────────────────────────────────────────────────┤
│  Hero: "튀니지 국민신문고에 오신 것을 환영합니다"        │
│  [민원신청] [부패신고] [국민제안] [민원조회] — 4버튼    │
├─────────────────────────────────────────────────────────┤
│  최근 공지사항 (3열 카드)                               │
├─────────────────────────────────────────────────────────┤
│  처리 현황 통계 (4개 KPI 숫자)                          │
├─────────────────────────────────────────────────────────┤
│  Footer: BCRC 연락처 | 개인정보처리방침 | 접근성         │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Back Office 레이아웃 (공무원)

```
┌──────────┬──────────────────────────────────────────────┐
│          │  Header: 사용자명 | 알림벨 | 로그아웃         │
│          ├──────────────────────────────────────────────┤
│  Sidebar │                                              │
│  (240px) │  페이지 콘텐츠 영역                          │
│          │  (max-width: 1200px, padding: 24px)          │
│  ─────   │                                              │
│  대시보드│                                              │
│  워크리스│                                              │
│  트      │                                              │
│  통계    │                                              │
│  설정    │                                              │
└──────────┴──────────────────────────────────────────────┘
```

### 6.3 민원 처리 화면 레이아웃

```
┌──────────────────────────────┬──────────────────────────┐
│  민원 정보 (col-span-3)      │  처리 패널 (col-span-2)  │
│                              │                          │
│  민원번호: CMP-2024-000042   │  상태 변경               │
│  유형: 고충민원              │  ┌─────────────────┐     │
│  분류: 환경 > 수질 > 식수    │  │ 처리중       ▼  │     │
│                              │  └─────────────────┘     │
│  ─────────────────────────   │                          │
│  시민 신청 내용              │  답변 작성               │
│  (스크롤 가능)               │  [리치 텍스트 에디터]    │
│                              │                          │
│  첨부파일 (2건)              │  [📚 유사 선례 검색]     │
│                              │  [📋 템플릿 선택]        │
│  처리 이력 타임라인          │                          │
│                              │  [↗ 이관 요청]           │
│                              │  [⏱ 기한 연장]           │
│                              │  [💬 내부 협의]           │
│                              │                          │
│                              │  [✓ 처리 완료]           │
└──────────────────────────────┴──────────────────────────┘
```

---

## 7. 아이콘 사용 가이드

Lucide React 아이콘을 사용한다. 사이즈는 맥락에 따라:
- 버튼 내 아이콘: `size={16}`
- 인라인 텍스트 아이콘: `size={16}`
- 카드 헤더 아이콘: `size={20}`
- KPI 카드 아이콘: `size={24}`
- 빈 상태(Empty State) 아이콘: `size={48}`

### 기능별 권장 아이콘

| 기능 | 아이콘 |
|------|--------|
| 민원 신청 | `FileText` |
| 부패 신고 | `ShieldAlert` |
| 국민제안 | `Lightbulb` |
| 처리 상태 조회 | `Search` |
| 이관 | `ArrowRightLeft` |
| 기한 연장 | `Clock` |
| 내부 협의 | `MessageSquare` |
| 통계 | `BarChart2` |
| 파일 첨부 | `Paperclip` |
| 다운로드 | `Download` |
| 알림 | `Bell` |
| 설정 | `Settings` |
| 사용자 관리 | `Users` |
| 기관 관리 | `Building2` |
| 경고 | `AlertTriangle` |
| 정보 | `Info` |
| 완료 | `CheckCircle2` |
| 오류 | `XCircle` |

---

## 8. 빈 상태(Empty State) 가이드

민원이 없거나 검색 결과가 없을 때 표시하는 화면.

```tsx
// 컴포넌트 구조
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="text-gray-300 mb-4">
    <Inbox size={48} />
  </div>
  <h3 className="text-lg font-medium text-gray-700 mb-1">
    {t('complaints.empty.title')}     {/* 접수된 민원이 없습니다 */}
  </h3>
  <p className="text-sm text-gray-500 mb-6">
    {t('complaints.empty.description')}
  </p>
  <Button variant="primary" leftIcon={<Plus size={16} />}>
    {t('complaints.new')}
  </Button>
</div>
```

---

## 9. 로딩 상태 가이드

### 9.1 페이지 로딩: Skeleton UI

```tsx
// 테이블 스켈레톤 (데이터 로딩 중)
const TableSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="h-14 bg-gray-200 rounded animate-pulse" />
    ))}
  </div>
);

// 카드 스켈레톤
const CardSkeleton = () => (
  <div className="bg-white rounded-lg p-4 shadow-sm">
    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-3/4" />
    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
  </div>
);
```

### 9.2 버튼 로딩: Spinner

```tsx
// 버튼 내 로딩 스피너
<Button loading={isSubmitting}>
  {isSubmitting ? t('common.submitting') : t('complaint.submit')}
</Button>

// 스피너: 버튼 텍스트 좌측에 작은 원형 스피너
// <svg className="animate-spin h-4 w-4" .../>
```

---

## 10. 접근성 체크리스트

개발 완료 전 반드시 확인:

- [ ] 모든 `<img>`에 `alt` 속성 있음
- [ ] 모든 폼 필드에 `<label>` 연결 (`htmlFor` / `aria-labelledby`)
- [ ] 버튼에 텍스트 또는 `aria-label` 있음 (아이콘만 있는 버튼 포함)
- [ ] 모달 열릴 때 포커스 이동, 닫힐 때 원래 위치로 복귀
- [ ] 색상 대비 4.5:1 이상 (텍스트), 3:1 이상 (UI 컴포넌트)
- [ ] 키보드 Tab 순서가 논리적
- [ ] 오류 메시지가 `role="alert"` 또는 `aria-live="polite"`로 선언됨
- [ ] 상태 변화가 색상만으로 구분되지 않음 (텍스트·아이콘 병행)

---

*문서 버전: v1.0 | UI_GUIDELINES | PMC AA 전문가 작성 | KOICA ODA Tunisia e-People II*
