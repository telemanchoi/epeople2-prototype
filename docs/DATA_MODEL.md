# DATA_MODEL.md — 데이터 모델 설계서

> e-People II 프로토타입 | PMC 응용시스템 설계 전문가 (AA/DA) 작성  
> **Claude Code 필독**: 이 문서에 정의된 타입·인터페이스를 `src/types/`에 그대로 구현할 것.  
> SRS·API_SPEC과 함께 참조하되, 충돌 시 이 문서가 우선한다.

---

## ⚠️ 설계 원칙 (반드시 준수)

### 원칙 1: 민원과 부패신고 데이터의 완전 분리
민원(`Complaint`)과 부패신고(`CorruptionReport`)는 **절대 동일 테이블/컬렉션에 저장하지 않는다.**
- 담당 조직이 다름 (BCRC vs DGGPC)
- 보안 등급이 다름 (일반 vs 기밀)
- 접근 권한이 다름
- 프로토타입의 목 데이터도 완전히 분리된 JSON 파일로 관리한다.

### 원칙 2: 다국어 필드 명명 규칙
아랍어/프랑스어 다국어 필드는 접미사로 구분한다.
```typescript
// ✅ 올바른 방식
titleFr: string;   // 프랑스어
titleAr: string;   // 아랍어

// ❌ 잘못된 방식
title: string;     // 어떤 언어인지 불명확
```

### 원칙 3: ID 형식 규칙
```
민원     : CMP-YYYY-NNNNNN   예) CMP-2024-000042
부패신고 : RPT-YYYY-NNNNNN   예) RPT-2024-000018
국민제안 : PRP-YYYY-NNNNNN   예) PRP-2024-000005
기관     : BRC-XXX-YYY-NNN   예) BRC-ENV-TUN-001
사용자   : USR-NNNNNN        예) USR-000042
첨부파일 : ATT-NNNNNN        예) ATT-000001
이관이력 : TRF-NNNNNN        예) TRF-000001
```

### 원칙 4: 날짜/시간 형식
모든 날짜·시간은 **ISO 8601 UTC** 형식 사용.
```typescript
submittedAt: "2024-03-01T09:30:00Z"  // ✅
submittedAt: "2024-03-01"            // ❌ (시간 정보 손실)
submittedAt: 1709282400000           // ❌ (Unix timestamp 사용 금지)
```

---

## 1. 전체 엔티티 관계도 (ERD 텍스트)

```
┌─────────────┐      ┌───────────────────┐      ┌─────────────┐
│    User     │      │    Complaint      │      │   Agency    │
│  (사용자)   │      │    (민원 Ticket)  │      │  (기관 BRC) │
├─────────────┤      ├───────────────────┤      ├─────────────┤
│ id          │1    *│ id                │*    1│ id          │
│ role        ├──────┤ type ←─ SLA 자동  ├──────┤ type        │
│ agency (FK) │      │ status            │      │ parentId    │
│ nameAr/Fr   │      │ citizenId (FK)    │      │ nameAr/Fr   │
└─────────────┘      │ assignedAgency(FK)│      │ slaConfig   │
                     │ assignedOfficer   │      └─────────────┘
                     │ transferCount     │
                     │ deadline          │
                     └─────────┬─────────┘
                               │ 1
                    ┌──────────┴──────────────┬──────────────┐
                    │                         │              │
                    * 1..*                    * 0..*         * 0..*
        ┌───────────────────┐  ┌──────────────────┐  ┌──────────────┐
        │ ComplaintHistory  │  │   Attachment     │  │Satisfaction  │
        │  (처리 이력)      │  │  (첨부파일)      │  │  Score       │
        ├───────────────────┤  ├──────────────────┤  ├──────────────┤
        │ action            │  │ filename         │  │ score (1-5)  │
        │ fromAgency        │  │ sizeBytes        │  │ comment      │
        │ toAgency          │  │ mimeType         │  └──────────────┘
        │ reasonAr/Fr       │  └──────────────────┘
        │ officerId         │
        └───────────────────┘

        ※ 별도 분리된 도메인 (Complaint와 교차 접근 불가)
┌──────────────────────┐    ┌─────────────────────┐
│  CorruptionReport    │    │   CitizenProposal    │
│  (부패신고)          │    │   (국민제안)         │
├──────────────────────┤    ├─────────────────────┤
│ id                   │    │ id                  │
│ type                 │    │ likeCount           │
│ isAnonymous          │    │ reviewResult        │
│ anonymousToken       │    │ implementationPlan  │
│ targetAgencyId       │    └────────┬────────────┘
└──────────────────────┘             │
                                     * 0..*
                               ┌─────────────┐
                               │ ProposalLike │
                               │(공감 기록)  │
                               └─────────────┘
```

