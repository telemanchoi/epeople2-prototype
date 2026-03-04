# e-People II 상세 어플리케이션 설계서

> **프로젝트**: 튀니지 전자참여 확대 및 부패방지 시스템 고도화 (e-People II)
> **발주기관**: KOICA (한국국제협력단)
> **수원기관**: 튀니지 총리실 BCRC (Bureau Central des Relations avec le Citoyen)
> **사업기간**: 2024–2028 (총 600만 USD)
> **문서유형**: PMC 컨설팅 산출물 — 상세 어플리케이션 설계서
> **작성자**: PMC 응용시스템 설계 전문가 (Application Architecture, AA)
> **문서버전**: v1.0
> **작성일**: 2025

---

## 목차

1. [문서 개요](#1-문서-개요)
2. [시스템 아키텍처 개요](#2-시스템-아키텍처-개요)
3. [서비스별 상세 설계](#3-서비스별-상세-설계)
4. [인프라 아키텍처](#4-인프라-아키텍처)
5. [외부 시스템 연계 설계](#5-외부-시스템-연계-설계)
6. [보안 아키텍처](#6-보안-아키텍처)
7. [다국어 및 RTL 설계](#7-다국어-및-rtl-설계)
8. [성능 설계](#8-성능-설계)
9. [데이터 흐름도](#9-데이터-흐름도)
10. [배포 전략](#10-배포-전략)
11. [재해 복구 및 백업](#11-재해-복구-및-백업)
12. [부록](#12-부록)

---

## 1. 문서 개요

### 1.1 목적

본 문서는 튀니지 e-People II 시스템의 상세 어플리케이션 설계서(Detailed Application Design Document)로서, PC1(현지 시스템 개발업체)이 목표 시스템을 구현하는 데 필요한 아키텍처 설계, 서비스 분리 구조, API 설계, 데이터 모델, 인프라 구성, 보안 정책, 연계 설계 등 기술적 의사결정 사항을 포괄적으로 기술한다.

본 문서는 RFP(제안요청서)와 별도의 독립 문서이며, PC1 개발자가 상세 설계 및 구현 과정에서 참조하는 **아키텍처 레퍼런스 가이드** 역할을 수행한다.

### 1.2 대상 독자

| 독자 | 활용 목적 |
|------|-----------|
| PC1 솔루션 아키텍트 | MSA 서비스 분리, API Gateway, 인프라 설계 참조 |
| PC1 백엔드 개발자 | 서비스별 도메인 모델, API 엔드포인트, 이벤트 설계 참조 |
| PC1 프론트엔드 개발자 | API 명세, 데이터 타입, 다국어/RTL 설계 참조 |
| PC1 DBA | 데이터 모델, 테이블 설계, 인덱스 전략 참조 |
| PC1 DevOps 엔지니어 | K8s 배포, CI/CD, 모니터링 설계 참조 |
| CNI 인프라 담당자 | 네트워크, 보안, Private Cloud 설계 참조 |
| PMC 전문가 | 설계 검증, PC1 산출물 검토 기준 |
| BCRC/DGGPC 담당자 | 업무 흐름, 워크플로우 이해 |

### 1.3 문서 범위

본 문서는 다음 범위를 포함한다.

- MSA 기반 9개 마이크로서비스의 상세 설계
- API Gateway 및 서비스 간 통신 패턴
- 각 서비스의 도메인 모델, API 엔드포인트, 이벤트 구독/발행
- CNI Private Cloud 기반 인프라 아키텍처
- ELISE, Tuntrust PKI, DigiGo SSO 등 외부 시스템 연계 설계
- 보안, 성능, 다국어(RTL) 아키텍처
- 데이터 흐름도 및 워크플로우
- 배포 전략 및 재해 복구

다음 항목은 본 문서의 범위 외이다.

- 화면 UI/UX 상세 설계 (별도 UI_GUIDELINES.md 참조)
- 프로토타입 구현 코드 (별도 소스코드 참조)
- RFP 요구사항 명세 (별도 SRS.md 참조)
- 중장기 로드맵 기능 (G-15~G-20)

### 1.4 참조 문서

| 문서명 | 파일 | 설명 |
|--------|------|------|
| 기능 내역서 v2.0 | `docs/기능내역서_v2.md` | 124개 기능 전체 목록, 갭 분석 반영 |
| SRS (소프트웨어 요구사항 명세) | `docs/SRS.md` | 기능/비기능 요구사항, 화면 목록 |
| 데이터 모델 설계서 | `docs/DATA_MODEL.md` | 타입 정의, ERD, 목 데이터 설계 |
| API 명세서 | `docs/API_SPEC.md` | 전체 엔드포인트, 요청/응답 형식 |
| 갭 분석 결과서 | `docs/GAP_ANALYSIS.md` | 국민신문고 벤치마킹, G-01~G-14 |
| 기술 스택 가이드 | `docs/TECH_STACK.md` | 기술 선택 근거, 패키지 구성 |
| UI 가이드라인 | `docs/UI_GUIDELINES.md` | 디자인 시스템, 컴포넌트 명세 |

### 1.5 용어 정의

| 용어 | 영문 | 설명 |
|------|------|------|
| BCRC | Bureau Central des Relations avec le Citoyen | 중앙민원실 (총리실 산하) |
| BRC | Bureau des Relations avec le Citoyen | 지역/부처별 민원실 (73개) |
| DGGPC | Direction Generale de la Gouvernance et de la Politique de Corruption | 부패방지총국 |
| CNI | Centre National de l'Informatique | 국가정보센터 (인프라 운영) |
| ANCE/ANSE | Agence Nationale de la Securite Electronique | 전자보안청 |
| INPDP | Instance Nationale de Protection des Donnees Personnelles | 개인정보보호위원회 |
| Tuntrust | Tunisia Trust | 튀니지 공인인증기관 |
| DigiGo | Digital Government | 전자정부 통합 플랫폼 |
| ELISE | Electronic Liaison and Information Sharing Environment | 전자문서교환 시스템 |
| MSA | Micro Service Architecture | 마이크로서비스 아키텍처 |
| SLA | Service Level Agreement | 서비스 수준 협약 (처리기한) |
| BPR | Business Process Re-engineering | 업무 프로세스 재설계 |
| PKI | Public Key Infrastructure | 공개키 기반 인증 |
| SSO | Single Sign-On | 통합 인증 |
| CTI | Computer Telephony Integration | 전화-컴퓨터 통합 |

### 1.6 갭 기능 참조표

본 문서 전체에서 참조되는 갭 분석 결과(G-01~G-14)의 요약이다.

| 갭 ID | 기능명 | 우선순위 | 영향 서비스 |
|--------|--------|---------|------------|
| G-01 | 민원 유형 분류 체계 (5유형) | 높음 | Complaint, Statistics, Admin |
| G-02 | 이관 남용 통제 장치 | 높음 | Complaint, Notification, Admin |
| G-03 | 다기관 공동 처리 워크플로우 | 높음 | Complaint, Notification |
| G-04 | 처리기한 연장 신청 워크플로우 | 높음 | Complaint, Notification |
| G-05 | 국민제안 (e-Participation) 서비스 | 높음 | eParticipation |
| G-06 | 반복 민원/장기 미처리 분석 | 높음 | Statistics, Complaint |
| G-07 | 유사 민원 선례 참조/지식 베이스 | 중간 | Complaint |
| G-08 | 답변 표준 템플릿 관리 | 중간 | Complaint, Admin |
| G-09 | 담당자 부재 시 대리 처리 | 중간 | Auth, Complaint |
| G-10 | 결과 통보 수신 확인 추적 | 중간 | Notification |
| G-11 | 기관 성과 공개 평가 | 중간 | Statistics, Admin |
| G-12 | 다수인(집단) 민원 처리 | 중간 | Complaint |
| G-13 | 저사양 기기/저속망 최적화 | 중간 | 전체 (프론트엔드) |
| G-14 | 운영 매뉴얼/기술 문서 관리 | 중간 | Admin |

---

## 2. 시스템 아키텍처 개요

### 2.1 MSA 전체 구조도

e-People II는 모놀리식 레거시 시스템을 9개 마이크로서비스로 분리하여 구축한다. 각 서비스는 독립적으로 배포, 확장, 운영이 가능한 Bounded Context를 가진다.

```
                          ┌──────────────────────────────┐
                          │       Client Applications     │
                          │  Web Portal  │  Mobile App    │
                          │  (React 18)  │  (WebApp/PWA)  │
                          └──────────┬───────────────────┘
                                     │ HTTPS (TLS 1.2+)
                                     ▼
                          ┌──────────────────────────────┐
                          │      CDN / Load Balancer      │
                          │         (Nginx / HAProxy)     │
                          └──────────┬───────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API Gateway (Kong)                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │ Rate     │ │ Auth     │ │ Logging  │ │ CORS     │ │ Request  ││
│  │ Limiting │ │ Plugin   │ │ Plugin   │ │ Plugin   │ │ Transform││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘│
└───────┬──────────┬──────────┬──────────┬──────────┬──────────────┘
        │          │          │          │          │
        ▼          ▼          ▼          ▼          ▼
  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
  │  Auth    │ │Complaint │ │  Anti-   │ │  ePart-  │ │Statistics│
  │ Service  │ │ Service  │ │Corruption│ │icipation │ │ Service  │
  │          │ │          │ │ Service  │ │ Service  │ │          │
  │ JWT/PKI  │ │ 민원관리 │ │ 부패신고 │ │ 국민제안 │ │ 통계분석 │
  │ RBAC     │ │ 5유형    │ │ DGGPC    │ │ 공감투표 │ │ KPI     │
  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
  │ Document │ │Notific-  │ │ Helpdesk │ │  Admin   │
  │ Service  │ │ation     │ │ Service  │ │ Service  │
  │          │ │ Service  │ │          │ │          │
  │ EDMS/    │ │ SMS/     │ │ 1881     │ │ 코드관리 │
  │ CDMS     │ │ Email/   │ │ CTI      │ │ 사용자   │
  │          │ │ Push     │ │ Ticket   │ │ 기관관리 │
  └──────────┘ └──────────┘ └──────────┘ └──────────┘
        │          │          │          │          │
        └──────────┴──────────┴──────────┴──────────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │PostgreSQL│ │  Redis   │ │ RabbitMQ │
        │ (per-svc)│ │ (Cache)  │ │ (Events) │
        └──────────┘ └──────────┘ └──────────┘
              │
              ▼
        ┌──────────┐
        │  MinIO   │
        │ (Files)  │
        └──────────┘
```

### 2.2 서비스 분리 원칙

9개 서비스의 분리는 다음 원칙에 따라 결정되었다.

| 원칙 | 적용 내용 |
|------|-----------|
| **Bounded Context** | 각 서비스는 하나의 명확한 업무 경계를 가진다 |
| **데이터 독립성** | 서비스별 독립 데이터베이스 (Database per Service) |
| **조직 정렬** | BCRC(민원), DGGPC(부패신고), CNI(인프라)의 조직 구조와 정렬 |
| **보안 분리** | 민원 데이터와 부패신고 데이터의 완전 물리적 분리 |
| **독립 배포** | 각 서비스의 독립적 빌드, 테스트, 배포 가능 |
| **기술 다양성** | 서비스별 최적 기술 선택 가능 (Java, Node.js 등) |

### 2.3 9개 서비스 분리 구조

| # | 서비스명 | 라우팅 경로 | 담당 조직 | 데이터베이스 |
|---|----------|------------|-----------|-------------|
| 1 | Auth Service | `/api/auth/*` | BCRC/DGGPC/CNI 공통 | `auth_db` |
| 2 | Complaint Service | `/api/complaints/*` | BCRC | `complaint_db` |
| 3 | Anti-Corruption Service | `/api/reports/*` | DGGPC | `anticorruption_db` |
| 4 | eParticipation Service | `/api/proposals/*` | BCRC | `participation_db` |
| 5 | Statistics Service | `/api/statistics/*` | BCRC/DGGPC | `statistics_db` |
| 6 | Document Service | `/api/documents/*` | 공통 | `document_db` |
| 7 | Notification Service | `/api/notifications/*` | 공통 | `notification_db` |
| 8 | Helpdesk Service | `/api/helpdesk/*` | BCRC | `helpdesk_db` |
| 9 | Admin Service | `/api/admin/*` | BCRC/CNI | `admin_db` |

### 2.4 API Gateway (Kong) 설계

Kong API Gateway는 모든 클라이언트 요청의 단일 진입점(Single Entry Point)으로, 다음 기능을 수행한다.

#### 2.4.1 Kong 플러그인 구성

| 플러그인 | 목적 | 설정 |
|---------|------|------|
| **jwt** | JWT 토큰 검증 | Access Token 유효성 검증, 만료 확인 |
| **rate-limiting** | 요청 빈도 제한 | 시민: 100req/min, 공무원: 300req/min |
| **cors** | CORS 정책 | 허용 오리진: `*.epeople2.gov.tn` |
| **request-transformer** | 요청 변환 | `X-User-Id`, `X-User-Role` 헤더 주입 |
| **response-transformer** | 응답 변환 | 보안 헤더 추가 |
| **logging** | 요청 로그 | ELK Stack으로 전송 |
| **ip-restriction** | IP 제한 | Admin API는 BCRC/CNI 내부망만 허용 |
| **acl** | ACL 그룹 | 역할 기반 라우팅 접근 제어 |

#### 2.4.2 라우팅 규칙

```yaml
# Kong Declarative Configuration (kong.yml)
_format_version: "3.0"

services:
  - name: auth-service
    url: http://auth-service:8080
    routes:
      - name: auth-routes
        paths: ["/api/auth"]
        strip_path: false
    plugins:
      - name: rate-limiting
        config: { minute: 30, policy: local }  # 로그인 시도 제한

  - name: complaint-service
    url: http://complaint-service:8080
    routes:
      - name: complaint-routes
        paths: ["/api/complaints", "/api/categories", "/api/agencies"]
        strip_path: false
    plugins:
      - name: jwt
      - name: rate-limiting
        config: { minute: 100, policy: local }

  - name: anticorruption-service
    url: http://anticorruption-service:8080
    routes:
      - name: report-routes
        paths: ["/api/reports"]
        strip_path: false
    plugins:
      - name: jwt
      - name: ip-restriction  # DGGPC 전용 API 추가 IP 제한
        config:
          allow: ["10.0.0.0/8"]

  - name: participation-service
    url: http://participation-service:8080
    routes:
      - name: proposal-routes
        paths: ["/api/proposals"]
        strip_path: false
    plugins:
      - name: jwt

  - name: statistics-service
    url: http://statistics-service:8080
    routes:
      - name: statistics-routes
        paths: ["/api/statistics"]
        strip_path: false
    plugins:
      - name: jwt
      - name: rate-limiting
        config: { minute: 60, policy: local }

  - name: document-service
    url: http://document-service:8080
    routes:
      - name: document-routes
        paths: ["/api/documents", "/api/attachments"]
        strip_path: false
    plugins:
      - name: jwt

  - name: notification-service
    url: http://notification-service:8080
    routes:
      - name: notification-routes
        paths: ["/api/notifications"]
        strip_path: false
    plugins:
      - name: jwt

  - name: helpdesk-service
    url: http://helpdesk-service:8080
    routes:
      - name: helpdesk-routes
        paths: ["/api/helpdesk"]
        strip_path: false
    plugins:
      - name: jwt

  - name: admin-service
    url: http://admin-service:8080
    routes:
      - name: admin-routes
        paths: ["/api/admin"]
        strip_path: false
    plugins:
      - name: jwt
      - name: ip-restriction
        config:
          allow: ["10.0.0.0/8"]  # 내부망만 허용
```

### 2.5 서비스 간 통신 패턴

서비스 간 통신은 동기(Synchronous)와 비동기(Asynchronous) 두 가지 패턴을 사용한다.

#### 2.5.1 동기 통신 (REST API)

서비스 간 즉각적 응답이 필요한 경우 내부 REST API를 사용한다.

```
┌───────────────────────────────────────────────────────────┐
│                    동기 REST 호출 관계                      │
│                                                           │
│  Complaint ──GET /internal/auth/validate──> Auth          │
│  Complaint ──GET /internal/agencies/:id───> Admin         │
│  Anti-Corruption ──GET /internal/auth/validate──> Auth    │
│  Statistics ──GET /internal/complaints/aggregate──> Complaint │
│  Notification ──GET /internal/auth/user/:id──> Auth       │
│  Helpdesk ──GET /internal/complaints/:id──> Complaint     │
│  Document ──GET /internal/auth/validate──> Auth           │
└───────────────────────────────────────────────────────────┘
```

내부 서비스 간 REST 호출 규칙:
- 경로 접두사: `/internal/` (API Gateway에서 외부 접근 차단)
- 타임아웃: 5초 (Circuit Breaker 패턴 적용)
- 재시도: 최대 2회, 지수 백오프(Exponential Backoff)

#### 2.5.2 비동기 통신 (RabbitMQ)

이벤트 기반 비동기 통신은 RabbitMQ를 통해 처리한다.

```
┌───────────────────────────────────────────────────────────┐
│                  RabbitMQ Exchange/Queue                    │
│                                                           │
│  Exchange: epeople.events (Topic Exchange)                │
│                                                           │
│  complaint.received      ──> Notification, Statistics     │
│  complaint.assigned      ──> Notification                 │
│  complaint.transferred   ──> Notification, Statistics     │
│  complaint.completed     ──> Notification, Statistics     │
│  complaint.deadline.approaching ──> Notification          │
│  complaint.deadline.overdue     ──> Notification, Admin   │
│  complaint.transfer.limit       ──> Notification, Admin   │
│  complaint.extension.requested  ──> Notification          │
│  complaint.extension.approved   ──> Notification          │
│  complaint.joint.started        ──> Notification          │
│                                                           │
│  report.received         ──> Notification                 │
│  report.status.changed   ──> Notification                 │
│                                                           │
│  proposal.submitted      ──> Notification                 │
│  proposal.reviewed       ──> Notification, Statistics     │
│  proposal.liked          ──> Statistics                   │
│                                                           │
│  auth.login.success      ──> Statistics                   │
│  auth.login.failed       ──> Admin (감사 로그)            │
│                                                           │
│  document.uploaded       ──> (해당 서비스에 콜백)         │
│  document.verified       ──> Notification                 │
│                                                           │
│  notification.sent       ──> Statistics (G-10 추적)       │
│  notification.delivered  ──> Statistics (G-10 추적)       │
│  notification.failed     ──> Admin (재발송 관리)          │
└───────────────────────────────────────────────────────────┘
```

#### 2.5.3 이벤트 메시지 표준 형식

모든 이벤트 메시지는 다음 표준 형식을 따른다.

```typescript
interface IEventMessage {
  eventId: string;          // UUID
  eventType: string;        // 'complaint.received'
  timestamp: string;        // ISO 8601 UTC
  source: string;           // 'complaint-service'
  correlationId: string;    // 추적용 ID
  payload: Record<string, unknown>;
  metadata: {
    userId?: string;
    userRole?: string;
    agencyId?: string;
  };
}

// 예시: 민원 접수 이벤트
{
  "eventId": "evt-7f3a9b2c-4e1d-4a8f-b6c3-2d1e9f0a3b7c",
  "eventType": "complaint.received",
  "timestamp": "2024-03-01T09:30:00Z",
  "source": "complaint-service",
  "correlationId": "req-abc123",
  "payload": {
    "complaintId": "CMP-2024-000042",
    "type": "grievance",
    "citizenId": "USR-000100",
    "assignedAgencyId": "BRC-ENV-TUN-001",
    "deadline": "2024-04-30T23:59:59Z"
  },
  "metadata": {
    "userId": "USR-000100",
    "userRole": "CITIZEN"
  }
}
```

### 2.6 Service Mesh 구조

서비스 간 통신 관리를 위해 Service Mesh(Istio 또는 Linkerd)를 적용한다.

```
┌─────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                     │
│                                                         │
│  ┌──────────────────────┐  ┌──────────────────────┐    │
│  │ Complaint Pod        │  │ Auth Pod             │    │
│  │ ┌────────┐ ┌───────┐│  │ ┌────────┐ ┌───────┐│    │
│  │ │  App   │ │Sidecar││  │ │  App   │ │Sidecar││    │
│  │ │Container│ │(Envoy)││  │ │Container│ │(Envoy)││    │
│  │ └────────┘ └───┬───┘│  │ └────────┘ └───┬───┘│    │
│  └────────────────┼────┘  └────────────────┼────┘    │
│                   │ mTLS                    │          │
│                   └─────────────────────────┘          │
│                                                         │
│  Service Mesh Control Plane:                           │
│  - mTLS (서비스 간 암호화 통신)                         │
│  - Traffic Management (트래픽 라우팅/분할)              │
│  - Observability (분산 추적, 메트릭)                    │
│  - Circuit Breaker (장애 격리)                          │
│  - Retry Policy (재시도 정책)                           │
└─────────────────────────────────────────────────────────┘
```

Service Mesh 주요 정책:

| 정책 | 설정 |
|------|------|
| **mTLS** | 모든 서비스 간 통신 암호화 (STRICT 모드) |
| **Circuit Breaker** | 5xx 에러 5회 연속 시 30초 차단 |
| **Retry** | 최대 2회, 지수 백오프 (100ms → 200ms) |
| **Timeout** | 기본 5초, 파일 업로드 60초 |
| **Rate Limit** | 서비스별 내부 호출 빈도 제한 |

---

## 3. 서비스별 상세 설계

### 3.1 Auth Service (인증/권한 서비스)

#### 3.1.1 서비스 책임 범위 (Bounded Context)

Auth Service는 시스템 전체의 인증(Authentication) 및 인가(Authorization)를 담당하는 중앙 서비스이다.

**책임 범위:**
- 사용자 인증 (ID/PW, PKI, SSO, 익명 토큰)
- JWT 토큰 발급/갱신/무효화
- 역할 기반 접근 제어 (RBAC)
- 사용자 계정 관리 (생성, 수정, 비활성화)
- 세션 관리
- 대리 처리 설정 (G-09)
- 로그인 감사 로그

**책임 범위 외:**
- 민원 데이터 접근 제어 (Complaint Service 내부에서 처리)
- 부패신고 데이터 접근 제어 (Anti-Corruption Service 내부에서 처리)

#### 3.1.2 내부 계층 구조

```
auth-service/
├── src/
│   ├── controller/
│   │   ├── AuthController.java          # 로그인/로그아웃/토큰 갱신
│   │   ├── UserController.java          # 사용자 CRUD
│   │   ├── RoleController.java          # 역할 관리
│   │   └── SubstituteController.java    # 대리 처리 설정 (G-09)
│   ├── service/
│   │   ├── AuthService.java             # 인증 로직
│   │   ├── JwtTokenService.java         # JWT 생성/검증
│   │   ├── PkiAuthService.java          # Tuntrust PKI 연계
│   │   ├── SsoAuthService.java          # DigiGo SSO 연계
│   │   ├── AnonymousTokenService.java   # 익명 토큰 발급
│   │   ├── UserService.java             # 사용자 관리
│   │   └── SubstituteService.java       # 대리 처리 관리
│   ├── repository/
│   │   ├── UserRepository.java
│   │   ├── RoleRepository.java
│   │   ├── RefreshTokenRepository.java
│   │   ├── AnonymousTokenRepository.java
│   │   └── SubstituteConfigRepository.java
│   ├── domain/
│   │   ├── User.java
│   │   ├── Role.java
│   │   ├── Permission.java
│   │   ├── RefreshToken.java
│   │   ├── AnonymousToken.java
│   │   └── SubstituteConfig.java
│   ├── dto/
│   │   ├── LoginRequest.java
│   │   ├── LoginResponse.java
│   │   ├── TokenRefreshRequest.java
│   │   └── PkiCallbackRequest.java
│   ├── security/
│   │   ├── JwtFilter.java
│   │   └── SecurityConfig.java
│   └── event/
│       └── AuthEventPublisher.java      # 로그인 성공/실패 이벤트 발행
├── resources/
│   └── application.yml
└── Dockerfile
```

#### 3.1.3 주요 도메인 모델

```typescript
// 사용자 역할 (8개 역할)
type UserRole =
  | 'CITIZEN'           // 시민 — 민원 신청, 부패 신고, 국민제안
  | 'ANONYMOUS'         // 익명 신고자 — 부패 신고 전용
  | 'BRC_OFFICER'       // BRC 담당자 — 민원 처리, 답변 작성
  | 'BRC_MANAGER'       // BRC 관리자 — BRC 내 민원 감독, 이관 승인
  | 'BCRC_ADMIN'        // BCRC 관리자 — 전체 BRC 감독, 배분, 통계
  | 'DGGPC_OFFICER'     // DGGPC 담당자 — 부패 신고 처리
  | 'DGGPC_MANAGER'     // DGGPC 관리자 — 부패 신고 감독
  | 'SYS_ADMIN';        // 시스템 관리자 — 전체 시스템 설정

// 사용자 엔티티
interface IUser {
  id: string;                   // 'USR-000042'
  username: string;             // 'officer@brc.tn'
  passwordHash: string;         // BCrypt 해시 (서버 전용)
  name: string;                 // 라틴 이름
  nameAr: string;               // 아랍어 이름
  role: UserRole;
  agencyId?: string;            // FK → Agency
  isActive: boolean;
  lastLoginAt?: string;
  failedLoginCount: number;     // 5회 초과 시 잠금
  lockedUntil?: string;         // 계정 잠금 시각
  createdAt: string;
  updatedAt: string;
}

// JWT 토큰 페이로드
interface IJwtPayload {
  sub: string;                  // userId
  role: UserRole;
  agencyId?: string;
  iat: number;                  // 발급 시각
  exp: number;                  // 만료 시각 (Access: 1시간)
  jti: string;                  // 토큰 고유 ID
}

// Refresh Token 엔티티
interface IRefreshToken {
  id: string;
  userId: string;
  token: string;                // UUID
  expiresAt: string;            // 7일
  isRevoked: boolean;
  createdAt: string;
}

// 익명 토큰 엔티티 (부패 신고용)
interface IAnonymousToken {
  token: string;                // 'ANON-{UUID}'
  reportId?: string;            // 연결된 신고 ID
  expiresAt: string;            // 1년
  isUsed: boolean;
  createdAt: string;
}

// 대리 처리 설정 (G-09)
interface ISubstituteConfig {
  id: string;
  officerId: string;            // 부재 담당자
  substituteId: string;         // 대리 담당자
  startDate: string;
  endDate: string;
  reason: string;
  isActive: boolean;
  createdAt: string;
}
```

#### 3.1.4 주요 API 엔드포인트

| Method | Path | 설명 | 인증 | 역할 |
|--------|------|------|------|------|
| POST | `/api/auth/login` | ID/PW 로그인 | 불필요 | 전체 |
| POST | `/api/auth/refresh` | Access Token 갱신 | Refresh Token | 전체 |
| POST | `/api/auth/logout` | 로그아웃 (토큰 무효화) | 필요 | 전체 |
| POST | `/api/auth/pki-callback` | PKI 인증 콜백 | 불필요 | 전체 |
| POST | `/api/auth/sso-callback` | DigiGo SSO 콜백 | 불필요 | 전체 |
| POST | `/api/auth/anonymous-token` | 익명 토큰 발급 | 불필요 | 전체 |
| GET | `/api/auth/me` | 현재 사용자 정보 | 필요 | 전체 |
| PUT | `/api/auth/password` | 비밀번호 변경 | 필요 | 전체 |
| GET | `/internal/auth/validate` | 토큰 검증 (내부) | 서비스 간 | 내부 |
| GET | `/internal/auth/user/:id` | 사용자 정보 조회 (내부) | 서비스 간 | 내부 |
| POST | `/api/auth/substitute` | 대리 처리 설정 (G-09) | 필요 | BRC_OFFICER+ |

#### 3.1.5 JWT Token Flow

```
┌────────┐     ┌──────────┐     ┌──────────────┐     ┌──────────────┐
│ Client │     │  Kong    │     │ Auth Service │     │ auth_db      │
│(Browser)│     │ Gateway  │     │              │     │ (PostgreSQL) │
└───┬────┘     └────┬─────┘     └──────┬───────┘     └──────┬───────┘
    │               │                   │                     │
    │ POST /auth/login                  │                     │
    │ {username, password}              │                     │
    ├──────────────>├──────────────────>│                     │
    │               │                   │ SELECT user WHERE   │
    │               │                   │ username = ?        │
    │               │                   ├────────────────────>│
    │               │                   │    user record      │
    │               │                   │<────────────────────│
    │               │                   │                     │
    │               │                   │ Verify BCrypt hash  │
    │               │                   │                     │
    │               │                   │ Generate JWT        │
    │               │                   │ (Access: 1hr,       │
    │               │                   │  Refresh: 7d)       │
    │               │                   │                     │
    │               │                   │ Store RefreshToken  │
    │               │                   ├────────────────────>│
    │               │                   │                     │
    │  200 {accessToken, refreshToken, user}                  │
    │<──────────────│<──────────────────│                     │
    │               │                   │                     │
    │ --- 이후 API 요청 ---             │                     │
    │ GET /complaints                   │                     │
    │ Authorization: Bearer <token>     │                     │
    ├──────────────>│                   │                     │
    │               │ JWT Plugin:       │                     │
    │               │ Verify signature  │                     │
    │               │ Check expiry      │                     │
    │               │ Extract claims    │                     │
    │               │ Add X-User-Id,    │                     │
    │               │ X-User-Role       │                     │
    │               │ headers           │                     │
    │               ├──────> Complaint Service                │
    │               │                   │                     │
    │ --- Token 갱신 ---                │                     │
    │ POST /auth/refresh                │                     │
    │ {refreshToken}                    │                     │
    ├──────────────>├──────────────────>│                     │
    │               │                   │ Validate refresh    │
    │               │                   │ token               │
    │               │                   ├────────────────────>│
    │               │                   │<────────────────────│
    │               │                   │                     │
    │               │                   │ Revoke old refresh  │
    │               │                   │ Issue new pair      │
    │               │                   │                     │
    │  200 {accessToken, refreshToken}  │                     │
    │<──────────────│<──────────────────│                     │
```

#### 3.1.6 RBAC (역할 기반 접근 제어) 매트릭스

| 기능 | CITIZEN | ANON | BRC_OFF | BRC_MGR | BCRC_ADM | DGGPC_OFF | DGGPC_MGR | SYS_ADM |
|------|---------|------|---------|---------|----------|-----------|-----------|---------|
| 민원 신청 | O | X | X | X | X | X | X | X |
| 내 민원 조회 | O | X | X | X | X | X | X | X |
| 민원 워크리스트 | X | X | O | O | O | X | X | X |
| 민원 처리/답변 | X | X | O | O | X | X | X | X |
| 민원 이관 | X | X | O | O | O | X | X | X |
| 기한 연장 승인 | X | X | X | O | O | X | X | X |
| 부패 신고 접수 | O | O | X | X | X | X | X | X |
| 부패 신고 처리 | X | X | X | X | X | O | O | X |
| 국민제안 접수 | O | X | X | X | X | X | X | X |
| 국민제안 심사 | X | X | X | X | O | X | X | X |
| 통계 조회 | X | X | O | O | O | O | O | O |
| 기관 성과 평가 | X | X | X | X | O | X | X | X |
| 사용자/권한 관리 | X | X | X | X | X | X | X | O |
| 공통코드 관리 | X | X | X | X | O | X | X | O |
| 시스템 모니터링 | X | X | X | X | X | X | X | O |

#### 3.1.7 PKI (Tuntrust) 통합 Flow

```
┌────────┐     ┌──────────┐     ┌──────────────┐     ┌──────────────┐
│ Client │     │  Auth    │     │   Tuntrust   │     │   DigiGo     │
│(Browser)│     │ Service  │     │  PKI Server  │     │  SSO Server  │
└───┬────┘     └────┬─────┘     └──────┬───────┘     └──────┬───────┘
    │               │                   │                     │
    │ Click "PKI 인증" 버튼             │                     │
    ├──────────────>│                   │                     │
    │               │ Generate state,   │                     │
    │               │ PKCE code_verifier│                     │
    │               │                   │                     │
    │ 302 Redirect to Tuntrust OAuth2   │                     │
    │ /authorize?client_id=...          │                     │
    │ &redirect_uri=.../pki-callback    │                     │
    │ &state=xyz&code_challenge=...     │                     │
    │<──────────────│                   │                     │
    │               │                   │                     │
    │ ── Tuntrust 인증 화면 ──          │                     │
    │ (Mobile ID / 인증서 선택)         │                     │
    ├───────────────────────────────────>                     │
    │               │                   │                     │
    │ 302 Redirect back                 │                     │
    │ /pki-callback?code=AUTH_CODE&state=xyz                  │
    │<──────────────────────────────────│                     │
    │               │                   │                     │
    ├──────────────>│                   │                     │
    │               │ POST /token       │                     │
    │               │ {code, code_verifier}                   │
    │               ├──────────────────>│                     │
    │               │ {id_token, access_token}                │
    │               │<──────────────────│                     │
    │               │                   │                     │
    │               │ Verify id_token   │                     │
    │               │ Extract user info │                     │
    │               │ Create/Update user│                     │
    │               │ Issue JWT pair    │                     │
    │               │                   │                     │
    │ 200 {accessToken, refreshToken, user}                   │
    │<──────────────│                   │                     │
```

#### 3.1.8 이벤트 발행/구독

**발행 이벤트:**
- `auth.login.success` — 로그인 성공 (Statistics 구독)
- `auth.login.failed` — 로그인 실패 (Admin 감사 로그 구독)
- `auth.account.locked` — 계정 잠금 (Notification 구독)
- `auth.password.changed` — 비밀번호 변경 (Notification 구독)
- `auth.substitute.activated` — 대리 처리 활성화 (Complaint 구독)

**구독 이벤트:** 없음 (Auth는 이벤트 소비자가 아님)

#### 3.1.9 의존 서비스

| 의존 대상 | 통신 방식 | 목적 |
|-----------|-----------|------|
| RabbitMQ | 비동기 | 이벤트 발행 |
| Redis | 직접 | Refresh Token 저장, 세션 캐시, 로그인 시도 카운터 |
| PostgreSQL (auth_db) | 직접 | 사용자/역할/권한 데이터 |

---

### 3.2 Complaint Service (민원 관리 서비스)

#### 3.2.1 서비스 책임 범위 (Bounded Context)

Complaint Service는 시민 민원의 전체 생명주기(Lifecycle)를 관리하는 핵심 서비스이다.

**책임 범위:**
- 민원 접수 (5유형: grievance, proposal, inquiry, suggestion, report) — G-01
- 민원 상태 관리 (received → assigned → processing → completed → closed)
- 민원 분류 (대→중→소 3단계 Cascading) 및 기관 자동 배분
- 이관 처리 및 이관 남용 통제 — G-02
- 공동 처리 (다기관 협업) — G-03
- 처리기한 관리 및 연장 신청 — G-04
- 유사 민원 선례 참조/지식 베이스 — G-07
- 답변 표준 템플릿 관리 — G-08
- 다수인(집단) 민원 처리 — G-12
- 중복/유사 민원 감지 — G-12
- 만족도 평가 수집
- 처리 이력 관리

**책임 범위 외:**
- 부패 신고 (Anti-Corruption Service)
- 국민제안 (eParticipation Service)
- 파일 저장 (Document Service에 위임)
- SMS/이메일 발송 (Notification Service에 위임)

#### 3.2.2 내부 계층 구조

```
complaint-service/
├── src/
│   ├── controller/
│   │   ├── ComplaintController.java       # 민원 CRUD, 상태 변경
│   │   ├── TransferController.java        # 이관 요청/승인 (G-02)
│   │   ├── JointProcessController.java    # 공동 처리 (G-03)
│   │   ├── ExtensionController.java       # 기한 연장 (G-04)
│   │   ├── SatisfactionController.java    # 만족도 평가
│   │   ├── SimilarCaseController.java     # 유사 선례 검색 (G-07)
│   │   ├── TemplateController.java        # 답변 템플릿 (G-08)
│   │   ├── CategoryController.java        # 분류 코드 조회
│   │   └── GroupComplaintController.java  # 집단 민원 (G-12)
│   ├── service/
│   │   ├── ComplaintService.java
│   │   ├── ComplaintWorkflowService.java  # 상태 전이 로직
│   │   ├── TransferService.java           # 이관 통제 로직
│   │   ├── JointProcessService.java
│   │   ├── DeadlineService.java           # SLA 계산, 연장 처리
│   │   ├── SimilarCaseService.java        # 유사 사례 검색
│   │   ├── TemplateService.java
│   │   ├── SatisfactionService.java
│   │   ├── DuplicateDetectionService.java # 중복 감지
│   │   └── CategoryService.java
│   ├── repository/
│   │   ├── ComplaintRepository.java
│   │   ├── ComplaintHistoryRepository.java
│   │   ├── TransferRepository.java
│   │   ├── ExtensionRequestRepository.java
│   │   ├── JointProcessRepository.java
│   │   ├── SatisfactionRepository.java
│   │   ├── TemplateRepository.java
│   │   └── CategoryRepository.java
│   ├── domain/
│   │   ├── Complaint.java
│   │   ├── ComplaintHistory.java
│   │   ├── TransferRequest.java
│   │   ├── DeadlineExtensionRequest.java
│   │   ├── JointProcess.java
│   │   ├── SatisfactionScore.java
│   │   ├── AnswerTemplate.java
│   │   └── Category.java
│   ├── event/
│   │   ├── ComplaintEventPublisher.java
│   │   └── ComplaintEventSubscriber.java
│   └── scheduler/
│       └── DeadlineCheckScheduler.java    # D-Day 체크 스케줄러
```

#### 3.2.3 주요 도메인 모델

```typescript
// 민원 유형 (G-01)
type ComplaintType =
  | 'grievance'     // 고충민원 — 60일 SLA
  | 'proposal'      // 제안 — 30일 SLA
  | 'inquiry'       // 질의 — 7일 SLA
  | 'suggestion'    // 건의 — 30일 SLA
  | 'report';       // 신고 — 15일 SLA

// 민원 상태
type ComplaintStatus =
  | 'received'      // 접수됨
  | 'assigned'      // 기관 배분됨
  | 'processing'    // 처리 중
  | 'completed'     // 처리 완료
  | 'closed';       // 종결

// 민원 엔티티 (전체)
interface IComplaint {
  id: string;                       // 'CMP-2024-000042'
  type: ComplaintType;
  titleFr: string;
  titleAr: string;
  contentFr: string;
  contentAr: string;
  status: ComplaintStatus;
  categoryPath: ICategoryPath;      // 대/중/소 분류
  regionCode: string;
  incidentDate?: string;
  citizenId: string;
  isAnonymous: false;               // 민원은 항상 실명
  assignedAgency: {
    id: string;
    nameFr: string;
    nameAr: string;
  };
  assignedOfficer?: {
    id: string;
    name: string;
    nameAr: string;
  };
  submittedAt: string;
  deadline: string;                 // SLA 기반 자동 계산
  daysRemaining: number;
  transferCount: number;            // G-02 이관 통제 기준
  hasAttachments: boolean;
  attachments: IAttachment[];
  history: IComplaintHistory[];
  answer?: IComplaintAnswer;
  extensionRequest?: IDeadlineExtensionRequest;
  jointProcess?: IJointProcess;
  satisfactionDetail?: ISatisfactionScore;
}

// 이관 요청 (G-02)
interface ITransferRequest {
  id: string;                       // 'TRF-000001'
  complaintId: string;
  fromAgencyId: string;
  toAgencyId: string;
  reasonFr: string;                 // 필수, 최소 50자
  reasonAr: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  currentTransferCount: number;     // 이관 횟수 추적
}

// 기한 연장 요청 (G-04)
interface IDeadlineExtensionRequest {
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

// 공동 처리 (G-03)
interface IJointProcess {
  id: string;
  complaintId: string;
  leadAgency: { id: string; nameFr: string; nameAr: string; };
  cooperatingAgencies: Array<{
    agency: { id: string; nameFr: string; nameAr: string; };
    opinionFr?: string;
    opinionAr?: string;
    submittedAt?: string;
    status: 'pending' | 'submitted';
  }>;
  startedAt: string;
}
```

#### 3.2.4 민원 상태 전이도 (State Machine)

```
                         ┌─────────────────────────────────────────┐
                         │                                         │
                         ▼                                         │
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ received │───>│ assigned │───>│processing│───>│completed │───>│  closed  │
│ (접수)   │    │ (배분)   │    │ (처리중) │    │ (완료)   │    │ (종결)   │
└──────────┘    └──────────┘    └────┬─────┘    └────┬─────┘    └──────────┘
                     │               │               │
                     │               │               │ 이의신청
                     │               │               │ (reopened)
                     │               │               └──────> processing
                     │               │
                     │               ├── 이관(transferred)
                     │               │   → assigned (다른 기관)
                     │               │
                     │               ├── 기한 연장(deadline_extended)
                     │               │   → processing (기한 갱신)
                     │               │
                     │               └── 공동처리 시작(joint_process_started)
                     │                   → processing (주관기관 유지)
                     │
                     └── 자동 배분 규칙에 의해
                         분류 코드 → 담당 BRC 자동 결정
```

#### 3.2.5 이관 남용 통제 로직 (G-02)

```
이관 요청 수신
    │
    ├── transferCount < 2
    │   └── 정상 이관 처리
    │       - 이관 사유 기록 (최소 50자)
    │       - 이관 이력 추가
    │       - transferCount + 1
    │       - 이벤트 발행: complaint.transferred
    │
    ├── transferCount == 2
    │   └── 경고 부여 후 이관 처리
    │       - 주황색 경고 아이콘 표시
    │       - 이관 사유 기록 (최소 100자 강화)
    │       - BCRC 관리자에게 알림 발송
    │       - 이벤트 발행: complaint.transfer.limit (warning)
    │
    └── transferCount >= 3
        └── BCRC 자동 보고 + 이관 처리
            - 빨간색 배지 + "BCRC 보고 필요" 표시
            - BCRC 관리자에게 긴급 알림 발송
            - BCRC 대시보드 "이관 다발 민원" 목록에 자동 등록
            - 이벤트 발행: complaint.transfer.limit (critical)
            - 이관은 처리하되 BCRC 개입 트리거
```

#### 3.2.6 주요 API 엔드포인트

| Method | Path | 설명 | 역할 |
|--------|------|------|------|
| GET | `/api/complaints` | 민원 목록 조회 (역할별 범위) | CITIZEN, BRC_OFFICER+ |
| POST | `/api/complaints` | 민원 신청 | CITIZEN |
| GET | `/api/complaints/:id` | 민원 상세 조회 | CITIZEN(본인), BRC_OFFICER+ |
| PATCH | `/api/complaints/:id/status` | 민원 상태 변경 | BRC_OFFICER+ |
| POST | `/api/complaints/:id/transfer` | 이관 요청 (G-02) | BRC_OFFICER+ |
| POST | `/api/complaints/:id/extend-deadline` | 기한 연장 신청 (G-04) | BRC_OFFICER |
| PATCH | `/api/complaints/:id/extension/:extId` | 연장 승인/거부 | BRC_MANAGER+ |
| POST | `/api/complaints/:id/joint-process` | 공동 처리 시작 (G-03) | BRC_MANAGER+ |
| POST | `/api/complaints/:id/satisfaction` | 만족도 평가 | CITIZEN |
| GET | `/api/complaints/duplicate-check` | 중복 민원 확인 (G-12) | CITIZEN |
| GET | `/api/complaints/similar` | 유사 선례 검색 (G-07) | BRC_OFFICER+ |
| GET | `/api/categories` | 분류 코드 트리 조회 | 전체 |
| GET | `/api/categories/:code/agencies` | 분류별 담당 기관 추천 | 전체 |
| GET | `/api/complaints/templates` | 답변 템플릿 목록 (G-08) | BRC_OFFICER+ |

#### 3.2.7 이벤트 발행/구독

**발행 이벤트:**
- `complaint.received` — 민원 접수 (Notification, Statistics 구독)
- `complaint.assigned` — 기관 배분 (Notification 구독)
- `complaint.transferred` — 이관 처리 (Notification, Statistics 구독)
- `complaint.completed` — 처리 완료 (Notification, Statistics 구독)
- `complaint.closed` — 종결 (Statistics 구독)
- `complaint.deadline.approaching` — 기한 임박 D-3, D-1 (Notification 구독)
- `complaint.deadline.overdue` — 기한 초과 (Notification, Admin 구독)
- `complaint.transfer.limit` — 이관 횟수 경고/초과 (Notification, Admin 구독)
- `complaint.extension.requested` — 연장 신청 (Notification 구독)
- `complaint.extension.approved` — 연장 승인 (Notification 구독)
- `complaint.extension.rejected` — 연장 거부 (Notification 구독)
- `complaint.joint.started` — 공동처리 시작 (Notification 구독)
- `complaint.satisfaction.submitted` — 만족도 제출 (Statistics 구독)

**구독 이벤트:**
- `auth.substitute.activated` — 대리 처리 활성화 시 민원 재배분

#### 3.2.8 의존 서비스

| 의존 대상 | 통신 방식 | 목적 |
|-----------|-----------|------|
| Auth Service | 동기 REST | 토큰 검증, 사용자 정보 조회 |
| Admin Service | 동기 REST | 기관 정보, SLA 설정 조회 |
| Document Service | 동기 REST | 첨부파일 등록/조회 |
| Notification Service | 비동기 MQ | 민원 상태 변경 알림 요청 |
| Statistics Service | 비동기 MQ | 통계 데이터 갱신 요청 |
| RabbitMQ | 비동기 | 이벤트 발행/구독 |
| Redis | 직접 | 민원 목록 캐시, 분류 코드 캐시 |
| PostgreSQL (complaint_db) | 직접 | 민원 데이터 |

---

### 3.3 Anti-Corruption Service (부패 신고 서비스)

#### 3.3.1 서비스 책임 범위 (Bounded Context)

Anti-Corruption Service는 부패 신고의 접수, 조사, 처리를 전담하는 서비스이다. **민원(Complaint) 서비스와 완전히 분리된 독립 서비스**로 설계한다.

**분리 근거:**
- 담당 조직이 다름: BCRC(민원) vs DGGPC(부패신고)
- 보안 등급이 다름: 일반(민원) vs 기밀(부패신고)
- 접근 권한이 다름: 민원 담당자가 부패신고 데이터에 접근 불가
- 신고자 신원 보호가 최우선: 시스템 아키텍처 레벨에서 격리

**책임 범위:**
- 실명/익명 부패 신고 접수
- 익명 토큰 기반 신고 추적
- 조사 워크플로우 (received → preliminary_review → under_investigation → completed/dismissed)
- 신고자 신원 보호 (데이터 접근 통제)
- 증거 문서 관리 (Document Service 연계)
- DGGPC/거버넌스팀 전용 관리 기능
- 부패 유형별 분석

#### 3.3.2 내부 계층 구조

```
anticorruption-service/
├── src/
│   ├── controller/
│   │   ├── ReportController.java          # 신고 접수/조회
│   │   ├── ReportTrackingController.java  # 익명 추적 조회
│   │   ├── InvestigationController.java   # 조사 처리 (DGGPC)
│   │   └── GovernanceTeamController.java  # 거버넌스팀 관리
│   ├── service/
│   │   ├── ReportService.java
│   │   ├── InvestigationWorkflowService.java
│   │   ├── AnonymousTrackingService.java
│   │   ├── ReporterProtectionService.java # 신고자 신원 보호
│   │   └── GovernanceTeamService.java
│   ├── repository/
│   │   ├── CorruptionReportRepository.java
│   │   ├── ReportHistoryRepository.java
│   │   └── GovernanceTeamRepository.java
│   ├── domain/
│   │   ├── CorruptionReport.java
│   │   ├── ReportHistory.java
│   │   └── GovernanceTeam.java
│   ├── security/
│   │   └── DggpcAccessFilter.java        # DGGPC 전용 접근 필터
│   └── event/
│       └── ReportEventPublisher.java
```

#### 3.3.3 주요 도메인 모델

```typescript
// 부패 신고 유형
type CorruptionReportType =
  | 'bribery'           // 뇌물
  | 'embezzlement'      // 횡령
  | 'abuse_of_power'    // 직권 남용
  | 'nepotism'          // 연고주의
  | 'other';            // 기타

// 부패 신고 상태
type CorruptionReportStatus =
  | 'received'           // 접수
  | 'preliminary_review' // 예비 검토
  | 'under_investigation'// 정식 조사 중
  | 'completed'          // 처리 완료
  | 'dismissed';         // 각하

// 부패 신고 엔티티
interface ICorruptionReport {
  id: string;                    // 'RPT-2024-000018'
  type: CorruptionReportType;
  status: CorruptionReportStatus;
  targetAgency: {
    id: string;
    nameFr: string;
    nameAr: string;
  };
  isAnonymous: boolean;
  anonymousToken?: string;       // 익명 토큰 (조회용)
  trackingCode: string;          // 추적 코드
  reporterMasked?: string;       // '***@***.tn' 마스킹
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
  submittedAt: string;
}
```

#### 3.3.4 익명 신고 및 추적 Flow

```
┌────────┐     ┌──────────┐     ┌──────────────┐     ┌──────────────┐
│ 시민   │     │  Auth    │     │Anti-Corrupt. │     │  anticorr_db │
│(Browser)│     │ Service  │     │   Service    │     │ (PostgreSQL) │
└───┬────┘     └────┬─────┘     └──────┬───────┘     └──────┬───────┘
    │               │                   │                     │
    │ === 익명 토큰 발급 ===            │                     │
    │ POST /auth/anonymous-token        │                     │
    ├──────────────>│                   │                     │
    │               │ Generate UUID     │                     │
    │               │ token             │                     │
    │ {token: "ANON-7f3a...",           │                     │
    │  notice: "보관하세요"}            │                     │
    │<──────────────│                   │                     │
    │               │                   │                     │
    │ === 익명 신고 접수 ===            │                     │
    │ POST /reports                     │                     │
    │ {type: "bribery",                 │                     │
    │  isAnonymous: true,               │                     │
    │  anonymousToken: "ANON-7f3a...",  │                     │
    │  content: "...",                  │                     │
    │  attachmentIds: [...]}            │                     │
    ├───────────────────────────────────>│                     │
    │               │                   │ INSERT report       │
    │               │                   │ (신고자 ID 저장 안함)│
    │               │                   ├────────────────────>│
    │               │                   │                     │
    │ {reportId: "RPT-2024-000018",     │                     │
    │  trackingCode: "TRACK-8f3b2a1c",  │                     │
    │  message: "보관하세요"}           │                     │
    │<──────────────────────────────────│                     │
    │               │                   │                     │
    │ === 추후 추적 조회 ===            │                     │
    │ GET /reports/track                │                     │
    │   ?token=ANON-7f3a...             │                     │
    ├───────────────────────────────────>│                     │
    │               │                   │ SELECT WHERE        │
    │               │                   │ anonymous_token = ? │
    │               │                   ├────────────────────>│
    │               │                   │<────────────────────│
    │               │                   │                     │
    │ {status: "under_investigation",   │                     │
    │  statusMessage: "조사 중입니다"}  │                     │
    │<──────────────────────────────────│                     │
```

#### 3.3.5 데이터 접근 통제

| 데이터 필드 | CITIZEN | ANON (본인) | DGGPC_OFF | DGGPC_MGR | 기타 역할 |
|------------|---------|------------|-----------|-----------|----------|
| reportId | X | O (토큰) | O | O | X |
| status | X | O (토큰) | O | O | X |
| content | X | X | O | O | X |
| reporterInfo | X | X | X | O (승인 시) | X |
| attachments | X | X | O | O | X |
| investigationNotes | X | X | O | O | X |

#### 3.3.6 주요 API 엔드포인트

| Method | Path | 설명 | 역할 |
|--------|------|------|------|
| POST | `/api/reports` | 부패 신고 접수 | CITIZEN, ANONYMOUS |
| GET | `/api/reports/track` | 익명 추적 조회 (토큰) | ANONYMOUS |
| GET | `/api/reports` | 신고 목록 (DGGPC 전용) | DGGPC_OFFICER+ |
| GET | `/api/reports/:id` | 신고 상세 (DGGPC 전용) | DGGPC_OFFICER+ |
| PATCH | `/api/reports/:id/status` | 상태 변경 (DGGPC) | DGGPC_OFFICER+ |

#### 3.3.7 이벤트 발행/구독

**발행 이벤트:**
- `report.received` — 신고 접수 (Notification 구독)
- `report.status.changed` — 상태 변경 (Notification 구독)
- `report.completed` — 처리 완료 (Notification, Statistics 구독)

**구독 이벤트:** 없음

#### 3.3.8 의존 서비스

| 의존 대상 | 통신 방식 | 목적 |
|-----------|-----------|------|
| Auth Service | 동기 REST | 토큰 검증, 익명 토큰 검증 |
| Document Service | 동기 REST | 증거 문서 등록/조회 |
| Notification Service | 비동기 MQ | 상태 변경 알림 |
| PostgreSQL (anticorruption_db) | 직접 | 부패신고 데이터 (완전 분리) |

---

### 3.4 eParticipation Service (국민제안 서비스, G-05)

#### 3.4.1 서비스 책임 범위 (Bounded Context)

eParticipation Service는 사업 명칭 "전자참여(e-Participation) 확대"의 핵심 기능인 국민제안 서비스를 전담한다. 단순 민원 처리를 넘어 시민-정부 간 쌍방향 소통 채널을 구현한다.

**책임 범위:**
- 정책 제안 접수 및 관리
- 제안 공개 게시판 운영
- 공감(좋아요) 시스템
- 제안 심사 워크플로우 (pending → under_review → accepted/rejected → implemented)
- 채택 제안 이행 현황 추적 및 공개
- 제안 카테고리 관리

#### 3.4.2 내부 계층 구조

```
participation-service/
├── src/
│   ├── controller/
│   │   ├── ProposalController.java        # 제안 CRUD
│   │   ├── ProposalLikeController.java    # 공감 토글
│   │   ├── ProposalReviewController.java  # 심사 결과 등록
│   │   └── ImplementationController.java  # 이행 현황 업데이트
│   ├── service/
│   │   ├── ProposalService.java
│   │   ├── ProposalLikeService.java
│   │   ├── ProposalReviewService.java
│   │   └── ImplementationTrackingService.java
│   ├── repository/
│   │   ├── ProposalRepository.java
│   │   ├── ProposalLikeRepository.java
│   │   ├── ProposalReviewRepository.java
│   │   └── ImplementationUpdateRepository.java
│   ├── domain/
│   │   ├── Proposal.java
│   │   ├── ProposalLike.java
│   │   ├── ProposalReview.java
│   │   └── ImplementationUpdate.java
│   └── event/
│       └── ProposalEventPublisher.java
```

#### 3.4.3 주요 도메인 모델

```typescript
// 제안 상태
type ProposalStatus =
  | 'pending'        // 검토 대기
  | 'under_review'   // 검토 중
  | 'accepted'       // 채택
  | 'rejected'       // 미채택
  | 'implemented';   // 이행 완료

// 국민제안 엔티티
interface IProposal {
  id: string;                    // 'PRP-2024-000005'
  titleFr: string;
  titleAr: string;
  contentFr: string;
  contentAr: string;
  status: ProposalStatus;
  categoryPath: ICategoryPath;
  assignedAgency?: {
    id: string;
    nameFr: string;
    nameAr: string;
  };
  citizenId: string;
  likeCount: number;
  isLikedByMe: boolean;          // 현재 로그인 사용자 공감 여부
  attachments: IAttachment[];
  review?: IProposalReview;
  implementationUpdates: IImplementationUpdate[];
  submittedAt: string;
}

// 심사 결과
interface IProposalReview {
  result: 'accepted' | 'rejected';
  reviewCommentFr: string;
  reviewCommentAr: string;
  reviewedAt: string;
  reviewedBy: string;
  implementationPlanFr?: string;
  implementationPlanAr?: string;
}

// 이행 현황 업데이트
interface IImplementationUpdate {
  id: string;
  contentFr: string;
  contentAr: string;
  progress: number;               // 0~100 (%)
  updatedAt: string;
}
```

#### 3.4.4 주요 API 엔드포인트

| Method | Path | 설명 | 역할 |
|--------|------|------|------|
| GET | `/api/proposals` | 제안 목록 (공개) | 전체 |
| POST | `/api/proposals` | 제안 작성 | CITIZEN |
| GET | `/api/proposals/:id` | 제안 상세 | 전체 |
| POST | `/api/proposals/:id/like` | 공감 토글 | CITIZEN |
| PATCH | `/api/proposals/:id/review` | 심사 결과 등록 | BCRC_ADMIN |
| POST | `/api/proposals/:id/implementation` | 이행 현황 업데이트 | BCRC_ADMIN |

#### 3.4.5 공감 시스템 설계

```
공감 토글 요청 (POST /proposals/:id/like)
    │
    ├── Redis에서 사용자 공감 여부 확인
    │   Key: "proposal:{id}:likes:{userId}"
    │
    ├── 이미 공감한 경우
    │   └── 공감 취소: likeCount - 1, Redis 키 삭제
    │
    └── 공감하지 않은 경우
        └── 공감 등록: likeCount + 1, Redis 키 설정
            └── 이벤트 발행: proposal.liked (Statistics 집계용)

공감 수 기준 우선 심사:
    - likeCount >= 100: 우선 심사 대상 자동 분류
    - BCRC 대시보드에 "인기 제안 TOP 10" 표시
```

#### 3.4.6 이벤트 발행/구독

**발행 이벤트:**
- `proposal.submitted` — 제안 접수 (Notification 구독)
- `proposal.reviewed` — 심사 결과 등록 (Notification, Statistics 구독)
- `proposal.liked` — 공감 (Statistics 구독)
- `proposal.implementation.updated` — 이행 현황 갱신 (Notification 구독)

**구독 이벤트:** 없음

#### 3.4.7 의존 서비스

| 의존 대상 | 통신 방식 | 목적 |
|-----------|-----------|------|
| Auth Service | 동기 REST | 토큰 검증, 로그인 확인 |
| Document Service | 동기 REST | 첨부파일 등록/조회 |
| Notification Service | 비동기 MQ | 심사 결과 알림 |
| Redis | 직접 | 공감 데이터 캐시 |
| PostgreSQL (participation_db) | 직접 | 제안 데이터 |

---

### 3.5 Statistics Service (통계/분석 서비스)

#### 3.5.1 서비스 책임 범위 (Bounded Context)

Statistics Service는 시스템 전체의 통계 집계, KPI 산출, 트렌드 분석, 보고서 생성을 담당한다.

**책임 범위:**
- 대시보드 KPI 실시간 집계 (접수, 완료, 처리율, 만족도 등)
- 기간별 추이 분석 (일별/주별/월별)
- 민원 유형별 분포 분석
- 기관별 성과 분석 및 순위 (G-11)
- 반복 민원 패턴 분석 (G-06)
- 장기 미처리 민원 분석 (G-06)
- 지역별 분포 분석
- 보고서 생성 (Excel/PDF 내보내기)
- 부패 신고 통계 (DGGPC 전용, 민원 통계와 분리 접근)

#### 3.5.2 내부 계층 구조

```
statistics-service/
├── src/
│   ├── controller/
│   │   ├── OverviewController.java        # KPI 요약
│   │   ├── TrendController.java           # 추이 분석
│   │   ├── TypeDistributionController.java # 유형별 분포
│   │   ├── AgencyPerformanceController.java # 기관 성과 (G-11)
│   │   ├── RepeatedComplaintController.java # 반복 민원 (G-06)
│   │   ├── LongOverdueController.java      # 장기 미처리 (G-06)
│   │   ├── RegionController.java           # 지역별 분포
│   │   └── ReportController.java           # 보고서 생성
│   ├── service/
│   │   ├── StatisticsAggregationService.java
│   │   ├── TrendAnalysisService.java
│   │   ├── AgencyPerformanceService.java
│   │   ├── RepeatedComplaintService.java
│   │   ├── LongOverdueService.java
│   │   ├── ReportGenerationService.java   # Excel/PDF 생성
│   │   └── CorruptionStatisticsService.java # DGGPC 전용
│   ├── repository/
│   │   ├── StatisticsSnapshotRepository.java
│   │   └── AgencyPerformanceRepository.java
│   ├── domain/
│   │   ├── StatisticsSnapshot.java        # 집계 스냅샷
│   │   └── AgencyPerformance.java
│   ├── event/
│   │   └── StatisticsEventSubscriber.java # 이벤트 수신하여 집계
│   └── scheduler/
│       ├── DailyAggregationScheduler.java  # 일별 집계
│       └── MonthlyReportScheduler.java     # 월별 리포트
```

#### 3.5.3 주요 도메인 모델

```typescript
// 대시보드 KPI 요약
interface IStatisticsOverview {
  totalReceived: number;
  totalCompleted: number;
  completionRate: number;          // 백분율 (0~100)
  avgProcessingDays: number;
  overdueCount: number;
  avgSatisfactionScore: number;    // 1~5
  changeVsLastPeriod: {
    received: number;              // % 변화
    completionRate: number;
  };
}

// 기간별 추이 데이터포인트
interface ITrendDataPoint {
  period: string;                  // '2024-03' or '2024-03-01'
  received: number;
  completed: number;
  overdue: number;
}

// 유형별 분포
interface ITypeDistribution {
  type: ComplaintType;
  count: number;
  percentage: number;
  avgProcessingDays: number;
}

// 기관별 성과 (G-11)
interface IAgencyPerformance {
  agency: { id: string; nameFr: string; nameAr: string; };
  received: number;
  completed: number;
  completionRate: number;          // 80% 미만 시 빨간색 강조
  avgProcessingDays: number;
  slaComplianceRate: number;
  satisfactionScore: number;
  transferCount: number;
  overdueCount: number;
}

// 반복 민원 레코드 (G-06)
interface IRepeatedComplaintRecord {
  citizenId: string;               // 마스킹 '***masked***'
  repeatCount: number;             // 3회 이상
  categories: string[];
  lastComplaintAt: string;
  totalUnresolved: number;
}

// 장기 미처리 민원 (G-06)
interface ILongOverdueComplaint {
  complaintId: string;
  type: ComplaintType;
  titleFr: string;
  daysOverdue: number;             // 30일+, 60일+
  assignedAgency: { id: string; nameFr: string; nameAr: string; };
  assignedOfficer?: { name: string; };
}
```

#### 3.5.4 반복 민원 분석 로직 (G-06)

```
일별 집계 스케줄러 (매일 02:00 UTC):
    │
    ├── 1. 시민별 민원 접수 횟수 집계
    │   SELECT citizen_id, COUNT(*) as cnt
    │   FROM complaints
    │   WHERE submitted_at >= (NOW() - INTERVAL '12 months')
    │   GROUP BY citizen_id
    │   HAVING COUNT(*) >= 3
    │
    ├── 2. 반복 민원 TOP 10 갱신
    │   - citizenId 마스킹 처리
    │   - 주요 카테고리 집계
    │   - 미해결 건수 산출
    │
    └── 3. 장기 미처리 민원 목록 갱신
        SELECT id, type, title_fr,
               EXTRACT(DAY FROM NOW() - deadline) as days_overdue
        FROM complaints
        WHERE status IN ('processing', 'assigned')
          AND deadline < NOW()
        ORDER BY days_overdue DESC
```

#### 3.5.5 주요 API 엔드포인트

| Method | Path | 설명 | 역할 |
|--------|------|------|------|
| GET | `/api/statistics/overview` | KPI 요약 | BRC_OFFICER+ |
| GET | `/api/statistics/trend` | 기간별 추이 | BRC_OFFICER+ |
| GET | `/api/statistics/by-type` | 유형별 분포 | BRC_OFFICER+ |
| GET | `/api/statistics/by-agency` | 기관별 성과 (G-11) | BCRC_ADMIN |
| GET | `/api/statistics/repeated-complaints` | 반복 민원 분석 (G-06) | BCRC_ADMIN |
| GET | `/api/statistics/long-overdue` | 장기 미처리 (G-06) | BRC_MANAGER+ |
| GET | `/api/statistics/by-region` | 지역별 분포 | BCRC_ADMIN |
| GET | `/api/statistics/satisfaction` | 만족도 분석 | BRC_MANAGER+ |
| GET | `/api/statistics/export` | 보고서 내보내기 (Excel/PDF) | BRC_MANAGER+ |

#### 3.5.6 이벤트 발행/구독

**발행 이벤트:** 없음 (Statistics는 순수 소비자)

**구독 이벤트:**
- `complaint.received` — 접수 건수 증가
- `complaint.completed` — 완료 건수 증가
- `complaint.transferred` — 이관 건수 증가
- `complaint.closed` — 종결 건수 증가
- `complaint.satisfaction.submitted` — 만족도 점수 갱신
- `report.completed` — 부패 신고 완료 건수
- `proposal.reviewed` — 제안 심사 완료 건수
- `proposal.liked` — 공감 수 집계
- `auth.login.success` — 사용자 접속 통계

#### 3.5.7 의존 서비스

| 의존 대상 | 통신 방식 | 목적 |
|-----------|-----------|------|
| Complaint Service | 동기 REST | 집계 원본 데이터 조회 |
| Auth Service | 동기 REST | 토큰 검증 |
| RabbitMQ | 비동기 | 이벤트 수신 |
| Redis | 직접 | KPI 캐시 (TTL: 5분) |
| PostgreSQL (statistics_db) | 직접 | 집계 스냅샷 저장 |

---

### 3.6 Document Service (문서 관리 서비스, EDMS/CDMS)

#### 3.6.1 서비스 책임 범위 (Bounded Context)

Document Service는 시스템 전체의 전자문서(EDMS) 및 통제문서(CDMS) 관리를 전담한다.

**책임 범위:**
- 문서 등록, 분류, 버전 관리
- 파일 업로드/다운로드 (MinIO 연계)
- 문서 생명주기 관리 (draft → active → archived → disposed)
- 문서 접근 제어 (조회/다운로드/인쇄 권한)
- 문서 무결성 검증 (SHA-256 해시)
- 워터마크 적용 (다운로드/인쇄 시)
- 배포 이력 관리 (누가, 언제, 어디에 배포했는지 추적)
- 첨부파일 관리 (민원/신고/제안 첨부파일)

#### 3.6.2 내부 계층 구조

```
document-service/
├── src/
│   ├── controller/
│   │   ├── AttachmentController.java      # 파일 업로드/다운로드
│   │   ├── DocumentController.java        # 문서 CRUD
│   │   ├── VersionController.java         # 버전 관리
│   │   └── DistributionController.java    # 배포 이력
│   ├── service/
│   │   ├── FileStorageService.java        # MinIO 연계
│   │   ├── DocumentService.java
│   │   ├── VersioningService.java
│   │   ├── IntegrityService.java          # SHA-256 해시 검증
│   │   ├── WatermarkService.java          # 워터마크 적용
│   │   ├── AccessControlService.java      # 문서 접근 제어
│   │   └── LifecycleService.java          # 생명주기 관리
│   ├── repository/
│   │   ├── DocumentRepository.java
│   │   ├── DocumentVersionRepository.java
│   │   ├── DistributionLogRepository.java
│   │   └── AttachmentRepository.java
│   ├── domain/
│   │   ├── Document.java
│   │   ├── DocumentVersion.java
│   │   ├── Attachment.java
│   │   └── DistributionLog.java
│   └── storage/
│       └── MinioClient.java               # MinIO SDK 연계
```

#### 3.6.3 주요 도메인 모델

```typescript
// 문서 생명주기 상태
type DocumentLifecycle = 'draft' | 'active' | 'archived' | 'disposed';

// 문서 접근 권한
interface IDocumentPermission {
  canView: boolean;
  canDownload: boolean;
  canPrint: boolean;
  canEdit: boolean;
}

// 첨부파일 엔티티
interface IAttachment {
  id: string;              // 'ATT-000001'
  filename: string;        // 서버 저장 파일명 (UUID 기반)
  originalName: string;    // 사용자 업로드 원본 파일명
  sizeBytes: number;
  mimeType: string;
  sha256Hash: string;      // 무결성 검증용
  storagePath: string;     // MinIO bucket/path
  uploadedAt: string;
  uploadedBy: string;
}

// 문서 엔티티 (EDMS)
interface IDocument {
  id: string;
  titleFr: string;
  titleAr: string;
  type: string;            // 문서 유형 코드
  lifecycle: DocumentLifecycle;
  currentVersion: number;
  classification: 'public' | 'internal' | 'confidential' | 'secret';
  relatedEntityId?: string; // 연관 민원/신고 ID
  relatedEntityType?: 'complaint' | 'report' | 'proposal';
  createdAt: string;
  createdBy: string;
  retentionPeriod: number; // 보존 기간 (일)
  disposalDate?: string;
}
```

#### 3.6.4 파일 업로드/다운로드 Flow

```
업로드 Flow:
    Client → POST /api/attachments/upload (multipart/form-data)
        → Document Service
            1. 파일 크기 검증 (max 10MB)
            2. MIME 타입 검증 (허용: jpg, png, pdf, doc, docx, xls, xlsx)
            3. 바이러스 스캔 (ClamAV 연계)
            4. SHA-256 해시 생성
            5. MinIO에 파일 저장 (bucket: epeople-attachments)
            6. 메타데이터 DB 저장
        ← 201 {id, filename, sizeBytes, mimeType}

다운로드 Flow:
    Client → GET /api/attachments/:id/download
        → Document Service
            1. 접근 권한 확인 (역할 + 문서 분류 기반)
            2. MinIO에서 파일 읽기
            3. 민감 문서인 경우 워터마크 적용
            4. 다운로드 이력 기록 (배포 로그)
        ← 200 (file stream)
```

#### 3.6.5 주요 API 엔드포인트

| Method | Path | 설명 | 역할 |
|--------|------|------|------|
| POST | `/api/attachments/upload` | 파일 업로드 | CITIZEN+ |
| GET | `/api/attachments/:id` | 파일 메타데이터 조회 | 권한 기반 |
| GET | `/api/attachments/:id/download` | 파일 다운로드 | 권한 기반 |
| GET | `/api/documents` | 문서 목록 조회 | BRC_OFFICER+ |
| POST | `/api/documents` | 문서 등록 | BRC_OFFICER+ |
| GET | `/api/documents/:id/versions` | 버전 이력 | BRC_OFFICER+ |
| POST | `/api/documents/:id/verify` | 무결성 검증 | BRC_OFFICER+ |

#### 3.6.6 이벤트 발행/구독

**발행 이벤트:**
- `document.uploaded` — 문서 업로드 완료
- `document.verified` — 무결성 검증 완료/실패

**구독 이벤트:** 없음

#### 3.6.7 의존 서비스

| 의존 대상 | 통신 방식 | 목적 |
|-----------|-----------|------|
| Auth Service | 동기 REST | 토큰 검증, 접근 권한 확인 |
| MinIO | 직접 (S3 API) | 파일 저장/조회 |
| PostgreSQL (document_db) | 직접 | 문서 메타데이터 |

---

### 3.7 Notification Service (알림 서비스)

#### 3.7.1 서비스 책임 범위 (Bounded Context)

Notification Service는 이벤트 기반으로 동작하며, 다른 서비스에서 발행한 이벤트를 수신하여 적절한 채널(SMS, Email, In-app Push, Web Push)로 알림을 발송한다.

**책임 범위:**
- 다채널 알림 발송 (SMS, Email, In-app, Web Push)
- 이벤트 수신 및 알림 변환
- 다국어 알림 템플릿 관리 (아랍어/프랑스어)
- 발송 이력 관리
- 수신 확인 추적 (G-10)
- 미수신 시 재발송 자동 처리
- 사용자별 알림 수신 설정 관리

#### 3.7.2 내부 계층 구조

```
notification-service/
├── src/
│   ├── controller/
│   │   ├── NotificationController.java    # 알림 목록/읽음 처리
│   │   ├── PreferenceController.java      # 수신 설정 관리
│   │   └── DeliveryTrackingController.java # 수신 확인 (G-10)
│   ├── service/
│   │   ├── NotificationService.java
│   │   ├── SmsGatewayService.java         # SMS 발송 연계
│   │   ├── EmailService.java              # SMTP 이메일 발송
│   │   ├── PushNotificationService.java   # Web Push
│   │   ├── InAppNotificationService.java  # 시스템 내 알림
│   │   ├── TemplateService.java           # 알림 템플릿 관리
│   │   ├── DeliveryTrackingService.java   # 도달 추적 (G-10)
│   │   └── RetryService.java             # 실패 재발송
│   ├── event/
│   │   └── NotificationEventSubscriber.java  # 이벤트 수신
│   ├── channel/
│   │   ├── SmsChannel.java
│   │   ├── EmailChannel.java
│   │   ├── WebPushChannel.java
│   │   └── InAppChannel.java
│   └── scheduler/
│       └── RetryScheduler.java            # 실패 건 재발송
```

#### 3.7.3 알림 유형 및 채널 매핑

| 알림 유형 | 소스 이벤트 | SMS | Email | In-App | 대상 |
|-----------|-----------|-----|-------|--------|------|
| `deadline_approaching` (D-3) | complaint.deadline.approaching | X | O | O | BRC 담당자 |
| `deadline_approaching` (D-1) | complaint.deadline.approaching | O | O | O | BRC 담당자 |
| `deadline_overdue` | complaint.deadline.overdue | O | O | O | BRC 담당자, 관리자 |
| `new_complaint_assigned` | complaint.assigned | X | O | O | BRC 담당자 |
| `transfer_requested` | complaint.transferred | X | O | O | 이관 대상 기관 |
| `transfer_limit_warning` | complaint.transfer.limit | X | O | O | BCRC 관리자 |
| `extension_approved` | complaint.extension.approved | O | O | O | BRC 담당자, 시민 |
| `extension_rejected` | complaint.extension.rejected | X | O | O | BRC 담당자 |
| `complaint_completed` | complaint.completed | O | O | O | 시민 |
| `joint_process_request` | complaint.joint.started | X | O | O | 협조 기관 |
| `proposal_reviewed` | proposal.reviewed | O | O | O | 시민 (제안자) |
| `report_status_changed` | report.status.changed | X | O* | O* | 신고자 (*익명은 X) |

#### 3.7.4 수신 확인 추적 (G-10)

```
알림 발송 Flow:
    1. 이벤트 수신 (RabbitMQ)
    2. 알림 템플릿 렌더링 (다국어)
    3. 채널별 발송
       ├── SMS: SMS Gateway API 호출
       │   └── 발송 결과 콜백 수신 (delivered/failed)
       ├── Email: SMTP 발송
       │   └── 수신 확인 추적 (open tracking pixel / read receipt)
       └── In-App: DB 저장 + WebSocket push
           └── 클라이언트 읽음 처리 시 확인
    4. 발송 이력 저장 (channel, status, sentAt, deliveredAt)
    5. 미수신 건 재발송 (3회까지, 30분 간격)

채널별 도달률 통계:
    GET /api/notifications/delivery-stats
    → { sms: { sent: 1000, delivered: 932, rate: 93.2% },
        email: { sent: 5000, delivered: 4750, rate: 95.0% },
        push: { sent: 3000, delivered: 2800, rate: 93.3% } }
```

#### 3.7.5 주요 API 엔드포인트

| Method | Path | 설명 | 역할 |
|--------|------|------|------|
| GET | `/api/notifications` | 내 알림 목록 | 전체 (로그인) |
| PATCH | `/api/notifications/:id/read` | 알림 읽음 처리 | 전체 (로그인) |
| PATCH | `/api/notifications/read-all` | 전체 읽음 처리 | 전체 (로그인) |
| GET | `/api/notifications/preferences` | 수신 설정 조회 | 전체 (로그인) |
| PUT | `/api/notifications/preferences` | 수신 설정 변경 | 전체 (로그인) |
| GET | `/api/notifications/delivery-stats` | 도달률 통계 (G-10) | BCRC_ADMIN |

#### 3.7.6 이벤트 발행/구독

**발행 이벤트:**
- `notification.sent` — 알림 발송 완료 (Statistics 구독: G-10 추적)
- `notification.delivered` — 알림 수신 확인 (Statistics 구독)
- `notification.failed` — 알림 발송 실패 (Admin 구독: 재발송 관리)

**구독 이벤트:** (대부분의 이벤트를 구독하는 주요 소비자)
- `complaint.*` — 민원 관련 모든 이벤트
- `report.*` — 부패 신고 관련 이벤트
- `proposal.*` — 국민제안 관련 이벤트
- `auth.account.locked` — 계정 잠금 알림

#### 3.7.7 의존 서비스

| 의존 대상 | 통신 방식 | 목적 |
|-----------|-----------|------|
| Auth Service | 동기 REST | 사용자 연락처 조회 |
| SMS Gateway | 동기 REST | SMS 발송 |
| SMTP Server | SMTP | 이메일 발송 |
| RabbitMQ | 비동기 | 이벤트 구독/발행 |
| Redis | 직접 | 미읽음 카운트 캐시 |
| PostgreSQL (notification_db) | 직접 | 알림/발송 이력 |

---

### 3.8 Helpdesk Service (헬프데스크 서비스, 1881)

#### 3.8.1 서비스 책임 범위 (Bounded Context)

Helpdesk Service는 1881 콜센터 및 다채널 상담을 통합 관리한다.

**책임 범위:**
- 상담 Ticket 생성 및 관리 (전화, 이메일, 온라인 채팅)
- CTI (Computer Telephony Integration) 연동 — Asterisk/FreeSWITCH
- 시민 프로파일 및 상담 이력 관리 (CRM 기능 포함)
- SLA 관리 (상담 유형별 처리기한)
- 상담원 스킬 기반 라우팅
- FAQ/지식 베이스 관리
- 상담원 성과 관리

#### 3.8.2 내부 계층 구조

```
helpdesk-service/
├── src/
│   ├── controller/
│   │   ├── TicketController.java          # 상담 Ticket CRUD
│   │   ├── CtiController.java            # CTI 연동 (WebSocket)
│   │   ├── CitizenProfileController.java  # 시민 프로파일/이력
│   │   ├── FaqController.java            # FAQ 관리
│   │   ├── AgentController.java          # 상담원 관리/성과
│   │   └── KnowledgeBaseController.java  # 지식 베이스
│   ├── service/
│   │   ├── TicketService.java
│   │   ├── CtiIntegrationService.java    # Asterisk 연계
│   │   ├── SkillBasedRoutingService.java # 스킬 기반 배분
│   │   ├── CitizenProfileService.java
│   │   ├── FaqService.java
│   │   └── AgentPerformanceService.java
│   ├── websocket/
│   │   └── CtiWebSocketHandler.java      # CTI WebSocket
│   └── repository/
│       ├── TicketRepository.java
│       ├── CitizenProfileRepository.java
│       ├── FaqRepository.java
│       └── AgentRepository.java
```

#### 3.8.3 주요 도메인 모델

```typescript
// 상담 Ticket 상태
type TicketStatus = 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';

// 상담 채널
type TicketChannel = 'phone' | 'email' | 'chat' | 'web';

// 상담 Ticket 엔티티
interface IHelpdeskTicket {
  id: string;                    // 'HDT-2024-000001'
  channel: TicketChannel;
  type: 'complaint_inquiry' | 'system_issue' | 'general' | 'other';
  status: TicketStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  citizenId?: string;
  citizenPhone?: string;
  citizenEmail?: string;
  summaryFr: string;
  summaryAr: string;
  detailFr?: string;
  detailAr?: string;
  assignedAgentId?: string;
  relatedComplaintId?: string;   // 연관 민원 ID
  slaDeadline: string;
  createdAt: string;
  resolvedAt?: string;
}

// 시민 프로파일 (CRM)
interface ICitizenProfile {
  citizenId: string;
  nameFr: string;
  nameAr: string;
  phone?: string;
  email?: string;
  totalComplaints: number;
  totalHelpdeskTickets: number;
  lastContactAt: string;
  notes: string[];
}
```

#### 3.8.4 CTI 통합 Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐
│  1881    │     │  Asterisk/   │     │  Helpdesk    │     │ Agent    │
│  Caller  │     │  FreeSWITCH  │     │  Service     │     │ Browser  │
└────┬─────┘     └──────┬───────┘     └──────┬───────┘     └────┬─────┘
     │                  │                     │                   │
     │ 전화 수신        │                     │                   │
     ├─────────────────>│                     │                   │
     │                  │ WebSocket: 착신 이벤트                  │
     │                  ├────────────────────>│                   │
     │                  │                     │ 발신번호로 시민   │
     │                  │                     │ 프로파일 검색     │
     │                  │                     │                   │
     │                  │                     │ WebSocket: 화면팝업│
     │                  │                     ├──────────────────>│
     │                  │                     │  (caller info +   │
     │                  │                     │   이전 상담 이력) │
     │                  │                     │                   │
     │ 통화 진행        │                     │                   │
     │<────────────────>│                     │                   │
     │                  │                     │ 상담원이 Ticket   │
     │                  │                     │ 생성 (자동 채움)  │
     │                  │                     │<──────────────────│
     │                  │                     │                   │
     │ 통화 종료        │                     │                   │
     │────────────────>│                     │                   │
     │                  │ WebSocket: 종료 이벤트                  │
     │                  ├────────────────────>│                   │
     │                  │                     │ Ticket 업데이트   │
     │                  │                     │ (통화 시간 기록)  │
```

#### 3.8.5 주요 API 엔드포인트

| Method | Path | 설명 | 역할 |
|--------|------|------|------|
| GET | `/api/helpdesk/tickets` | 상담 Ticket 목록 | BRC_OFFICER+ |
| POST | `/api/helpdesk/tickets` | Ticket 생성 | BRC_OFFICER+ |
| GET | `/api/helpdesk/tickets/:id` | Ticket 상세 | BRC_OFFICER+ |
| PATCH | `/api/helpdesk/tickets/:id` | Ticket 업데이트 | BRC_OFFICER+ |
| GET | `/api/helpdesk/citizens/:id/profile` | 시민 프로파일 | BRC_OFFICER+ |
| GET | `/api/helpdesk/faq` | FAQ 목록 | 전체 |
| GET | `/api/helpdesk/agents/performance` | 상담원 성과 | BRC_MANAGER+ |
| WS | `/ws/helpdesk/cti` | CTI WebSocket | BRC_OFFICER+ |

#### 3.8.6 이벤트 발행/구독

**발행 이벤트:**
- `helpdesk.ticket.created` — Ticket 생성
- `helpdesk.ticket.resolved` — Ticket 해결

**구독 이벤트:**
- `complaint.completed` — 연관 민원 처리 완료 시 Ticket 자동 업데이트

#### 3.8.7 의존 서비스

| 의존 대상 | 통신 방식 | 목적 |
|-----------|-----------|------|
| Auth Service | 동기 REST | 토큰 검증 |
| Complaint Service | 동기 REST | 연관 민원 정보 조회 |
| Asterisk/FreeSWITCH | WebSocket + REST | CTI 연동 |
| PostgreSQL (helpdesk_db) | 직접 | Ticket/프로파일 데이터 |

---

### 3.9 Admin Service (관리 서비스)

#### 3.9.1 서비스 책임 범위 (Bounded Context)

Admin Service는 시스템 전체의 마스터 데이터 및 공통 설정을 관리한다.

**책임 범위:**
- 공통 코드 통합 관리 (상태 코드, 처리결과 코드, 민원유형 코드 등)
- 민원 분류 코드 계층 관리 (대→중→소 CRUD)
- 기관 정보 관리 (73개 BRC + BCRC + DGGPC)
- SLA 설정 관리 (유형별/기관별 처리기한)
- 사용자/역할 관리 (SYS_ADMIN 전용)
- 행정구역 코드 관리
- 표준 처리 절차 배포 관리
- 운영 매뉴얼/기술 문서 관리 (G-14)
- 감사 로그 조회/분석
- 시스템 설정 (알림 정책, 세션 타임아웃 등)

#### 3.9.2 내부 계층 구조

```
admin-service/
├── src/
│   ├── controller/
│   │   ├── CodeController.java            # 공통 코드 CRUD
│   │   ├── CategoryController.java        # 분류 코드 계층 관리
│   │   ├── AgencyController.java          # 기관 정보 관리
│   │   ├── SlaConfigController.java       # SLA 설정 관리
│   │   ├── UserManagementController.java  # 사용자/역할 관리
│   │   ├── RegionController.java          # 행정구역 관리
│   │   ├── ProcedureController.java       # 표준 절차 배포
│   │   ├── DocumentationController.java   # 운영 매뉴얼 (G-14)
│   │   ├── AuditLogController.java        # 감사 로그 조회
│   │   └── SystemConfigController.java    # 시스템 설정
│   ├── service/
│   │   ├── CommonCodeService.java
│   │   ├── CategoryService.java
│   │   ├── AgencyService.java
│   │   ├── SlaConfigService.java
│   │   ├── UserManagementService.java
│   │   ├── AuditLogService.java
│   │   └── DocumentationService.java      # G-14 Wiki 형태 문서
│   ├── repository/
│   │   ├── CommonCodeRepository.java
│   │   ├── CategoryRepository.java
│   │   ├── AgencyRepository.java
│   │   ├── SlaConfigRepository.java
│   │   ├── AuditLogRepository.java
│   │   └── DocumentationRepository.java
│   ├── domain/
│   │   ├── CommonCode.java
│   │   ├── Category.java
│   │   ├── Agency.java
│   │   ├── SlaConfig.java
│   │   ├── AuditLog.java
│   │   └── Documentation.java
│   └── event/
│       └── AdminEventSubscriber.java      # 감사 이벤트 수신
```

#### 3.9.3 주요 도메인 모델

```typescript
// 기관 엔티티
interface IAgency {
  id: string;                    // 'BRC-ENV-TUN-001'
  nameFr: string;
  nameAr: string;
  type: 'BCRC' | 'BRC' | 'DGGPC' | 'GOVERNANCE_TEAM';
  parentId: string | null;       // 상위 기관 (계층 구조)
  regionCode: string;
  isActive: boolean;
  contactEmail: string;
  slaConfig: ISLAConfig;
}

// SLA 설정 (유형별 처리기한, 단위: 시간)
interface ISLAConfig {
  grievance: number;             // 고충민원: 1440시간 (60일)
  proposal: number;              // 제안: 720시간 (30일)
  inquiry: number;               // 질의: 168시간 (7일)
  suggestion: number;            // 건의: 720시간 (30일)
  report: number;                // 신고: 360시간 (15일)
}

// 공통 코드 엔티티
interface ICommonCode {
  codeGroup: string;             // 'COMPLAINT_STATUS'
  code: string;                  // 'processing'
  nameFr: string;
  nameAr: string;
  sortOrder: number;
  isActive: boolean;
  description?: string;
}

// 감사 로그 엔티티
interface IAuditLog {
  id: string;
  userId: string;
  userRole: string;
  action: string;                // 'VIEW', 'CREATE', 'UPDATE', 'DELETE'
  resource: string;              // 'complaint', 'report', 'user'
  resourceId: string;
  details: string;               // JSON string
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

// 운영 문서 (G-14)
interface IDocumentation {
  id: string;
  titleFr: string;
  titleAr: string;
  contentFr: string;             // Markdown 형식
  contentAr: string;
  category: 'operation_manual' | 'architecture' | 'api_spec' | 'dev_standard' | 'incident_response';
  version: string;
  lastUpdatedAt: string;
  lastUpdatedBy: string;
}
```

#### 3.9.4 주요 API 엔드포인트

| Method | Path | 설명 | 역할 |
|--------|------|------|------|
| GET | `/api/admin/codes` | 공통 코드 목록 | BCRC_ADMIN+ |
| POST | `/api/admin/codes` | 공통 코드 등록 | BCRC_ADMIN+ |
| PUT | `/api/admin/codes/:id` | 공통 코드 수정 | BCRC_ADMIN+ |
| GET | `/api/admin/categories` | 분류 코드 트리 | BCRC_ADMIN+ |
| POST | `/api/admin/categories` | 분류 코드 등록 | BCRC_ADMIN+ |
| GET | `/api/admin/agencies` | 기관 목록 | BCRC_ADMIN+ |
| POST | `/api/admin/agencies` | 기관 등록 | SYS_ADMIN |
| PUT | `/api/admin/agencies/:id` | 기관 정보 수정 | BCRC_ADMIN+ |
| GET | `/api/admin/sla` | SLA 설정 조회 | BCRC_ADMIN+ |
| PUT | `/api/admin/sla/:agencyId` | SLA 설정 변경 | BCRC_ADMIN+ |
| GET | `/api/admin/users` | 사용자 목록 | SYS_ADMIN |
| POST | `/api/admin/users` | 사용자 생성 | SYS_ADMIN |
| PUT | `/api/admin/users/:id` | 사용자 수정 | SYS_ADMIN |
| GET | `/api/admin/audit-logs` | 감사 로그 조회 | BCRC_ADMIN+ |
| GET | `/api/admin/documentation` | 운영 문서 목록 (G-14) | BRC_OFFICER+ |
| POST | `/api/admin/documentation` | 운영 문서 등록 (G-14) | BCRC_ADMIN+ |

#### 3.9.5 이벤트 발행/구독

**발행 이벤트:**
- `admin.agency.updated` — 기관 정보 변경 (Complaint, Statistics 캐시 갱신)
- `admin.sla.updated` — SLA 설정 변경 (Complaint 서비스에 즉시 반영)
- `admin.code.updated` — 공통 코드 변경 (전체 서비스 캐시 갱신)

**구독 이벤트:**
- `auth.login.failed` — 로그인 실패 감사 로그 기록
- `complaint.deadline.overdue` — 기한 초과 감사 이벤트 기록
- `complaint.transfer.limit` — 이관 초과 감사 이벤트 기록
- `notification.failed` — 알림 실패 감사 이벤트 기록

#### 3.9.6 의존 서비스

| 의존 대상 | 통신 방식 | 목적 |
|-----------|-----------|------|
| Auth Service | 동기 REST | 토큰 검증 |
| RabbitMQ | 비동기 | 이벤트 구독/발행 |
| Redis | 직접 | 공통 코드 캐시, 기관 정보 캐시 |
| PostgreSQL (admin_db) | 직접 | 마스터 데이터 |

---

## 4. 인프라 아키텍처

### 4.1 CNI Private Cloud + Kubernetes 배포

e-People II는 튀니지 국가정보센터(CNI) Private Cloud 환경의 Kubernetes(K8s) 클러스터에 배포한다.

#### 4.1.1 전체 네트워크 아키텍처

```
                          ┌─── Internet ───┐
                          │                │
                          ▼                │
                   ┌──────────────┐        │
                   │   WAF/DDoS   │        │
                   │  Protection  │        │
                   └──────┬───────┘        │
                          │                │
                   ┌──────────────┐        │
                   │  Firewall    │        │
                   │  (Layer 7)   │        │
                   └──────┬───────┘        │
                          │                │
         ┌────────────────┼────────────────┤
         │           DMZ Zone              │
         │  ┌──────────────────────────┐   │
         │  │  Load Balancer (Nginx)   │   │
         │  │  + CDN (Static Assets)   │   │
         │  └──────────┬───────────────┘   │
         │             │                   │
         │  ┌──────────────────────────┐   │
         │  │  ELISE Broker Server     │   │
         │  │  (연계 중개 서버)         │   │
         │  └──────────────────────────┘   │
         └─────────────┬───────────────────┘
                       │
         ┌─────────────┼───────────────────────────────────┐
         │        Application Zone (K8s Cluster)           │
         │                                                 │
         │  ┌──────────────────────────────────────────┐  │
         │  │  Namespace: epeople-gateway               │  │
         │  │  ┌──────────────┐ ┌──────────────┐       │  │
         │  │  │ Kong Gateway │ │ Kong Gateway │       │  │
         │  │  │ (Pod 1)      │ │ (Pod 2)      │       │  │
         │  │  └──────────────┘ └──────────────┘       │  │
         │  └──────────────────────────────────────────┘  │
         │                                                 │
         │  ┌──────────────────────────────────────────┐  │
         │  │  Namespace: epeople-services              │  │
         │  │  ┌────────┐ ┌────────┐ ┌────────┐       │  │
         │  │  │  Auth  │ │Complnt.│ │ Anti-  │       │  │
         │  │  │(2 pods)│ │(3 pods)│ │Corrupt.│       │  │
         │  │  └────────┘ └────────┘ │(2 pods)│       │  │
         │  │  ┌────────┐ ┌────────┐ └────────┘       │  │
         │  │  │ePartic.│ │ Stats  │ ┌────────┐       │  │
         │  │  │(2 pods)│ │(2 pods)│ │  Doc   │       │  │
         │  │  └────────┘ └────────┘ │(2 pods)│       │  │
         │  │  ┌────────┐ ┌────────┐ └────────┘       │  │
         │  │  │Notific.│ │Helpdesk│ ┌────────┐       │  │
         │  │  │(2 pods)│ │(2 pods)│ │ Admin  │       │  │
         │  │  └────────┘ └────────┘ │(2 pods)│       │  │
         │  │                        └────────┘       │  │
         │  └──────────────────────────────────────────┘  │
         │                                                 │
         │  ┌──────────────────────────────────────────┐  │
         │  │  Namespace: epeople-infra                 │  │
         │  │  ┌────────┐ ┌────────┐ ┌────────┐       │  │
         │  │  │RabbitMQ│ │ Redis  │ │ MinIO  │       │  │
         │  │  │Cluster │ │Sentinel│ │Cluster │       │  │
         │  │  └────────┘ └────────┘ └────────┘       │  │
         │  └──────────────────────────────────────────┘  │
         └─────────────────────────────────────────────────┘
                       │
         ┌─────────────┼───────────────────────────────────┐
         │         Data Zone                               │
         │  ┌──────────────────────────────────────────┐  │
         │  │  PostgreSQL Cluster (Active-Standby)     │  │
         │  │  ┌──────────┐  ┌──────────┐             │  │
         │  │  │ Primary  │──│ Standby  │             │  │
         │  │  │ (Active) │  │ (Passive)│             │  │
         │  │  └──────────┘  └──────────┘             │  │
         │  │  DB: auth_db, complaint_db,             │  │
         │  │      anticorruption_db, participation_db,│  │
         │  │      statistics_db, document_db,         │  │
         │  │      notification_db, helpdesk_db,       │  │
         │  │      admin_db                            │  │
         │  └──────────────────────────────────────────┘  │
         │                                                 │
         │  ┌──────────────────────────────────────────┐  │
         │  │  Audit DB (별도 서버, 위변조 방지)        │  │
         │  └──────────────────────────────────────────┘  │
         └─────────────────────────────────────────────────┘
                       │
         ┌─────────────┼───────────────────────────────────┐
         │        Monitoring Zone                          │
         │  ┌────────────┐ ┌────────────┐ ┌────────────┐  │
         │  │ Prometheus │ │  Grafana   │ │ ELK Stack  │  │
         │  └────────────┘ └────────────┘ └────────────┘  │
         └─────────────────────────────────────────────────┘
```

#### 4.1.2 Kubernetes Namespace 설계

| Namespace | 서비스 | Pod 수 (최소) | 리소스 |
|-----------|--------|-------------|--------|
| `epeople-gateway` | Kong API Gateway | 2 | CPU: 500m, Mem: 512Mi |
| `epeople-services` | 9개 마이크로서비스 | 서비스당 2+ | CPU: 250m~1000m, Mem: 256Mi~1Gi |
| `epeople-infra` | RabbitMQ, Redis, MinIO | 각 2~3 | CPU: 500m~1000m, Mem: 512Mi~2Gi |
| `epeople-monitoring` | Prometheus, Grafana, ELK | 각 1~2 | CPU: 500m, Mem: 1Gi~4Gi |
| `epeople-cicd` | GitLab Runner, SonarQube | 각 1 | CPU: 500m, Mem: 1Gi |

#### 4.1.3 서비스별 리소스 요청/제한

```yaml
# Complaint Service (가장 높은 트래픽)
resources:
  requests:
    cpu: "500m"
    memory: "512Mi"
  limits:
    cpu: "1000m"
    memory: "1Gi"

# Auth Service
resources:
  requests:
    cpu: "250m"
    memory: "256Mi"
  limits:
    cpu: "500m"
    memory: "512Mi"

# Statistics Service (집계 작업 시 높은 CPU)
resources:
  requests:
    cpu: "500m"
    memory: "512Mi"
  limits:
    cpu: "2000m"
    memory: "2Gi"
```

### 4.2 Database Per Service 패턴

각 마이크로서비스는 독립된 데이터베이스를 사용한다. 단일 PostgreSQL 클러스터 내에서 논리적으로 분리된 데이터베이스로 운영한다.

| 서비스 | 데이터베이스명 | 주요 테이블 | 예상 데이터량 |
|--------|-------------|-----------|-------------|
| Auth | `auth_db` | users, roles, refresh_tokens, anonymous_tokens | 약 2,000 사용자 |
| Complaint | `complaint_db` | complaints, histories, transfers, extensions, joint_processes, satisfactions, categories, templates | 연간 5,000+ 민원 |
| Anti-Corruption | `anticorruption_db` | corruption_reports, report_histories | 연간 500+ 신고 |
| eParticipation | `participation_db` | proposals, proposal_likes, reviews, implementation_updates | 연간 1,000+ 제안 |
| Statistics | `statistics_db` | statistics_snapshots, agency_performances | 집계 데이터 |
| Document | `document_db` | documents, document_versions, attachments, distribution_logs | 연간 10,000+ 파일 |
| Notification | `notification_db` | notifications, delivery_logs, preferences | 연간 50,000+ 알림 |
| Helpdesk | `helpdesk_db` | tickets, citizen_profiles, faq, agents | 연간 10,000+ 상담 |
| Admin | `admin_db` | common_codes, agencies, sla_configs, audit_logs, documentation | 마스터 데이터 |

### 4.3 Message Broker (RabbitMQ) 구성

```yaml
# RabbitMQ Cluster 설정
cluster:
  nodes: 3  # 고가용성을 위한 3노드 클러스터

exchanges:
  - name: epeople.events
    type: topic
    durable: true

  - name: epeople.dlx      # Dead Letter Exchange
    type: topic
    durable: true

queues:
  # Notification Service 큐
  - name: notification.complaint.events
    bindings:
      - exchange: epeople.events
        routing_key: "complaint.*"

  - name: notification.report.events
    bindings:
      - exchange: epeople.events
        routing_key: "report.*"

  - name: notification.proposal.events
    bindings:
      - exchange: epeople.events
        routing_key: "proposal.*"

  # Statistics Service 큐
  - name: statistics.events
    bindings:
      - exchange: epeople.events
        routing_key: "complaint.*"
      - exchange: epeople.events
        routing_key: "report.completed"
      - exchange: epeople.events
        routing_key: "proposal.*"

  # Admin Service 큐 (감사 로그)
  - name: admin.audit.events
    bindings:
      - exchange: epeople.events
        routing_key: "auth.login.failed"
      - exchange: epeople.events
        routing_key: "complaint.deadline.overdue"
      - exchange: epeople.events
        routing_key: "complaint.transfer.limit"

  # Dead Letter Queue (실패 메시지)
  - name: epeople.dlq
    bindings:
      - exchange: epeople.dlx
        routing_key: "#"
```

### 4.4 Cache (Redis) 전략

| 캐시 키 패턴 | TTL | 용도 | 서비스 |
|-------------|-----|------|--------|
| `auth:session:{userId}` | 1시간 | 세션 캐시 | Auth |
| `auth:login_attempts:{username}` | 30분 | 로그인 시도 카운터 | Auth |
| `complaint:list:{hash}` | 30초 | 민원 목록 캐시 | Complaint |
| `category:tree` | 1시간 | 분류 코드 트리 | Complaint |
| `agency:{id}` | 10분 | 기관 정보 | Admin → 전체 |
| `sla:{agencyId}` | 10분 | SLA 설정 | Admin → Complaint |
| `statistics:overview:{hash}` | 5분 | KPI 요약 캐시 | Statistics |
| `proposal:{id}:likes:{userId}` | 영구 | 공감 여부 | eParticipation |
| `notification:unread:{userId}` | 1분 | 미읽음 카운트 | Notification |
| `codes:{codeGroup}` | 30분 | 공통 코드 캐시 | Admin → 전체 |

### 4.5 CI/CD Pipeline (GitLab CI)

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Commit  │───>│  Build   │───>│  Test    │───>│ Security │───>│  Deploy  │
│ (GitLab) │    │          │    │          │    │  Scan    │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
                │ Docker    │    │ Unit     │    │ SAST     │    │ Dev      │
                │ Build     │    │ Integr.  │    │ DAST     │    │ Staging  │
                │           │    │ API Test │    │ Dep.Scan │    │ Prod     │
                │           │    │ E2E Test │    │          │    │          │
```

```yaml
# .gitlab-ci.yml (각 서비스 공통)
stages:
  - build
  - test
  - security
  - deploy-dev
  - deploy-staging
  - deploy-prod

build:
  stage: build
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

test:
  stage: test
  script:
    - ./gradlew test
    - ./gradlew integrationTest

security-scan:
  stage: security
  script:
    - trivy image $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA  # 컨테이너 취약점
    - sonar-scanner                                     # 코드 품질/보안

deploy-dev:
  stage: deploy-dev
  script:
    - kubectl set image deployment/$SERVICE_NAME $SERVICE_NAME=$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA -n epeople-services
  environment: development
  only: [develop]

deploy-staging:
  stage: deploy-staging
  script:
    - kubectl set image deployment/$SERVICE_NAME $SERVICE_NAME=$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA -n epeople-services
  environment: staging
  only: [main]
  when: manual

deploy-prod:
  stage: deploy-prod
  script:
    - kubectl apply -f k8s/production/
  environment: production
  only: [tags]
  when: manual
```

### 4.6 Monitoring (Prometheus + Grafana) 및 Logging (ELK)

**Prometheus 수집 메트릭:**
- HTTP 요청 수, 응답 시간, 에러율 (서비스별)
- JVM 메모리, CPU 사용량 (Pod별)
- DB 커넥션 풀 사용량
- RabbitMQ 큐 깊이, 메시지 처리율
- Redis 히트율, 메모리 사용량

**Grafana 대시보드 구성:**
- 서비스별 Health Overview
- API 응답 시간 Percentile (P50, P95, P99)
- 에러율 트렌드
- 리소스 사용량 (CPU, Memory, Disk)
- RabbitMQ 큐 모니터링
- 비즈니스 KPI (민원 접수/처리 건수)

**ELK 로그 수집:**
- 구조화된 JSON 로그 포맷
- 서비스명, 트레이스 ID, 사용자 ID 포함
- 로그 레벨: ERROR는 즉시 알림, WARN은 집계 후 알림

---

## 5. 외부 시스템 연계 설계

### 5.1 ELISE (전자문서교환 시스템) 연계

#### 5.1.1 연계 아키텍처

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐
│  ELISE   │     │ ELISE Broker │     │  Complaint   │     │complaint │
│  System  │     │  (DMZ Zone)  │     │  Service     │     │   _db    │
└────┬─────┘     └──────┬───────┘     └──────┬───────┘     └────┬─────┘
     │                  │                     │                   │
     │ 전자문서 전송    │                     │                   │
     │ (REST API)       │                     │                   │
     ├─────────────────>│                     │                   │
     │                  │ 1. 문서 유효성 검증 │                   │
     │                  │ 2. 악성코드 스캔    │                   │
     │                  │ 3. 형식 표준화      │                   │
     │                  │                     │                   │
     │                  │ 내부 API 호출       │                   │
     │                  ├────────────────────>│                   │
     │                  │                     │ 민원 Ticket 자동  │
     │                  │                     │ 생성 (중복 검증)  │
     │                  │                     ├──────────────────>│
     │                  │                     │                   │
     │                  │ 202 Accepted        │                   │
     │                  │<────────────────────│                   │
     │ 수신 확인        │                     │                   │
     │<─────────────────│                     │                   │
     │                  │                     │                   │
     │ === 오류 발생 시 ===                   │                   │
     │                  │ 재시도 (3회, 지수 백오프)               │
     │                  │ 실패 시 → Dead Letter Queue             │
     │                  │ → Admin에 알림 발송                     │
```

#### 5.1.2 ELISE 연계 API

```
POST /internal/elise/receive
Content-Type: application/json

{
  "eliseDocumentId": "ELISE-DOC-2024-001234",
  "sourceAgency": "Ministry of Environment",
  "documentType": "complaint",
  "subjectFr": "...",
  "subjectAr": "...",
  "contentFr": "...",
  "contentAr": "...",
  "attachments": [
    {
      "filename": "document.pdf",
      "contentBase64": "...",
      "mimeType": "application/pdf"
    }
  ],
  "metadata": {
    "receivedAt": "2024-03-01T10:00:00Z",
    "priority": "normal"
  }
}
```

### 5.2 Tuntrust PKI 연계

OAuth2/OIDC 표준 프로토콜로 연계한다. 상세 Flow는 3.1.7절 참조.

| 항목 | 설정 |
|------|------|
| 프로토콜 | OAuth 2.0 + OIDC (Authorization Code + PKCE) |
| Authorization Endpoint | `https://auth.tuntrust.tn/authorize` |
| Token Endpoint | `https://auth.tuntrust.tn/token` |
| JWKS Endpoint | `https://auth.tuntrust.tn/.well-known/jwks.json` |
| Redirect URI | `https://epeople2.gov.tn/api/auth/pki-callback` |
| Scopes | `openid profile email phone` |

### 5.3 DigiGo SSO 연계

| 항목 | 설정 |
|------|------|
| 프로토콜 | SAML 2.0 또는 OAuth2 (MTC 협의 후 확정) |
| IdP Metadata URL | `https://digigo.gov.tn/saml/metadata` |
| SP Entity ID | `https://epeople2.gov.tn` |
| ACS URL | `https://epeople2.gov.tn/api/auth/sso-callback` |

### 5.4 SMS Gateway 연계

```
Notification Service → REST API → SMS Gateway → 이동통신사 → 시민

POST https://sms-gateway.tn/api/send
{
  "to": "+216-XX-XXX-XXX",
  "message": "الشكوى CMP-2024-000042: تم معالجة شكواكم بنجاح",
  "sender": "ePeople2",
  "callbackUrl": "https://epeople2.gov.tn/api/notifications/sms-callback"
}

콜백 수신 (수신 확인, G-10):
POST /api/notifications/sms-callback
{
  "messageId": "SMS-001",
  "status": "delivered",  // delivered | failed | pending
  "deliveredAt": "2024-03-01T10:05:00Z"
}
```

### 5.5 Email 서버 연계

| 항목 | 설정 |
|------|------|
| 프로토콜 | SMTP (TLS) |
| 서버 | smtp.epeople2.gov.tn:587 |
| 인증 | SMTP AUTH (서비스 계정) |
| 발신 주소 | noreply@epeople2.gov.tn |
| 수신 확인 | Open tracking pixel + Disposition-Notification-To 헤더 |

### 5.6 1881 Call Center (CTI) 연계

| 항목 | 설정 |
|------|------|
| PBX 시스템 | Asterisk 또는 FreeSWITCH (오픈소스) |
| 프로토콜 | WebSocket (실시간 이벤트) + REST API (제어) |
| 기능 | 착신 팝업, 통화 기록, 자동 Ticket 연계 |

상세 CTI Flow는 3.8.4절 참조.

---

## 6. 보안 아키텍처

### 6.1 인증 아키텍처

e-People II는 4가지 인증 메커니즘을 지원한다.

```
┌──────────────────────────────────────────────────────────┐
│                 인증 메커니즘 분류                         │
│                                                          │
│  1. JWT (ID/PW 로그인)                                   │
│     ├── Access Token: 1시간, HS256 서명                  │
│     ├── Refresh Token: 7일, DB 저장                      │
│     └── 5회 실패 시 30분 계정 잠금                       │
│                                                          │
│  2. PKI (Tuntrust Mobile ID)                             │
│     ├── OAuth2 Authorization Code + PKCE                 │
│     └── ANSE Homologation 인증 필수                      │
│                                                          │
│  3. SSO (DigiGo 전자정부 포털)                           │
│     ├── SAML 2.0 또는 OAuth2                             │
│     └── MTC 사전 협의 필요                               │
│                                                          │
│  4. Anonymous Token (부패 신고 전용)                      │
│     ├── UUID 기반 일회성 토큰                            │
│     ├── 1년 유효기간                                     │
│     └── 신고 상태 추적 전용 (다른 기능 접근 불가)        │
└──────────────────────────────────────────────────────────┘
```

### 6.2 인가 모델 (RBAC)

8개 역할과 권한 매트릭스는 3.1.6절의 RBAC 매트릭스를 참조한다. 추가적으로 다음 원칙을 적용한다.

**최소 권한 원칙 (Principle of Least Privilege):**
- 각 역할은 업무 수행에 필요한 최소한의 권한만 부여
- 데이터 접근은 역할 + 소속 기관 범위로 제한
  - BRC_OFFICER: 본인 배분 민원만 조회/처리
  - BRC_MANAGER: 소속 BRC 전체 민원
  - BCRC_ADMIN: 전체 BRC 민원

**데이터 민감도 기반 접근:**
- 일반 데이터: 역할 기반 접근
- 민감 데이터 (개인정보): 역할 + 업무 목적 확인
- 기밀 데이터 (부패 신고): DGGPC 역할 전용 + 추가 승인

### 6.3 데이터 암호화

| 구분 | 방식 | 대상 |
|------|------|------|
| 전송 중 암호화 (In Transit) | TLS 1.2+ (HTTPS) | 모든 통신 |
| 서비스 간 암호화 | mTLS (Service Mesh) | 서비스 간 내부 통신 |
| 저장 시 암호화 (At Rest) | AES-256 (DB 컬럼 레벨) | 개인정보 필드 |
| 파일 암호화 | AES-256 (MinIO Server-Side Encryption) | 첨부파일 |
| 비밀번호 | BCrypt (cost factor: 12) | 사용자 비밀번호 |
| 토큰 | HS256 (JWT) | Access/Refresh Token |

**암호화 대상 필드:**
- 시민 주민번호 (Carte d'Identite Nationale)
- 시민 전화번호
- 시민 이메일
- 부패 신고자 식별 정보 (실명 신고의 경우)
- 익명 토큰

### 6.4 개인정보 마스킹 규칙

| 필드 | 원본 | 마스킹 결과 | 적용 시점 |
|------|------|-----------|----------|
| 이름 | Ahmed Ben Ali | A**** B** A** | 민원 목록 표시 |
| 이메일 | ahmed@email.tn | a****@****.tn | API 응답 |
| 전화번호 | +216-71-123456 | +216-71-***456 | API 응답 |
| 주민번호 | 12345678 | ****5678 | API 응답 |
| 시민 ID | CIT-000042 | CIT-***masked*** | 통계 데이터 |

### 6.5 감사 로그 전략

```
모든 시스템 활동에 대해 이중 감사 로그 기록:

1차 로그: 운영 DB (admin_db.audit_logs)
    - 빠른 조회/검색 용도
    - 보존 기간: 2년

2차 로그: 별도 감사 DB (audit_db, 별도 서버)
    - 위변조 방지 (Write-Once 정책)
    - 보존 기간: 5년
    - 해시 체인으로 무결성 검증

기록 항목:
    - 사용자 ID, 역할, 소속 기관
    - 행위 (VIEW, CREATE, UPDATE, DELETE, APPROVE, TRANSFER)
    - 대상 리소스 (complaint, report, user 등)
    - 리소스 ID
    - 이전 값 / 변경 후 값 (UPDATE의 경우)
    - IP 주소, User-Agent
    - 타임스탬프 (UTC)
```

### 6.6 OWASP TOP 10 대응

| # | 위협 | 대응 방안 |
|---|------|-----------|
| A01 | Broken Access Control | RBAC + API Gateway ACL + 서비스 레벨 권한 검증 |
| A02 | Cryptographic Failures | TLS 1.2+, AES-256, BCrypt, JWT HS256 |
| A03 | Injection | Prepared Statement, 입력값 유효성 검증 (Zod), SQL 파라미터 바인딩 |
| A04 | Insecure Design | 위협 모델링, 보안 설계 검토, ANSE Homologation |
| A05 | Security Misconfiguration | IaC (Infrastructure as Code), 보안 기본값 적용 |
| A06 | Vulnerable Components | 의존성 스캔 (Trivy, OWASP Dependency-Check) |
| A07 | Auth Failures | JWT + Refresh Token, 계정 잠금, PKCE |
| A08 | Data Integrity Failures | CI/CD 파이프라인 보안, 서명된 아티팩트 |
| A09 | Logging Failures | 이중 감사 로그, ELK 중앙 로그, 실시간 알림 |
| A10 | SSRF | 내부 API 호출 화이트리스트, URL 유효성 검증 |

### 6.7 ANSE Homologation 요건

ANSE(전자보안청) 보안 승인(Homologation)은 시스템 오픈의 전제 조건이다.

**준수 항목:**
- 침투 테스트 (Penetration Testing) 완료
- 취약점 스캔 결과 보고서
- 보안 아키텍처 문서
- 개인정보 보호 영향 평가 (PIA)
- 인증서 관리 체계 (PKI/Tuntrust 연계)
- 감사 로그 체계 증빙
- 재해 복구 계획서

### 6.8 INPDP (개인정보보호법) 준수

| 요건 | 대응 |
|------|------|
| 처리 목적 명시 | 개인정보 처리 동의서 (민원 신청 Step 5) |
| 최소 수집 원칙 | 업무 수행에 필요한 최소 정보만 수집 |
| 보유 기간 제한 | 민원: 5년, 부패신고: 10년, 로그: 5년 |
| 접근 권한 통제 | RBAC + 데이터 민감도 기반 접근 통제 |
| 파기 절차 | 보유 기간 만료 시 자동 파기 알림 + 승인 후 파기 |
| 접근 로그 | 개인정보 열람/접근 모든 이력 기록 |

### 6.9 API 보안

| 보안 항목 | 구현 방법 |
|-----------|-----------|
| Rate Limiting | Kong 플러그인: 시민 100req/min, 공무원 300req/min |
| Input Validation | Zod (프론트), Bean Validation (백엔드) |
| CORS | 허용 오리진: `*.epeople2.gov.tn` |
| Content Security Policy | `default-src 'self'; script-src 'self'` |
| X-Frame-Options | `DENY` (클릭재킹 방지) |
| X-Content-Type-Options | `nosniff` |
| Strict-Transport-Security | `max-age=31536000; includeSubDomains` |

---

## 7. 다국어 및 RTL 설계

### 7.1 다국어 필드 명명 규칙

모든 데이터베이스 테이블 및 API 응답에서 다국어 필드는 접미사(Suffix) 방식으로 명명한다.

```
규칙: {fieldName}{LanguageCode}

예시:
  titleFr   / titleAr        — 프랑스어 / 아랍어 제목
  contentFr / contentAr      — 프랑스어 / 아랍어 본문
  nameFr    / nameAr         — 프랑스어 / 아랍어 이름
  reasonFr  / reasonAr       — 프랑스어 / 아랍어 사유
  noteFr    / noteAr         — 프랑스어 / 아랍어 비고

DB 컬럼:
  title_fr  / title_ar       — snake_case 형식
```

**금지 사항:**
- `title: string` — 언어 불명확, 사용 금지
- `title_en: string` — 영어 필드 불필요 (시스템 언어가 아님)

### 7.2 i18n 아키텍처

```
프론트엔드 (React + i18next):
  src/locales/
  ├── ar/                          # 아랍어 (RTL)
  │   ├── common.json              # 공통 텍스트
  │   ├── complaint.json           # 민원 관련
  │   ├── report.json              # 부패 신고 관련
  │   ├── proposal.json            # 국민제안 관련
  │   ├── auth.json                # 인증 관련
  │   ├── admin.json               # 관리 관련
  │   └── statistics.json          # 통계 관련
  └── fr/                          # 프랑스어 (LTR)
      ├── common.json
      ├── complaint.json
      ├── report.json
      ├── proposal.json
      ├── auth.json
      ├── admin.json
      └── statistics.json

백엔드 API 응답:
  - 모든 다국어 필드를 항상 양쪽 언어 모두 포함하여 반환
  - 클라이언트에서 현재 언어에 맞는 필드를 선택하여 표시
  - API 쿼리 파라미터 `lang=ar|fr`로 정렬/검색 언어 지정
```

### 7.3 RTL 레이아웃 전략

```tsx
// HTML 루트에 언어/방향 동적 설정
<html lang={i18n.language} dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
  <body className={i18n.language === 'ar' ? 'font-arabic' : 'font-latin'}>

// Tailwind RTL 변형 활용 예시
<div className="ml-4 rtl:ml-0 rtl:mr-4">
  <span className="text-left rtl:text-right">텍스트</span>
</div>

// 아이콘 방향 반전
<ChevronRight className="rtl:rotate-180" />

// Flexbox 방향
<div className="flex flex-row rtl:flex-row-reverse">
  <Sidebar />
  <MainContent />
</div>
```

**RTL 전환 시 주의 사항:**
- `margin-left` → `margin-right` 자동 전환 (`rtl:` prefix 사용)
- `text-align: left` → `text-align: right` 자동 전환
- 아이콘 방향성이 있는 경우 `rotate-180` 적용 (화살표, 네비게이션)
- 차트(Recharts) X축 방향은 LTR 유지 (수치 데이터는 좌→우가 표준)
- 전화번호, 날짜 등 숫자는 LTR 방향 유지 (`dir="ltr"` 인라인 적용)

### 7.4 폰트 전략

```css
/* 아랍어 폰트 스택 */
.font-arabic {
  font-family: 'Noto Sans Arabic', 'Cairo', 'Amiri', Arial, sans-serif;
  /* 아랍어는 기본 폰트보다 1px 크게, 줄간격 1.2배 넓게 */
  font-size: calc(1em + 1px);
  line-height: 1.8;
}

/* 프랑스어/라틴 폰트 스택 */
.font-latin {
  font-family: 'Inter', 'Roboto', Arial, sans-serif;
  line-height: 1.6;
}

/* 숫자는 항상 서양식 (아랍어 환경에서도) */
.numeric {
  font-feature-settings: "tnum";
  direction: ltr;
  unicode-bidi: embed;
}
```

### 7.5 날짜/숫자 지역화

| 항목 | 프랑스어 (FR) | 아랍어 (AR) |
|------|-------------|-----------|
| 날짜 형식 | DD/MM/YYYY (01/03/2024) | DD/MM/YYYY (01/03/2024) |
| 시간 형식 | HH:mm (14:30) | HH:mm (14:30) |
| 숫자 구분자 | 1.234,56 (점+쉼표) | 1,234.56 (쉼표+점) |
| 통화 | DT (Dinar Tunisien) | د.ت |
| 요일 | Lundi, Mardi... | الاثنين، الثلاثاء... |
| 달력 | 그레고리력 | 그레고리력 (히즈리력 선택 가능) |

---

## 8. 성능 설계

### 8.1 성능 목표 지표

| 항목 | 목표 | 비고 |
|------|------|------|
| 페이지 초기 로드 | 3초 이내 | 3G 환경 기준 (G-13) |
| API 응답 시간 (P95) | 2초 이내 | 95% 요청 기준 |
| API 응답 시간 (P99) | 5초 이내 | 99% 요청 기준 |
| 동시 접속 사용자 | 500명 이상 | 시민 + 공무원 합산 |
| 파일 업로드 | 30초 이내 | 10MB 파일 기준 |
| 검색 응답 | 1초 이내 | 민원 키워드 검색 |
| 대시보드 로드 | 2초 이내 | KPI 4개 + 차트 3개 |

### 8.2 캐싱 전략

```
┌──────────────────────────────────────────────────────────┐
│                    캐싱 계층 (Cache Layers)               │
│                                                          │
│  Layer 1: CDN (Static Assets)                            │
│  ├── JS/CSS 번들: Cache-Control: max-age=31536000       │
│  ├── 이미지: Cache-Control: max-age=86400               │
│  └── index.html: Cache-Control: no-cache                │
│                                                          │
│  Layer 2: Browser Cache                                  │
│  ├── Service Worker (PWA offline support)                │
│  ├── React Query staleTime: 30초 (목록), 5분 (상세)     │
│  └── localStorage: 언어 설정, 사용자 선호                │
│                                                          │
│  Layer 3: API Gateway Cache (Kong)                       │
│  ├── 공개 API (카테고리, FAQ): TTL 5분                  │
│  └── 정적 설정 (기관 목록, 공통 코드): TTL 10분         │
│                                                          │
│  Layer 4: Redis Cache (Application Level)                │
│  ├── 민원 목록: TTL 30초                                │
│  ├── KPI 요약: TTL 5분                                  │
│  ├── 분류 코드 트리: TTL 1시간                          │
│  ├── 기관 정보: TTL 10분                                │
│  └── 세션 데이터: TTL 1시간                             │
│                                                          │
│  Layer 5: Database Query Cache                           │
│  ├── PostgreSQL shared_buffers: 25% RAM                  │
│  └── Prepared Statement Cache                            │
└──────────────────────────────────────────────────────────┘
```

### 8.3 데이터베이스 쿼리 최적화

**인덱스 전략 (complaint_db):**

```sql
-- 민원 목록 조회 (가장 빈번한 쿼리)
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_type ON complaints(type);
CREATE INDEX idx_complaints_citizen_id ON complaints(citizen_id);
CREATE INDEX idx_complaints_agency ON complaints(assigned_agency);
CREATE INDEX idx_complaints_deadline ON complaints(deadline);
CREATE INDEX idx_complaints_submitted ON complaints(submitted_at DESC);

-- 복합 인덱스 (워크리스트 조회: 상태 + 기관 + 기한순)
CREATE INDEX idx_complaints_worklist
  ON complaints(assigned_agency, status, deadline)
  WHERE status IN ('assigned', 'processing');

-- 처리 이력 (민원별 시간순 조회)
CREATE INDEX idx_histories_complaint
  ON complaint_histories(complaint_id, created_at DESC);

-- 전문 검색 (아랍어 + 프랑스어)
CREATE INDEX idx_complaints_search_fr
  ON complaints USING gin(to_tsvector('french', title_fr || ' ' || content_fr));
CREATE INDEX idx_complaints_search_ar
  ON complaints USING gin(to_tsvector('arabic', title_ar || ' ' || content_ar));
```

### 8.4 코드 스플리팅 및 Lazy Loading

```typescript
// React Router 기반 코드 스플리팅
const CitizenHome = lazy(() => import('@pages/citizen/CitizenHomePage'));
const ComplaintNew = lazy(() => import('@pages/citizen/complaints/ComplaintNewPage'));
const ComplaintList = lazy(() => import('@pages/citizen/complaints/ComplaintListPage'));
const BackofficeDashboard = lazy(() => import('@pages/backoffice/DashboardPage'));
const Statistics = lazy(() => import('@pages/backoffice/StatisticsPage'));
const AdminDashboard = lazy(() => import('@pages/admin/AdminDashboardPage'));

// 결과: 초기 번들 크기 최소화
// 시민 포털 접근 시: citizen 관련 코드만 로드
// Back Office 접근 시: backoffice 관련 코드만 로드
```

### 8.5 저사양 기기/저속망 최적화 (G-13)

| 최적화 항목 | 구현 방법 |
|------------|-----------|
| 이미지 최적화 | WebP 형식 우선, `<picture>` 태그 Fallback, Lazy Loading |
| 번들 크기 | Vite Tree-shaking, 코드 스플리팅, 외부 라이브러리 최소화 |
| 네트워크 요청 | API 응답 압축 (gzip/brotli), 불필요한 필드 제거 |
| 오프라인 지원 | Service Worker 캐시, 임시 저장 (민원 작성 중 네트워크 끊김 대비) |
| 폰트 최적화 | `font-display: swap`, WOFF2 형식, 서브셋 생성 |
| Critical CSS | 초기 렌더링에 필요한 CSS 인라인, 나머지 비동기 로드 |

---

## 9. 데이터 흐름도 (Data Flow Diagrams)

### 9.1 민원 접수~처리~완료 전체 워크플로우

```
┌────────┐                     ┌───────────┐                    ┌───────────┐
│  시민  │                     │ Complaint │                    │   BRC     │
│(CITIZEN)│                     │  Service  │                    │ 담당자    │
└───┬────┘                     └─────┬─────┘                    └─────┬─────┘
    │                                │                                │
    │ Step 1: 유형 선택 (5유형)      │                                │
    │ Step 2: 분류 선택 (L1→L2→L3)   │                                │
    │ Step 3: 내용 작성               │                                │
    │ Step 4: 파일 첨부               │                                │
    │ Step 5: 확인 및 제출            │                                │
    │                                │                                │
    │ POST /complaints               │                                │
    ├───────────────────────────────>│                                │
    │                                │ 1. 입력값 검증                  │
    │                                │ 2. 유형별 SLA 계산              │
    │                                │ 3. 분류 코드 → 담당 BRC 결정    │
    │                                │ 4. Ticket 생성 (status:received)│
    │                                │ 5. 이벤트 발행                  │
    │                                │    complaint.received           │
    │                                │                                │
    │ 201 {id, deadline, agency}     │                                │
    │<───────────────────────────────│                                │
    │                                │                                │
    │                                │ === 자동 배분 ===              │
    │                                │ status: assigned               │
    │                                │ 이벤트: complaint.assigned     │
    │                                │                                │
    │                                │ ─────────────────────────────>│
    │                                │ (알림: 새 민원 배분)           │
    │                                │                                │
    │                                │                                │ 워크리스트 확인
    │                                │                                │ GET /complaints
    │                                │<───────────────────────────────│
    │                                │ 민원 목록 응답                  │
    │                                │────────────────────────────────>│
    │                                │                                │
    │                                │                                │ 민원 처리 시작
    │                                │ PATCH /complaints/:id/status   │
    │                                │<───────────────────────────────│
    │                                │ {status: "processing"}          │
    │                                │                                │
    │                                │ === 처리 중 ===                │
    │                                │                                │
    │                                │ [시나리오 A: 정상 처리 완료]   │
    │                                │ PATCH /complaints/:id/status   │
    │                                │<───────────────────────────────│
    │                                │ {status: "completed",           │
    │                                │  answerFr: "...",               │
    │                                │  answerAr: "..."}               │
    │                                │                                │
    │ (SMS + Email: 처리 완료 통보)  │                                │
    │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │                                │
    │                                │                                │
    │ 만족도 평가 (1~5점)            │                                │
    │ POST /complaints/:id/satisfaction                               │
    │───────────────────────────────>│                                │
    │                                │ 이벤트: satisfaction.submitted  │
    │                                │                                │
    │                                │ status: closed (7일 후 자동)   │
```

### 9.2 부패 신고 접수~조사~완료 워크플로우

```
┌────────┐              ┌───────────┐          ┌───────────┐
│  시민  │              │Anti-Corr. │          │  DGGPC    │
│(익명)  │              │  Service  │          │ 조사관    │
└───┬────┘              └─────┬─────┘          └─────┬─────┘
    │                         │                      │
    │ 1. 익명 토큰 발급       │                      │
    │ POST /auth/anon-token   │                      │
    │─────────────────────────>                      │
    │ {token: "ANON-xxx"}     │                      │
    │<─────────────────────────                      │
    │                         │                      │
    │ 2. 신고 접수            │                      │
    │ POST /reports           │                      │
    │ {isAnonymous: true,     │                      │
    │  anonymousToken: "...", │                      │
    │  type: "bribery", ...}  │                      │
    │────────────────────────>│                      │
    │                         │ status: received     │
    │                         │ 이벤트: report.received
    │ {trackingCode: "TRACK-xxx"}                    │
    │<────────────────────────│                      │
    │                         │                      │
    │                         │ ───────────────────>│
    │                         │ (알림: 새 신고 접수) │
    │                         │                      │
    │                         │                      │ 예비 검토
    │                         │ PATCH /reports/:id   │
    │                         │<─────────────────────│
    │                         │ {status: "preliminary_review"}
    │                         │                      │
    │                         │                      │ 정식 조사 개시
    │                         │ PATCH /reports/:id   │
    │                         │<─────────────────────│
    │                         │ {status: "under_investigation"}
    │                         │                      │
    │ 3. 추적 조회            │                      │
    │ GET /reports/track      │                      │
    │   ?token=ANON-xxx       │                      │
    │────────────────────────>│                      │
    │ {status: "under_investigation"}                │
    │<────────────────────────│                      │
    │                         │                      │
    │                         │                      │ 조사 완료
    │                         │ PATCH /reports/:id   │
    │                         │<─────────────────────│
    │                         │ {status: "completed",│
    │                         │  result: {...}}      │
    │                         │                      │
    │ (추적 조회 시 결과 확인 가능)                  │
```

### 9.3 국민제안 접수~심사~이행 워크플로우

```
┌────────┐              ┌───────────┐          ┌───────────┐
│  시민  │              │eParticip. │          │  BCRC     │
│(제안자)│              │  Service  │          │ 관리자    │
└───┬────┘              └─────┬─────┘          └─────┬─────┘
    │                         │                      │
    │ 제안 작성               │                      │
    │ POST /proposals         │                      │
    │────────────────────────>│                      │
    │                         │ status: pending      │
    │                         │ 이벤트: proposal.submitted
    │ 201 {id: "PRP-xxx"}    │                      │
    │<────────────────────────│                      │
    │                         │                      │
    │ (다른 시민들의 공감)    │                      │
    │ POST /proposals/:id/like│                      │
    │────────────────────────>│                      │
    │ {liked: true,           │                      │
    │  likeCount: 143}        │                      │
    │<────────────────────────│                      │
    │                         │                      │
    │                         │                      │ 심사 진행
    │                         │ PATCH /:id/review    │
    │                         │<─────────────────────│
    │                         │ {result: "accepted", │
    │                         │  implementationPlan: "..."}
    │                         │                      │
    │ (알림: 제안 채택 통보)  │                      │
    │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │                      │
    │                         │                      │
    │                         │                      │ 이행 현황 업데이트
    │                         │ POST /:id/implementation
    │                         │<─────────────────────│
    │                         │ {progress: 50,       │
    │                         │  content: "..."}     │
    │                         │                      │
    │ 이행 현황 조회          │                      │
    │ GET /proposals/:id      │                      │
    │────────────────────────>│                      │
    │ {implementationUpdates: [...]}                  │
    │<────────────────────────│                      │
```

### 9.4 이관 요청~처리 워크플로우 (G-02)

```
┌───────────┐          ┌───────────┐          ┌───────────┐
│  BRC-A    │          │ Complaint │          │  BRC-B    │
│ 담당자    │          │  Service  │          │ (이관대상)│
└─────┬─────┘          └─────┬─────┘          └─────┬─────┘
      │                      │                      │
      │ 이관 요청            │                      │
      │ POST /:id/transfer   │                      │
      │ {targetAgencyId:     │                      │
      │  "BRC-B",            │                      │
      │  reasonFr: "..."     │                      │
      │  (최소 50자)}        │                      │
      │─────────────────────>│                      │
      │                      │                      │
      │                      │ === 이관 통제 검증 ===│
      │                      │ transferCount 확인    │
      │                      │                      │
      │                      │ [Case 1: count < 2]  │
      │                      │ 정상 처리             │
      │                      │ transferCount + 1     │
      │                      │                      │
      │                      │ [Case 2: count == 2] │
      │                      │ 경고 + 이관 처리     │
      │                      │ → BCRC에 알림 발송   │
      │                      │                      │
      │                      │ [Case 3: count >= 3] │
      │                      │ BCRC 자동 보고       │
      │                      │ → BCRC 대시보드 등록 │
      │                      │ → 긴급 알림 발송     │
      │                      │                      │
      │                      │ 이벤트:              │
      │                      │ complaint.transferred │
      │                      │                      │
      │ 200 (이관 완료)      │                      │
      │<─────────────────────│                      │
      │                      │                      │
      │                      │ ───────────────────>│
      │                      │ (알림: 이관 수신)    │
      │                      │                      │
      │                      │                      │ 이관 수락/처리
```

### 9.5 기한 연장 신청~승인 워크플로우 (G-04)

```
┌───────────┐          ┌───────────┐          ┌───────────┐
│  BRC      │          │ Complaint │          │  BRC      │
│ 담당자    │          │  Service  │          │ 관리자    │
└─────┬─────┘          └─────┬─────┘          └─────┬─────┘
      │                      │                      │
      │ 연장 신청            │                      │
      │ POST /:id/extend     │                      │
      │ {days: 15,           │                      │
      │  reasonFr: "..."}    │                      │
      │─────────────────────>│                      │
      │                      │ 연장 요청 생성       │
      │                      │ status: pending_approval
      │                      │                      │
      │                      │ 이벤트:              │
      │                      │ extension.requested   │
      │                      │ ───────────────────>│
      │                      │ (알림: 연장 승인 요청)│
      │ 201 {extensionId}    │                      │
      │<─────────────────────│                      │
      │                      │                      │
      │                      │                      │ 승인 처리
      │                      │ PATCH /:extId        │
      │                      │<─────────────────────│
      │                      │ {status: "approved"}  │
      │                      │                      │
      │                      │ 기한 자동 갱신       │
      │                      │ deadline += 15일      │
      │                      │                      │
      │ (알림: 연장 승인)    │                      │
      │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                      │
      │                      │                      │
      │                      │ 시민에게 통보        │
      │                      │ (SMS + Email:        │
      │                      │  "기한이 연장됨")    │
```

### 9.6 공동처리 워크플로우 (G-03)

```
┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐
│  BCRC     │  │ Complaint │  │  BRC-A    │  │  BRC-B    │
│ 관리자    │  │  Service  │  │(주관기관) │  │(협조기관) │
└─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
      │              │              │              │
      │ 공동처리 시작│              │              │
      │ POST /:id/joint-process     │              │
      │ {leadAgencyId: "BRC-A",     │              │
      │  cooperatingIds: ["BRC-B"]} │              │
      │─────────────>│              │              │
      │              │ 공동처리 생성│              │
      │              │              │              │
      │              │ 이벤트:      │              │
      │              │ joint.started│              │
      │              │ ────────────>│              │
      │              │ (주관기관 지정 알림)         │
      │              │              │              │
      │              │ ──────────────────────────>│
      │              │ (협조기관 참여 요청 알림)   │
      │              │              │              │
      │              │              │              │ 의견 제출
      │              │              │              │ POST /:id/opinion
      │              │              │<─────────────│
      │              │              │ {opinionFr}  │
      │              │              │              │
      │              │              │ 통합 답변 작성
      │              │              │ (의견 취합)  │
      │              │ PATCH /:id/status            │
      │              │<─────────────│              │
      │              │ {status: "completed",        │
      │              │  answerFr: "통합 답변..."}   │
      │              │              │              │
      │              │ 처리기한: 주관기관 기준      │
      │              │ 단일 적용                    │
```

---

## 10. 배포 전략 (Deployment Strategy)

### 10.1 환경 분리 전략

```
┌──────────────────────────────────────────────────────────────────┐
│                    환경 분리 구조 (Environment Separation)         │
│                                                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐│
│  │    DEV      │  │   STAGING   │  │     UAT     │  │   PROD   ││
│  │  (개발)     │  │ (스테이징)  │  │ (수용테스트)│  │  (운영)  ││
│  ├─────────────┤  ├─────────────┤  ├─────────────┤  ├──────────┤│
│  │ 목적:      │  │ 목적:      │  │ 목적:      │  │ 목적:    ││
│  │ 개발/디버그 │  │ 통합테스트  │  │ 최종검증    │  │ 서비스    ││
│  │            │  │ QA/회귀     │  │ 이해관계자  │  │ 운영     ││
│  │            │  │ 테스트      │  │ 승인        │  │          ││
│  ├─────────────┤  ├─────────────┤  ├─────────────┤  ├──────────┤│
│  │ K8s:       │  │ K8s:       │  │ K8s:       │  │ K8s:     ││
│  │ epeople-dev│  │epeople-stg │  │ epeople-uat│  │epeople   ││
│  │ namespace  │  │ namespace  │  │ namespace  │  │namespace ││
│  ├─────────────┤  ├─────────────┤  ├─────────────┤  ├──────────┤│
│  │ DB:        │  │ DB:        │  │ DB:        │  │ DB:      ││
│  │ 개발 전용  │  │ STG 전용   │  │ UAT 전용   │  │ 운영 전용││
│  │ 목 데이터  │  │ 샘플 데이터│  │ 실데이터   │  │ 실데이터 ││
│  │ 공유       │  │ 격리       │  │ 마스킹     │  │ 격리     ││
│  ├─────────────┤  ├─────────────┤  ├─────────────┤  ├──────────┤│
│  │ 레플리카:  │  │ 레플리카:  │  │ 레플리카:  │  │레플리카: ││
│  │ 1 per svc  │  │ 2 per svc  │  │ 2 per svc  │  │3 per svc ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘│
│                                                                    │
│  승격 흐름: DEV ──build──> STG ──QA pass──> UAT ──승인──> PROD   │
└──────────────────────────────────────────────────────────────────┘
```

### 10.2 환경별 구성 관리

```yaml
# Kubernetes ConfigMap — 환경별 설정 분리
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: epeople-config
  namespace: epeople-${ENV}
data:
  # 환경 공통 (Override 가능)
  APP_ENV: "${ENV}"                          # dev | staging | uat | prod
  LOG_LEVEL: "${LOG_LEVEL}"                   # debug | info | warn | error
  API_BASE_URL: "https://${DOMAIN}/api"

  # 데이터베이스
  DB_HOST: "postgres-${ENV}.internal"
  DB_PORT: "5432"
  DB_POOL_SIZE: "${DB_POOL_SIZE}"

  # Redis
  REDIS_HOST: "redis-${ENV}.internal"
  REDIS_PORT: "6379"

  # RabbitMQ
  RABBITMQ_HOST: "rabbitmq-${ENV}.internal"
  RABBITMQ_PORT: "5672"

  # MinIO
  MINIO_ENDPOINT: "minio-${ENV}.internal:9000"
  MINIO_BUCKET: "epeople-${ENV}-documents"

  # 외부 연계
  ELISE_BROKER_URL: "${ELISE_URL}"
  TUNTRUST_OCSP_URL: "${TUNTRUST_URL}"
  SMS_GATEWAY_URL: "${SMS_URL}"

---
# 환경별 세부 설정 (예: 운영)
# prod-values.yaml
env: prod
domain: epeople2.gov.tn
logLevel: warn
dbPoolSize: 20
replicas: 3
resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 1000m
    memory: 1024Mi

# dev-values.yaml
env: dev
domain: dev.epeople2.internal
logLevel: debug
dbPoolSize: 5
replicas: 1
resources:
  requests:
    cpu: 100m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

### 10.3 환경별 설정 매트릭스

| 설정 항목 | DEV | STAGING | UAT | PROD |
|-----------|-----|---------|-----|------|
| 도메인 | dev.epeople2.internal | staging.epeople2.gov.tn | uat.epeople2.gov.tn | epeople2.gov.tn |
| TLS | Self-signed | Let's Encrypt | ANSE 인증서 | ANSE 인증서 |
| DB 레플리카 | 0 (Single) | 1 (Read replica) | 1 (Read replica) | 2 (Read replica) |
| Redis 모드 | Standalone | Standalone | Sentinel | Sentinel (3노드) |
| 레플리카 수 | 1 | 2 | 2 | 3 |
| HPA | 비활성 | 활성 (min:2/max:4) | 활성 (min:2/max:4) | 활성 (min:3/max:10) |
| 로그 레벨 | DEBUG | INFO | INFO | WARN |
| DB Pool | 5 | 10 | 10 | 20 |
| Rate Limit | 없음 | 100 req/min | 100 req/min | 60 req/min |
| CORS | * | staging 도메인 | uat 도메인 | 운영 도메인만 |
| Mock 데이터 | 활성 (MSW) | 비활성 | 비활성 | 비활성 |
| 외부 연계 | Mock | Test 연계 | Test 연계 | 실제 연계 |
| 모니터링 | 기본 | 전체 | 전체 | 전체 + 알람 |
| 백업 | 없음 | 일 1회 | 일 1회 | 1시간 단위 |

### 10.4 Blue/Green 배포 전략

```
┌──────────────────────────────────────────────────────────────────┐
│                Blue/Green Deployment Strategy                      │
│                                                                    │
│  현재 운영 (Blue)                 새 버전 (Green)                 │
│  ┌─────────────────────┐          ┌─────────────────────┐        │
│  │ complaint-svc v1.2  │          │ complaint-svc v1.3  │        │
│  │ auth-svc v1.1       │          │ auth-svc v1.1       │        │
│  │ stats-svc v2.0      │          │ stats-svc v2.1      │        │
│  │ ...                 │          │ ...                 │        │
│  └─────────┬───────────┘          └─────────┬───────────┘        │
│            │                                │                     │
│  ┌─────────┴───────────┐          ┌─────────┴───────────┐        │
│  │   DB (공유)         │          │   DB (공유)         │        │
│  │   PostgreSQL        │◄════════►│   Migration 적용    │        │
│  └─────────────────────┘          └─────────────────────┘        │
│                                                                    │
│  배포 절차:                                                       │
│  ─────────                                                        │
│  1. Green 환경에 새 버전 배포                                     │
│  2. DB 마이그레이션 실행 (하위 호환 필수)                         │
│  3. Green 환경 Smoke Test 실행                                    │
│  4. Health Check 통과 확인                                        │
│  5. API Gateway 트래픽 전환: Blue → Green                        │
│  6. Blue 환경 30분간 대기 (롤백 대비)                            │
│  7. 정상 확인 후 Blue 환경 해제                                   │
│                                                                    │
│  Kong Ingress 설정:                                               │
│  ┌───────────┐    ┌──────────┐                                    │
│  │  Kong API  │───>│ Blue (현)│  weight: 100%                     │
│  │  Gateway   │    └──────────┘                                    │
│  │           │    ┌──────────┐                                    │
│  │  전환 후  │───>│Green (신)│  weight: 100%                     │
│  └───────────┘    └──────────┘                                    │
└──────────────────────────────────────────────────────────────────┘
```

### 10.5 Canary 배포 전략 (단계적 트래픽 이동)

```yaml
# Kong Canary Release 설정
# 단계적 트래픽 이동으로 위험 최소화
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: canary-release
config:
  # Phase 1: 5% 트래픽을 새 버전으로
  percentage: 5
  upstream_host: complaint-svc-v1.3
  upstream_port: 8080

  # Phase 2: 20분 후 에러율 < 1% 확인 시
  # percentage: 25

  # Phase 3: 추가 20분 후
  # percentage: 50

  # Phase 4: 안정성 확인 완료
  # percentage: 100
```

**Canary 배포 단계별 진행:**

| 단계 | 트래픽 비율 | 지속 시간 | 롤백 조건 |
|------|-----------|-----------|-----------|
| Phase 1 | 5% → Canary | 20분 | 에러율 > 1% 또는 P95 > 3초 |
| Phase 2 | 25% → Canary | 20분 | 에러율 > 0.5% 또는 P95 > 2.5초 |
| Phase 3 | 50% → Canary | 30분 | 에러율 > 0.3% 또는 P95 > 2초 |
| Phase 4 | 100% → Canary | - | 완전 전환 완료 |

**자동 롤백 트리거 (Prometheus Alert):**

```yaml
# Prometheus AlertManager Rule
groups:
  - name: canary-rollback
    rules:
      - alert: CanaryHighErrorRate
        expr: |
          (
            sum(rate(http_requests_total{status=~"5..", deployment="canary"}[5m]))
            /
            sum(rate(http_requests_total{deployment="canary"}[5m]))
          ) > 0.01
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Canary 배포 에러율 1% 초과 — 자동 롤백 실행"
          runbook: "kubectl rollout undo deployment/${SERVICE_NAME}"

      - alert: CanaryHighLatency
        expr: |
          histogram_quantile(0.95,
            sum(rate(http_request_duration_seconds_bucket{deployment="canary"}[5m])) by (le)
          ) > 3
        for: 3m
        labels:
          severity: critical
        annotations:
          summary: "Canary 배포 P95 지연 3초 초과 — 자동 롤백 실행"
```

### 10.6 데이터베이스 마이그레이션 전략

```
┌──────────────────────────────────────────────────────────────────┐
│              Database Migration Strategy (Flyway)                  │
│                                                                    │
│  원칙: 항상 하위 호환 (Backward-Compatible) 마이그레이션          │
│                                                                    │
│  V1__initial_schema.sql                                           │
│  ├── CREATE TABLE complaints (...)                                │
│  ├── CREATE TABLE complaint_histories (...)                       │
│  ├── CREATE TABLE agencies (...)                                  │
│  └── CREATE INDEX idx_complaints_status (...)                     │
│                                                                    │
│  V2__add_transfer_control.sql          (G-02 이관 통제 기능)     │
│  ├── ALTER TABLE complaints ADD COLUMN transfer_count INTEGER     │
│  │   DEFAULT 0;                                                    │
│  └── CREATE INDEX idx_complaints_transfer (...)                   │
│                                                                    │
│  V3__add_deadline_extension.sql        (G-04 기한 연장 기능)     │
│  ├── CREATE TABLE deadline_extensions (...)                       │
│  └── ALTER TABLE complaints ADD COLUMN original_deadline ...     │
│                                                                    │
│  V4__add_joint_processing.sql          (G-03 공동처리 기능)      │
│  ├── CREATE TABLE joint_processes (...)                           │
│  └── CREATE TABLE joint_opinions (...)                            │
│                                                                    │
│  V5__add_anti_corruption.sql           (부패 신고 분리 도메인)   │
│  ├── CREATE TABLE corruption_reports (...)                        │
│  ├── CREATE TABLE report_histories (...)                          │
│  └── CREATE TABLE witness_protections (...)                       │
│                                                                    │
│  V6__add_citizen_proposals.sql         (G-05 국민 제안)          │
│  ├── CREATE TABLE citizen_proposals (...)                         │
│  ├── CREATE TABLE proposal_likes (...)                            │
│  └── CREATE TABLE implementation_updates (...)                    │
│                                                                    │
│  === 마이그레이션 실행 규칙 ===                                   │
│  1. 항상 ALTER TABLE ADD COLUMN (DROP COLUMN 금지)               │
│  2. NOT NULL 제약은 DEFAULT 값과 함께 추가                       │
│  3. 인덱스 생성은 CONCURRENTLY 옵션 사용                         │
│  4. 대용량 테이블 변경은 pt-online-schema-change 사용            │
│  5. 롤백 스크립트 항상 동시 작성 (V2_undo__...)                  │
└──────────────────────────────────────────────────────────────────┘
```

**마이그레이션 실행 플로우:**

```
1. CI 파이프라인에서 자동 감지
   └── flyway info → 미적용 마이그레이션 확인

2. STG 환경에서 먼저 적용
   └── flyway migrate -url=jdbc:postgresql://stg-db:5432/complaint_db
   └── 자동화된 회귀 테스트 실행

3. UAT 환경 적용
   └── QA팀 승인 후 실행
   └── 성능 테스트 (대용량 데이터 환경)

4. PROD 환경 적용
   └── 운영팀 승인 + 변경관리 티켓 필수
   └── 점검 시간(야간) 또는 무중단 마이그레이션
   └── 적용 후 10분간 모니터링
```

### 10.7 무중단 배포 (Zero-Downtime Deployment)

**Kubernetes Rolling Update 설정:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: complaint-service
  namespace: epeople-prod
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1          # 최대 추가 Pod 수
      maxUnavailable: 0    # 항상 3개 Pod 가용 보장
  template:
    spec:
      containers:
        - name: complaint-svc
          image: registry.cni.tn/epeople/complaint-svc:${VERSION}
          ports:
            - containerPort: 8080

          # Readiness Probe: 트래픽 수신 준비 확인
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 5
            failureThreshold: 3

          # Liveness Probe: 프로세스 생존 확인
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
            failureThreshold: 3

          # Startup Probe: 초기 기동 시간 보장
          startupProbe:
            httpGet:
              path: /actuator/health
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
            failureThreshold: 30    # 최대 150초 기동 대기

          # Graceful Shutdown
          lifecycle:
            preStop:
              exec:
                command: ["/bin/sh", "-c", "sleep 10"]

      terminationGracePeriodSeconds: 60   # 진행 중 요청 완료 대기
```

**무중단 배포 시퀀스:**

```
시간 ──────────────────────────────────────────────────────>

Pod v1.2 [████████████████████████████████████████████████]
                                      │ preStop (10s)
                                      │ 진행중 요청 완료 (50s)
                                      └── 종료

Pod v1.3         [startup probe........│ ready │████████████]
                 │ initialDelay: 10s   │       │
                 │ health check pass   │       │ 트래픽 수신 시작
                 └─────────────────────┘       │

Kong LB  ──[v1.2]──[v1.2]──[v1.2]──[v1.2+v1.3]──[v1.3]──

결과: 서비스 중단 시간 = 0초
```

### 10.8 롤백 절차

```
┌──────────────────────────────────────────────────────────────────┐
│                    롤백 절차 (Rollback Procedure)                  │
│                                                                    │
│  === 자동 롤백 (Kubernetes) ===                                   │
│                                                                    │
│  1. 배포 실패 감지                                                │
│     - Readiness Probe 3회 연속 실패                               │
│     - Pod CrashLoopBackOff 상태 진입                              │
│     → Kubernetes 자동 롤백 (revisionHistoryLimit: 5)              │
│                                                                    │
│  2. 수동 롤백 명령어                                              │
│     $ kubectl rollout undo deployment/complaint-service            │
│       -n epeople-prod                                              │
│     $ kubectl rollout status deployment/complaint-service          │
│       -n epeople-prod                                              │
│                                                                    │
│  3. 특정 버전으로 롤백                                            │
│     $ kubectl rollout history deployment/complaint-service         │
│     $ kubectl rollout undo deployment/complaint-service            │
│       --to-revision=3 -n epeople-prod                              │
│                                                                    │
│  === DB 마이그레이션 롤백 ===                                     │
│                                                                    │
│  4. Flyway Undo 실행                                              │
│     $ flyway undo -url=jdbc:postgresql://prod-db/complaint_db     │
│     ※ 주의: 데이터 유실 가능성 검토 필수                         │
│     ※ 운영팀 승인 + 변경관리 이력 기록 필수                      │
│                                                                    │
│  === Blue/Green 롤백 ===                                          │
│                                                                    │
│  5. Kong 트래픽 즉시 전환                                        │
│     Green → Blue (기존 안정 버전)                                 │
│     소요 시간: < 10초                                             │
│                                                                    │
│  === 롤백 체크리스트 ===                                          │
│  □ 장애 원인 1차 파악                                             │
│  □ 영향 범위 확인 (해당 서비스만 or 연관 서비스)                 │
│  □ 롤백 대상 결정 (앱 only / 앱 + DB)                            │
│  □ 롤백 실행                                                      │
│  □ 서비스 정상 확인 (Health Check + E2E Test)                     │
│  □ 장애 보고서 작성                                               │
│  □ 근본 원인 분석 (RCA) 회의 일정 수립                           │
└──────────────────────────────────────────────────────────────────┘
```

### 10.9 CI/CD 파이프라인 상세

```yaml
# .gitlab-ci.yml — 전체 파이프라인
stages:
  - build
  - test
  - security
  - deploy-stg
  - integration-test
  - deploy-uat
  - approval
  - deploy-prod

variables:
  DOCKER_REGISTRY: registry.cni.tn/epeople
  SONAR_HOST: https://sonar.cni.tn

# === Stage 1: Build ===
build:
  stage: build
  image: eclipse-temurin:17-jdk
  script:
    - ./gradlew build -x test
    - docker build -t ${DOCKER_REGISTRY}/${SERVICE_NAME}:${CI_COMMIT_SHA} .
    - docker push ${DOCKER_REGISTRY}/${SERVICE_NAME}:${CI_COMMIT_SHA}
  artifacts:
    paths:
      - build/libs/*.jar
    expire_in: 1 hour

# === Stage 2: Test ===
unit-test:
  stage: test
  script:
    - ./gradlew test
    - ./gradlew jacocoTestReport
  coverage: '/Total.*?([0-9]{1,3})%/'
  artifacts:
    reports:
      junit: build/test-results/test/*.xml
      coverage_report:
        coverage_format: cobertura
        path: build/reports/jacoco/test/jacocoTestReport.xml
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'

# === Stage 3: Security Scan ===
sast:
  stage: security
  image: sonarsource/sonar-scanner-cli
  script:
    - sonar-scanner
        -Dsonar.projectKey=epeople-${SERVICE_NAME}
        -Dsonar.host.url=${SONAR_HOST}
        -Dsonar.qualitygate.wait=true
  rules:
    - if: '$CI_COMMIT_BRANCH == "develop" || $CI_COMMIT_BRANCH == "main"'

dependency-check:
  stage: security
  image: owasp/dependency-check:latest
  script:
    - /usr/share/dependency-check/bin/dependency-check.sh
        --project epeople-${SERVICE_NAME}
        --scan ./build/libs/
        --format HTML --format JSON
        --failOnCVSS 7
  artifacts:
    paths:
      - dependency-check-report.*
    expire_in: 1 week

container-scan:
  stage: security
  image: aquasec/trivy:latest
  script:
    - trivy image --severity HIGH,CRITICAL
        --exit-code 1
        ${DOCKER_REGISTRY}/${SERVICE_NAME}:${CI_COMMIT_SHA}

# === Stage 4: Deploy to Staging ===
deploy-staging:
  stage: deploy-stg
  image: bitnami/kubectl:latest
  script:
    - kubectl set image deployment/${SERVICE_NAME}
        ${SERVICE_NAME}=${DOCKER_REGISTRY}/${SERVICE_NAME}:${CI_COMMIT_SHA}
        -n epeople-staging
    - kubectl rollout status deployment/${SERVICE_NAME}
        -n epeople-staging --timeout=300s
  environment:
    name: staging
    url: https://staging.epeople2.gov.tn
  rules:
    - if: '$CI_COMMIT_BRANCH == "develop"'

# === Stage 5: Integration Test ===
integration-test:
  stage: integration-test
  image: postman/newman:latest
  script:
    - newman run tests/integration/epeople-api.postman_collection.json
        --environment tests/integration/staging.postman_environment.json
        --reporters cli,junit
  artifacts:
    reports:
      junit: newman/*.xml
  needs: ["deploy-staging"]

# === Stage 6: Deploy to UAT ===
deploy-uat:
  stage: deploy-uat
  script:
    - kubectl set image deployment/${SERVICE_NAME}
        ${SERVICE_NAME}=${DOCKER_REGISTRY}/${SERVICE_NAME}:${CI_COMMIT_SHA}
        -n epeople-uat
    - kubectl rollout status deployment/${SERVICE_NAME}
        -n epeople-uat --timeout=300s
  environment:
    name: uat
    url: https://uat.epeople2.gov.tn
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
  needs: ["integration-test"]

# === Stage 7: Manual Approval ===
production-approval:
  stage: approval
  script:
    - echo "운영 배포 승인 대기 중..."
  when: manual
  allow_failure: false
  needs: ["deploy-uat"]
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'

# === Stage 8: Deploy to Production ===
deploy-production:
  stage: deploy-prod
  script:
    # Blue/Green: Green 환경에 배포
    - kubectl set image deployment/${SERVICE_NAME}-green
        ${SERVICE_NAME}=${DOCKER_REGISTRY}/${SERVICE_NAME}:${CI_COMMIT_SHA}
        -n epeople-prod
    - kubectl rollout status deployment/${SERVICE_NAME}-green
        -n epeople-prod --timeout=600s
    # Smoke Test
    - ./scripts/smoke-test.sh https://green.epeople2.gov.tn
    # 트래픽 전환
    - kubectl patch ingress epeople-ingress -n epeople-prod
        --type=json -p='[{"op":"replace","path":"/spec/rules/0/http/paths/0/backend/service/name","value":"'${SERVICE_NAME}-green'"}]'
  environment:
    name: production
    url: https://epeople2.gov.tn
  needs: ["production-approval"]
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
```

### 10.10 컨테이너 이미지 관리

```dockerfile
# Dockerfile — 멀티 스테이지 빌드 (예: Complaint Service)
# Stage 1: Build
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app
COPY gradle/ gradle/
COPY gradlew build.gradle.kts settings.gradle.kts ./
RUN ./gradlew dependencies --no-daemon
COPY src/ src/
RUN ./gradlew bootJar --no-daemon -x test

# Stage 2: Runtime (최소 이미지)
FROM eclipse-temurin:17-jre-alpine
LABEL maintainer="epeople-team@cni.tn"
LABEL version="${VERSION}"

# 보안: Non-root 사용자
RUN addgroup -g 1000 epeople && \
    adduser -u 1000 -G epeople -s /bin/sh -D epeople

WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar

# 보안: 파일 권한 최소화
RUN chown -R epeople:epeople /app
USER epeople

# Health Check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/actuator/health || exit 1

EXPOSE 8080
ENTRYPOINT ["java", \
  "-XX:MaxRAMPercentage=75.0", \
  "-XX:+UseG1GC", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
```

**이미지 태그 관리 정책:**

| 태그 형식 | 설명 | 예시 |
|-----------|------|------|
| `${COMMIT_SHA}` | Git Commit 해시 (불변) | `a1b2c3d4` |
| `${VERSION}` | SemVer 릴리스 태그 | `1.3.0` |
| `latest-${ENV}` | 환경별 최신 (가변) | `latest-staging` |
| `${BRANCH}-${BUILD_NUMBER}` | 브랜치별 빌드 | `develop-142` |

---

## 11. 재해 복구 및 백업 (Disaster Recovery & Backup)

### 11.1 복구 목표 정의

| 지표 | 목표 | 설명 |
|------|------|------|
| **RPO** (Recovery Point Objective) | **1시간** | 최대 데이터 유실 허용 시간 — 1시간 이전까지의 데이터 복구 보장 |
| **RTO** (Recovery Time Objective) | **4시간** | 서비스 복구 목표 시간 — 장애 발생 후 4시간 이내 정상화 |
| **MTBF** (Mean Time Between Failures) | 99.5% (연 43.8시간 이하 중단) | 연간 목표 가용성 |
| **MTTR** (Mean Time To Repair) | 2시간 이내 | 장애 평균 복구 시간 목표 |

### 11.2 백업 전략

```
┌──────────────────────────────────────────────────────────────────┐
│                    백업 전략 (Backup Strategy)                      │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Layer 1: 데이터베이스 백업 (PostgreSQL)                    │  │
│  │                                                              │  │
│  │  ■ Full Backup (전체 백업)                                  │  │
│  │    - 주기: 매일 02:00 (야간)                                │  │
│  │    - 도구: pg_basebackup                                    │  │
│  │    - 보관: 30일                                              │  │
│  │    - 저장 위치: CNI NAS (별도 물리 서버)                    │  │
│  │                                                              │  │
│  │  ■ Incremental Backup (증분 백업)                           │  │
│  │    - 주기: 1시간 단위                                       │  │
│  │    - 도구: WAL (Write-Ahead Log) 아카이빙                   │  │
│  │    - RPO 1시간 보장의 핵심 메커니즘                         │  │
│  │    - 저장 위치: CNI NAS + Off-site 복제                     │  │
│  │                                                              │  │
│  │  ■ Point-in-Time Recovery (PITR)                            │  │
│  │    - WAL 기반 특정 시점 복원 가능                           │  │
│  │    - 최소 복구 단위: 1시간 전 시점까지                      │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Layer 2: 파일 스토리지 백업 (MinIO)                        │  │
│  │                                                              │  │
│  │  ■ MinIO Replication                                        │  │
│  │    - 주 서버 → DR 서버 실시간 복제 (Bucket Replication)     │  │
│  │    - 첨부파일, 전자문서 등 바이너리 데이터                  │  │
│  │                                                              │  │
│  │  ■ Versioning 활성화                                        │  │
│  │    - 삭제된 파일 30일간 복구 가능                           │  │
│  │    - Lifecycle Policy: 90일 이후 Archive 계층 이동          │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Layer 3: 설정/인프라 백업                                   │  │
│  │                                                              │  │
│  │  ■ Kubernetes 설정                                          │  │
│  │    - Velero를 이용한 클러스터 상태 백업 (일 1회)            │  │
│  │    - ConfigMap, Secret, Deployment 등 전체 리소스           │  │
│  │                                                              │  │
│  │  ■ Git 저장소                                               │  │
│  │    - GitLab: 일 1회 전체 백업                               │  │
│  │    - 소스 코드, CI/CD 파이프라인, Wiki                      │  │
│  │                                                              │  │
│  │  ■ Kong API Gateway 설정                                    │  │
│  │    - decK (Kong 선언적 설정) 파일 Git 관리                  │  │
│  │    - 라우팅, 플러그인, 인증 설정 버전 관리                 │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Layer 4: 로그/감사 이력 백업                                │  │
│  │                                                              │  │
│  │  ■ Elasticsearch 인덱스 스냅샷                              │  │
│  │    - 일 1회 스냅샷 → NAS 저장                               │  │
│  │    - 감사 로그: 5년 보관 (INPDP 규정)                       │  │
│  │    - 운영 로그: 90일 보관 후 아카이브                       │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 11.3 백업 스케줄 요약

| 대상 | 유형 | 주기 | 보관 기간 | 저장 위치 | RPO 기여 |
|------|------|------|-----------|-----------|----------|
| PostgreSQL (9 DB) | Full Backup | 매일 02:00 | 30일 | CNI NAS | 24시간 |
| PostgreSQL WAL | Incremental | 1시간 | 7일 | CNI NAS + DR | **1시간** |
| MinIO 첨부파일 | Replication | 실시간 | - | DR 서버 | **실시간** |
| MinIO Versioning | Soft Delete | 삭제 시 | 30일 | 주 서버 | 실시간 |
| K8s Cluster | Velero Snapshot | 매일 03:00 | 14일 | CNI NAS | 24시간 |
| GitLab | Full Export | 매일 04:00 | 30일 | CNI NAS | 24시간 |
| Elasticsearch | Index Snapshot | 매일 05:00 | 감사: 5년 / 운영: 90일 | CNI NAS | 24시간 |
| Redis | RDB Snapshot | 1시간 | 24시간 | 로컬 디스크 | 1시간 |
| Kong 설정 | decK Export | Git Commit 시 | 무기한 (Git) | GitLab | 실시간 |

### 11.4 재해 복구 아키텍처

```
┌──────────────────────────────────────────────────────────────────┐
│                 재해 복구 아키텍처 (DR Architecture)               │
│                                                                    │
│  ┌──────────────────────────┐    ┌──────────────────────────┐    │
│  │     Primary Site         │    │     DR Site              │    │
│  │     (CNI Data Center 1)  │    │     (CNI Data Center 2)  │    │
│  │                          │    │                          │    │
│  │  ┌──────────────────┐   │    │   ┌──────────────────┐   │    │
│  │  │  K8s Cluster     │   │    │   │  K8s Cluster     │   │    │
│  │  │  (Active)        │   │    │   │  (Standby)       │   │    │
│  │  │                  │   │    │   │                  │   │    │
│  │  │  9 MSA Services  │   │    │   │  최소 구성:     │   │    │
│  │  │  Kong Gateway    │   │    │   │  Auth + Complaint│   │    │
│  │  │  Redis Sentinel  │   │    │   │  + Gateway       │   │    │
│  │  └──────────────────┘   │    │   └──────────────────┘   │    │
│  │                          │    │                          │    │
│  │  ┌──────────────────┐   │    │   ┌──────────────────┐   │    │
│  │  │  PostgreSQL      │   │====│==>│  PostgreSQL      │   │    │
│  │  │  (Primary)       │WAL│Rep.│   │  (Standby)       │   │    │
│  │  │  9 Databases     │===│====│==>│  Streaming Rep.  │   │    │
│  │  └──────────────────┘   │    │   └──────────────────┘   │    │
│  │                          │    │                          │    │
│  │  ┌──────────────────┐   │    │   ┌──────────────────┐   │    │
│  │  │  MinIO           │   │Bkt │   │  MinIO           │   │    │
│  │  │  (Primary)       │===│Rep.│==>│  (Mirror)        │   │    │
│  │  └──────────────────┘   │    │   └──────────────────┘   │    │
│  │                          │    │                          │    │
│  │  ┌──────────────────┐   │    │   ┌──────────────────┐   │    │
│  │  │  NAS Backup      │   │    │   │  NAS Backup      │   │    │
│  │  │  (Local Copy)    │===│====│==>│  (Off-site Copy) │   │    │
│  │  └──────────────────┘   │    │   └──────────────────┘   │    │
│  └──────────────────────────┘    └──────────────────────────┘    │
│                                                                    │
│  복제 경로:                                                       │
│  ═══ PostgreSQL WAL Streaming Replication (비동기/동기 선택)      │
│  ═══ MinIO Bucket Replication (비동기)                            │
│  ═══ NAS rsync (일 1회)                                          │
└──────────────────────────────────────────────────────────────────┘
```

### 11.5 재해 복구 절차 (DR Procedure)

```
┌──────────────────────────────────────────────────────────────────┐
│                재해 복구 실행 절차 (Failover Runbook)              │
│                                                                    │
│  === Level 1: 서비스 단위 장애 (단일 서비스 다운) ===            │
│  예상 복구 시간: 15분 ~ 1시간                                    │
│                                                                    │
│  Step 1. Kubernetes 자동 복구 확인                                │
│          - Pod 재시작 (자동), HPA 스케일링 확인                   │
│  Step 2. 자동 복구 실패 시 수동 개입                              │
│          $ kubectl rollout restart deployment/${SVC} -n epeople    │
│  Step 3. DB 연결 풀 초기화 (필요 시)                              │
│          $ kubectl exec -it ${POD} -- curl -X POST               │
│            localhost:8080/actuator/restart                         │
│  Step 4. 서비스 정상화 확인                                       │
│          $ kubectl get pods -n epeople | grep ${SVC}              │
│          $ curl -s https://epeople2.gov.tn/api/${SVC}/health     │
│                                                                    │
│  === Level 2: 인프라 장애 (DB/Redis/RabbitMQ 다운) ===           │
│  예상 복구 시간: 1시간 ~ 2시간                                   │
│                                                                    │
│  Step 1. 장애 구성요소 식별                                       │
│          - Grafana 대시보드 확인                                  │
│          - AlertManager 알림 확인                                 │
│  Step 2. Redis 장애 → Sentinel 자동 Failover 확인                │
│          $ redis-cli -h sentinel-host SENTINEL get-master-addr    │
│  Step 3. PostgreSQL 장애 → Standby 프로모션                      │
│          $ pg_ctl promote -D /var/lib/postgresql/data              │
│          $ 서비스 DB 연결 문자열 갱신                              │
│  Step 4. RabbitMQ 장애 → 클러스터 노드 복구                      │
│          $ rabbitmqctl stop_app && rabbitmqctl start_app          │
│  Step 5. 전체 서비스 재시작 및 검증                               │
│                                                                    │
│  === Level 3: 사이트 전체 장애 (DC 다운) ===                     │
│  예상 복구 시간: 2시간 ~ 4시간 (RTO 목표)                        │
│                                                                    │
│  Step 1. DR Site 활성화 결정 (운영팀장 승인)                      │
│  Step 2. DNS 전환                                                 │
│          epeople2.gov.tn → DR Site IP                             │
│          TTL: 300초 (5분) — 사전 설정                              │
│  Step 3. DR PostgreSQL Standby → Primary 프로모션                 │
│          $ pg_ctl promote -D /var/lib/postgresql/data              │
│  Step 4. DR K8s 서비스 활성화                                     │
│          $ kubectl scale deployment --all --replicas=3            │
│            -n epeople-prod                                        │
│  Step 5. MinIO Mirror → Primary 전환                              │
│  Step 6. 전체 서비스 Health Check                                 │
│          $ ./scripts/dr-health-check.sh                           │
│  Step 7. 사용자 알림 (시스템 정상화 공지)                        │
│  Step 8. Primary Site 복구 후 데이터 역동기화 계획 수립          │
│                                                                    │
│  === Failback (원래 사이트 복귀) ===                              │
│  Step 1. Primary Site 인프라 복구 완료 확인                       │
│  Step 2. DR → Primary 데이터 역동기화                            │
│  Step 3. Primary 서비스 기동 + 검증                               │
│  Step 4. DNS 원복 (DR → Primary)                                 │
│  Step 5. DR Site → Standby 모드 복귀                              │
└──────────────────────────────────────────────────────────────────┘
```

### 11.6 재해 복구 테스트 계획

| 테스트 유형 | 주기 | 내용 | 성공 기준 |
|------------|------|------|-----------|
| 백업 복원 테스트 | 월 1회 | 전체 백업에서 DB 복원, 데이터 무결성 검증 | 데이터 100% 일치 |
| DR Failover 테스트 | 분기 1회 | DR Site로 전체 전환, 서비스 동작 검증 | RTO 4시간 이내 복구 |
| PITR 테스트 | 분기 1회 | WAL 기반 특정 시점 복원 | RPO 1시간 이내 복원 |
| Tabletop Exercise | 반기 1회 | 시나리오 기반 모의 훈련 (인력 절차 검증) | 절차 준수율 100% |
| Chaos Engineering | 월 1회 | 운영 환경 일부 장애 주입 (Pod Kill 등) | 자동 복구 확인 |

### 11.7 장애 등급 및 에스컬레이션

| 등급 | 영향 범위 | 예시 | 대응 시간 | 에스컬레이션 |
|------|-----------|------|-----------|-------------|
| P1 (Critical) | 전체 서비스 중단 | DC 장애, 네트워크 전면 장애 | 즉시 | PMC → KOICA → BCRC |
| P2 (High) | 핵심 기능 불가 | 민원 접수/조회 불가, 인증 장애 | 30분 이내 | 운영팀 → PMC |
| P3 (Medium) | 부분 기능 장애 | 통계 서비스 지연, 알림 발송 실패 | 2시간 이내 | 운영팀 내부 처리 |
| P4 (Low) | 경미한 이상 | UI 깨짐, 비필수 기능 오류 | 영업일 이내 | 개발팀 백로그 등록 |

---

## 12. 부록 (Appendix)

### 12.1 전체 API 엔드포인트 목록

#### 12.1.1 인증 서비스 (Auth Service)

| Method | Endpoint | 설명 | 인증 | 역할 |
|--------|----------|------|------|------|
| POST | `/auth/login` | 일반 로그인 | - | 공개 |
| POST | `/auth/pki-login` | PKI 인증서 로그인 | - | 공개 |
| POST | `/auth/sso/digigo` | DigiGo SSO 로그인 | - | 공개 |
| POST | `/auth/anonymous-token` | 익명 토큰 발급 | - | 공개 |
| POST | `/auth/refresh` | 토큰 갱신 | JWT | 모든 인증 사용자 |
| POST | `/auth/logout` | 로그아웃 | JWT | 모든 인증 사용자 |
| GET | `/auth/me` | 내 프로필 조회 | JWT | 모든 인증 사용자 |
| PATCH | `/auth/me` | 내 프로필 수정 | JWT | 모든 인증 사용자 |
| POST | `/auth/password/change` | 비밀번호 변경 | JWT | 모든 인증 사용자 |
| POST | `/auth/password/reset` | 비밀번호 초기화 요청 | - | 공개 |

#### 12.1.2 민원 서비스 (Complaint Service)

| Method | Endpoint | 설명 | 인증 | 역할 |
|--------|----------|------|------|------|
| GET | `/complaints` | 민원 목록 조회 | JWT | CITIZEN, BRC_*, BCRC_*, SYS_ADMIN |
| POST | `/complaints` | 민원 신규 접수 | JWT | CITIZEN |
| GET | `/complaints/:id` | 민원 상세 조회 | JWT | CITIZEN(본인), BRC_*, BCRC_*, SYS_ADMIN |
| PATCH | `/complaints/:id/status` | 민원 상태 변경 | JWT | BRC_OFFICER, BRC_MANAGER |
| POST | `/complaints/:id/transfer` | 민원 이관 요청 | JWT | BRC_OFFICER, BRC_MANAGER |
| POST | `/complaints/:id/extend` | 기한 연장 신청 | JWT | BRC_OFFICER |
| PATCH | `/complaints/:id/extend/:extId` | 기한 연장 승인/반려 | JWT | BRC_MANAGER |
| POST | `/complaints/:id/joint-process` | 공동처리 시작 | JWT | BCRC_ADMIN |
| POST | `/complaints/:id/opinion` | 공동처리 의견 제출 | JWT | BRC_OFFICER |
| POST | `/complaints/:id/satisfaction` | 만족도 평가 | JWT | CITIZEN(본인) |
| GET | `/complaints/:id/history` | 처리 이력 조회 | JWT | CITIZEN(본인), BRC_*, BCRC_* |
| GET | `/complaints/categories` | 분류 코드 트리 조회 | - | 공개 |
| GET | `/complaints/similar` | 유사 선례 검색 (G-07) | JWT | BRC_OFFICER |

#### 12.1.3 부패 신고 서비스 (Anti-Corruption Service)

| Method | Endpoint | 설명 | 인증 | 역할 |
|--------|----------|------|------|------|
| GET | `/reports` | 신고 목록 조회 | JWT | DGGPC_*, BCRC_ADMIN |
| POST | `/reports` | 신고 접수 | JWT/ANON | CITIZEN, ANONYMOUS |
| GET | `/reports/:id` | 신고 상세 조회 | JWT | DGGPC_*, BCRC_ADMIN |
| PATCH | `/reports/:id/status` | 신고 상태 변경 | JWT | DGGPC_OFFICER, DGGPC_MANAGER |
| GET | `/reports/track` | 익명 추적 조회 | ANON Token | ANONYMOUS |
| POST | `/reports/:id/evidence` | 증거 자료 추가 | JWT/ANON | CITIZEN, ANONYMOUS |
| GET | `/reports/:id/history` | 조사 이력 조회 | JWT | DGGPC_* |

#### 12.1.4 국민제안 서비스 (eParticipation Service)

| Method | Endpoint | 설명 | 인증 | 역할 |
|--------|----------|------|------|------|
| GET | `/proposals` | 제안 목록 조회 | - | 공개 |
| POST | `/proposals` | 제안 작성 | JWT | CITIZEN |
| GET | `/proposals/:id` | 제안 상세 조회 | - | 공개 |
| POST | `/proposals/:id/like` | 공감 토글 | JWT | CITIZEN |
| PATCH | `/proposals/:id/review` | 제안 심사 | JWT | BCRC_ADMIN |
| POST | `/proposals/:id/implementation` | 이행 현황 업데이트 | JWT | BCRC_ADMIN |
| GET | `/proposals/:id/implementation` | 이행 현황 조회 | - | 공개 |

#### 12.1.5 통계 서비스 (Statistics Service)

| Method | Endpoint | 설명 | 인증 | 역할 |
|--------|----------|------|------|------|
| GET | `/statistics/dashboard` | 대시보드 KPI | JWT | BRC_*, BCRC_*, SYS_ADMIN |
| GET | `/statistics/trends` | 민원 추이 (월별) | JWT | BRC_*, BCRC_* |
| GET | `/statistics/by-type` | 유형별 통계 | JWT | BRC_*, BCRC_* |
| GET | `/statistics/by-agency` | 기관별 통계 | JWT | BCRC_ADMIN |
| GET | `/statistics/repeated` | 반복 민원 분석 (G-06) | JWT | BRC_MANAGER, BCRC_ADMIN |
| GET | `/statistics/overdue` | 장기 미처리 분석 | JWT | BRC_MANAGER, BCRC_ADMIN |
| GET | `/statistics/satisfaction` | 만족도 통계 | JWT | BRC_*, BCRC_* |
| GET | `/statistics/agency-performance` | 기관 성과 (G-11) | JWT | BCRC_ADMIN |
| GET | `/statistics/export` | 통계 데이터 엑셀 내보내기 | JWT | BCRC_ADMIN |

#### 12.1.6 문서 서비스 (Document Service)

| Method | Endpoint | 설명 | 인증 | 역할 |
|--------|----------|------|------|------|
| POST | `/documents/upload` | 파일 업로드 | JWT | 모든 인증 사용자 |
| GET | `/documents/:id` | 파일 다운로드 | JWT | 권한에 따라 |
| GET | `/documents/:id/metadata` | 파일 메타데이터 조회 | JWT | 권한에 따라 |
| DELETE | `/documents/:id` | 파일 삭제 (Soft Delete) | JWT | 소유자, SYS_ADMIN |
| POST | `/documents/:id/verify` | 파일 무결성 검증 | JWT | BRC_*, DGGPC_* |
| GET | `/documents/complaint/:complaintId` | 민원별 첨부파일 목록 | JWT | 권한에 따라 |

#### 12.1.7 알림 서비스 (Notification Service)

| Method | Endpoint | 설명 | 인증 | 역할 |
|--------|----------|------|------|------|
| GET | `/notifications` | 내 알림 목록 | JWT | 모든 인증 사용자 |
| PATCH | `/notifications/:id/read` | 알림 읽음 처리 | JWT | 모든 인증 사용자 |
| PATCH | `/notifications/read-all` | 전체 읽음 처리 | JWT | 모든 인증 사용자 |
| GET | `/notifications/unread-count` | 읽지 않은 알림 수 | JWT | 모든 인증 사용자 |
| PUT | `/notifications/preferences` | 알림 설정 변경 | JWT | 모든 인증 사용자 |
| GET | `/notifications/delivery-status` | 발송 상태 조회 (G-10) | JWT | SYS_ADMIN |

#### 12.1.8 헬프데스크 서비스 (Helpdesk Service)

| Method | Endpoint | 설명 | 인증 | 역할 |
|--------|----------|------|------|------|
| GET | `/helpdesk/tickets` | 티켓 목록 조회 | JWT | BRC_*, BCRC_* |
| POST | `/helpdesk/tickets` | 티켓 생성 (전화 접수) | JWT | BRC_OFFICER |
| GET | `/helpdesk/tickets/:id` | 티켓 상세 조회 | JWT | BRC_*, BCRC_* |
| PATCH | `/helpdesk/tickets/:id` | 티켓 업데이트 | JWT | BRC_OFFICER |
| GET | `/helpdesk/citizen-profile/:citizenId` | 시민 프로필 (CRM) | JWT | BRC_OFFICER |
| GET | `/helpdesk/faq` | FAQ 목록 | - | 공개 |
| POST | `/helpdesk/faq` | FAQ 등록 | JWT | BCRC_ADMIN |

#### 12.1.9 관리 서비스 (Admin Service)

| Method | Endpoint | 설명 | 인증 | 역할 |
|--------|----------|------|------|------|
| GET | `/admin/agencies` | 기관 목록 조회 | JWT | BCRC_ADMIN, SYS_ADMIN |
| POST | `/admin/agencies` | 기관 등록 | JWT | SYS_ADMIN |
| PATCH | `/admin/agencies/:id` | 기관 정보 수정 | JWT | SYS_ADMIN |
| GET | `/admin/users` | 사용자 목록 조회 | JWT | BCRC_ADMIN, SYS_ADMIN |
| POST | `/admin/users` | 사용자 등록 | JWT | SYS_ADMIN |
| PATCH | `/admin/users/:id` | 사용자 정보 수정 | JWT | SYS_ADMIN |
| PATCH | `/admin/users/:id/role` | 사용자 역할 변경 | JWT | SYS_ADMIN |
| GET | `/admin/codes` | 공통 코드 조회 | JWT | BRC_*, BCRC_*, SYS_ADMIN |
| POST | `/admin/codes` | 공통 코드 등록 | JWT | SYS_ADMIN |
| GET | `/admin/sla-config` | SLA 설정 조회 | JWT | BCRC_ADMIN, SYS_ADMIN |
| PATCH | `/admin/sla-config` | SLA 설정 변경 | JWT | BCRC_ADMIN |
| GET | `/admin/audit-logs` | 감사 로그 조회 | JWT | BCRC_ADMIN, SYS_ADMIN |
| GET | `/admin/system-health` | 시스템 상태 조회 | JWT | SYS_ADMIN |
| GET | `/admin/documentation` | 법령/매뉴얼 목록 (G-14) | JWT | BRC_*, BCRC_* |
| POST | `/admin/documentation` | 법령/매뉴얼 등록 (G-14) | JWT | BCRC_ADMIN |

### 12.2 이벤트/메시지 목록

#### 12.2.1 민원 도메인 이벤트

| 이벤트 이름 | 발행 서비스 | 구독 서비스 | 발행 시점 | 페이로드 주요 필드 |
|------------|-----------|-----------|-----------|-------------------|
| `complaint.received` | Complaint | Notification, Statistics | 민원 접수 완료 | complaintId, type, citizenId, agencyId |
| `complaint.assigned` | Complaint | Notification | 담당자 배분 | complaintId, officerId, agencyId |
| `complaint.processing` | Complaint | Statistics | 처리 시작 | complaintId, officerId |
| `complaint.transferred` | Complaint | Notification, Statistics | 이관 완료 | complaintId, fromAgency, toAgency, transferCount |
| `complaint.completed` | Complaint | Notification, Statistics | 처리 완료 | complaintId, answerId, completedAt |
| `complaint.closed` | Complaint | Statistics | 최종 종결 | complaintId, closedAt, satisfactionScore |
| `complaint.deadline_warning` | Complaint | Notification | D-3일 경고 | complaintId, deadline, agencyId |
| `complaint.overdue` | Complaint | Notification, Admin | 기한 초과 | complaintId, deadline, overdueDays |
| `extension.requested` | Complaint | Notification | 기한 연장 신청 | complaintId, extensionId, requestedDays |
| `extension.approved` | Complaint | Notification | 기한 연장 승인 | complaintId, extensionId, newDeadline |
| `extension.rejected` | Complaint | Notification | 기한 연장 반려 | complaintId, extensionId, reason |
| `joint.started` | Complaint | Notification | 공동처리 시작 | complaintId, leadAgencyId, cooperatingIds |
| `joint.opinion_submitted` | Complaint | Notification | 협조기관 의견 제출 | complaintId, agencyId, opinionId |
| `satisfaction.submitted` | Complaint | Statistics | 만족도 평가 | complaintId, score, comment |
| `transfer.bcrc_alert` | Complaint | Notification, Admin | 이관 3회+ BCRC 보고 | complaintId, transferCount |

#### 12.2.2 부패 신고 도메인 이벤트

| 이벤트 이름 | 발행 서비스 | 구독 서비스 | 발행 시점 | 페이로드 주요 필드 |
|------------|-----------|-----------|-----------|-------------------|
| `report.received` | Anti-Corruption | Notification | 신고 접수 | reportId, type, isAnonymous |
| `report.preliminary_review` | Anti-Corruption | Notification | 예비 검토 시작 | reportId, reviewerId |
| `report.under_investigation` | Anti-Corruption | Notification | 정식 조사 개시 | reportId, investigatorId |
| `report.completed` | Anti-Corruption | Notification, Statistics | 조사 완료 | reportId, result |
| `report.evidence_added` | Anti-Corruption | Notification | 증거 자료 추가 | reportId, evidenceId |

#### 12.2.3 국민제안 도메인 이벤트

| 이벤트 이름 | 발행 서비스 | 구독 서비스 | 발행 시점 | 페이로드 주요 필드 |
|------------|-----------|-----------|-----------|-------------------|
| `proposal.submitted` | eParticipation | Notification | 제안 접수 | proposalId, citizenId |
| `proposal.liked` | eParticipation | Statistics | 공감 추가 | proposalId, likeCount |
| `proposal.reviewed` | eParticipation | Notification | 심사 완료 | proposalId, result |
| `proposal.implementation_update` | eParticipation | Notification | 이행 현황 업데이트 | proposalId, progress |

#### 12.2.4 시스템 이벤트

| 이벤트 이름 | 발행 서비스 | 구독 서비스 | 발행 시점 | 페이로드 주요 필드 |
|------------|-----------|-----------|-----------|-------------------|
| `user.logged_in` | Auth | Admin (Audit) | 로그인 성공 | userId, role, loginMethod, ipAddress |
| `user.logged_out` | Auth | Admin (Audit) | 로그아웃 | userId |
| `user.login_failed` | Auth | Admin (Audit), Notification | 로그인 실패 | loginId, reason, ipAddress, attemptCount |
| `notification.sent` | Notification | Admin (Audit) | 알림 발송 | notificationId, channel, recipientId |
| `notification.failed` | Notification | Admin (Audit) | 알림 발송 실패 | notificationId, channel, error, retryCount |
| `document.uploaded` | Document | Admin (Audit) | 파일 업로드 | documentId, fileName, sizeBytes, uploaderId |
| `document.downloaded` | Document | Admin (Audit) | 파일 다운로드 | documentId, downloaderId |
| `sla.config_changed` | Admin | Complaint | SLA 설정 변경 | slaType, oldValue, newValue, changedBy |
| `agency.created` | Admin | Statistics | 기관 신규 등록 | agencyId, agencyName, agencyType |

### 12.3 환경 변수 목록

#### 12.3.1 공통 환경 변수

| 변수명 | 설명 | 예시 값 | 필수 |
|--------|------|---------|------|
| `APP_ENV` | 실행 환경 | `dev` / `staging` / `uat` / `prod` | Y |
| `APP_PORT` | 서비스 포트 | `8080` | Y |
| `LOG_LEVEL` | 로그 레벨 | `debug` / `info` / `warn` / `error` | Y |
| `JWT_SECRET` | JWT 서명 키 | (256-bit 이상) | Y |
| `JWT_ACCESS_EXPIRY` | Access Token 만료 시간 | `1h` | Y |
| `JWT_REFRESH_EXPIRY` | Refresh Token 만료 시간 | `7d` | Y |

#### 12.3.2 데이터베이스 환경 변수

| 변수명 | 설명 | 예시 값 | 필수 |
|--------|------|---------|------|
| `DB_HOST` | PostgreSQL 호스트 | `postgres-prod.internal` | Y |
| `DB_PORT` | PostgreSQL 포트 | `5432` | Y |
| `DB_NAME` | 데이터베이스 이름 | `complaint_db` / `auth_db` / ... | Y |
| `DB_USER` | 데이터베이스 사용자 | `epeople_svc` | Y |
| `DB_PASSWORD` | 데이터베이스 비밀번호 | (Kubernetes Secret 참조) | Y |
| `DB_POOL_MIN` | 최소 커넥션 풀 | `5` | N |
| `DB_POOL_MAX` | 최대 커넥션 풀 | `20` | N |
| `DB_SSL_MODE` | SSL 모드 | `require` | Y (운영) |

#### 12.3.3 Redis 환경 변수

| 변수명 | 설명 | 예시 값 | 필수 |
|--------|------|---------|------|
| `REDIS_HOST` | Redis 호스트 | `redis-prod.internal` | Y |
| `REDIS_PORT` | Redis 포트 | `6379` | Y |
| `REDIS_PASSWORD` | Redis 비밀번호 | (Kubernetes Secret 참조) | Y |
| `REDIS_DB` | Redis DB 번호 | `0` (서비스별 분리) | N |
| `REDIS_SENTINEL_HOSTS` | Sentinel 호스트 목록 | `sentinel-1:26379,sentinel-2:26379` | Y (운영) |
| `REDIS_SENTINEL_MASTER` | Sentinel Master 이름 | `epeople-master` | Y (운영) |

#### 12.3.4 RabbitMQ 환경 변수

| 변수명 | 설명 | 예시 값 | 필수 |
|--------|------|---------|------|
| `RABBITMQ_HOST` | RabbitMQ 호스트 | `rabbitmq-prod.internal` | Y |
| `RABBITMQ_PORT` | AMQP 포트 | `5672` | Y |
| `RABBITMQ_USER` | RabbitMQ 사용자 | `epeople_svc` | Y |
| `RABBITMQ_PASSWORD` | RabbitMQ 비밀번호 | (Kubernetes Secret 참조) | Y |
| `RABBITMQ_VHOST` | Virtual Host | `/epeople` | Y |

#### 12.3.5 MinIO 환경 변수

| 변수명 | 설명 | 예시 값 | 필수 |
|--------|------|---------|------|
| `MINIO_ENDPOINT` | MinIO 엔드포인트 | `minio-prod.internal:9000` | Y |
| `MINIO_ACCESS_KEY` | MinIO Access Key | (Kubernetes Secret 참조) | Y |
| `MINIO_SECRET_KEY` | MinIO Secret Key | (Kubernetes Secret 참조) | Y |
| `MINIO_BUCKET` | 기본 버킷 | `epeople-prod-documents` | Y |
| `MINIO_REGION` | 리전 | `tn-tunis-1` | N |
| `MINIO_USE_SSL` | SSL 사용 여부 | `true` | Y (운영) |

#### 12.3.6 외부 연계 환경 변수

| 변수명 | 설명 | 예시 값 | 필수 |
|--------|------|---------|------|
| `ELISE_BROKER_URL` | ELISE 연계 브로커 URL | `https://elise.gov.tn/broker` | Y |
| `ELISE_API_KEY` | ELISE API 인증 키 | (Kubernetes Secret 참조) | Y |
| `TUNTRUST_OCSP_URL` | Tuntrust OCSP URL | `https://ocsp.tuntrust.tn` | Y |
| `TUNTRUST_CRL_URL` | Tuntrust CRL URL | `https://crl.tuntrust.tn` | Y |
| `DIGIGO_SSO_URL` | DigiGo SSO 엔드포인트 | `https://sso.digigo.tn` | Y |
| `DIGIGO_CLIENT_ID` | DigiGo 클라이언트 ID | `epeople2-client` | Y |
| `DIGIGO_CLIENT_SECRET` | DigiGo 클라이언트 시크릿 | (Kubernetes Secret 참조) | Y |
| `SMS_GATEWAY_URL` | SMS 게이트웨이 URL | `https://sms.tunisietelecom.tn/api` | Y |
| `SMS_API_KEY` | SMS API 키 | (Kubernetes Secret 참조) | Y |
| `SMTP_HOST` | SMTP 서버 호스트 | `smtp.gov.tn` | Y |
| `SMTP_PORT` | SMTP 포트 | `587` | Y |
| `SMTP_USER` | SMTP 사용자 | `noreply@epeople2.gov.tn` | Y |
| `SMTP_PASSWORD` | SMTP 비밀번호 | (Kubernetes Secret 참조) | Y |

### 12.4 기술 스택 요약표

#### 12.4.1 프론트엔드 기술 스택 (프로토타입)

| 영역 | 기술 | 버전 | 용도 |
|------|------|------|------|
| 언어 | TypeScript | 5.2+ | 정적 타입 |
| 프레임워크 | React | 18.2+ | UI 컴포넌트 |
| 빌드 도구 | Vite | 5.0+ | 빌드/번들링 |
| 스타일링 | Tailwind CSS | 3.3+ | 유틸리티 기반 CSS (RTL 지원) |
| 라우팅 | React Router | 6.20+ | SPA 라우팅 |
| 전역 상태 | Zustand | 4.4+ | 클라이언트 상태 관리 |
| 서버 상태 | TanStack Query | 5.8+ | API 데이터 캐싱/동기화 |
| 다국어 | i18next + react-i18next | 23.7+ / 13.5+ | 아랍어/프랑스어 i18n |
| 차트 | Recharts | 2.10+ | 통계 시각화 |
| 아이콘 | Lucide React | 0.294+ | SVG 아이콘 |
| 폼 | React Hook Form + Zod | 7.49+ / 3.22+ | 폼 관리 + 유효성 검증 |
| 파일 업로드 | react-dropzone | 14.2+ | Drag & Drop 파일 업로드 |
| Mock API | MSW | 2.0+ | 서비스 워커 기반 Mock |
| UI 컴포넌트 | Headless UI | 1.7+ | 접근성 컴포넌트 |
| 유틸 | clsx + tailwind-merge | 2.0+ / 2.1+ | CSS 클래스 결합 |
| 날짜 | date-fns | 3.0+ | 날짜 연산/포맷 |
| HTTP | Axios | 1.6+ | HTTP 클라이언트 |

#### 12.4.2 백엔드 기술 스택 (PC1 구현 권장)

| 영역 | 기술 | 버전 | 용도 |
|------|------|------|------|
| 언어 | Java | 17+ (LTS) | 서비스 구현 |
| 프레임워크 | Spring Boot | 3.x | MSA 서비스 프레임워크 |
| API 문서 | SpringDoc OpenAPI | 2.x | Swagger UI 자동 생성 |
| ORM | JPA/Hibernate | 6.x | 데이터베이스 접근 |
| DB 마이그레이션 | Flyway | 9.x | 스키마 버전 관리 |
| 보안 | Spring Security | 6.x | 인증/인가 |
| 메시징 | Spring AMQP | 3.x | RabbitMQ 연동 |
| 캐시 | Spring Data Redis | 3.x | Redis 캐시 |

#### 12.4.3 인프라 기술 스택

| 영역 | 기술 | 용도 |
|------|------|------|
| 컨테이너 런타임 | Docker | 컨테이너 빌드/실행 |
| 오케스트레이션 | Kubernetes | 컨테이너 배포/관리 |
| API Gateway | Kong (OSS) | 라우팅, Rate Limiting, 인증 |
| Service Mesh | Istio / Linkerd | mTLS, Circuit Breaker, 분산 추적 |
| 데이터베이스 | PostgreSQL 15 | 관계형 데이터 저장 |
| 캐시/세션 | Redis 7 (Sentinel) | 캐시, 세션, 분산 락 |
| 메시지 브로커 | RabbitMQ 3.12 | 비동기 이벤트, 알림 큐 |
| 파일 스토리지 | MinIO | S3 호환 객체 스토리지 |
| CI/CD | GitLab CI | 빌드, 테스트, 배포 자동화 |
| 코드 저장소 | GitLab | 소스 코드 버전 관리 |
| 모니터링 | Prometheus + Grafana | 메트릭 수집/시각화 |
| 로그 | ELK Stack | 분산 로그 수집/분석 |
| 분산 추적 | Jaeger | MSA 요청 추적 |
| 보안 스캔 | SonarQube + Trivy + OWASP DC | SAST + Container Scan + SCA |
| 백업 | Velero + pg_basebackup | K8s 클러스터 + DB 백업 |
| DNS | Route 53 / Internal DNS | 도메인 관리 |
| TLS 인증서 | ANSE 인증서 + Let's Encrypt | HTTPS 암호화 |

### 12.5 갭 기능 참조 매핑 (Gap Feature Cross-Reference)

| 갭 ID | 기능명 | 관련 마이크로서비스 | 관련 API 엔드포인트 | 관련 이벤트 | 문서 섹션 참조 |
|--------|--------|-------------------|-------------------|------------|---------------|
| G-01 | 민원 5유형 분류 체계 | Complaint | `POST /complaints` | `complaint.received` | 3.2.1, 3.2.3 |
| G-02 | 이관 횟수 통제 (2회 경고 / 3회 BCRC 보고) | Complaint | `POST /:id/transfer` | `complaint.transferred`, `transfer.bcrc_alert` | 3.2.2, 9.4 |
| G-03 | 다기관 공동처리 체계 | Complaint | `POST /:id/joint-process`, `POST /:id/opinion` | `joint.started`, `joint.opinion_submitted` | 3.2.7, 9.6 |
| G-04 | 기한 연장 신청 및 승인 워크플로우 | Complaint | `POST /:id/extend`, `PATCH /:id/extend/:extId` | `extension.requested`, `extension.approved` | 3.2.6, 9.5 |
| G-05 | 국민제안 공감(좋아요) 시스템 | eParticipation | `POST /proposals/:id/like` | `proposal.liked` | 3.4.1, 3.4.3 |
| G-06 | 반복 민원 분석 (동일 시민 3회+ 접수) | Statistics | `GET /statistics/repeated` | `complaint.received` (집계) | 3.5.3 |
| G-07 | AI 기반 유사 선례 검색 | Complaint | `GET /complaints/similar` | - | 3.2 (추가) |
| G-08 | ELISE 정부 문서 교환 연계 | Document, Admin | (내부 연계) | `elise.document_received` | 5.1 |
| G-09 | 1881 콜센터 CTI 연동 | Helpdesk | `POST /helpdesk/tickets` | `ticket.created` | 3.8.1, 5.6 |
| G-10 | 알림 발송 상태 추적 | Notification | `GET /notifications/delivery-status` | `notification.sent`, `notification.failed` | 3.7.3 |
| G-11 | BCRC 통합 기관 성과 관리 | Statistics, Admin | `GET /statistics/agency-performance` | `complaint.completed` (집계) | 3.5.4, 3.9 |
| G-12 | PKI 전자서명 (Tuntrust) | Auth | `POST /auth/pki-login` | `user.logged_in` | 3.1.3, 5.2 |
| G-13 | 저사양 기기/저속망 최적화 | (프론트엔드 전체) | - | - | 8.5 |
| G-14 | 법령/매뉴얼 통합 관리 | Admin | `GET /admin/documentation`, `POST /admin/documentation` | - | 3.9.5 |

### 12.6 용어 사전 (Glossary)

| 한국어 | 영어 | 프랑스어 | 아랍어 | 설명 |
|--------|------|---------|--------|------|
| 민원 | Complaint / Petition | Plainte / Pétition | شكوى | 시민이 정부 기관에 제출하는 모든 유형의 요청 |
| 고충민원 | Grievance | Doléance | تظلم | 권리 침해에 대한 구제 요청 (SLA: 60일) |
| 제안 | Proposal | Proposition | اقتراح | 정책 개선 제안 (SLA: 30일) |
| 질의 | Inquiry | Question | استفسار | 법령/절차 문의 (SLA: 7일) |
| 건의 | Suggestion | Observation | ملاحظة | 행정 개선 건의 (SLA: 30일) |
| 신고 | Report | Signalement | بلاغ | 위법행위 신고 (SLA: 15일) |
| 부패 신고 | Corruption Report | Dénonciation de corruption | بلاغ فساد | DGGPC 관할 부패/비리 신고 |
| 국민제안 | Citizen Proposal | Proposition citoyenne | مقترح مواطن | 시민 주도 정책 제안 + 공감 시스템 |
| 이관 | Transfer | Transfert | تحويل | 민원을 다른 기관으로 이동 |
| 공동처리 | Joint Processing | Traitement conjoint | معالجة مشتركة | 다수 기관 협력 처리 |
| BRC | Bureau of Citizen Relations | Bureau des Relations avec le Citoyen | مكتب العلاقات مع المواطن | 각 부처 시민관계사무소 |
| BCRC | Central BRC | Bureau Central des Relations avec le Citoyen | المكتب المركزي للعلاقات مع المواطن | 총리실 중앙 시민관계사무소 |
| DGGPC | Directorate General | Direction Générale de la Gouvernance et de la Prévention de la Corruption | الإدارة العامة للحوكمة ومكافحة الفساد | 부패방지총국 |
| INPDP | Data Protection Authority | Instance Nationale de Protection des Données Personnelles | الهيئة الوطنية لحماية المعطيات الشخصية | 개인정보보호기관 |
| ANSE | Cybersecurity Authority | Agence Nationale de la Sécurité Informatique | الوكالة الوطنية للسلامة المعلوماتية | 국가사이버보안기관 |
| CNI | National Cloud | Cloud National Intégré | السحابة الوطنية المتكاملة | 튀니지 정부 통합 클라우드 |
| ELISE | Government Document Exchange | Système d'échange de documents gouvernementaux | نظام تبادل الوثائق الحكومية | 정부 전자문서 교환 시스템 |
| SLA | Service Level Agreement | Accord de niveau de service | اتفاقية مستوى الخدمة | 서비스 수준 협약 (처리 기한) |
| KPI | Key Performance Indicator | Indicateur clé de performance | مؤشر الأداء الرئيسي | 핵심 성과 지표 |

### 12.7 문서 변경 이력

| 버전 | 일자 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| v0.1 | 2024-12-01 | PMC AA 전문가 | 초안 작성 (섹션 1~3 마이크로서비스 설계) |
| v0.5 | 2025-01-15 | PMC AA 전문가 | 인프라, 보안, 외부 연계 섹션 추가 (섹션 4~6) |
| v0.8 | 2025-02-15 | PMC AA 전문가 | i18n, 성능, 데이터 흐름도 섹션 추가 (섹션 7~9) |
| v0.9 | 2025-03-01 | PMC AA 전문가 | 배포, DR, 부록 섹션 추가 (섹션 10~12) |
| **v1.0** | **2025-03-15** | **PMC AA 전문가** | **최종 검토 완료, PC1 제공용 확정판** |

### 12.8 참조 문서 목록

| 문서명 | 파일 경로 | 설명 |
|--------|-----------|------|
| 기능 내역서 v2 | `docs/기능내역서_v2.md` | 124개 기능 전체 목록, 갭 기능 정의 |
| 소프트웨어 요구사항 명세서 (SRS) | `docs/SRS.md` | 기능/비기능 요구사항, 화면 목록 |
| 데이터 모델 설계서 | `docs/DATA_MODEL.md` | 타입 정의, ERD, 목 데이터 설계 |
| API 명세서 | `docs/API_SPEC.md` | 전체 엔드포인트, 요청/응답 형식 |
| 갭 분석서 | `docs/GAP_ANALYSIS.md` | 국민신문고 벤치마킹, 갭 기능 분석 |
| 기술 스택 가이드 | `docs/TECH_STACK.md` | 기술 선택 근거, 패키지 구성 |
| UI 가이드라인 | `docs/UI_GUIDELINES.md` | 디자인 시스템, 컴포넌트 명세 |

---

*문서 버전: v1.0 | 상세 어플리케이션 설계서 | PMC AA 전문가 작성 | KOICA ODA Tunisia e-People II*