---

## 2. 핵심 타입 정의 (`src/types/`)

### 2.1 공통 타입 (`types/common.ts`)

```typescript
// ─── 기관 유형 ───────────────────────────────────────────────
export type AgencyType = 'BCRC' | 'BRC' | 'DGGPC' | 'GOVERNANCE_TEAM';

// ─── 사용자 역할 ─────────────────────────────────────────────
export type UserRole =
  | 'CITIZEN'           // 시민
  | 'ANONYMOUS'         // 익명 신고자
  | 'BRC_OFFICER'       // BRC 담당자
  | 'BRC_MANAGER'       // BRC 관리자
  | 'BCRC_ADMIN'        // BCRC 중앙 관리자
  | 'DGGPC_OFFICER'     // DGGPC 담당자
  | 'DGGPC_MANAGER'     // DGGPC 관리자
  | 'SYS_ADMIN';        // 시스템 관리자

// ─── 행정구역 ────────────────────────────────────────────────
export interface IRegion {
  code: string;         // 'TUN-01'
  nameFr: string;       // 'Tunis - Arrondissement 1'
  nameAr: string;       // 'تونس - الدائرة 1'
  governorat: string;   // 'TUN'
}

// ─── 다국어 텍스트 ───────────────────────────────────────────
export interface ILocalizedText {
  fr: string;
  ar: string;
}

// ─── 페이지네이션 ────────────────────────────────────────────
export interface IPagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

// ─── API 공통 응답 ───────────────────────────────────────────
export interface IApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: IPagination;
  timestamp: string;
}

export interface IApiError {
  success: false;
  error: {
    code: string;
    messageFr: string;
    messageAr: string;
  };
  timestamp: string;
}
```

---

### 2.2 기관 타입 (`types/agency.ts`)

```typescript
// ─── SLA 설정 (민원 유형별 처리기한) ────────────────────────
// 단위: 시간(hours)
export interface ISLAConfig {
  grievance: number;    // 고충민원: 1440시간(60일)
  proposal: number;     // 제안:     720시간(30일)
  inquiry: number;      // 질의:     168시간(7일)
  suggestion: number;   // 건의:     720시간(30일)
  report: number;       // 신고:     360시간(15일)
}

// ─── 기관 ────────────────────────────────────────────────────
export interface IAgency {
  id: string;                   // 'BRC-ENV-TUN-001'
  nameFr: string;
  nameAr: string;
  type: AgencyType;
  parentId: string | null;      // 상위 기관 (BCRC → BRC 계층)
  regionCode: string;
  isActive: boolean;
  contactEmail: string;
  slaConfig: ISLAConfig;        // 기관별 SLA 기준 (유형별)
}

// ─── 기관 성과 (통계용) ──────────────────────────────────────
export interface IAgencyPerformance {
  agency: Pick<IAgency, 'id' | 'nameFr' | 'nameAr'>;
  received: number;
  completed: number;
  completionRate: number;       // 백분율 (0~100)
  avgProcessingDays: number;
  slaComplianceRate: number;    // SLA 준수율 (%)
  satisfactionScore: number;    // 평균 만족도 (1~5)
  transferCount: number;        // 이관 발생 건수
  overdueCount: number;         // 기한 초과 건수
}
```

---

### 2.3 민원 타입 (`types/complaint.ts`)

```typescript
// ─── 민원 유형 (G-01 핵심 설계 항목) ───────────────────────
// 이 5가지 유형이 SLA·워크플로우·통계 전체의 기반
export type ComplaintType =
  | 'grievance'     // 고충민원  (Réclamation / تظلم)    — 60일
  | 'proposal'      // 제안      (Suggestion / اقتراح)   — 30일
  | 'inquiry'       // 질의      (Renseignement / استفسار)— 7일
  | 'suggestion'    // 건의      (Doléance / ملاحظة)     — 30일
  | 'report';       // 신고      (Signalement / بلاغ)    — 15일

// ─── 민원 상태 ───────────────────────────────────────────────
export type ComplaintStatus =
  | 'received'      // 접수됨
  | 'assigned'      // 기관 배분됨
  | 'processing'    // 처리 중
  | 'completed'     // 처리 완료
  | 'closed';       // 종결 (만족도 평가 완료 또는 기간 만료)

// ─── 처리 이력 액션 유형 ────────────────────────────────────
export type ComplaintHistoryAction =
  | 'received'              // 접수
  | 'assigned'              // 배분
  | 'transferred'           // 이관
  | 'joint_process_started' // 공동처리 시작 (G-03)
  | 'deadline_extended'     // 기한 연장 (G-04)
  | 'processed'             // 답변 작성 완료
  | 'completed'             // 처리 완료
  | 'closed'                // 종결
  | 'reopened';             // 이의신청으로 재개

// ─── 민원 분류 (대/중/소 3단계) ─────────────────────────────
export interface ICategory {
  code: string;         // '010201'
  nameFr: string;
  nameAr: string;
  children?: ICategory[];
}

export interface ICategoryPath {
  l1: Pick<ICategory, 'code' | 'nameFr' | 'nameAr'>;
  l2: Pick<ICategory, 'code' | 'nameFr' | 'nameAr'>;
  l3?: Pick<ICategory, 'code' | 'nameFr' | 'nameAr'>;
}

// ─── 첨부파일 ────────────────────────────────────────────────
export interface IAttachment {
  id: string;           // 'ATT-000001'
  filename: string;     // 서버 저장 파일명
  originalName: string; // 사용자 업로드 원본 파일명
  sizeBytes: number;
  mimeType: string;
  uploadedAt: string;   // ISO 8601
}

// ─── 처리 이력 단건 ─────────────────────────────────────────
export interface IComplaintHistory {
  id: string;
  action: ComplaintHistoryAction;
  actionLabelFr: string;        // 화면 표시용 레이블 (FR)
  actionLabelAr: string;        // 화면 표시용 레이블 (AR)
  fromAgency?: Pick<IAgency, 'id' | 'nameFr' | 'nameAr'>;
  toAgency?: Pick<IAgency, 'id' | 'nameFr' | 'nameAr'>;
  officer?: { id: string; name: string };
  reasonFr?: string;
  reasonAr?: string;
  noteFr?: string;
  noteAr?: string;
  timestamp: string;            // ISO 8601
}

// ─── 기한 연장 요청 ─────────────────────────────────────────
export interface IDeadlineExtensionRequest {
  id: string;
  complaintId: string;
  requestedAdditionalDays: number;
  reasonFr: string;
  reasonAr: string;
  status: 'pending_approval' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  currentDeadline: string;
  requestedDeadline: string;
}

// ─── 공동처리 (G-03) ────────────────────────────────────────
export interface IJointProcess {
  id: string;
  complaintId: string;
  leadAgency: Pick<IAgency, 'id' | 'nameFr' | 'nameAr'>;
  cooperatingAgencies: Array<{
    agency: Pick<IAgency, 'id' | 'nameFr' | 'nameAr'>;
    opinionFr?: string;
    opinionAr?: string;
    submittedAt?: string;
    status: 'pending' | 'submitted';
  }>;
  startedAt: string;
}

// ─── 만족도 평가 ─────────────────────────────────────────────
export interface ISatisfactionScore {
  score: 1 | 2 | 3 | 4 | 5;
  commentFr?: string;
  commentAr?: string;
  submittedAt: string;
}

// ─── 민원 Ticket (목록용 경량 버전) ────────────────────────
export interface IComplaintSummary {
  id: string;
  type: ComplaintType;
  titleFr: string;
  titleAr: string;
  status: ComplaintStatus;
  categoryPath: ICategoryPath;
  assignedAgency: Pick<IAgency, 'id' | 'nameFr' | 'nameAr'>;
  submittedAt: string;
  deadline: string;
  daysRemaining: number;        // 양수: 남은 일수 / 음수: 초과 일수
  transferCount: number;        // 이관 횟수 (G-02 통제 기준)
  hasAttachments: boolean;
  satisfactionScore: number | null;
}

// ─── 민원 Ticket (상세 전체 버전) ───────────────────────────
export interface IComplaint extends IComplaintSummary {
  contentFr: string;
  contentAr: string;
  regionCode: string;
  incidentDate?: string;
  citizenId: string;            // 마스킹 처리되어 표시
  isAnonymous: false;           // 민원은 항상 실명 (익명은 부패신고만)
  assignedOfficer?: {
    id: string;
    name: string;
    nameAr: string;
  };
  attachments: IAttachment[];
  history: IComplaintHistory[];
  answer?: {
    contentFr: string;
    contentAr: string;
    answeredAt: string;
    answeredBy: string;
  };
  extensionRequest?: IDeadlineExtensionRequest;
  jointProcess?: IJointProcess;
  satisfactionDetail?: ISatisfactionScore;
}
```

---

### 2.4 부패 신고 타입 (`types/report.ts`)

> **Claude Code 주의**: 이 타입들은 `complaint.ts`와 완전히 분리 유지. 어떠한 경우에도 Complaint 타입을 확장하거나 합치지 말 것.

```typescript
// ─── 부패 신고 유형 ──────────────────────────────────────────
export type CorruptionReportType =
  | 'bribery'           // 뇌물
  | 'embezzlement'      // 횡령
  | 'abuse_of_power'    // 직권 남용
  | 'nepotism'          // 연고주의
  | 'other';            // 기타

// ─── 부패 신고 상태 ──────────────────────────────────────────
export type CorruptionReportStatus =
  | 'received'          // 접수
  | 'preliminary_review'// 예비 검토
  | 'under_investigation'// 정식 조사 중
  | 'completed'         // 처리 완료
  | 'dismissed';        // 각하 (근거 없음)

// ─── 부패 신고 (목록용) ─────────────────────────────────────
export interface ICorruptionReportSummary {
  id: string;                   // 'RPT-2024-000018'
  type: CorruptionReportType;
  status: CorruptionReportStatus;
  targetAgency: Pick<IAgency, 'id' | 'nameFr' | 'nameAr'>;
  isAnonymous: boolean;
  // ⚠️ 아래 두 필드는 DGGPC 역할만 볼 수 있음. 시민 응답에서는 반드시 제외
  reporterMasked?: string;      // '***@***.tn' 형식으로 마스킹
  anonymousToken?: string;      // 익명 토큰 (조회용)
  submittedAt: string;
  trackingCode: string;         // 신고자 조회용 코드
}

// ─── 부패 신고 (상세) ────────────────────────────────────────
export interface ICorruptionReport extends ICorruptionReportSummary {
  contentFr: string;
  contentAr: string;
  incidentDate?: string;
  locationFr?: string;
  locationAr?: string;
  attachments: IAttachment[];
  history: ICorruptionReportHistory[];
  result?: {
    summaryFr: string;
    summaryAr: string;
    completedAt: string;
  };
}

export interface ICorruptionReportHistory {
  id: string;
  action: string;
  actionLabelFr: string;
  actionLabelAr: string;
  officerId?: string;   // DGGPC 직원
  noteFr?: string;
  noteAr?: string;
  timestamp: string;
}
```

---

### 2.5 국민제안 타입 (`types/proposal.ts`)

```typescript
// ─── 제안 상태 ───────────────────────────────────────────────
export type ProposalStatus =
  | 'pending'           // 검토 대기
  | 'under_review'      // 검토 중
  | 'accepted'          // 채택
  | 'rejected'          // 미채택
  | 'implemented';      // 이행 완료

// ─── 심사 결과 ───────────────────────────────────────────────
export interface IProposalReview {
  result: 'accepted' | 'rejected';
  reviewCommentFr: string;
  reviewCommentAr: string;
  reviewedAt: string;
  reviewedBy: string;
  implementationPlanFr?: string;
  implementationPlanAr?: string;
}

// ─── 이행 현황 업데이트 ──────────────────────────────────────
export interface IImplementationUpdate {
  id: string;
  contentFr: string;
  contentAr: string;
  progress: number;     // 0~100 (%)
  updatedAt: string;
}

// ─── 국민제안 (목록용) ───────────────────────────────────────
export interface IProposalSummary {
  id: string;
  titleFr: string;
  titleAr: string;
  status: ProposalStatus;
  categoryPath: ICategoryPath;
  assignedAgency?: Pick<IAgency, 'id' | 'nameFr' | 'nameAr'>;
  likeCount: number;
  isLikedByMe: boolean;         // 현재 로그인 사용자의 공감 여부
  submittedAt: string;
  reviewResult?: Pick<IProposalReview, 'result' | 'reviewedAt'>;
}

// ─── 국민제안 (상세) ─────────────────────────────────────────
export interface IProposal extends IProposalSummary {
  contentFr: string;
  contentAr: string;
  attachments: IAttachment[];
  review?: IProposalReview;
  implementationUpdates: IImplementationUpdate[];
}
```

---

### 2.6 사용자 타입 (`types/user.ts`)

```typescript
export interface IUser {
  id: string;                           // 'USR-000042'
  username: string;                     // 'officer@brc.tn'
  name: string;                         // 라틴 이름
  nameAr: string;                       // 아랍어 이름
  role: UserRole;
  agency?: Pick<IAgency, 'id' | 'nameFr' | 'nameAr'>;
  isActive: boolean;
  lastLoginAt?: string;
  // ⚠️ 비밀번호·토큰 등 민감 정보는 절대 클라이언트 타입에 포함하지 말 것
}

// 로그인 후 클라이언트에서 유지하는 세션 정보
export interface IAuthSession {
  user: IUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

// 대리 처리 설정 (G-09)
export interface ISubstituteConfig {
  officerId: string;
  substituteId: string;
  startDate: string;
  endDate: string;
  reason: string;
  isActive: boolean;
}
```

---

### 2.7 통계 타입 (`types/statistics.ts`)

```typescript
// ─── 대시보드 KPI 요약 ───────────────────────────────────────
export interface IStatisticsOverview {
  totalReceived: number;
  totalCompleted: number;
  completionRate: number;
  avgProcessingDays: number;
  overdueCount: number;
  avgSatisfactionScore: number;
  changeVsLastPeriod: {
    received: number;         // % 변화 (+12.3 또는 -5.2)
    completionRate: number;
  };
}

// ─── 기간별 추이 ────────────────────────────────────────────
export interface ITrendDataPoint {
  period: string;             // '2024-03' (월) 또는 '2024-03-01' (일)
  received: number;
  completed: number;
  overdue: number;
}

// ─── 유형별 분포 ────────────────────────────────────────────
export interface ITypeDistribution {
  type: ComplaintType;
  count: number;
  percentage: number;
  avgProcessingDays: number;
}

// ─── 반복 민원 분석 (G-06) ──────────────────────────────────
export interface IRepeatedComplaintRecord {
  citizenId: string;          // 마스킹 처리 ('***masked***')
  repeatCount: number;
  categories: string[];       // 주요 분류 목록
  lastComplaintAt: string;
  totalUnresolved: number;
}

// ─── 장기 미처리 민원 (G-06) ────────────────────────────────
export interface ILongOverdueComplaint {
  complaintId: string;
  type: ComplaintType;
  titleFr: string;
  daysOverdue: number;
  assignedAgency: Pick<IAgency, 'id' | 'nameFr' | 'nameAr'>;
  assignedOfficer?: { name: string };
}
```

---

### 2.8 알림 타입 (`types/notification.ts`)

```typescript
export type NotificationType =
  | 'deadline_approaching'      // 처리기한 임박 (D-3, D-1)
  | 'deadline_overdue'          // 기한 초과
  | 'new_complaint_assigned'    // 새 민원 배분
  | 'transfer_requested'        // 이관 요청 수신
  | 'transfer_limit_warning'    // 이관 횟수 경고 (G-02)
  | 'extension_approved'        // 기한 연장 승인 (G-04)
  | 'extension_rejected'        // 기한 연장 거부
  | 'complaint_completed'       // 민원 처리 완료 (시민용)
  | 'joint_process_request'     // 공동처리 참여 요청 (G-03)
  | 'proposal_reviewed';        // 제안 심사 결과 (G-05)

export interface INotification {
  id: string;
  type: NotificationType;
  titleFr: string;
  titleAr: string;
  messageFr: string;
  messageAr: string;
  relatedId?: string;           // 관련 민원/신고/제안 ID
  relatedType?: 'complaint' | 'report' | 'proposal';
  isRead: boolean;
  createdAt: string;
}
```

---

## 3. 목 데이터 설계 (`src/mocks/data/`)

### 3.1 파일 구조 및 데이터 양

| 파일 | 데이터 양 | 핵심 조건 |
|------|----------|-----------|
| `complaints.json` | 50건 이상 | 모든 유형·상태 분포, 다양한 D-Day |
| `agencies.json` | 73건 (전체) | BRC 73개 전부 포함 |
| `categories.json` | 대6·중20·소50+ | 3단계 트리 구조 |
| `statistics.json` | 12개월치 | 월별 추이 데이터 |
| `proposals.json` | 20건 이상 | 모든 상태 분포 |
| `reports.json` | 10건 이상 | 실명/익명 혼합 |
| `users.json` | 10건 이상 | 모든 역할 포함 |
| `notifications.json` | 15건 이상 | 읽음/미읽음 혼합 |

### 3.2 목 데이터 배분 원칙

**민원 상태 배분** (50건 기준):
```
received   : 5건  (10%)
assigned   : 5건  (10%)
processing : 25건 (50%)  ← 워크리스트 테스트용으로 가장 많이
completed  : 10건 (20%)
closed     :  5건 (10%)
```

**민원 유형 배분**:
```
grievance  : 24건 (48%) ← 가장 많음
inquiry    : 15건 (30%)
suggestion :  6건 (12%)
proposal   :  3건 (6%)
report     :  2건 (4%)
```

**D-Day 배분** (processing 상태 민원 기준):
```
D+14 이상  :  8건  ← 녹색
D+4 ~ D+13 :  7건  ← 노랑
D+2 ~ D+3  :  4건  ← 주황
D+0 ~ D+1  :  3건  ← 빨강
기한 초과  :  3건  ← 빨강 + "초과" 배지
```

**이관 횟수 배분** (G-02 테스트용):
```
transferCount = 0 : 35건
transferCount = 1 : 10건
transferCount = 2 :  3건  ← 경고 표시 테스트
transferCount = 3 :  2건  ← BCRC 보고 필요 표시 테스트
```

### 3.3 민원 샘플 전체 구조

```json
// complaints.json
[
  {
    "id": "CMP-2024-000042",
    "type": "grievance",
    "titleFr": "Problème de raccordement d'eau potable dans le quartier",
    "titleAr": "مشكلة في توصيل مياه الشرب في الحي",
    "contentFr": "Depuis plus de 3 mois, l'eau potable ne parvient plus à notre quartier de manière régulière...",
    "contentAr": "منذ أكثر من 3 أشهر، لا تصل مياه الشرب إلى حينا بشكل منتظم...",
    "status": "processing",
    "categoryPath": {
      "l1": { "code": "01", "nameFr": "Environnement", "nameAr": "البيئة" },
      "l2": { "code": "0102", "nameFr": "Eau", "nameAr": "الماء" },
      "l3": { "code": "010201", "nameFr": "Eau potable", "nameAr": "مياه الشرب" }
    },
    "regionCode": "TUN-01",
    "incidentDate": "2024-01-15",
    "citizenId": "CIT-***masked***",
    "isAnonymous": false,
    "assignedAgency": {
      "id": "BRC-ENV-TUN-001",
      "nameFr": "BRC - Ministère de l'Environnement - Tunis",
      "nameAr": "مكتب العلاقات - وزارة البيئة - تونس"
    },
    "assignedOfficer": {
      "id": "USR-000042",
      "name": "Ahmed Ben Ali",
      "nameAr": "أحمد بن علي"
    },
    "submittedAt": "2024-03-01T09:30:00Z",
    "deadline": "2024-04-30T23:59:59Z",
    "daysRemaining": 18,
    "transferCount": 1,
    "hasAttachments": true,
    "attachments": [
      {
        "id": "ATT-000101",
        "filename": "att_cmp042_001.jpg",
        "originalName": "photo_robinet.jpg",
        "sizeBytes": 1240000,
        "mimeType": "image/jpeg",
        "uploadedAt": "2024-03-01T09:28:00Z"
      }
    ],
    "history": [
      {
        "id": "HIST-001",
        "action": "received",
        "actionLabelFr": "Plainte reçue",
        "actionLabelAr": "استلام الشكوى",
        "timestamp": "2024-03-01T09:30:00Z",
        "noteFr": "Dépôt en ligne",
        "noteAr": "تقديم إلكتروني"
      },
      {
        "id": "HIST-002",
        "action": "assigned",
        "actionLabelFr": "Transmise à l'agence",
        "actionLabelAr": "إحالة إلى الوكالة",
        "toAgency": {
          "id": "BRC-MUN-001",
          "nameFr": "BRC - Mairie de Tunis",
          "nameAr": "مكتب العلاقات - بلدية تونس"
        },
        "timestamp": "2024-03-01T14:00:00Z"
      },
      {
        "id": "HIST-003",
        "action": "transferred",
        "actionLabelFr": "Transférée à un autre organisme",
        "actionLabelAr": "محوّلة إلى جهة أخرى",
        "fromAgency": {
          "id": "BRC-MUN-001",
          "nameFr": "BRC - Mairie de Tunis",
          "nameAr": "مكتب العلاقات - بلدية تونس"
        },
        "toAgency": {
          "id": "BRC-ENV-TUN-001",
          "nameFr": "BRC - Ministère de l'Environnement",
          "nameAr": "مكتب العلاقات - وزارة البيئة"
        },
        "reasonFr": "Changement d'organisme compétent selon la réglementation en vigueur",
        "reasonAr": "تغيير الجهة المختصة وفق التنظيم المعمول به",
        "timestamp": "2024-03-03T10:00:00Z"
      }
    ],
    "answer": null,
    "satisfactionScore": null,
    "satisfactionDetail": null
  }
]
```

### 3.4 BRC 기관 샘플

```json
// agencies.json (73개 중 샘플)
[
  {
    "id": "BRC-ENV-TUN-001",
    "nameFr": "Bureau des Relations avec le Citoyen - Ministère de l'Environnement - Tunis",
    "nameAr": "مكتب العلاقات مع المواطن - وزارة البيئة - تونس",
    "type": "BRC",
    "parentId": "BCRC-001",
    "regionCode": "TUN",
    "isActive": true,
    "contactEmail": "brc@environnement.gov.tn",
    "slaConfig": {
      "grievance": 1440,
      "proposal": 720,
      "inquiry": 168,
      "suggestion": 720,
      "report": 360
    }
  }
]
```

---

## 4. Zustand 스토어 설계 (`src/stores/`)

### 4.1 인증 스토어 (`authStore.ts`)

```typescript
interface AuthStore {
  session: IAuthSession | null;
  isAuthenticated: boolean;
  
  // Actions
  login: (session: IAuthSession) => void;
  logout: () => void;
  updateToken: (accessToken: string, expiresAt: string) => void;
  
  // Computed (Zustand selector로 구현)
  // hasRole: (role: UserRole) => boolean
  // isBackoffice: () => boolean
}
```

### 4.2 민원 신청 폼 스토어 (`complaintFormStore.ts`)

Step Wizard의 단계 간 데이터를 유지하는 스토어.

```typescript
interface ComplaintFormData {
  // Step 1
  type: ComplaintType | null;
  
  // Step 2
  categoryL1: string;
  categoryL2: string;
  categoryL3: string;
  suggestedAgencyId: string;
  
  // Step 3
  titleFr: string;
  titleAr: string;
  contentFr: string;
  contentAr: string;
  regionCode: string;
  incidentDate: string;
  
  // Step 4
  attachmentIds: string[];
  uploadedAttachments: IAttachment[];
  
  // Step 5
  consentGiven: boolean;
}

interface ComplaintFormStore {
  currentStep: number;           // 1~5
  formData: ComplaintFormData;
  isSubmitting: boolean;
  submittedComplaintId: string | null;
  
  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateFormData: (data: Partial<ComplaintFormData>) => void;
  setSubmitting: (v: boolean) => void;
  setSubmittedId: (id: string) => void;
  reset: () => void;
}
```

### 4.3 UI 스토어 (`uiStore.ts`)

```typescript
interface UIStore {
  language: 'ar' | 'fr';
  isRTL: boolean;             // language === 'ar'일 때 true
  sidebarOpen: boolean;
  activeModal: string | null;
  
  // Actions
  setLanguage: (lang: 'ar' | 'fr') => void;
  toggleSidebar: () => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
}
```

---

## 5. 중요 설계 결정 사항 (Decision Log)

| # | 결정 | 근거 | 영향 범위 |
|---|------|------|-----------|
| D-01 | 민원·부패신고 완전 분리 | 보안 요건, BCRC/DGGPC 담당 분리 | types/, stores/, mocks/ 전체 |
| D-02 | 다국어 필드 접미사 방식 (`titleFr`/`titleAr`) | JSON 직렬화 용이, 타입 안전성 | 모든 엔티티 타입 |
| D-03 | `daysRemaining` 사전 계산 필드 제공 | 프론트에서 매번 계산 시 오류 가능성 | IComplaintSummary |
| D-04 | `transferCount`를 최상위 필드로 유지 | G-02 통제 로직을 위해 빠른 접근 필요 | IComplaint, 워크리스트 UI |
| D-05 | `categoryPath`를 단순 코드가 아닌 객체로 | 코드 조회 없이 바로 표시 가능 | 목록/상세 화면 전체 |
| D-06 | 시민 응답에서 `reporterMasked` 항상 제외 | 신고자 신원 보호 원칙 | MSW 핸들러 |
| D-07 | 모든 날짜·시간 ISO 8601 UTC | 국제 표준, 타임존 오류 방지 | 전체 |

---

*문서 버전: v1.0 | DATA_MODEL | PMC AA/DA 전문가 작성 | KOICA ODA Tunisia e-People II*
