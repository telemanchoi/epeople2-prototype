# e-People II 상세 데이터베이스 설계서

> **프로젝트**: 튀니지 전자참여 확대 및 부패방지 시스템(e-People II) 고도화
> **발주**: KOICA ODA (2024-2028, $6M USD)
> **수원기관**: 튀니지 총리실 BCRC (Bureau Central des Relations avec le Citoyen)
> **문서 버전**: v1.0
> **작성자**: PMC 데이터 아키텍처(DA) 전문가
> **대상 독자**: PC1 현지 시스템 개발업체, PMC AA/TA 전문가, CNI DBA
> **DBMS**: PostgreSQL 15 (Primary) + Redis 7 (Cache)

---

## 목차

1. [문서 개요](#1-문서-개요)
2. [데이터베이스 아키텍처](#2-데이터베이스-아키텍처)
3. [ERD (Entity Relationship Diagram)](#3-erd-entity-relationship-diagram)
4. [테이블 정의서 (DDL)](#4-테이블-정의서-ddl)
5. [인덱스 설계](#5-인덱스-설계)
6. [초기 데이터 (Seed Data)](#6-초기-데이터-seed-data)
7. [데이터 마이그레이션 전략](#7-데이터-마이그레이션-전략)
8. [보안 설계](#8-보안-설계)
9. [성능 최적화](#9-성능-최적화)
10. [Redis 캐시 설계](#10-redis-캐시-설계)
11. [백업 및 복구](#11-백업-및-복구)
12. [모니터링](#12-모니터링)
13. [부록](#13-부록)

---

## 1. 문서 개요

### 1.1 목적

본 문서는 튀니지 e-People II 시스템의 **상세 데이터베이스 설계서(Detailed Database Design Document)**로서, PC1 현지 시스템 개발업체가 데이터베이스를 구축할 때 참조하는 컨설팅 산출물이다.

본 문서는 다음을 포함한다:
- 9개 마이크로서비스별 데이터베이스 스키마 설계
- 전체 테이블의 DDL(Data Definition Language) 정의
- 인덱스 설계 및 성능 최적화 전략
- 보안 설계 (암호화, RLS, 감사 로그)
- Redis 캐시 설계 및 백업/복구 전략

### 1.2 대상 독자

| 독자 | 활용 목적 |
|------|-----------|
| PC1 개발업체 DBA | DDL 구현, 인덱스 생성, 성능 튜닝 |
| PC1 개발업체 백엔드 개발자 | ORM 매핑, 쿼리 작성, 트랜잭션 설계 |
| PMC AA/TA 전문가 | 설계 검증, 코드 리뷰 |
| CNI DBA | 운영 환경 구성, 백업/복구 운영 |
| BCRC 시스템 관리자 | 데이터 관리 정책 이해 |

### 1.3 문서 범위

본 문서의 범위는 다음과 같다:
- **포함**: 9개 마이크로서비스 데이터베이스의 논리/물리 설계, DDL, 인덱스, 보안, 캐시, 백업
- **제외**: 애플리케이션 로직, API 설계(API_SPEC.md 참조), UI 설계(UI_GUIDELINES.md 참조)

### 1.4 참조 문서

| 문서 | 관계 |
|------|------|
| DATA_MODEL.md | 타입 정의, ERD, 목 데이터 설계 -- 본 문서의 상위 설계 |
| SRS.md | 기능/비기능 요구사항 -- 본 문서의 설계 근거 |
| API_SPEC.md | API 엔드포인트/요청/응답 -- 쿼리 패턴의 근거 |
| GAP_ANALYSIS.md | 갭 분석 결과 -- G-01~G-14 반영 근거 |
| 기능내역서_v2.md | 124개 기능 목록 -- 테이블 도출 근거 |

### 1.5 설계 원칙

| 원칙 ID | 원칙 | 상세 |
|---------|------|------|
| DP-01 | **민원-부패신고 완전 분리** | Complaint와 CorruptionReport는 별도 데이터베이스에 저장. 절대 동일 테이블/스키마에 혼재 불가. (담당조직: BCRC vs DGGPC, 보안등급: 일반 vs 기밀) |
| DP-02 | **다국어 필드 접미사** | 모든 다국어 컬럼은 `_fr`(프랑스어), `_ar`(아랍어) 접미사 사용. 예: `title_fr`, `title_ar` |
| DP-03 | **ID 형식 규칙** | 비즈니스 ID는 PREFIX-YYYY-NNNNNN 형식. 내부 PK는 UUID v4 |
| DP-04 | **날짜/시간 UTC** | 모든 TIMESTAMP 컬럼은 `TIMESTAMP WITH TIME ZONE`, UTC 저장 |
| DP-05 | **Database per Service** | 각 마이크로서비스는 독립 데이터베이스 소유. 서비스 간 직접 JOIN 금지 |
| DP-06 | **개인정보 암호화** | citizen_id, phone, email, anonymous_token은 AES-256-GCM 컬럼 레벨 암호화 |
| DP-07 | **소프트 삭제** | 주요 엔티티는 `deleted_at` TIMESTAMP 컬럼으로 소프트 삭제. 물리 삭제 금지 |
| DP-08 | **감사 추적** | 모든 테이블에 `created_at`, `updated_at`, `created_by`, `updated_by` 컬럼 필수 |

### 1.6 명명 규칙

#### 데이터베이스 명명
```
패턴: epeople2_{service_name}
예시: epeople2_auth, epeople2_complaint, epeople2_anticorruption
```

#### 테이블 명명
```
규칙: snake_case, 복수형, 소문자
예시: complaints, complaint_histories, corruption_reports
```

#### 컬럼 명명
```
규칙: snake_case, 소문자
PK  : id (UUID)
FK  : {참조테이블_단수}_id
다국어: {필드명}_fr, {필드명}_ar
날짜 : {행위}_at (created_at, submitted_at, deadline_at)
불린 : is_{상태} (is_active, is_anonymous)
카운트: {대상}_count (transfer_count, like_count)
```

#### 인덱스 명명
```
PK     : pk_{테이블명}
UK     : uk_{테이블명}_{컬럼명}
FK IDX : idx_{테이블명}_{FK컬럼명}
일반   : idx_{테이블명}_{컬럼명들}
부분   : pidx_{테이블명}_{설명}
```

#### 제약 조건 명명
```
FK  : fk_{테이블명}_{참조테이블명}
CHK : chk_{테이블명}_{설명}
UQ  : uq_{테이블명}_{컬럼명}
```

---

## 2. 데이터베이스 아키텍처

### 2.1 Database per Service 패턴

e-People II는 MSA(Micro Service Architecture) 기반으로 설계되며, 각 마이크로서비스는 독립된 데이터베이스를 소유한다. 서비스 간 데이터 참조는 API 호출 또는 이벤트 기반으로 수행하며, 직접 데이터베이스 JOIN은 금지한다.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        e-People II MSA 데이터베이스                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐  ┌──────────────────┐  ┌────────────────────┐    │
│  │  Auth Service │  │ Complaint Service │  │ AntiCorruption Svc │    │
│  │              │  │                  │  │                    │    │
│  │ epeople2_    │  │ epeople2_        │  │ epeople2_          │    │
│  │ auth         │  │ complaint        │  │ anticorruption     │    │
│  │              │  │                  │  │                    │    │
│  │ - users      │  │ - complaints     │  │ - corruption_      │    │
│  │ - sessions   │  │ - histories      │  │   reports          │    │
│  │ - roles      │  │ - transfers      │  │ - investigation_   │    │
│  │ - audit_log  │  │ - categories     │  │   notes            │    │
│  └──────┬───────┘  └────────┬─────────┘  └─────────┬──────────┘    │
│         │                   │                       │                │
│  ┌──────┴───────┐  ┌───────┴──────────┐  ┌────────┴───────────┐    │
│  │eParticipation│  │ Statistics Svc   │  │  Document Svc      │    │
│  │  Service     │  │                  │  │                    │    │
│  │ epeople2_    │  │ epeople2_        │  │ epeople2_          │    │
│  │ eparticipa-  │  │ statistics       │  │ document           │    │
│  │ tion         │  │                  │  │                    │    │
│  │ - proposals  │  │ - daily_stats    │  │ - documents        │    │
│  │ - likes      │  │ - agency_perf    │  │ - versions         │    │
│  │ - reviews    │  │ - reports        │  │ - access_controls  │    │
│  └──────────────┘  └──────────────────┘  └────────────────────┘    │
│                                                                       │
│  ┌──────────────┐  ┌──────────────────┐  ┌────────────────────┐    │
│  │ Notification │  │ Helpdesk Service │  │  Admin Service      │    │
│  │  Service     │  │                  │  │                    │    │
│  │ epeople2_    │  │ epeople2_        │  │ epeople2_          │    │
│  │ notification │  │ helpdesk         │  │ admin              │    │
│  │              │  │                  │  │                    │    │
│  │ - notifica-  │  │ - tickets        │  │ - agencies         │    │
│  │   tions      │  │ - faq_articles   │  │ - sla_configs      │    │
│  │ - sms_log    │  │ - knowledge_base │  │ - common_codes     │    │
│  └──────────────┘  └──────────────────┘  └────────────────────┘    │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 9개 데이터베이스 목록

| # | 데이터베이스명 | 담당 서비스 | 핵심 엔티티 | 예상 데이터량 (5년) |
|---|---------------|------------|------------|-------------------|
| 1 | `epeople2_auth` | Auth Service | 사용자, 세션, 역할, 감사 로그 | 50만 행 |
| 2 | `epeople2_complaint` | Complaint Service | 민원, 처리이력, 이관, 공동처리 | 500만 행 |
| 3 | `epeople2_anticorruption` | Anti-Corruption Service | 부패신고, 조사메모, 신고자보호 | 10만 행 |
| 4 | `epeople2_eparticipation` | eParticipation Service | 국민제안, 공감, 심사결과 | 50만 행 |
| 5 | `epeople2_statistics` | Statistics Service | 통계 집계, 기관성과, 보고서 | 100만 행 |
| 6 | `epeople2_document` | Document Service | 전자문서, 버전, 접근통제 | 200만 행 |
| 7 | `epeople2_notification` | Notification Service | 알림, SMS/이메일 로그 | 1,000만 행 |
| 8 | `epeople2_helpdesk` | Helpdesk Service | 상담 Ticket, FAQ, 지식베이스 | 100만 행 |
| 9 | `epeople2_admin` | Admin Service | 기관, SLA, 공통코드, 시스템설정 | 1만 행 |

### 2.3 PostgreSQL 15 구성 권장사항

#### 서버 사양 (운영 환경 기준)

| 구성 요소 | 최소 사양 | 권장 사양 |
|----------|----------|----------|
| CPU | 8 vCPU | 16 vCPU |
| Memory | 32 GB | 64 GB |
| Storage | 500 GB SSD | 1 TB NVMe SSD |
| Network | 1 Gbps | 10 Gbps |

#### postgresql.conf 핵심 설정

```ini
# -- 메모리 설정 (64GB RAM 기준) --
shared_buffers = 16GB                    # RAM의 25%
effective_cache_size = 48GB              # RAM의 75%
work_mem = 256MB                         # 복잡 쿼리 정렬/해시용
maintenance_work_mem = 2GB               # VACUUM, CREATE INDEX용
wal_buffers = 64MB                       # WAL 버퍼

# -- 커넥션 --
max_connections = 200                    # PgBouncer 사용 시 낮게 설정
superuser_reserved_connections = 3

# -- WAL 설정 --
wal_level = replica                      # 복제 및 PITR 지원
max_wal_size = 4GB
min_wal_size = 1GB
checkpoint_completion_target = 0.9
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/archive/%f'

# -- 쿼리 플래너 --
random_page_cost = 1.1                   # SSD 환경
effective_io_concurrency = 200           # SSD 환경
default_statistics_target = 200          # 통계 정밀도

# -- 병렬 쿼리 --
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
max_parallel_maintenance_workers = 4

# -- 로깅 --
log_min_duration_statement = 500         # 500ms 이상 슬로우 쿼리 로깅
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
log_temp_files = 0

# -- 다국어 (아랍어/프랑스어) --
lc_collate = 'und-x-icu'                # ICU 기반 다국어 정렬
lc_ctype = 'und-x-icu'

# -- 자동 VACUUM --
autovacuum_max_workers = 6
autovacuum_naptime = 30s
autovacuum_vacuum_threshold = 50
autovacuum_analyze_threshold = 50
autovacuum_vacuum_scale_factor = 0.05
autovacuum_analyze_scale_factor = 0.02
```

### 2.4 Connection Pooling (PgBouncer)

각 마이크로서비스는 PgBouncer를 통해 데이터베이스에 접속한다.

```ini
# pgbouncer.ini

[databases]
epeople2_auth = host=db-primary port=5432 dbname=epeople2_auth
epeople2_complaint = host=db-primary port=5432 dbname=epeople2_complaint
epeople2_anticorruption = host=db-primary port=5432 dbname=epeople2_anticorruption
epeople2_eparticipation = host=db-primary port=5432 dbname=epeople2_eparticipation
epeople2_statistics = host=db-read-replica port=5432 dbname=epeople2_statistics
epeople2_document = host=db-primary port=5432 dbname=epeople2_document
epeople2_notification = host=db-primary port=5432 dbname=epeople2_notification
epeople2_helpdesk = host=db-primary port=5432 dbname=epeople2_helpdesk
epeople2_admin = host=db-primary port=5432 dbname=epeople2_admin

[pgbouncer]
listen_port = 6432
listen_addr = 0.0.0.0
auth_type = scram-sha-256
pool_mode = transaction              # 트랜잭션 모드 (MSA 적합)
max_client_conn = 1000
default_pool_size = 25
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 3
server_idle_timeout = 300
server_lifetime = 3600
log_connections = 1
log_disconnections = 1
stats_period = 60
```

### 2.5 Redis 7 캐시 전략 (개요)

Redis는 세션 관리, 참조 데이터 캐시, API 응답 캐시, 분산 락에 사용된다. 상세 설계는 [10. Redis 캐시 설계](#10-redis-캐시-설계)에서 다룬다.

```
┌─────────────────────────────────────────────┐
│              Redis 7 Cluster                  │
├─────────────────────────────────────────────┤
│                                               │
│  [Master 1]──[Replica 1]    Session Store    │
│  [Master 2]──[Replica 2]    Reference Cache  │
│  [Master 3]──[Replica 3]    API Response     │
│                              Distributed Lock │
│                                               │
│  메모리: 8GB (운영), 4GB (스테이징)           │
│  Eviction: allkeys-lru                        │
│  Persistence: RDB + AOF                       │
│                                               │
└─────────────────────────────────────────────┘
```

### 2.6 데이터 복제 전략

```
┌──────────────┐        Streaming         ┌──────────────┐
│  DB Primary  │ ──────Replication──────> │ Read Replica │
│  (RW)        │                          │ (RO)         │
│              │                          │              │
│ - Auth       │   Synchronous /          │ - Statistics │
│ - Complaint  │   Asynchronous           │   (읽기전용)  │
│ - All Write  │                          │ - Reporting  │
│   Operations │                          │   Queries    │
└──────┬───────┘                          └──────────────┘
       │
       │  WAL Archive
       ▼
┌──────────────┐
│  WAL Archive │
│  Storage     │
│  (PITR용)    │
└──────────────┘
```

**복제 구성**:
- **Primary → Read Replica**: 비동기 스트리밍 복제 (1초 미만 지연)
- **통계 서비스**: Read Replica에서 조회하여 Primary 부하 분산
- **WAL 아카이브**: PITR(Point-in-Time Recovery) 지원

### 2.7 스키마 명명 규칙

각 데이터베이스 내부에서는 기본 `public` 스키마를 사용하되, 필요 시 도메인별 스키마를 분리한다.

```sql
-- 기본: public 스키마 사용
-- 대용량 테이블의 파티션 관리를 위한 별도 스키마
CREATE SCHEMA IF NOT EXISTS partitions;  -- 파티션 테이블용
CREATE SCHEMA IF NOT EXISTS archive;     -- 아카이브 데이터용
CREATE SCHEMA IF NOT EXISTS audit;       -- 감사 로그용
```

---

## 3. ERD (Entity Relationship Diagram)

### 3.1 전체 시스템 ERD (서비스 간 참조 관계)

```
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                    e-People II 전체 ERD (서비스 간 참조)                   │
 └─────────────────────────────────────────────────────────────────────────┘

   epeople2_auth                epeople2_admin
  ┌─────────────┐             ┌──────────────┐
  │   users     │────user_id──│  agencies    │
  │   sessions  │    (API)    │  sla_configs │
  │   roles     │             │  common_codes│
  │   audit_log │             │  system_cfgs │
  └──────┬──────┘             └──────┬───────┘
         │ user_id (API참조)          │ agency_id (API참조)
         │                            │
  ┌──────┴────────────────────────────┴─────────────────────────┐
  │                                                              │
  │  epeople2_complaint          epeople2_anticorruption         │
  │ ┌─────────────────┐        ┌─────────────────────┐          │
  │ │  complaints     │        │ corruption_reports   │          │
  │ │  histories      │  XXXX  │ report_histories     │          │
  │ │  transfers      │ (분리) │ investigation_notes  │          │
  │ │  categories     │        │ whistleblower_       │          │
  │ │  joint_process  │        │   protection         │          │
  │ │  extensions     │        └─────────────────────┘          │
  │ │  satisfactions  │                                          │
  │ │  similar_cmps   │        epeople2_eparticipation           │
  │ │  templates      │       ┌─────────────────────┐           │
  │ │  group_cmps     │       │  proposals          │           │
  │ └────────┬────────┘       │  proposal_reviews   │           │
  │          │                 │  proposal_likes     │           │
  │          │                 │  implementation_    │           │
  │          │                 │    updates          │           │
  │          │                 └─────────────────────┘           │
  │          │                                                    │
  └──────────┼────────────────────────────────────────────────────┘
             │ complaint_id (이벤트)
             │
  ┌──────────┴──────────────────────────────────────────────────┐
  │                                                              │
  │  epeople2_statistics        epeople2_notification            │
  │ ┌─────────────────┐       ┌──────────────────┐              │
  │ │ daily_statistics │       │ notifications    │              │
  │ │ monthly_stats    │       │ sms_log          │              │
  │ │ agency_perf      │       │ email_log        │              │
  │ │ repeated_analysis│       │ delivery_confirms│              │
  │ │ generated_reports│       │ preferences      │              │
  │ └─────────────────┘       └──────────────────┘              │
  │                                                              │
  │  epeople2_document          epeople2_helpdesk                │
  │ ┌─────────────────┐       ┌──────────────────┐              │
  │ │ documents       │       │ helpdesk_tickets │              │
  │ │ doc_versions    │       │ ticket_notes     │              │
  │ │ access_controls │       │ faq_articles     │              │
  │ │ access_logs     │       │ knowledge_base   │              │
  │ │ watermark_cfgs  │       │ agent_profiles   │              │
  │ └─────────────────┘       └──────────────────┘              │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  ※ XXXX 표시: 민원(Complaint)과 부패신고(CorruptionReport)는
     절대 동일 데이터베이스에 존재하지 않음 (DP-01 원칙)
  ※ 서비스 간 참조는 API 호출 또는 이벤트 메시지로만 수행
```

### 3.2 Auth 도메인 ERD

```
  epeople2_auth
  ═════════════

  ┌──────────────────┐       ┌──────────────────┐
  │     users        │       │   user_roles     │
  ├──────────────────┤       ├──────────────────┤
  │ id          (PK) │1─────*│ id          (PK) │
  │ username    (UQ) │       │ user_id     (FK) │
  │ password_hash    │       │ role_code        │
  │ name_fr          │       │ agency_id        │
  │ name_ar          │       │ assigned_at      │
  │ email (encrypted)│       │ revoked_at       │
  │ phone (encrypted)│       └──────────────────┘
  │ citizen_id (enc) │
  │ is_active        │       ┌──────────────────┐
  │ created_at       │       │  user_sessions   │
  │ updated_at       │       ├──────────────────┤
  └────────┬─────────┘       │ id          (PK) │
           │1                │ user_id     (FK) │
           │                 │ access_token_hash│
           ├────────────────*│ refresh_token_hash│
           │                 │ ip_address       │
           │                 │ user_agent       │
           │                 │ expires_at       │
           │                 │ created_at       │
           │                 └──────────────────┘
           │
           │                 ┌──────────────────┐
           │                 │  login_attempts  │
           ├────────────────*├──────────────────┤
           │                 │ id          (PK) │
           │                 │ user_id     (FK) │
           │                 │ ip_address       │
           │                 │ success          │
           │                 │ failure_reason   │
           │                 │ attempted_at     │
           │                 └──────────────────┘
           │
           │                 ┌──────────────────┐
           │                 │ pki_certificates │
           ├────────────────*├──────────────────┤
           │                 │ id          (PK) │
           │                 │ user_id     (FK) │
           │                 │ cert_serial      │
           │                 │ provider         │
           │                 │ issued_at        │
           │                 │ expires_at       │
           │                 └──────────────────┘
           │
           │                 ┌──────────────────────┐
           │                 │ substitute_configs   │
           └────────────────*├──────────────────────┤
                             │ id            (PK)   │
                             │ officer_id    (FK)   │
                             │ substitute_id (FK)   │
                             │ start_date           │
                             │ end_date             │
                             │ reason_fr            │
                             │ reason_ar            │
                             │ is_active            │
                             └──────────────────────┘

  ┌──────────────────┐       ┌──────────────────┐
  │ anonymous_tokens │       │   audit_log      │
  ├──────────────────┤       ├──────────────────┤
  │ id          (PK) │       │ id          (PK) │
  │ token  (encrypted│       │ user_id          │
  │        + hashed) │       │ action           │
  │ report_id        │       │ resource_type    │
  │ expires_at       │       │ resource_id      │
  │ is_used          │       │ ip_address       │
  │ created_at       │       │ details (JSONB)  │
  └──────────────────┘       │ created_at       │
                             └──────────────────┘
```

### 3.3 Complaint 도메인 ERD (가장 복잡 -- G-01~G-04, G-06, G-07, G-12)

```
  epeople2_complaint
  ══════════════════

  ┌──────────────────────────────────────────┐
  │              complaints                    │
  ├──────────────────────────────────────────┤
  │ id                    UUID (PK)           │
  │ complaint_number      'CMP-YYYY-NNNNNN'  │  ← G-01: 5유형 지원
  │ type                  complaint_type ENUM │
  │ status                complaint_status    │
  │ title_fr              VARCHAR(200)        │
  │ title_ar              VARCHAR(200)        │
  │ content_fr            TEXT                │
  │ content_ar            TEXT                │
  │ category_l1           VARCHAR(10) FK      │
  │ category_l2           VARCHAR(10) FK      │
  │ category_l3           VARCHAR(10) FK      │
  │ region_code           VARCHAR(20)         │
  │ incident_date         DATE                │
  │ citizen_id (encrypted)UUID                │
  │ assigned_agency_id    VARCHAR(30)         │  ← Admin API 참조
  │ assigned_officer_id   UUID                │  ← Auth API 참조
  │ transfer_count        SMALLINT DEFAULT 0  │  ← G-02: 이관 통제
  │ deadline_at           TIMESTAMPTZ         │  ← G-01: SLA 자동 적용
  │ original_deadline_at  TIMESTAMPTZ         │  ← G-04: 연장 전 원래 기한
  │ submitted_at          TIMESTAMPTZ         │
  │ completed_at          TIMESTAMPTZ         │
  │ closed_at             TIMESTAMPTZ         │
  │ group_complaint_id    UUID FK (nullable)  │  ← G-12: 다수인 민원
  │ deleted_at            TIMESTAMPTZ         │
  │ created_at            TIMESTAMPTZ         │
  │ updated_at            TIMESTAMPTZ         │
  │ created_by            UUID                │
  │ updated_by            UUID                │
  └──────────┬─────────────────────┬──────────┘
             │1                    │1
    ┌────────┴──────┐    ┌────────┴──────────────┐
    │               │    │                        │
    *               *    *                        *
  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ ┌──────────────┐
  │ complaint_   │ │ complaint_   │ │ complaint_       │ │ satisfaction │
  │ histories    │ │ attachments  │ │ transfers        │ │ _scores      │
  ├──────────────┤ ├──────────────┤ ├──────────────────┤ ├──────────────┤
  │ id      (PK) │ │ id      (PK) │ │ id          (PK) │ │ id      (PK) │
  │ complaint_id │ │ complaint_id │ │ complaint_id(FK) │ │ complaint_id │
  │ action       │ │ file_name    │ │ transfer_number  │ │ score (1-5)  │
  │ label_fr     │ │ original_name│ │ from_agency_id   │ │ comment_fr   │
  │ label_ar     │ │ size_bytes   │ │ to_agency_id     │ │ comment_ar   │
  │ from_agency  │ │ mime_type    │ │ reason_fr        │ │ submitted_at │
  │ to_agency    │ │ storage_path │ │ reason_ar        │ └──────────────┘
  │ officer_id   │ │ uploaded_at  │ │ status           │
  │ reason_fr    │ │ uploaded_by  │ │ approved_by      │
  │ reason_ar    │ └──────────────┘ │ sequence_number  │ ← G-02
  │ note_fr      │                  │ bcrc_auto_report │ ← G-02: >=3 시 true
  │ note_ar      │                  │ requested_at     │
  │ created_at   │                  │ completed_at     │
  └──────────────┘                  └──────────────────┘

  ┌──────────────────┐   ┌──────────────────────────┐
  │ joint_processes  │   │ joint_process_agencies   │
  ├──────────────────┤   ├──────────────────────────┤
  │ id          (PK) │1─*│ id                (PK)   │  ← G-03
  │ complaint_id(FK) │   │ joint_process_id  (FK)   │
  │ lead_agency_id   │   │ agency_id                │
  │ status           │   │ opinion_fr               │
  │ started_at       │   │ opinion_ar               │
  │ completed_at     │   │ status                   │
  └──────────────────┘   │ submitted_at             │
                         └──────────────────────────┘

  ┌──────────────────────┐   ┌──────────────────┐
  │ deadline_extensions  │   │ answer_templates │
  ├──────────────────────┤   ├──────────────────┤  ← G-08
  │ id            (PK)   │   │ id          (PK) │
  │ complaint_id  (FK)   │   │ type             │
  │ requested_days       │   │ category_l1      │
  │ reason_fr            │   │ category_l2      │
  │ reason_ar            │   │ title_fr         │
  │ status               │   │ title_ar         │
  │ current_deadline     │   │ content_fr       │
  │ requested_deadline   │   │ content_ar       │
  │ requested_at         │   │ is_active        │
  │ reviewed_at          │   │ usage_count      │
  │ reviewed_by          │   │ created_by       │
  └──────────────────────┘   └──────────────────┘
       ← G-04

  ┌──────────────────────┐   ┌──────────────────────┐
  │ similar_complaints   │   │ group_complaints     │
  ├──────────────────────┤   ├──────────────────────┤  ← G-12
  │ id            (PK)   │   │ id            (PK)   │
  │ source_complaint_id  │   │ group_number         │
  │ similar_complaint_id │   │ representative_      │
  │ similarity_score     │   │   complaint_id (FK)  │
  │ matched_by           │   │ title_fr             │
  │ created_at           │   │ title_ar             │
  └──────────────────────┘   │ status               │
       ← G-07                │ member_count         │
                             │ created_at           │
                             │ closed_at            │
                             └──────────────────────┘

  ┌────────────────────────────────────────────────────────────┐
  │              complaint_categories (3단계 계층 구조)          │
  ├────────────────────────────────────────────────────────────┤
  │ code             VARCHAR(10) (PK)                          │
  │ name_fr          VARCHAR(200)                              │
  │ name_ar          VARCHAR(200)                              │
  │ level            SMALLINT (1, 2, 3)                        │
  │ parent_code      VARCHAR(10) (FK → self)                   │
  │ is_active        BOOLEAN                                   │
  │ sort_order       INTEGER                                   │
  └────────────────────────────────────────────────────────────┘
```

### 3.4 Anti-Corruption 도메인 ERD (부패 신고 -- 민원과 완전 분리)

```
  epeople2_anticorruption
  ═══════════════════════

  ⚠️ 이 데이터베이스는 epeople2_complaint와 완전히 분리됨
     담당 조직: DGGPC (vs 민원: BCRC)
     보안 등급: 기밀 (vs 민원: 일반)

  ┌────────────────────────────────────────┐
  │           corruption_reports            │
  ├────────────────────────────────────────┤
  │ id                    UUID (PK)        │
  │ report_number         'RPT-YYYY-NNNNNN'│
  │ type                  corruption_type  │
  │ status                report_status    │
  │ title_fr              VARCHAR(200)     │
  │ title_ar              VARCHAR(200)     │
  │ content_fr            TEXT             │
  │ content_ar            TEXT             │
  │ target_agency_id      VARCHAR(30)      │
  │ incident_date         DATE             │
  │ location_fr           VARCHAR(500)     │
  │ location_ar           VARCHAR(500)     │
  │ is_anonymous          BOOLEAN          │
  │ reporter_id(encrypted)UUID             │
  │ anonymous_token(enc)  VARCHAR(200)     │
  │ tracking_code         VARCHAR(30) (UQ) │
  │ assigned_officer_id   UUID             │
  │ submitted_at          TIMESTAMPTZ      │
  │ completed_at          TIMESTAMPTZ      │
  │ result_summary_fr     TEXT             │
  │ result_summary_ar     TEXT             │
  │ deleted_at            TIMESTAMPTZ      │
  │ created_at            TIMESTAMPTZ      │
  │ updated_at            TIMESTAMPTZ      │
  └───────────┬────────────────────────────┘
              │1
     ┌────────┼──────────┬──────────────┐
     *        *          *              *
  ┌────────┐ ┌────────┐ ┌────────────┐ ┌──────────────────┐
  │report_ │ │report_ │ │investiga-  │ │ whistleblower_   │
  │histo-  │ │attach- │ │tion_notes  │ │ protection       │
  │ries    │ │ments   │ │            │ │                  │
  ├────────┤ ├────────┤ ├────────────┤ ├──────────────────┤
  │id  (PK)│ │id  (PK)│ │id     (PK) │ │ id          (PK) │
  │report_ │ │report_ │ │report_id   │ │ report_id   (FK) │
  │  id(FK)│ │  id(FK)│ │officer_id  │ │ protection_type  │
  │action  │ │file_   │ │note_fr     │ │ status           │
  │label_fr│ │  name  │ │note_ar     │ │ description_fr   │
  │label_ar│ │orig_   │ │is_confiden-│ │ description_ar   │
  │officer │ │  name  │ │  tial      │ │ measures_taken_fr│
  │note_fr │ │size_   │ │created_at  │ │ measures_taken_ar│
  │note_ar │ │  bytes │ └────────────┘ │ effective_from   │
  │created │ │mime_   │   DGGPC전용      │ effective_to     │
  │  _at   │ │  type  │                 │ created_at       │
  └────────┘ │storage │                 │ created_by       │
             │  _path │                 └──────────────────┘
             │uploaded│
             │  _at   │
             └────────┘
```

### 3.5 eParticipation 도메인 ERD (G-05)

```
  epeople2_eparticipation
  ═══════════════════════

  ┌───────────────────────────────────────┐
  │             proposals                  │
  ├───────────────────────────────────────┤
  │ id                   UUID (PK)        │
  │ proposal_number      'PRP-YYYY-NNNNNN'│
  │ title_fr             VARCHAR(200)     │
  │ title_ar             VARCHAR(200)     │
  │ content_fr           TEXT             │
  │ content_ar           TEXT             │
  │ status               proposal_status  │
  │ category_l1          VARCHAR(10)      │
  │ citizen_id           UUID             │
  │ assigned_agency_id   VARCHAR(30)      │
  │ like_count           INTEGER DEFAULT 0│
  │ submitted_at         TIMESTAMPTZ      │
  │ deleted_at           TIMESTAMPTZ      │
  │ created_at           TIMESTAMPTZ      │
  │ updated_at           TIMESTAMPTZ      │
  └─────────┬─────────────────────────────┘
            │1
   ┌────────┼─────────┬────────────────┐
   *        *         *                *
 ┌──────────┐ ┌──────────┐ ┌────────────────────┐ ┌──────────────────┐
 │proposal_ │ │proposal_ │ │ implementation_    │ │ proposal_        │
 │reviews   │ │likes     │ │ updates            │ │ attachments      │
 ├──────────┤ ├──────────┤ ├────────────────────┤ ├──────────────────┤
 │id    (PK)│ │id    (PK)│ │ id            (PK) │ │ id          (PK) │
 │proposal_ │ │proposal_ │ │ proposal_id   (FK) │ │ proposal_id (FK) │
 │  id  (FK)│ │  id  (FK)│ │ content_fr         │ │ file_name        │
 │result    │ │user_id   │ │ content_ar         │ │ original_name    │
 │comment_fr│ │(UQ pair) │ │ progress (0-100)   │ │ size_bytes       │
 │comment_ar│ │created_at│ │ updated_at         │ │ mime_type        │
 │reviewed_ │ └──────────┘ │ updated_by         │ │ storage_path     │
 │  at      │              └────────────────────┘ │ uploaded_at      │
 │reviewed_ │                                      └──────────────────┘
 │  by      │
 │implement_│
 │ plan_fr  │
 │ plan_ar  │
 └──────────┘
```

### 3.6 Statistics 도메인 ERD

```
  epeople2_statistics
  ═══════════════════

  ┌─────────────────────┐   ┌─────────────────────┐
  │  daily_statistics   │   │ monthly_statistics  │
  ├─────────────────────┤   ├─────────────────────┤
  │ id            (PK)  │   │ id            (PK)  │
  │ stat_date     (UQ)  │   │ stat_month    (UQ)  │
  │ total_received      │   │ total_received      │
  │ total_completed     │   │ total_completed     │
  │ total_overdue       │   │ total_overdue       │
  │ by_type (JSONB)     │   │ by_type (JSONB)     │
  │ by_status (JSONB)   │   │ by_status (JSONB)   │
  │ by_agency (JSONB)   │   │ by_agency (JSONB)   │
  │ avg_processing_days │   │ avg_processing_days │
  │ avg_satisfaction    │   │ avg_satisfaction    │
  │ created_at          │   │ completion_rate     │
  └─────────────────────┘   │ created_at          │
                            └─────────────────────┘

  ┌──────────────────────────┐   ┌───────────────────────────────┐
  │   agency_performance     │   │ repeated_complaints_analysis  │
  ├──────────────────────────┤   ├───────────────────────────────┤
  │ id               (PK)   │   │ id                     (PK)   │  ← G-06
  │ agency_id               │   │ citizen_id_hash               │
  │ period_start            │   │ repeat_count                  │
  │ period_end              │   │ categories (JSONB)            │
  │ received                │   │ last_complaint_at             │
  │ completed               │   │ total_unresolved              │
  │ completion_rate         │   │ analysis_date                 │
  │ avg_processing_days     │   │ created_at                    │
  │ sla_compliance_rate     │   └───────────────────────────────┘
  │ satisfaction_score      │
  │ transfer_count          │   ┌───────────────────────────────┐
  │ overdue_count           │   │ overdue_complaints_analysis   │
  │ created_at              │   ├───────────────────────────────┤
  └──────────────────────────┘   │ id                     (PK)   │  ← G-06
                                │ complaint_id                  │
  ┌──────────────────────┐      │ complaint_number              │
  │  report_templates    │      │ type                          │
  ├──────────────────────┤      │ days_overdue                  │
  │ id            (PK)   │      │ assigned_agency_id            │
  │ name_fr              │      │ assigned_officer_id           │
  │ name_ar              │      │ analysis_date                 │
  │ template_type        │      │ created_at                    │
  │ config (JSONB)       │      └───────────────────────────────┘
  │ is_active            │
  │ created_by           │
  └──────────────────────┘

  ┌──────────────────────┐   ┌──────────────────────┐
  │  generated_reports   │   │    export_logs       │
  ├──────────────────────┤   ├──────────────────────┤
  │ id            (PK)   │   │ id            (PK)   │
  │ template_id   (FK)   │   │ report_id     (FK)   │
  │ title_fr             │   │ format               │
  │ title_ar             │   │ file_path            │
  │ period_start         │   │ file_size_bytes      │
  │ period_end           │   │ exported_by          │
  │ filters (JSONB)      │   │ exported_at          │
  │ generated_by         │   └──────────────────────┘
  │ generated_at         │
  │ status               │
  └──────────────────────┘
```

### 3.7 Document 도메인 ERD

```
  epeople2_document
  ═════════════════

  ┌───────────────────────────┐
  │        documents          │
  ├───────────────────────────┤
  │ id               (PK)    │
  │ document_number          │
  │ title_fr                 │
  │ title_ar                 │
  │ doc_type                 │
  │ classification           │
  │ related_service          │
  │ related_entity_id        │
  │ current_version          │
  │ storage_path             │
  │ file_size_bytes          │
  │ mime_type                │
  │ hash_sha256              │
  │ retention_policy_id (FK) │
  │ created_by               │
  │ created_at               │
  │ updated_at               │
  │ deleted_at               │
  └──────────┬───────────────┘
             │1
    ┌────────┼──────────┬──────────────┐
    *        *          *              │
  ┌──────────┐ ┌──────────────┐ ┌─────┴──────────┐
  │document_ │ │ document_    │ │ access_attempt │
  │versions  │ │ access_      │ │ _logs          │
  ├──────────┤ │ controls     │ ├────────────────┤
  │id    (PK)│ ├──────────────┤ │ id        (PK) │
  │doc_id(FK)│ │id       (PK) │ │ doc_id    (FK) │
  │version   │ │doc_id   (FK) │ │ user_id        │
  │change_fr │ │user_id       │ │ action         │
  │change_ar │ │role          │ │ granted        │
  │file_path │ │can_view      │ │ ip_address     │
  │hash_256  │ │can_download  │ │ attempted_at   │
  │created_by│ │can_print     │ └────────────────┘
  │created_at│ │can_edit      │
  └──────────┘ │granted_by    │
               │granted_at    │
               └──────────────┘

  ┌──────────────────────┐   ┌──────────────────────┐
  │distribution_records  │   │integrity_verifications│
  ├──────────────────────┤   ├──────────────────────┤
  │ id            (PK)   │   │ id            (PK)   │
  │ document_id   (FK)   │   │ document_id   (FK)   │
  │ distributed_to       │   │ expected_hash        │
  │ distributed_by       │   │ actual_hash          │
  │ method               │   │ is_valid             │
  │ distributed_at       │   │ verified_at          │
  └──────────────────────┘   └──────────────────────┘

  ┌──────────────────────┐   ┌──────────────────────┐
  │  watermark_configs   │   │ retention_policies   │
  ├──────────────────────┤   ├──────────────────────┤
  │ id            (PK)   │   │ id            (PK)   │
  │ name_fr              │   │ name_fr              │
  │ name_ar              │   │ name_ar              │
  │ template             │   │ retention_days       │
  │ is_active            │   │ action_on_expiry     │
  │ applies_to (JSONB)   │   │ is_active            │
  └──────────────────────┘   └──────────────────────┘
```

### 3.8 Notification 도메인 ERD

```
  epeople2_notification
  ═════════════════════

  ┌────────────────────────────┐
  │       notifications        │
  ├────────────────────────────┤
  │ id                  (PK)   │
  │ user_id                    │
  │ type          notif_type   │
  │ title_fr                   │
  │ title_ar                   │
  │ message_fr                 │
  │ message_ar                 │
  │ related_id                 │
  │ related_type               │
  │ is_read       BOOLEAN      │
  │ read_at       TIMESTAMPTZ  │
  │ created_at    TIMESTAMPTZ  │
  └────────────────────────────┘

  ┌──────────────────────────┐   ┌──────────────────────────┐
  │ notification_preferences │   │  delivery_confirmations  │
  ├──────────────────────────┤   ├──────────────────────────┤  ← G-10
  │ id               (PK)   │   │ id               (PK)    │
  │ user_id          (UQ)   │   │ notification_id  (FK)    │
  │ email_enabled            │   │ channel                  │
  │ sms_enabled              │   │ delivery_status          │
  │ push_enabled             │   │ delivered_at             │
  │ quiet_hours_start        │   │ confirmed_at             │
  │ quiet_hours_end          │   │ retry_count              │
  │ disabled_types (JSONB)   │   │ last_retry_at            │
  │ updated_at               │   └──────────────────────────┘
  └──────────────────────────┘

  ┌──────────────────────────┐   ┌──────────────────────────┐
  │        sms_log           │   │       email_log          │
  ├──────────────────────────┤   ├──────────────────────────┤
  │ id               (PK)   │   │ id               (PK)    │
  │ notification_id  (FK)   │   │ notification_id  (FK)    │
  │ phone_number (encrypted)│   │ email_to (encrypted)     │
  │ message_content         │   │ subject_fr               │
  │ gateway_provider        │   │ subject_ar               │
  │ gateway_message_id      │   │ body_html                │
  │ status                  │   │ status                   │
  │ error_message           │   │ error_message            │
  │ sent_at                 │   │ sent_at                  │
  │ delivered_at            │   │ delivered_at             │
  │ retry_count             │   │ retry_count              │
  └──────────────────────────┘   └──────────────────────────┘
```

### 3.9 Helpdesk 도메인 ERD

```
  epeople2_helpdesk
  ═════════════════

  ┌───────────────────────────┐
  │     helpdesk_tickets      │
  ├───────────────────────────┤
  │ id               (PK)    │
  │ ticket_number            │
  │ channel                  │
  │ ticket_type              │
  │ status                   │
  │ priority                 │
  │ subject_fr               │
  │ subject_ar               │
  │ description_fr           │
  │ description_ar           │
  │ citizen_profile_id (FK)  │
  │ agent_id          (FK)   │
  │ related_complaint_id     │
  │ sla_config_id     (FK)   │
  │ due_at                   │
  │ resolved_at              │
  │ closed_at                │
  │ created_at               │
  │ updated_at               │
  └──────────┬───────────────┘
             │1
    ┌────────┴──────┐
    *               *
  ┌────────────────┐
  │  ticket_notes  │
  ├────────────────┤
  │ id        (PK) │     ┌──────────────────┐     ┌──────────────────┐
  │ ticket_id (FK) │     │ citizen_profiles │     │ agent_profiles   │
  │ note_fr        │     ├──────────────────┤     ├──────────────────┤
  │ note_ar        │     │ id          (PK) │     │ id          (PK) │
  │ is_internal    │     │ citizen_id       │     │ user_id          │
  │ created_by     │     │ name_fr          │     │ name_fr          │
  │ created_at     │     │ name_ar          │     │ name_ar          │
  └────────────────┘     │ phone (encrypted)│     │ specialization   │
                         │ email (encrypted)│     │ is_active        │
  ┌──────────────────┐   │ interaction_count│     │ created_at       │
  │ agent_performance│   │ last_contact_at  │     └──────────────────┘
  ├──────────────────┤   │ notes (JSONB)    │
  │ id          (PK) │   │ created_at       │     ┌──────────────────┐
  │ agent_id    (FK) │   └──────────────────┘     │  faq_articles    │
  │ period_start     │                            ├──────────────────┤
  │ period_end       │   ┌──────────────────────┐ │ id          (PK) │
  │ tickets_handled  │   │ cti_call_events     │ │ question_fr      │
  │ avg_resolution   │   ├──────────────────────┤ │ question_ar      │
  │ sla_compliance   │   │ id            (PK)   │ │ answer_fr        │
  │ satisfaction     │   │ ticket_id     (FK)   │ │ answer_ar        │
  │ created_at       │   │ call_direction       │ │ category         │
  └──────────────────┘   │ caller_number (enc)  │ │ view_count       │
                         │ agent_id             │ │ is_published     │
  ┌──────────────────┐   │ duration_seconds     │ │ sort_order       │
  │knowledge_base_   │   │ recording_path       │ │ created_at       │
  │articles          │   │ started_at           │ │ updated_at       │
  ├──────────────────┤   │ ended_at             │ └──────────────────┘
  │ id          (PK) │   └──────────────────────┘
  │ title_fr         │                            ┌──────────────────┐
  │ title_ar         │                            │helpdesk_sla_     │
  │ content_fr       │                            │configs           │
  │ content_ar       │                            ├──────────────────┤
  │ category         │                            │ id          (PK) │
  │ tags (JSONB)     │                            │ ticket_type      │
  │ is_published     │                            │ priority         │
  │ view_count       │                            │ response_hours   │
  │ helpful_count    │                            │ resolution_hours │
  │ created_by       │                            │ is_active        │
  │ created_at       │                            └──────────────────┘
  │ updated_at       │
  └──────────────────┘
```

### 3.10 Admin 도메인 ERD

```
  epeople2_admin
  ══════════════

  ┌───────────────────────────────┐
  │          agencies             │
  ├───────────────────────────────┤
  │ id               VARCHAR(30) │  'BRC-XXX-YYY-NNN'
  │ name_fr          VARCHAR(300)│
  │ name_ar          VARCHAR(300)│
  │ type             agency_type │  BCRC | BRC | DGGPC | GOVERNANCE_TEAM
  │ parent_id        VARCHAR(30) │  FK → self (계층 구조)
  │ region_code      VARCHAR(20) │
  │ governorat_code  VARCHAR(10) │
  │ contact_email    VARCHAR(200)│
  │ contact_phone    VARCHAR(50) │
  │ address_fr       TEXT        │
  │ address_ar       TEXT        │
  │ is_active        BOOLEAN     │
  │ created_at       TIMESTAMPTZ │
  │ updated_at       TIMESTAMPTZ │
  └──────────┬────────────────────┘
             │1
    ┌────────┴──────┐
    *               │
  ┌──────────────┐  │
  │ sla_configs  │  │
  ├──────────────┤  │       ┌──────────────────────────┐
  │ id      (PK) │  │       │      common_codes        │
  │ agency_id(FK)│  │       ├──────────────────────────┤
  │ complaint_   │  │       │ id               (PK)   │
  │   type       │  │       │ group_code              │
  │ sla_hours    │  │       │ code            (UQ)    │
  │ extension_   │  │       │ name_fr                 │
  │   allowed    │  │       │ name_ar                 │
  │ max_extension│  │       │ description_fr          │
  │   _days      │  │       │ description_ar          │
  │ is_active    │  │       │ sort_order              │
  │ updated_by   │  │       │ is_active               │
  │ updated_at   │  │       │ metadata (JSONB)        │
  └──────────────┘  │       │ created_at              │
                    │       │ updated_at              │
                    │       └──────────────────────────┘
                    │
                    │       ┌──────────────────────────┐
                    │       │     system_configs       │
                    │       ├──────────────────────────┤
                    │       │ key        VARCHAR (PK)  │
                    │       │ value      TEXT          │
                    │       │ description_fr           │
                    │       │ description_ar           │
                    │       │ data_type                │
                    │       │ updated_by               │
                    │       │ updated_at               │
                    │       └──────────────────────────┘

  ┌──────────────────────────┐   ┌──────────────────────────┐
  │   standard_procedures    │   │   operation_manuals      │
  ├──────────────────────────┤   ├──────────────────────────┤  ← G-14
  │ id               (PK)   │   │ id               (PK)   │
  │ title_fr                 │   │ title_fr                 │
  │ title_ar                 │   │ title_ar                 │
  │ procedure_type           │   │ manual_type              │
  │ content_fr               │   │ content_fr               │
  │ content_ar               │   │ content_ar               │
  │ version                  │   │ version                  │
  │ is_active                │   │ file_path                │
  │ applies_to (JSONB)       │   │ is_published             │
  │ published_at             │   │ published_at             │
  │ created_by               │   │ created_by               │
  │ created_at               │   │ created_at               │
  │ updated_at               │   │ updated_at               │
  └──────────────────────────┘   └──────────────────────────┘

  ┌──────────────────────────┐
  │  data_migration_logs     │
  ├──────────────────────────┤
  │ id               (PK)   │
  │ batch_id                 │
  │ source_table             │
  │ target_table             │
  │ total_records            │
  │ success_count            │
  │ failure_count            │
  │ error_details (JSONB)    │
  │ started_at               │
  │ completed_at             │
  │ status                   │
  └──────────────────────────┘
```

### 3.11 서비스 간 참조 패턴

서비스 간 데이터 참조는 직접 JOIN이 아닌 다음 패턴을 사용한다:

| 참조 유형 | 패턴 | 예시 |
|----------|------|------|
| **동기 API 참조** | REST API 호출로 타 서비스 데이터 조회 | Complaint에서 Agency 이름 조회 시 Admin Service API 호출 |
| **이벤트 기반** | 이벤트 발행/구독으로 데이터 동기화 | 민원 상태 변경 시 Notification Service에 이벤트 발행 |
| **ID 참조** | 타 서비스의 ID만 컬럼에 저장 (FK 미설정) | `complaints.assigned_agency_id`는 Admin DB의 `agencies.id` 참조하지만 DB레벨 FK 없음 |
| **캐시 복제** | 자주 사용하는 참조 데이터를 Redis에 캐시 | Agency 목록, Category 트리를 Redis에 캐시 후 로컬 조회 |
| **Materialized View** | 통계 집계를 위해 이벤트 소비 후 로컬 뷰 갱신 | Statistics Service가 Complaint 이벤트를 소비하여 통계 테이블 갱신 |

```
  Complaint Service          Admin Service
  ┌──────────────┐          ┌──────────────┐
  │ complaints   │          │ agencies     │
  │              │  REST    │              │
  │ assigned_    │ -------> │ id           │
  │ agency_id    │  API     │ name_fr      │
  │ (VARCHAR)    │          │ name_ar      │
  │              │          │              │
  │ ※ DB FK 없음 │          │              │
  └──────────────┘          └──────────────┘

  ※ 서비스 간 데이터 정합성은 Saga 패턴 + 이벤트 보상 트랜잭션으로 보장
```

---

## 4. 테이블 정의서 (DDL)

> 모든 DDL은 PostgreSQL 15 기준으로 작성되었다.
> 각 테이블에 대해 CREATE TABLE, 인덱스, 코멘트를 포함한다.

### 4.1 Auth Service Database (`epeople2_auth`)

```sql
-- ============================================================
-- Database: epeople2_auth
-- Description: 사용자 인증, 세션, 역할, 감사 로그
-- ============================================================

CREATE DATABASE epeople2_auth
    WITH ENCODING = 'UTF8'
    LC_COLLATE = 'und-x-icu'
    LC_CTYPE = 'und-x-icu'
    TEMPLATE = template0;

\c epeople2_auth;

-- 확장 모듈
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";       -- UUID 생성
CREATE EXTENSION IF NOT EXISTS "pgcrypto";         -- 암호화 함수
CREATE EXTENSION IF NOT EXISTS "pg_trgm";          -- 트라이그램 검색

-- ─── ENUM 타입 정의 ───────────────────────────────────────

CREATE TYPE user_role AS ENUM (
    'CITIZEN',           -- 시민 (Citoyen)
    'ANONYMOUS',         -- 익명 신고자 (Anonyme)
    'BRC_OFFICER',       -- BRC 담당자 (Agent BRC)
    'BRC_MANAGER',       -- BRC 관리자 (Responsable BRC)
    'BCRC_ADMIN',        -- BCRC 중앙 관리자 (Administrateur BCRC)
    'DGGPC_OFFICER',     -- DGGPC 담당자 (Agent DGGPC)
    'DGGPC_MANAGER',     -- DGGPC 관리자 (Responsable DGGPC)
    'SYS_ADMIN'          -- 시스템 관리자 (Administrateur système)
);

CREATE TYPE pki_provider AS ENUM (
    'MOBILE_ID',         -- ANCE Tuntrust Mobile ID
    'DIGIGO',            -- DigiGo SSO
    'MANUAL'             -- 수동 인증서 등록
);

-- ─── users 테이블 (사용자) ────────────────────────────────

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_number     VARCHAR(20) NOT NULL,                           -- 'USR-NNNNNN'
    username        VARCHAR(100) NOT NULL,                          -- 로그인 ID (이메일 형식)
    password_hash   VARCHAR(255) NOT NULL,                          -- bcrypt 해시
    name_fr         VARCHAR(100) NOT NULL,                          -- 프랑스어 이름
    name_ar         VARCHAR(100) NOT NULL,                          -- 아랍어 이름
    email_encrypted BYTEA,                                          -- AES-256-GCM 암호화
    phone_encrypted BYTEA,                                          -- AES-256-GCM 암호화
    citizen_id_encrypted BYTEA,                                     -- AES-256-GCM 암호화 (주민번호)
    primary_role    user_role NOT NULL DEFAULT 'CITIZEN',
    agency_id       VARCHAR(30),                                    -- Admin Service의 agencies.id 참조
    preferred_language VARCHAR(2) DEFAULT 'fr' CHECK (preferred_language IN ('ar', 'fr')),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_locked       BOOLEAN NOT NULL DEFAULT false,
    locked_until    TIMESTAMP WITH TIME ZONE,
    failed_login_count SMALLINT NOT NULL DEFAULT 0,
    last_login_at   TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE,
    deleted_at      TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by      UUID,
    updated_by      UUID,

    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT uq_users_user_number UNIQUE (user_number),
    CONSTRAINT chk_users_failed_login CHECK (failed_login_count >= 0 AND failed_login_count <= 10)
);

COMMENT ON TABLE users IS '사용자 (Utilisateurs) - 시민, 공무원, 관리자 통합 계정';
COMMENT ON COLUMN users.id IS '내부 PK (UUID v4)';
COMMENT ON COLUMN users.user_number IS '비즈니스 ID: USR-NNNNNN';
COMMENT ON COLUMN users.email_encrypted IS 'AES-256-GCM 암호화된 이메일';
COMMENT ON COLUMN users.phone_encrypted IS 'AES-256-GCM 암호화된 전화번호';
COMMENT ON COLUMN users.citizen_id_encrypted IS 'AES-256-GCM 암호화된 시민 식별번호';
COMMENT ON COLUMN users.agency_id IS 'Admin Service agencies.id 참조 (DB FK 없음, API 참조)';

-- 인덱스
CREATE INDEX idx_users_username ON users (username) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_primary_role ON users (primary_role) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_agency_id ON users (agency_id) WHERE deleted_at IS NULL AND agency_id IS NOT NULL;
CREATE INDEX idx_users_is_active ON users (is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users (created_at DESC);

-- ─── user_roles 테이블 (사용자 역할) ─────────────────────

CREATE TABLE user_roles (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_code   user_role NOT NULL,
    agency_id   VARCHAR(30),                                        -- 역할이 적용되는 기관
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    revoked_at  TIMESTAMP WITH TIME ZONE,
    assigned_by UUID,
    revoked_by  UUID,

    CONSTRAINT uq_user_roles_active UNIQUE (user_id, role_code, agency_id)
);

COMMENT ON TABLE user_roles IS '사용자 역할 (Rôles utilisateur) - 한 사용자가 여러 역할 보유 가능';
COMMENT ON COLUMN user_roles.agency_id IS '역할이 적용되는 기관 ID. BRC_OFFICER는 특정 BRC에서만 유효';

CREATE INDEX idx_user_roles_user_id ON user_roles (user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_user_roles_role_code ON user_roles (role_code) WHERE revoked_at IS NULL;

-- ─── user_sessions 테이블 (세션) ──────────────────────────

CREATE TABLE user_sessions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_token_hash   VARCHAR(64) NOT NULL,                       -- SHA-256 해시
    refresh_token_hash  VARCHAR(64) NOT NULL,                       -- SHA-256 해시
    ip_address          INET,
    user_agent          VARCHAR(500),
    device_info         JSONB,
    expires_at          TIMESTAMP WITH TIME ZONE NOT NULL,
    refresh_expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked          BOOLEAN NOT NULL DEFAULT false,
    revoked_at          TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE user_sessions IS '사용자 세션 (Sessions) - JWT 토큰 관리';

CREATE INDEX idx_sessions_user_id ON user_sessions (user_id) WHERE is_revoked = false;
CREATE INDEX idx_sessions_access_token ON user_sessions (access_token_hash);
CREATE INDEX idx_sessions_refresh_token ON user_sessions (refresh_token_hash);
CREATE INDEX idx_sessions_expires_at ON user_sessions (expires_at) WHERE is_revoked = false;

-- ─── login_attempts 테이블 (로그인 시도) ──────────────────

CREATE TABLE login_attempts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    username        VARCHAR(100) NOT NULL,                          -- 입력된 사용자명
    ip_address      INET NOT NULL,
    user_agent      VARCHAR(500),
    success         BOOLEAN NOT NULL,
    failure_reason  VARCHAR(100),                                   -- 실패 사유 코드
    attempted_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE login_attempts IS '로그인 시도 (Tentatives de connexion) - 보안 감사용';

CREATE INDEX idx_login_attempts_user_id ON login_attempts (user_id, attempted_at DESC);
CREATE INDEX idx_login_attempts_ip ON login_attempts (ip_address, attempted_at DESC);
-- 5회 연속 실패 감지를 위한 부분 인덱스
CREATE INDEX pidx_login_attempts_failed ON login_attempts (user_id, attempted_at DESC)
    WHERE success = false;

-- ─── pki_certificates 테이블 (PKI 인증서) ────────────────

CREATE TABLE pki_certificates (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cert_serial     VARCHAR(100) NOT NULL,
    provider        pki_provider NOT NULL,
    subject_dn      VARCHAR(500),                                   -- 인증서 Subject DN
    issuer_dn       VARCHAR(500),                                   -- 발급자 DN
    issued_at       TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked      BOOLEAN NOT NULL DEFAULT false,
    revoked_at      TIMESTAMP WITH TIME ZONE,
    fingerprint_sha256 VARCHAR(64),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_pki_cert_serial UNIQUE (provider, cert_serial)
);

COMMENT ON TABLE pki_certificates IS 'PKI 인증서 (Certificats PKI) - Tuntrust/DigiGo 연계';

CREATE INDEX idx_pki_user_id ON pki_certificates (user_id) WHERE is_revoked = false;

-- ─── anonymous_tokens 테이블 (익명 토큰) ──────────────────

CREATE TABLE anonymous_tokens (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_hash      VARCHAR(64) NOT NULL,                           -- SHA-256 해시
    token_encrypted BYTEA NOT NULL,                                 -- AES-256-GCM 암호화된 원본 토큰
    report_id       VARCHAR(30),                                    -- 연결된 부패 신고 ID
    expires_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used         BOOLEAN NOT NULL DEFAULT false,
    used_at         TIMESTAMP WITH TIME ZONE,
    ip_address      INET,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_anonymous_token_hash UNIQUE (token_hash)
);

COMMENT ON TABLE anonymous_tokens IS '익명 토큰 (Jetons anonymes) - 부패 신고용 익명 인증';
COMMENT ON COLUMN anonymous_tokens.token_encrypted IS 'AES-256-GCM 암호화: ANON-UUID 형식 원본';

CREATE INDEX idx_anon_tokens_hash ON anonymous_tokens (token_hash) WHERE is_used = false;
CREATE INDEX idx_anon_tokens_expires ON anonymous_tokens (expires_at);

-- ─── substitute_configs 테이블 (대리 처리 설정, G-09) ────

CREATE TABLE substitute_configs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    officer_id      UUID NOT NULL REFERENCES users(id),
    substitute_id   UUID NOT NULL REFERENCES users(id),
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    reason_fr       VARCHAR(500),
    reason_ar       VARCHAR(500),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    approved_by     UUID REFERENCES users(id),
    approved_at     TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_substitute_date_range CHECK (end_date >= start_date),
    CONSTRAINT chk_substitute_not_self CHECK (officer_id != substitute_id)
);

COMMENT ON TABLE substitute_configs IS '대리 처리 설정 (Configuration de suppléance) - G-09 담당자 부재 시';

CREATE INDEX idx_substitute_officer ON substitute_configs (officer_id) WHERE is_active = true;
CREATE INDEX idx_substitute_active_period ON substitute_configs (start_date, end_date) WHERE is_active = true;

-- ─── audit_log 테이블 (감사 로그) ─────────────────────────

CREATE TABLE audit_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID,                                           -- 행위자 (NULL = 시스템)
    user_role       user_role,
    action          VARCHAR(50) NOT NULL,                           -- CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT
    resource_type   VARCHAR(50) NOT NULL,                           -- users, sessions, roles 등
    resource_id     VARCHAR(100),                                   -- 대상 리소스 ID
    ip_address      INET,
    user_agent      VARCHAR(500),
    details         JSONB,                                          -- 변경 내용 상세 (before/after)
    severity        VARCHAR(10) DEFAULT 'INFO' CHECK (severity IN ('INFO', 'WARN', 'ERROR', 'CRITICAL')),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit_log IS '감사 로그 (Journal d''audit) - 모든 시스템 활동 기록';

-- 파티셔닝: 월 단위 파티션 (대량 데이터 대비)
-- 운영 환경에서는 상속 파티셔닝 또는 선언적 파티셔닝 적용
CREATE INDEX idx_audit_log_user_id ON audit_log (user_id, created_at DESC);
CREATE INDEX idx_audit_log_action ON audit_log (action, created_at DESC);
CREATE INDEX idx_audit_log_resource ON audit_log (resource_type, resource_id);
CREATE INDEX idx_audit_log_created_at ON audit_log (created_at DESC);
CREATE INDEX idx_audit_log_severity ON audit_log (severity, created_at DESC) WHERE severity IN ('WARN', 'ERROR', 'CRITICAL');

-- ─── updated_at 자동 갱신 트리거 ──────────────────────────

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_substitute_configs_updated_at
    BEFORE UPDATE ON substitute_configs
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

-- ─── user_number 시퀀스 자동 생성 ─────────────────────────

CREATE SEQUENCE seq_user_number START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION generate_user_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_number IS NULL THEN
        NEW.user_number = 'USR-' || LPAD(nextval('seq_user_number')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_number
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION generate_user_number();
```

### 4.2 Complaint Service Database (`epeople2_complaint`)

```sql
-- ============================================================
-- Database: epeople2_complaint
-- Description: 민원 접수, 처리, 이관, 공동처리, 만족도
-- 가장 복잡한 도메인: G-01~G-04, G-06, G-07, G-08, G-12
-- ============================================================

CREATE DATABASE epeople2_complaint
    WITH ENCODING = 'UTF8'
    LC_COLLATE = 'und-x-icu'
    LC_CTYPE = 'und-x-icu'
    TEMPLATE = template0;

\c epeople2_complaint;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── ENUM 타입 정의 ───────────────────────────────────────

-- G-01: 5가지 민원 유형 (SLA, 워크플로우, 통계의 기반)
CREATE TYPE complaint_type AS ENUM (
    'grievance',      -- 고충민원 (Réclamation / تظلم)       — SLA 60일
    'proposal',       -- 제안     (Suggestion / اقتراح)      — SLA 30일
    'inquiry',        -- 질의     (Renseignement / استفسار)  — SLA 7일
    'suggestion',     -- 건의     (Doléance / ملاحظة)        — SLA 30일
    'report'          -- 신고     (Signalement / بلاغ)       — SLA 15일
);

CREATE TYPE complaint_status AS ENUM (
    'received',       -- 접수됨 (Reçue)
    'assigned',       -- 기관 배분됨 (Assignée)
    'processing',     -- 처리 중 (En cours)
    'completed',      -- 처리 완료 (Traitée)
    'closed'          -- 종결 (Clôturée)
);

CREATE TYPE history_action AS ENUM (
    'received',              -- 접수
    'assigned',              -- 배분
    'transferred',           -- 이관
    'joint_process_started', -- 공동처리 시작 (G-03)
    'deadline_extended',     -- 기한 연장 (G-04)
    'processed',             -- 답변 작성 완료
    'completed',             -- 처리 완료
    'closed',                -- 종결
    'reopened'               -- 이의신청으로 재개
);

CREATE TYPE transfer_status AS ENUM (
    'requested',      -- 이관 요청
    'approved',       -- 이관 승인
    'rejected',       -- 이관 거부
    'completed'       -- 이관 완료
);

CREATE TYPE extension_status AS ENUM (
    'pending_approval',  -- 승인 대기
    'approved',          -- 승인
    'rejected'           -- 거부
);

CREATE TYPE joint_process_status AS ENUM (
    'active',         -- 진행 중
    'completed',      -- 완료
    'cancelled'       -- 취소
);

CREATE TYPE agency_opinion_status AS ENUM (
    'pending',        -- 의견 제출 대기
    'submitted'       -- 의견 제출 완료
);

CREATE TYPE group_complaint_status AS ENUM (
    'open',           -- 접수 중 (추가 가입 가능)
    'processing',     -- 처리 중
    'closed'          -- 종결
);

-- ─── complaint_categories 테이블 (분류 코드 - 3단계 계층) ─

CREATE TABLE complaint_categories (
    code        VARCHAR(10) PRIMARY KEY,                            -- '01', '0101', '010101'
    name_fr     VARCHAR(200) NOT NULL,
    name_ar     VARCHAR(200) NOT NULL,
    description_fr VARCHAR(500),
    description_ar VARCHAR(500),
    level       SMALLINT NOT NULL CHECK (level IN (1, 2, 3)),       -- L1, L2, L3
    parent_code VARCHAR(10) REFERENCES complaint_categories(code),
    default_agency_id VARCHAR(30),                                  -- 기본 담당 기관 (Admin API 참조)
    is_active   BOOLEAN NOT NULL DEFAULT true,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_category_level_parent CHECK (
        (level = 1 AND parent_code IS NULL) OR
        (level > 1 AND parent_code IS NOT NULL)
    )
);

COMMENT ON TABLE complaint_categories IS '민원 분류 코드 (Codes de classification) - 대/중/소 3단계';
COMMENT ON COLUMN complaint_categories.code IS '분류 코드: L1=2자리, L2=4자리, L3=6자리';

CREATE INDEX idx_categories_parent ON complaint_categories (parent_code);
CREATE INDEX idx_categories_level ON complaint_categories (level, sort_order);

-- ─── group_complaints 테이블 (다수인 민원, G-12) ──────────

CREATE TABLE group_complaints (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_number                VARCHAR(30) NOT NULL,                -- 'GRP-YYYY-NNNNNN'
    representative_complaint_id UUID,                                -- 대표 민원 (후에 FK 추가)
    title_fr                    VARCHAR(200) NOT NULL,
    title_ar                    VARCHAR(200) NOT NULL,
    description_fr              TEXT,
    description_ar              TEXT,
    status                      group_complaint_status NOT NULL DEFAULT 'open',
    member_count                INTEGER NOT NULL DEFAULT 0,
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    closed_at                   TIMESTAMP WITH TIME ZONE,
    created_by                  UUID,

    CONSTRAINT uq_group_number UNIQUE (group_number)
);

COMMENT ON TABLE group_complaints IS '다수인(집단) 민원 (Plaintes collectives) - G-12';

-- ─── complaints 테이블 (민원 Ticket) ──────────────────────

CREATE TABLE complaints (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_number        VARCHAR(30) NOT NULL,                    -- 'CMP-YYYY-NNNNNN'
    type                    complaint_type NOT NULL,                  -- G-01: 5유형
    status                  complaint_status NOT NULL DEFAULT 'received',
    title_fr                VARCHAR(200) NOT NULL,
    title_ar                VARCHAR(200) NOT NULL,
    content_fr              TEXT NOT NULL,
    content_ar              TEXT NOT NULL,
    category_l1             VARCHAR(10) NOT NULL REFERENCES complaint_categories(code),
    category_l2             VARCHAR(10) NOT NULL REFERENCES complaint_categories(code),
    category_l3             VARCHAR(10) REFERENCES complaint_categories(code),
    region_code             VARCHAR(20),                             -- 행정구역 코드
    incident_date           DATE,
    citizen_id_encrypted    BYTEA NOT NULL,                          -- AES-256-GCM 암호화
    assigned_agency_id      VARCHAR(30),                             -- Admin API 참조
    assigned_officer_id     UUID,                                    -- Auth API 참조
    transfer_count          SMALLINT NOT NULL DEFAULT 0,             -- G-02: 이관 횟수
    deadline_at             TIMESTAMP WITH TIME ZONE NOT NULL,       -- 처리기한
    original_deadline_at    TIMESTAMP WITH TIME ZONE NOT NULL,       -- G-04: 연장 전 원래 기한
    submitted_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    assigned_at             TIMESTAMP WITH TIME ZONE,
    completed_at            TIMESTAMP WITH TIME ZONE,
    closed_at               TIMESTAMP WITH TIME ZONE,
    answer_content_fr       TEXT,                                    -- 처리 답변
    answer_content_ar       TEXT,
    answer_officer_id       UUID,
    answered_at             TIMESTAMP WITH TIME ZONE,
    group_complaint_id      UUID REFERENCES group_complaints(id),    -- G-12: 다수인 민원 소속
    consent_given           BOOLEAN NOT NULL DEFAULT false,
    deleted_at              TIMESTAMP WITH TIME ZONE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by              UUID NOT NULL,
    updated_by              UUID,

    CONSTRAINT uq_complaint_number UNIQUE (complaint_number),
    CONSTRAINT chk_complaint_transfer CHECK (transfer_count >= 0),
    CONSTRAINT chk_complaint_consent CHECK (consent_given = true)
);

COMMENT ON TABLE complaints IS '민원 Ticket (Plaintes) - G-01 5유형, G-02 이관통제, G-04 기한연장';
COMMENT ON COLUMN complaints.complaint_number IS '비즈니스 ID: CMP-YYYY-NNNNNN';
COMMENT ON COLUMN complaints.type IS 'G-01: 5가지 민원 유형 (SLA 자동 적용 기준)';
COMMENT ON COLUMN complaints.transfer_count IS 'G-02: 이관 횟수 (>=2 경고, >=3 BCRC 자동보고)';
COMMENT ON COLUMN complaints.deadline_at IS '현재 처리기한 (연장 반영)';
COMMENT ON COLUMN complaints.original_deadline_at IS 'G-04: 최초 배정 시 SLA에 의해 자동 설정된 기한';

-- 인덱스
CREATE INDEX idx_complaints_number ON complaints (complaint_number);
CREATE INDEX idx_complaints_status ON complaints (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_complaints_type ON complaints (type) WHERE deleted_at IS NULL;
CREATE INDEX idx_complaints_type_status ON complaints (type, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_complaints_agency ON complaints (assigned_agency_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_complaints_officer ON complaints (assigned_officer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_complaints_deadline ON complaints (deadline_at) WHERE deleted_at IS NULL AND status IN ('received', 'assigned', 'processing');
CREATE INDEX idx_complaints_submitted ON complaints (submitted_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_complaints_citizen ON complaints (citizen_id_encrypted) WHERE deleted_at IS NULL;
CREATE INDEX idx_complaints_group ON complaints (group_complaint_id) WHERE group_complaint_id IS NOT NULL;
-- G-02: 이관 다발 민원 조회용
CREATE INDEX pidx_complaints_high_transfer ON complaints (transfer_count DESC, deadline_at)
    WHERE deleted_at IS NULL AND transfer_count >= 2 AND status IN ('received', 'assigned', 'processing');
-- 전문 검색 (프랑스어/아랍어)
CREATE INDEX idx_complaints_title_fr_trgm ON complaints USING gin (title_fr gin_trgm_ops);
CREATE INDEX idx_complaints_title_ar_trgm ON complaints USING gin (title_ar gin_trgm_ops);

-- complaint_number 시퀀스
CREATE SEQUENCE seq_complaint_number START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION generate_complaint_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.complaint_number IS NULL THEN
        NEW.complaint_number = 'CMP-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' ||
            LPAD(nextval('seq_complaint_number')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_complaint_number
    BEFORE INSERT ON complaints
    FOR EACH ROW
    EXECUTE FUNCTION generate_complaint_number();

-- group_complaints FK (순환 참조 해결)
ALTER TABLE group_complaints
    ADD CONSTRAINT fk_group_representative
    FOREIGN KEY (representative_complaint_id) REFERENCES complaints(id);

-- ─── complaint_histories 테이블 (처리 이력) ───────────────

CREATE TABLE complaint_histories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id    UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    action          history_action NOT NULL,
    action_label_fr VARCHAR(200) NOT NULL,                          -- 화면 표시용
    action_label_ar VARCHAR(200) NOT NULL,
    from_agency_id  VARCHAR(30),
    to_agency_id    VARCHAR(30),
    officer_id      UUID,
    officer_name    VARCHAR(100),
    reason_fr       TEXT,
    reason_ar       TEXT,
    note_fr         TEXT,
    note_ar         TEXT,
    metadata        JSONB,                                          -- 추가 메타데이터
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE complaint_histories IS '민원 처리 이력 (Historique des plaintes) - 타임라인 표시용';

CREATE INDEX idx_histories_complaint ON complaint_histories (complaint_id, created_at);
CREATE INDEX idx_histories_action ON complaint_histories (action);

-- ─── complaint_attachments 테이블 (첨부파일) ──────────────

CREATE TABLE complaint_attachments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attachment_number VARCHAR(20) NOT NULL,                          -- 'ATT-NNNNNN'
    complaint_id    UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    file_name       VARCHAR(255) NOT NULL,                          -- 서버 저장 파일명
    original_name   VARCHAR(255) NOT NULL,                          -- 원본 파일명
    size_bytes      BIGINT NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 10485760), -- 최대 10MB
    mime_type       VARCHAR(100) NOT NULL,
    storage_path    VARCHAR(500) NOT NULL,                          -- 객체 스토리지 경로 (MinIO)
    hash_sha256     VARCHAR(64),                                    -- 파일 무결성 검증용
    uploaded_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    uploaded_by     UUID NOT NULL,

    CONSTRAINT uq_attachment_number UNIQUE (attachment_number),
    CONSTRAINT chk_attachment_mime CHECK (
        mime_type IN (
            'image/jpeg', 'image/png', 'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    )
);

COMMENT ON TABLE complaint_attachments IS '민원 첨부파일 (Pièces jointes) - 최대 5개, 각 10MB';

CREATE INDEX idx_attachments_complaint ON complaint_attachments (complaint_id);

CREATE SEQUENCE seq_attachment_number START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION generate_attachment_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.attachment_number IS NULL THEN
        NEW.attachment_number = 'ATT-' || LPAD(nextval('seq_attachment_number')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_attachment_number
    BEFORE INSERT ON complaint_attachments
    FOR EACH ROW
    EXECUTE FUNCTION generate_attachment_number();

-- ─── complaint_transfers 테이블 (이관 이력, G-02) ────────

CREATE TABLE complaint_transfers (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_number     VARCHAR(20) NOT NULL,                        -- 'TRF-NNNNNN'
    complaint_id        UUID NOT NULL REFERENCES complaints(id),
    sequence_number     SMALLINT NOT NULL,                           -- 이 민원의 N번째 이관
    from_agency_id      VARCHAR(30) NOT NULL,
    to_agency_id        VARCHAR(30) NOT NULL,
    reason_fr           TEXT NOT NULL,
    reason_ar           TEXT NOT NULL,
    status              transfer_status NOT NULL DEFAULT 'requested',
    requested_by        UUID NOT NULL,
    approved_by         UUID,
    bcrc_auto_reported  BOOLEAN NOT NULL DEFAULT false,              -- G-02: 3회 이상 시 자동보고
    bcrc_report_at      TIMESTAMP WITH TIME ZONE,
    requested_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at        TIMESTAMP WITH TIME ZONE,

    CONSTRAINT uq_transfer_number UNIQUE (transfer_number),
    CONSTRAINT chk_transfer_agencies CHECK (from_agency_id != to_agency_id),
    CONSTRAINT chk_transfer_reason_length CHECK (
        char_length(reason_fr) >= 50 AND char_length(reason_ar) >= 50
    )
);

COMMENT ON TABLE complaint_transfers IS '민원 이관 이력 (Historique des transferts) - G-02 이관남용 통제';
COMMENT ON COLUMN complaint_transfers.sequence_number IS 'G-02: 이 민원의 N번째 이관 (>=2 경고, >=3 BCRC보고)';
COMMENT ON COLUMN complaint_transfers.bcrc_auto_reported IS 'G-02: sequence_number >= 3 시 자동으로 true 설정';
COMMENT ON COLUMN complaint_transfers.reason_fr IS '이관 사유 (최소 50자 필수)';

CREATE INDEX idx_transfers_complaint ON complaint_transfers (complaint_id, sequence_number);
-- G-02: BCRC 자동 보고 대상 조회
CREATE INDEX pidx_transfers_bcrc_report ON complaint_transfers (bcrc_report_at DESC)
    WHERE bcrc_auto_reported = true;

-- G-02: 이관 시 자동 보고 트리거
CREATE OR REPLACE FUNCTION trigger_transfer_bcrc_report()
RETURNS TRIGGER AS $$
BEGIN
    -- 이관 횟수 증가
    UPDATE complaints
    SET transfer_count = transfer_count + 1,
        assigned_agency_id = NEW.to_agency_id,
        updated_at = NOW()
    WHERE id = NEW.complaint_id;

    -- 3회 이상 이관 시 BCRC 자동 보고
    IF NEW.sequence_number >= 3 THEN
        NEW.bcrc_auto_reported = true;
        NEW.bcrc_report_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_transfer_bcrc_report
    BEFORE INSERT ON complaint_transfers
    FOR EACH ROW
    EXECUTE FUNCTION trigger_transfer_bcrc_report();

-- ─── joint_processes 테이블 (공동처리, G-03) ──────────────

CREATE TABLE joint_processes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id    UUID NOT NULL REFERENCES complaints(id),
    lead_agency_id  VARCHAR(30) NOT NULL,                            -- 주관 기관
    status          joint_process_status NOT NULL DEFAULT 'active',
    started_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMP WITH TIME ZONE,
    started_by      UUID NOT NULL,

    CONSTRAINT uq_joint_complaint UNIQUE (complaint_id)
);

COMMENT ON TABLE joint_processes IS '공동처리 (Traitement conjoint) - G-03 다기관 협업';

-- ─── joint_process_agencies 테이블 (공동처리 참여기관) ────

CREATE TABLE joint_process_agencies (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    joint_process_id    UUID NOT NULL REFERENCES joint_processes(id) ON DELETE CASCADE,
    agency_id           VARCHAR(30) NOT NULL,
    opinion_fr          TEXT,
    opinion_ar          TEXT,
    status              agency_opinion_status NOT NULL DEFAULT 'pending',
    due_at              TIMESTAMP WITH TIME ZONE,
    submitted_at        TIMESTAMP WITH TIME ZONE,
    submitted_by        UUID,

    CONSTRAINT uq_joint_agency UNIQUE (joint_process_id, agency_id)
);

COMMENT ON TABLE joint_process_agencies IS '공동처리 참여기관 (Agences participantes) - G-03';

CREATE INDEX idx_joint_agencies_process ON joint_process_agencies (joint_process_id);

-- ─── deadline_extensions 테이블 (기한 연장, G-04) ────────

CREATE TABLE deadline_extensions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    extension_number        VARCHAR(20) NOT NULL,                    -- 'EXT-NNNNNN'
    complaint_id            UUID NOT NULL REFERENCES complaints(id),
    requested_additional_days INTEGER NOT NULL CHECK (requested_additional_days > 0 AND requested_additional_days <= 30),
    reason_fr               TEXT NOT NULL,
    reason_ar               TEXT NOT NULL,
    status                  extension_status NOT NULL DEFAULT 'pending_approval',
    current_deadline_at     TIMESTAMP WITH TIME ZONE NOT NULL,
    requested_deadline_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    requested_by            UUID NOT NULL,
    requested_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    reviewed_by             UUID,
    reviewed_at             TIMESTAMP WITH TIME ZONE,
    review_note_fr          TEXT,
    review_note_ar          TEXT,

    CONSTRAINT uq_extension_number UNIQUE (extension_number)
);

COMMENT ON TABLE deadline_extensions IS '처리기한 연장 신청 (Demande de prolongation) - G-04';
COMMENT ON COLUMN deadline_extensions.requested_additional_days IS '연장 요청 일수 (최대 30일)';

CREATE INDEX idx_extensions_complaint ON deadline_extensions (complaint_id);
CREATE INDEX pidx_extensions_pending ON deadline_extensions (requested_at DESC)
    WHERE status = 'pending_approval';

-- G-04: 연장 승인 시 민원 기한 자동 갱신 트리거
CREATE OR REPLACE FUNCTION trigger_extension_approved()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status = 'pending_approval' THEN
        UPDATE complaints
        SET deadline_at = NEW.requested_deadline_at,
            updated_at = NOW()
        WHERE id = NEW.complaint_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_extension_approved
    AFTER UPDATE ON deadline_extensions
    FOR EACH ROW
    WHEN (NEW.status = 'approved' AND OLD.status = 'pending_approval')
    EXECUTE FUNCTION trigger_extension_approved();

-- ─── satisfaction_scores 테이블 (만족도 평가) ─────────────

CREATE TABLE satisfaction_scores (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id    UUID NOT NULL REFERENCES complaints(id),
    citizen_id      UUID NOT NULL,                                   -- Auth API 참조
    score           SMALLINT NOT NULL CHECK (score >= 1 AND score <= 5),
    comment_fr      TEXT,
    comment_ar      TEXT,
    submitted_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_satisfaction_complaint UNIQUE (complaint_id)
);

COMMENT ON TABLE satisfaction_scores IS '만족도 평가 (Évaluation de satisfaction) - 1~5점 척도';

-- ─── similar_complaints 테이블 (유사 민원 연결, G-07) ─────

CREATE TABLE similar_complaints (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_complaint_id     UUID NOT NULL REFERENCES complaints(id),
    similar_complaint_id    UUID NOT NULL REFERENCES complaints(id),
    similarity_score        DECIMAL(5,4) CHECK (similarity_score >= 0 AND similarity_score <= 1),
    matched_by              VARCHAR(50) NOT NULL DEFAULT 'system',   -- 'system', 'officer', 'manual'
    matched_fields          JSONB,                                   -- 매칭 근거 필드 목록
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_similar_not_self CHECK (source_complaint_id != similar_complaint_id),
    CONSTRAINT uq_similar_pair UNIQUE (source_complaint_id, similar_complaint_id)
);

COMMENT ON TABLE similar_complaints IS '유사 민원 연결 (Plaintes similaires) - G-07 선례 참조';

CREATE INDEX idx_similar_source ON similar_complaints (source_complaint_id);
CREATE INDEX idx_similar_target ON similar_complaints (similar_complaint_id);

-- ─── answer_templates 테이블 (답변 표준 템플릿, G-08) ────

CREATE TABLE answer_templates (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type            complaint_type,                                  -- NULL = 전체 유형 공통
    category_l1     VARCHAR(10) REFERENCES complaint_categories(code),
    category_l2     VARCHAR(10) REFERENCES complaint_categories(code),
    title_fr        VARCHAR(200) NOT NULL,
    title_ar        VARCHAR(200) NOT NULL,
    content_fr      TEXT NOT NULL,
    content_ar      TEXT NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    usage_count     INTEGER NOT NULL DEFAULT 0,
    version         INTEGER NOT NULL DEFAULT 1,
    created_by      UUID NOT NULL,
    updated_by      UUID,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE answer_templates IS '답변 표준 템플릿 (Modèles de réponse) - G-08 BCRC 중앙관리';

CREATE INDEX idx_templates_type ON answer_templates (type) WHERE is_active = true;
CREATE INDEX idx_templates_category ON answer_templates (category_l1, category_l2) WHERE is_active = true;

-- ─── updated_at 트리거 ────────────────────────────────────

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_complaints_updated_at BEFORE UPDATE ON complaints
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON complaint_categories
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER trg_templates_updated_at BEFORE UPDATE ON answer_templates
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
```

### 4.3 Anti-Corruption Service Database (`epeople2_anticorruption`)

```sql
-- ============================================================
-- Database: epeople2_anticorruption
-- Description: 부패 신고 접수, 조사, 신고자 보호
-- ⚠️ 민원(epeople2_complaint)과 완전히 분리
-- 담당 조직: DGGPC (vs 민원: BCRC)
-- 보안 등급: 기밀
-- ============================================================

CREATE DATABASE epeople2_anticorruption
    WITH ENCODING = 'UTF8'
    LC_COLLATE = 'und-x-icu'
    LC_CTYPE = 'und-x-icu'
    TEMPLATE = template0;

\c epeople2_anticorruption;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── ENUM 타입 정의 ───────────────────────────────────────

CREATE TYPE corruption_type AS ENUM (
    'bribery',            -- 뇌물 (Corruption)
    'embezzlement',       -- 횡령 (Détournement)
    'abuse_of_power',     -- 직권남용 (Abus de pouvoir)
    'nepotism',           -- 연고주의 (Népotisme)
    'other'               -- 기타 (Autre)
);

CREATE TYPE corruption_report_status AS ENUM (
    'received',               -- 접수 (Reçu)
    'preliminary_review',     -- 예비 검토 (Examen préliminaire)
    'under_investigation',    -- 정식 조사 중 (En cours d''enquête)
    'completed',              -- 처리 완료 (Traité)
    'dismissed'               -- 각하 (Classé sans suite)
);

CREATE TYPE protection_type AS ENUM (
    'identity_protection',    -- 신원 보호
    'employment_protection',  -- 고용 보호
    'physical_protection',    -- 신변 보호
    'legal_support'           -- 법률 지원
);

-- ─── corruption_reports 테이블 (부패 신고) ────────────────

CREATE TABLE corruption_reports (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_number           VARCHAR(30) NOT NULL,                    -- 'RPT-YYYY-NNNNNN'
    type                    corruption_type NOT NULL,
    status                  corruption_report_status NOT NULL DEFAULT 'received',
    title_fr                VARCHAR(200) NOT NULL,
    title_ar                VARCHAR(200) NOT NULL,
    content_fr              TEXT NOT NULL,
    content_ar              TEXT NOT NULL,
    target_agency_id        VARCHAR(30),                             -- 피신고 기관 (Admin API)
    target_description_fr   TEXT,                                    -- 피신고 대상 설명
    target_description_ar   TEXT,
    incident_date           DATE,
    location_fr             VARCHAR(500),
    location_ar             VARCHAR(500),
    is_anonymous            BOOLEAN NOT NULL DEFAULT false,
    reporter_id_encrypted   BYTEA,                                   -- AES-256-GCM (실명 신고 시)
    anonymous_token_encrypted BYTEA,                                 -- AES-256-GCM (익명 신고 시)
    tracking_code           VARCHAR(30) NOT NULL,                    -- 신고자 조회용 코드
    assigned_officer_id     UUID,                                    -- DGGPC 담당자 (Auth API)
    assigned_team_id        VARCHAR(30),                             -- 거버넌스팀 ID
    submitted_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at            TIMESTAMP WITH TIME ZONE,
    dismissed_at            TIMESTAMP WITH TIME ZONE,
    result_summary_fr       TEXT,
    result_summary_ar       TEXT,
    severity_level          SMALLINT DEFAULT 1 CHECK (severity_level BETWEEN 1 AND 5),
    deleted_at              TIMESTAMP WITH TIME ZONE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by              UUID,

    CONSTRAINT uq_report_number UNIQUE (report_number),
    CONSTRAINT uq_tracking_code UNIQUE (tracking_code),
    CONSTRAINT chk_report_identity CHECK (
        (is_anonymous = true AND anonymous_token_encrypted IS NOT NULL) OR
        (is_anonymous = false AND reporter_id_encrypted IS NOT NULL)
    )
);

COMMENT ON TABLE corruption_reports IS '부패 신고 (Signalements de corruption) - DGGPC 전용, 민원과 완전 분리';
COMMENT ON COLUMN corruption_reports.reporter_id_encrypted IS '⚠️ 시민 식별 정보 암호화 - DGGPC만 접근';
COMMENT ON COLUMN corruption_reports.anonymous_token_encrypted IS '⚠️ 익명 토큰 암호화 - 신고자 보호';

CREATE INDEX idx_reports_number ON corruption_reports (report_number);
CREATE INDEX idx_reports_tracking ON corruption_reports (tracking_code);
CREATE INDEX idx_reports_status ON corruption_reports (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_reports_type ON corruption_reports (type) WHERE deleted_at IS NULL;
CREATE INDEX idx_reports_officer ON corruption_reports (assigned_officer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reports_submitted ON corruption_reports (submitted_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_reports_target_agency ON corruption_reports (target_agency_id) WHERE deleted_at IS NULL;

-- report_number 시퀀스
CREATE SEQUENCE seq_report_number START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION generate_report_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.report_number IS NULL THEN
        NEW.report_number = 'RPT-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' ||
            LPAD(nextval('seq_report_number')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_report_number
    BEFORE INSERT ON corruption_reports
    FOR EACH ROW
    EXECUTE FUNCTION generate_report_number();

-- ─── corruption_report_histories 테이블 (처리 이력) ───────

CREATE TABLE corruption_report_histories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id       UUID NOT NULL REFERENCES corruption_reports(id) ON DELETE CASCADE,
    action          VARCHAR(50) NOT NULL,
    action_label_fr VARCHAR(200) NOT NULL,
    action_label_ar VARCHAR(200) NOT NULL,
    officer_id      UUID,
    note_fr         TEXT,
    note_ar         TEXT,
    is_confidential BOOLEAN NOT NULL DEFAULT false,                  -- 내부 메모 여부
    metadata        JSONB,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE corruption_report_histories IS '부패 신고 처리 이력 (Historique des signalements)';

CREATE INDEX idx_report_histories_report ON corruption_report_histories (report_id, created_at);

-- ─── corruption_report_attachments 테이블 (첨부파일) ──────

CREATE TABLE corruption_report_attachments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id       UUID NOT NULL REFERENCES corruption_reports(id) ON DELETE CASCADE,
    file_name       VARCHAR(255) NOT NULL,
    original_name   VARCHAR(255) NOT NULL,
    size_bytes      BIGINT NOT NULL CHECK (size_bytes > 0),
    mime_type       VARCHAR(100) NOT NULL,
    storage_path    VARCHAR(500) NOT NULL,                           -- 암호화된 스토리지 경로
    hash_sha256     VARCHAR(64),
    is_evidence     BOOLEAN NOT NULL DEFAULT false,                  -- 증거자료 여부
    uploaded_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    uploaded_by     UUID
);

COMMENT ON TABLE corruption_report_attachments IS '부패 신고 첨부파일 (Pièces jointes) - 증거자료 포함';

CREATE INDEX idx_report_attachments_report ON corruption_report_attachments (report_id);

-- ─── investigation_notes 테이블 (조사 메모 - DGGPC 전용) ─

CREATE TABLE investigation_notes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id       UUID NOT NULL REFERENCES corruption_reports(id),
    officer_id      UUID NOT NULL,
    note_fr         TEXT NOT NULL,
    note_ar         TEXT,
    note_type       VARCHAR(50) NOT NULL DEFAULT 'general',          -- general, finding, evidence, conclusion
    is_confidential BOOLEAN NOT NULL DEFAULT true,                   -- 기본 기밀
    classification  VARCHAR(20) NOT NULL DEFAULT 'CONFIDENTIAL' CHECK (
        classification IN ('INTERNAL', 'CONFIDENTIAL', 'SECRET')
    ),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE investigation_notes IS '조사 메모 (Notes d''enquête) - DGGPC 전용, 기밀 문서';

CREATE INDEX idx_inv_notes_report ON investigation_notes (report_id, created_at);

-- ─── whistleblower_protection 테이블 (신고자 보호 기록) ──

CREATE TABLE whistleblower_protection (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id       UUID NOT NULL REFERENCES corruption_reports(id),
    protection_type protection_type NOT NULL,
    status          VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (
        status IN ('requested', 'active', 'expired', 'revoked')
    ),
    description_fr  TEXT NOT NULL,
    description_ar  TEXT,
    measures_taken_fr TEXT,
    measures_taken_ar TEXT,
    effective_from  DATE NOT NULL,
    effective_to    DATE,
    requested_by    UUID,
    approved_by     UUID,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by      UUID NOT NULL
);

COMMENT ON TABLE whistleblower_protection IS '신고자 보호 기록 (Protection des lanceurs d''alerte)';

CREATE INDEX idx_protection_report ON whistleblower_protection (report_id);
CREATE INDEX pidx_protection_active ON whistleblower_protection (effective_to)
    WHERE status = 'active';

-- ─── updated_at 트리거 ────────────────────────────────────

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reports_updated_at BEFORE UPDATE ON corruption_reports
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER trg_inv_notes_updated_at BEFORE UPDATE ON investigation_notes
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER trg_protection_updated_at BEFORE UPDATE ON whistleblower_protection
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
```

### 4.4 eParticipation Service Database (`epeople2_eparticipation`)

```sql
-- ============================================================
-- Database: epeople2_eparticipation
-- Description: 국민제안, 공감, 심사, 이행현황 (G-05)
-- ============================================================

CREATE DATABASE epeople2_eparticipation
    WITH ENCODING = 'UTF8'
    LC_COLLATE = 'und-x-icu'
    LC_CTYPE = 'und-x-icu'
    TEMPLATE = template0;

\c epeople2_eparticipation;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ENUM 타입
CREATE TYPE proposal_status AS ENUM (
    'pending',        -- 검토 대기
    'under_review',   -- 검토 중
    'accepted',       -- 채택
    'rejected',       -- 미채택
    'implemented'     -- 이행 완료
);

CREATE TYPE review_result AS ENUM ('accepted', 'rejected');

-- ─── proposals 테이블 (국민제안) ──────────────────────────

CREATE TABLE proposals (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_number     VARCHAR(30) NOT NULL,
    title_fr            VARCHAR(200) NOT NULL,
    title_ar            VARCHAR(200) NOT NULL,
    content_fr          TEXT NOT NULL,
    content_ar          TEXT NOT NULL,
    status              proposal_status NOT NULL DEFAULT 'pending',
    category_l1         VARCHAR(10) NOT NULL,
    citizen_id          UUID NOT NULL,
    assigned_agency_id  VARCHAR(30),
    like_count          INTEGER NOT NULL DEFAULT 0,
    submitted_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by          UUID NOT NULL,

    CONSTRAINT uq_proposal_number UNIQUE (proposal_number),
    CONSTRAINT chk_proposal_like_count CHECK (like_count >= 0)
);

COMMENT ON TABLE proposals IS '국민제안 (Propositions citoyennes) - G-05 전자참여';

CREATE INDEX idx_proposals_status ON proposals (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_proposals_citizen ON proposals (citizen_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_proposals_agency ON proposals (assigned_agency_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_proposals_likes ON proposals (like_count DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_proposals_submitted ON proposals (submitted_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_proposals_title_fr_trgm ON proposals USING gin (title_fr gin_trgm_ops);

CREATE SEQUENCE seq_proposal_number START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION generate_proposal_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.proposal_number IS NULL THEN
        NEW.proposal_number = 'PRP-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' ||
            LPAD(nextval('seq_proposal_number')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_proposal_number
    BEFORE INSERT ON proposals
    FOR EACH ROW EXECUTE FUNCTION generate_proposal_number();

-- ─── proposal_reviews 테이블 (심사 결과) ──────────────────

CREATE TABLE proposal_reviews (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id             UUID NOT NULL REFERENCES proposals(id),
    result                  review_result NOT NULL,
    review_comment_fr       TEXT NOT NULL,
    review_comment_ar       TEXT NOT NULL,
    implementation_plan_fr  TEXT,
    implementation_plan_ar  TEXT,
    reviewed_at             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    reviewed_by             UUID NOT NULL,

    CONSTRAINT uq_review_proposal UNIQUE (proposal_id)
);

COMMENT ON TABLE proposal_reviews IS '제안 심사 결과 (Résultats d''examen) - G-05';

-- ─── proposal_likes 테이블 (공감) ─────────────────────────

CREATE TABLE proposal_likes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id     UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_proposal_like UNIQUE (proposal_id, user_id)
);

COMMENT ON TABLE proposal_likes IS '제안 공감 (J''aime) - G-05 시민 참여';

CREATE INDEX idx_likes_proposal ON proposal_likes (proposal_id);
CREATE INDEX idx_likes_user ON proposal_likes (user_id);

-- 공감 수 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION trigger_update_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE proposals SET like_count = like_count + 1, updated_at = NOW()
        WHERE id = NEW.proposal_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE proposals SET like_count = GREATEST(like_count - 1, 0), updated_at = NOW()
        WHERE id = OLD.proposal_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_like_count_insert AFTER INSERT ON proposal_likes
    FOR EACH ROW EXECUTE FUNCTION trigger_update_like_count();
CREATE TRIGGER trg_like_count_delete AFTER DELETE ON proposal_likes
    FOR EACH ROW EXECUTE FUNCTION trigger_update_like_count();

-- ─── implementation_updates 테이블 (이행 현황) ────────────

CREATE TABLE implementation_updates (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id     UUID NOT NULL REFERENCES proposals(id),
    content_fr      TEXT NOT NULL,
    content_ar      TEXT NOT NULL,
    progress        SMALLINT NOT NULL CHECK (progress >= 0 AND progress <= 100),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by      UUID NOT NULL
);

COMMENT ON TABLE implementation_updates IS '제안 이행 현황 (Suivi de mise en oeuvre) - G-05';

CREATE INDEX idx_impl_updates_proposal ON implementation_updates (proposal_id, updated_at DESC);

-- ─── proposal_attachments 테이블 ──────────────────────────

CREATE TABLE proposal_attachments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id     UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    file_name       VARCHAR(255) NOT NULL,
    original_name   VARCHAR(255) NOT NULL,
    size_bytes      BIGINT NOT NULL CHECK (size_bytes > 0),
    mime_type       VARCHAR(100) NOT NULL,
    storage_path    VARCHAR(500) NOT NULL,
    uploaded_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    uploaded_by     UUID NOT NULL
);

CREATE INDEX idx_proposal_attachments ON proposal_attachments (proposal_id);
```

### 4.5 Statistics Service Database (`epeople2_statistics`)

```sql
-- ============================================================
-- Database: epeople2_statistics
-- Description: 통계 집계, 기관 성과, 보고서 (G-06, G-11)
-- ============================================================

CREATE DATABASE epeople2_statistics
    WITH ENCODING = 'UTF8'
    LC_COLLATE = 'und-x-icu'
    LC_CTYPE = 'und-x-icu'
    TEMPLATE = template0;

\c epeople2_statistics;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── daily_statistics 테이블 (일간 통계) ──────────────────

CREATE TABLE daily_statistics (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stat_date           DATE NOT NULL,
    total_received      INTEGER NOT NULL DEFAULT 0,
    total_completed     INTEGER NOT NULL DEFAULT 0,
    total_overdue       INTEGER NOT NULL DEFAULT 0,
    total_transferred   INTEGER NOT NULL DEFAULT 0,
    by_type             JSONB NOT NULL DEFAULT '{}',
    by_status           JSONB NOT NULL DEFAULT '{}',
    by_agency           JSONB NOT NULL DEFAULT '{}',
    by_region           JSONB NOT NULL DEFAULT '{}',
    avg_processing_days DECIMAL(8,2),
    avg_satisfaction    DECIMAL(3,2),
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_daily_stat_date UNIQUE (stat_date)
);

COMMENT ON TABLE daily_statistics IS '일간 통계 집계 (Statistiques quotidiennes)';
COMMENT ON COLUMN daily_statistics.by_type IS 'JSON: {"grievance": 10, "inquiry": 5, ...}';

CREATE INDEX idx_daily_stats_date ON daily_statistics (stat_date DESC);

-- ─── monthly_statistics 테이블 (월간 통계) ────────────────

CREATE TABLE monthly_statistics (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stat_month          VARCHAR(7) NOT NULL,                         -- 'YYYY-MM'
    total_received      INTEGER NOT NULL DEFAULT 0,
    total_completed     INTEGER NOT NULL DEFAULT 0,
    total_overdue       INTEGER NOT NULL DEFAULT 0,
    completion_rate     DECIMAL(5,2),
    by_type             JSONB NOT NULL DEFAULT '{}',
    by_status           JSONB NOT NULL DEFAULT '{}',
    by_agency           JSONB NOT NULL DEFAULT '{}',
    by_region           JSONB NOT NULL DEFAULT '{}',
    avg_processing_days DECIMAL(8,2),
    avg_satisfaction    DECIMAL(3,2),
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_monthly_stat_month UNIQUE (stat_month)
);

COMMENT ON TABLE monthly_statistics IS '월간 통계 집계 (Statistiques mensuelles) - 추이 차트용';

CREATE INDEX idx_monthly_stats_month ON monthly_statistics (stat_month DESC);

-- ─── agency_performance 테이블 (기관 성과, G-11) ──────────

CREATE TABLE agency_performance (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id           VARCHAR(30) NOT NULL,
    agency_name_fr      VARCHAR(300),
    agency_name_ar      VARCHAR(300),
    period_start        DATE NOT NULL,
    period_end          DATE NOT NULL,
    received            INTEGER NOT NULL DEFAULT 0,
    completed           INTEGER NOT NULL DEFAULT 0,
    completion_rate     DECIMAL(5,2),
    avg_processing_days DECIMAL(8,2),
    sla_compliance_rate DECIMAL(5,2),
    satisfaction_score  DECIMAL(3,2),
    transfer_count      INTEGER NOT NULL DEFAULT 0,
    overdue_count       INTEGER NOT NULL DEFAULT 0,
    by_type             JSONB DEFAULT '{}',
    rank_overall        INTEGER,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_agency_perf_period UNIQUE (agency_id, period_start, period_end)
);

COMMENT ON TABLE agency_performance IS '기관 성과 (Performance des agences) - G-11 공개 평가';
COMMENT ON COLUMN agency_performance.sla_compliance_rate IS 'G-11: 80% 미만 시 빨간색 강조';

CREATE INDEX idx_agency_perf_agency ON agency_performance (agency_id);
CREATE INDEX idx_agency_perf_period ON agency_performance (period_start, period_end);
CREATE INDEX pidx_agency_perf_low ON agency_performance (sla_compliance_rate)
    WHERE sla_compliance_rate < 80.0;

-- ─── repeated_complaints_analysis 테이블 (반복 민원, G-06)─

CREATE TABLE repeated_complaints_analysis (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    citizen_id_hash     VARCHAR(64) NOT NULL,                        -- SHA-256 해시 (개인정보 보호)
    repeat_count        INTEGER NOT NULL,
    categories          JSONB NOT NULL DEFAULT '[]',
    complaint_ids       JSONB NOT NULL DEFAULT '[]',
    last_complaint_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    total_unresolved    INTEGER NOT NULL DEFAULT 0,
    analysis_date       DATE NOT NULL,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_repeated_citizen_date UNIQUE (citizen_id_hash, analysis_date)
);

COMMENT ON TABLE repeated_complaints_analysis IS '반복 민원 분석 (Analyse des réclamations répétées) - G-06';

CREATE INDEX idx_repeated_count ON repeated_complaints_analysis (repeat_count DESC);
CREATE INDEX idx_repeated_date ON repeated_complaints_analysis (analysis_date DESC);

-- ─── overdue_complaints_analysis 테이블 (장기 미처리, G-06)

CREATE TABLE overdue_complaints_analysis (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id        UUID NOT NULL,
    complaint_number    VARCHAR(30) NOT NULL,
    type                VARCHAR(20) NOT NULL,
    title_fr            VARCHAR(200),
    days_overdue        INTEGER NOT NULL,
    assigned_agency_id  VARCHAR(30),
    assigned_officer_id UUID,
    analysis_date       DATE NOT NULL,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_overdue_complaint_date UNIQUE (complaint_id, analysis_date)
);

COMMENT ON TABLE overdue_complaints_analysis IS '장기 미처리 분석 (Analyse des retards) - G-06';

CREATE INDEX idx_overdue_days ON overdue_complaints_analysis (days_overdue DESC);
CREATE INDEX idx_overdue_agency ON overdue_complaints_analysis (assigned_agency_id);

-- ─── report_templates / generated_reports / export_logs ────

CREATE TABLE report_templates (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_fr     VARCHAR(200) NOT NULL,
    name_ar     VARCHAR(200) NOT NULL,
    template_type VARCHAR(50) NOT NULL,
    config      JSONB NOT NULL DEFAULT '{}',
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_by  UUID NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE generated_reports (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id     UUID REFERENCES report_templates(id),
    title_fr        VARCHAR(200) NOT NULL,
    title_ar        VARCHAR(200),
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    filters         JSONB DEFAULT '{}',
    result_data     JSONB,
    status          VARCHAR(20) NOT NULL DEFAULT 'generating'
        CHECK (status IN ('generating', 'completed', 'failed')),
    generated_by    UUID NOT NULL,
    generated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE export_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id       UUID REFERENCES generated_reports(id),
    format          VARCHAR(10) NOT NULL CHECK (format IN ('xlsx', 'pdf', 'csv')),
    file_path       VARCHAR(500),
    file_size_bytes BIGINT,
    exported_by     UUID NOT NULL,
    exported_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_generated_reports_date ON generated_reports (generated_at DESC);
CREATE INDEX idx_export_logs_report ON export_logs (report_id);
```

### 4.6 Document Service Database (`epeople2_document`)

```sql
-- ============================================================
-- Database: epeople2_document
-- Description: 전자문서 관리 (EDMS/CDMS)
-- ============================================================

CREATE DATABASE epeople2_document
    WITH ENCODING = 'UTF8'
    LC_COLLATE = 'und-x-icu'
    LC_CTYPE = 'und-x-icu'
    TEMPLATE = template0;

\c epeople2_document;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── documents 테이블 ─────────────────────────────────────

CREATE TABLE retention_policies (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_fr         VARCHAR(200) NOT NULL,
    name_ar         VARCHAR(200) NOT NULL,
    retention_days  INTEGER NOT NULL CHECK (retention_days > 0),
    action_on_expiry VARCHAR(30) NOT NULL DEFAULT 'archive'
        CHECK (action_on_expiry IN ('archive', 'delete', 'review')),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE documents (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_number     VARCHAR(30) NOT NULL,
    title_fr            VARCHAR(300) NOT NULL,
    title_ar            VARCHAR(300) NOT NULL,
    doc_type            VARCHAR(50) NOT NULL,
    classification      VARCHAR(20) NOT NULL DEFAULT 'INTERNAL'
        CHECK (classification IN ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'SECRET')),
    related_service     VARCHAR(50),
    related_entity_id   VARCHAR(50),
    current_version     INTEGER NOT NULL DEFAULT 1,
    storage_path        VARCHAR(500) NOT NULL,
    file_size_bytes     BIGINT NOT NULL,
    mime_type           VARCHAR(100) NOT NULL,
    hash_sha256         VARCHAR(64) NOT NULL,
    retention_policy_id UUID REFERENCES retention_policies(id),
    retention_expires_at TIMESTAMP WITH TIME ZONE,
    created_by          UUID NOT NULL,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMP WITH TIME ZONE,

    CONSTRAINT uq_document_number UNIQUE (document_number)
);

COMMENT ON TABLE documents IS '전자문서 (Documents électroniques) - EDMS';

CREATE INDEX idx_documents_related ON documents (related_service, related_entity_id);
CREATE INDEX idx_documents_type ON documents (doc_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_classification ON documents (classification) WHERE deleted_at IS NULL;

-- ─── document_versions 테이블 ─────────────────────────────

CREATE TABLE document_versions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number  INTEGER NOT NULL,
    change_note_fr  TEXT,
    change_note_ar  TEXT,
    storage_path    VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    hash_sha256     VARCHAR(64) NOT NULL,
    created_by      UUID NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_doc_version UNIQUE (document_id, version_number)
);

CREATE INDEX idx_doc_versions ON document_versions (document_id, version_number DESC);

-- ─── document_access_controls 테이블 ──────────────────────

CREATE TABLE document_access_controls (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id         UUID,
    role_code       VARCHAR(30),
    agency_id       VARCHAR(30),
    can_view        BOOLEAN NOT NULL DEFAULT false,
    can_download    BOOLEAN NOT NULL DEFAULT false,
    can_print       BOOLEAN NOT NULL DEFAULT false,
    can_edit        BOOLEAN NOT NULL DEFAULT false,
    granted_by      UUID NOT NULL,
    granted_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    revoked_at      TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_doc_access_document ON document_access_controls (document_id);
CREATE INDEX idx_doc_access_user ON document_access_controls (user_id) WHERE revoked_at IS NULL;

-- ─── access_attempt_logs 테이블 ───────────────────────────

CREATE TABLE access_attempt_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id     UUID NOT NULL REFERENCES documents(id),
    user_id         UUID NOT NULL,
    action          VARCHAR(30) NOT NULL CHECK (action IN ('view', 'download', 'print', 'edit')),
    granted         BOOLEAN NOT NULL,
    ip_address      INET,
    user_agent      VARCHAR(500),
    attempted_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_access_logs_document ON access_attempt_logs (document_id, attempted_at DESC);
CREATE INDEX idx_access_logs_user ON access_attempt_logs (user_id, attempted_at DESC);
CREATE INDEX pidx_access_logs_denied ON access_attempt_logs (attempted_at DESC) WHERE granted = false;

-- ─── distribution_records / integrity_verifications / watermark_configs

CREATE TABLE distribution_records (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id     UUID NOT NULL REFERENCES documents(id),
    distributed_to  UUID NOT NULL,
    distributed_by  UUID NOT NULL,
    method          VARCHAR(30) NOT NULL CHECK (method IN ('email', 'download', 'system', 'print')),
    distributed_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE integrity_verifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id     UUID NOT NULL REFERENCES documents(id),
    expected_hash   VARCHAR(64) NOT NULL,
    actual_hash     VARCHAR(64) NOT NULL,
    is_valid        BOOLEAN NOT NULL,
    verified_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    verified_by     VARCHAR(50) NOT NULL DEFAULT 'system'
);

CREATE TABLE watermark_configs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_fr     VARCHAR(200) NOT NULL,
    name_ar     VARCHAR(200) NOT NULL,
    template    TEXT NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    applies_to  JSONB DEFAULT '{}',
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### 4.7 Notification Service Database (`epeople2_notification`)

```sql
-- ============================================================
-- Database: epeople2_notification
-- Description: 알림, SMS/이메일 발송, 수신확인 (G-10)
-- ============================================================

CREATE DATABASE epeople2_notification
    WITH ENCODING = 'UTF8'
    LC_COLLATE = 'und-x-icu'
    LC_CTYPE = 'und-x-icu'
    TEMPLATE = template0;

\c epeople2_notification;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE notification_type AS ENUM (
    'deadline_approaching',
    'deadline_overdue',
    'new_complaint_assigned',
    'transfer_requested',
    'transfer_limit_warning',
    'extension_approved',
    'extension_rejected',
    'complaint_completed',
    'joint_process_request',
    'proposal_reviewed'
);

CREATE TYPE delivery_status AS ENUM (
    'pending', 'sent', 'delivered', 'failed', 'bounced'
);

-- ─── notifications 테이블 ─────────────────────────────────

CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL,
    type            notification_type NOT NULL,
    title_fr        VARCHAR(300) NOT NULL,
    title_ar        VARCHAR(300) NOT NULL,
    message_fr      TEXT NOT NULL,
    message_ar      TEXT NOT NULL,
    related_id      VARCHAR(50),
    related_type    VARCHAR(30) CHECK (related_type IN ('complaint', 'report', 'proposal', 'ticket')),
    is_read         BOOLEAN NOT NULL DEFAULT false,
    read_at         TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE notifications IS '알림 (Notifications)';

CREATE INDEX idx_notifications_user ON notifications (user_id, created_at DESC);
CREATE INDEX pidx_notifications_unread ON notifications (user_id, created_at DESC) WHERE is_read = false;
CREATE INDEX idx_notifications_type ON notifications (type, created_at DESC);
CREATE INDEX idx_notifications_related ON notifications (related_type, related_id);

-- ─── notification_preferences 테이블 ──────────────────────

CREATE TABLE notification_preferences (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL,
    email_enabled       BOOLEAN NOT NULL DEFAULT true,
    sms_enabled         BOOLEAN NOT NULL DEFAULT true,
    push_enabled        BOOLEAN NOT NULL DEFAULT true,
    quiet_hours_start   TIME,
    quiet_hours_end     TIME,
    disabled_types      JSONB DEFAULT '[]',
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_notif_pref_user UNIQUE (user_id)
);

-- ─── sms_log 테이블 ───────────────────────────────────────

CREATE TABLE sms_log (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id     UUID REFERENCES notifications(id),
    phone_number_encrypted BYTEA NOT NULL,
    message_content     TEXT NOT NULL,
    language            VARCHAR(2) NOT NULL DEFAULT 'fr' CHECK (language IN ('ar', 'fr')),
    gateway_provider    VARCHAR(50) NOT NULL,
    gateway_message_id  VARCHAR(100),
    status              delivery_status NOT NULL DEFAULT 'pending',
    error_message       TEXT,
    sent_at             TIMESTAMP WITH TIME ZONE,
    delivered_at        TIMESTAMP WITH TIME ZONE,
    retry_count         SMALLINT NOT NULL DEFAULT 0,
    next_retry_at       TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE sms_log IS 'SMS 발송 이력 (Journal des SMS)';

CREATE INDEX idx_sms_notification ON sms_log (notification_id);
CREATE INDEX idx_sms_status ON sms_log (status, created_at DESC);
CREATE INDEX pidx_sms_retry ON sms_log (next_retry_at) WHERE status = 'failed' AND retry_count < 3;

-- ─── email_log 테이블 ─────────────────────────────────────

CREATE TABLE email_log (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id     UUID REFERENCES notifications(id),
    email_to_encrypted  BYTEA NOT NULL,
    subject_fr          VARCHAR(300),
    subject_ar          VARCHAR(300),
    body_html           TEXT NOT NULL,
    status              delivery_status NOT NULL DEFAULT 'pending',
    error_message       TEXT,
    smtp_message_id     VARCHAR(200),
    sent_at             TIMESTAMP WITH TIME ZONE,
    delivered_at        TIMESTAMP WITH TIME ZONE,
    opened_at           TIMESTAMP WITH TIME ZONE,
    retry_count         SMALLINT NOT NULL DEFAULT 0,
    next_retry_at       TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_notification ON email_log (notification_id);
CREATE INDEX idx_email_status ON email_log (status, created_at DESC);
CREATE INDEX pidx_email_retry ON email_log (next_retry_at) WHERE status = 'failed' AND retry_count < 3;

-- ─── delivery_confirmations 테이블 (수신확인, G-10) ───────

CREATE TABLE delivery_confirmations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id     UUID NOT NULL REFERENCES notifications(id),
    channel             VARCHAR(20) NOT NULL CHECK (channel IN ('sms', 'email', 'push', 'portal')),
    delivery_status     delivery_status NOT NULL DEFAULT 'pending',
    delivered_at        TIMESTAMP WITH TIME ZONE,
    confirmed_at        TIMESTAMP WITH TIME ZONE,
    retry_count         SMALLINT NOT NULL DEFAULT 0,
    last_retry_at       TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE delivery_confirmations IS '수신 확인 추적 (Confirmation de réception) - G-10';

CREATE INDEX idx_delivery_notification ON delivery_confirmations (notification_id);
CREATE INDEX pidx_delivery_pending ON delivery_confirmations (created_at DESC) WHERE delivery_status = 'pending';
```

### 4.8 Helpdesk Service Database (`epeople2_helpdesk`)

```sql
-- ============================================================
-- Database: epeople2_helpdesk
-- Description: 상담 Ticket, FAQ, 지식베이스, CTI (1881)
-- ============================================================

CREATE DATABASE epeople2_helpdesk
    WITH ENCODING = 'UTF8'
    LC_COLLATE = 'und-x-icu'
    LC_CTYPE = 'und-x-icu'
    TEMPLATE = template0;

\c epeople2_helpdesk;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TYPE ticket_channel AS ENUM ('phone', 'email', 'online_chat');
CREATE TYPE ticket_type AS ENUM ('complaint_inquiry', 'system_error', 'general_inquiry', 'other');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- ─── citizen_profiles 테이블 ──────────────────────────────

CREATE TABLE citizen_profiles (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    citizen_id          UUID,
    name_fr             VARCHAR(100) NOT NULL,
    name_ar             VARCHAR(100),
    phone_encrypted     BYTEA,
    email_encrypted     BYTEA,
    interaction_count   INTEGER NOT NULL DEFAULT 0,
    last_contact_at     TIMESTAMP WITH TIME ZONE,
    notes               JSONB DEFAULT '[]',
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_citizen_profiles_citizen ON citizen_profiles (citizen_id);

-- ─── agent_profiles 테이블 ────────────────────────────────

CREATE TABLE agent_profiles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL,
    name_fr         VARCHAR(100) NOT NULL,
    name_ar         VARCHAR(100),
    specialization  VARCHAR(100),
    max_concurrent_tickets INTEGER DEFAULT 10,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_available    BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_agent_user UNIQUE (user_id)
);

-- ─── helpdesk_sla_configs 테이블 ──────────────────────────

CREATE TABLE helpdesk_sla_configs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_type     ticket_type NOT NULL,
    priority        ticket_priority NOT NULL,
    response_hours  INTEGER NOT NULL,
    resolution_hours INTEGER NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT uq_helpdesk_sla UNIQUE (ticket_type, priority)
);

-- ─── helpdesk_tickets 테이블 ──────────────────────────────

CREATE TABLE helpdesk_tickets (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number           VARCHAR(30) NOT NULL,
    channel                 ticket_channel NOT NULL,
    ticket_type             ticket_type NOT NULL,
    status                  ticket_status NOT NULL DEFAULT 'open',
    priority                ticket_priority NOT NULL DEFAULT 'medium',
    subject_fr              VARCHAR(300) NOT NULL,
    subject_ar              VARCHAR(300),
    description_fr          TEXT,
    description_ar          TEXT,
    citizen_profile_id      UUID REFERENCES citizen_profiles(id),
    agent_id                UUID REFERENCES agent_profiles(id),
    related_complaint_id    VARCHAR(30),
    sla_config_id           UUID REFERENCES helpdesk_sla_configs(id),
    due_at                  TIMESTAMP WITH TIME ZONE,
    first_response_at       TIMESTAMP WITH TIME ZONE,
    resolved_at             TIMESTAMP WITH TIME ZONE,
    closed_at               TIMESTAMP WITH TIME ZONE,
    satisfaction_score      SMALLINT CHECK (satisfaction_score BETWEEN 1 AND 5),
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_ticket_number UNIQUE (ticket_number)
);

CREATE INDEX idx_tickets_status ON helpdesk_tickets (status) WHERE status IN ('open', 'in_progress');
CREATE INDEX idx_tickets_agent ON helpdesk_tickets (agent_id, status);
CREATE INDEX idx_tickets_citizen ON helpdesk_tickets (citizen_profile_id);
CREATE INDEX idx_tickets_due ON helpdesk_tickets (due_at) WHERE status IN ('open', 'in_progress');

-- ─── ticket_notes 테이블 ──────────────────────────────────

CREATE TABLE ticket_notes (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id   UUID NOT NULL REFERENCES helpdesk_tickets(id) ON DELETE CASCADE,
    note_fr     TEXT NOT NULL,
    note_ar     TEXT,
    is_internal BOOLEAN NOT NULL DEFAULT false,
    created_by  UUID NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_notes ON ticket_notes (ticket_id, created_at);

-- ─── agent_performance 테이블 ─────────────────────────────

CREATE TABLE agent_performance (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id        UUID NOT NULL REFERENCES agent_profiles(id),
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    tickets_handled INTEGER NOT NULL DEFAULT 0,
    tickets_resolved INTEGER NOT NULL DEFAULT 0,
    avg_resolution_hours DECIMAL(8,2),
    avg_first_response_hours DECIMAL(8,2),
    sla_compliance_rate DECIMAL(5,2),
    satisfaction_avg DECIMAL(3,2),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_agent_perf_period UNIQUE (agent_id, period_start, period_end)
);

-- ─── cti_call_events 테이블 ───────────────────────────────

CREATE TABLE cti_call_events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id       UUID REFERENCES helpdesk_tickets(id),
    call_direction  VARCHAR(10) NOT NULL CHECK (call_direction IN ('inbound', 'outbound')),
    caller_number_encrypted BYTEA,
    agent_id        UUID REFERENCES agent_profiles(id),
    duration_seconds INTEGER,
    recording_path  VARCHAR(500),
    call_status     VARCHAR(20) NOT NULL DEFAULT 'completed',
    started_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at        TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cti_ticket ON cti_call_events (ticket_id);
CREATE INDEX idx_cti_agent ON cti_call_events (agent_id, started_at DESC);

-- ─── faq_articles / knowledge_base_articles ───────────────

CREATE TABLE faq_articles (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_fr VARCHAR(500) NOT NULL,
    question_ar VARCHAR(500) NOT NULL,
    answer_fr   TEXT NOT NULL,
    answer_ar   TEXT NOT NULL,
    category    VARCHAR(50) NOT NULL,
    view_count  INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT false,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_faq_category ON faq_articles (category, sort_order) WHERE is_published = true;
CREATE INDEX idx_faq_question_fr_trgm ON faq_articles USING gin (question_fr gin_trgm_ops);

CREATE TABLE knowledge_base_articles (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_fr    VARCHAR(300) NOT NULL,
    title_ar    VARCHAR(300) NOT NULL,
    content_fr  TEXT NOT NULL,
    content_ar  TEXT NOT NULL,
    category    VARCHAR(50) NOT NULL,
    tags        JSONB DEFAULT '[]',
    is_published BOOLEAN NOT NULL DEFAULT false,
    view_count  INTEGER NOT NULL DEFAULT 0,
    helpful_count INTEGER NOT NULL DEFAULT 0,
    created_by  UUID NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kb_category ON knowledge_base_articles (category) WHERE is_published = true;
CREATE INDEX idx_kb_tags ON knowledge_base_articles USING gin (tags);
CREATE INDEX idx_kb_title_fr_trgm ON knowledge_base_articles USING gin (title_fr gin_trgm_ops);
```

### 4.9 Admin Service Database (`epeople2_admin`)

```sql
-- ============================================================
-- Database: epeople2_admin
-- Description: 기관, SLA, 공통코드, 시스템설정, 표준절차
-- ============================================================

CREATE DATABASE epeople2_admin
    WITH ENCODING = 'UTF8'
    LC_COLLATE = 'und-x-icu'
    LC_CTYPE = 'und-x-icu'
    TEMPLATE = template0;

\c epeople2_admin;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE agency_type AS ENUM ('BCRC', 'BRC', 'DGGPC', 'GOVERNANCE_TEAM');

-- ─── agencies 테이블 (기관 - 73 BRCs) ────────────────────

CREATE TABLE agencies (
    id              VARCHAR(30) PRIMARY KEY,                         -- 'BRC-XXX-YYY-NNN'
    name_fr         VARCHAR(300) NOT NULL,
    name_ar         VARCHAR(300) NOT NULL,
    abbreviation_fr VARCHAR(50),
    abbreviation_ar VARCHAR(50),
    type            agency_type NOT NULL,
    parent_id       VARCHAR(30) REFERENCES agencies(id),
    region_code     VARCHAR(20),
    governorat_code VARCHAR(10),
    contact_email   VARCHAR(200),
    contact_phone   VARCHAR(50),
    address_fr      TEXT,
    address_ar      TEXT,
    head_name_fr    VARCHAR(100),
    head_name_ar    VARCHAR(100),
    officer_count   INTEGER DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE agencies IS '기관 (Agences) - BCRC, 73 BRC, DGGPC, 거버넌스팀';
COMMENT ON COLUMN agencies.id IS 'BRC-XXX-YYY-NNN 형식 (XXX=부처, YYY=지역, NNN=순번)';

CREATE INDEX idx_agencies_type ON agencies (type) WHERE is_active = true;
CREATE INDEX idx_agencies_parent ON agencies (parent_id);
CREATE INDEX idx_agencies_region ON agencies (region_code) WHERE is_active = true;
CREATE INDEX idx_agencies_governorat ON agencies (governorat_code) WHERE is_active = true;

-- ─── sla_configs 테이블 (SLA 설정) ────────────────────────

CREATE TABLE sla_configs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id       VARCHAR(30) NOT NULL REFERENCES agencies(id),
    complaint_type  VARCHAR(20) NOT NULL CHECK (complaint_type IN (
        'grievance', 'proposal', 'inquiry', 'suggestion', 'report'
    )),
    sla_hours       INTEGER NOT NULL CHECK (sla_hours > 0),
    sla_days        INTEGER GENERATED ALWAYS AS (sla_hours / 24) STORED,
    extension_allowed BOOLEAN NOT NULL DEFAULT true,
    max_extension_days INTEGER DEFAULT 30 CHECK (max_extension_days > 0),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    updated_by      UUID,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_sla_agency_type UNIQUE (agency_id, complaint_type)
);

COMMENT ON TABLE sla_configs IS 'SLA 설정 (Configuration SLA) - 기관별/유형별 처리기한';
COMMENT ON COLUMN sla_configs.sla_hours IS '처리기한(시간): grievance=1440(60일), inquiry=168(7일)';

-- ─── common_codes 테이블 (공통 코드) ──────────────────────

CREATE TABLE common_codes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_code      VARCHAR(50) NOT NULL,
    code            VARCHAR(50) NOT NULL,
    name_fr         VARCHAR(200) NOT NULL,
    name_ar         VARCHAR(200) NOT NULL,
    description_fr  VARCHAR(500),
    description_ar  VARCHAR(500),
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    parent_code     VARCHAR(50),
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_common_code UNIQUE (group_code, code)
);

COMMENT ON TABLE common_codes IS '공통 코드 (Codes communs) - 시스템 전역 코드 관리';

CREATE INDEX idx_common_codes_group ON common_codes (group_code, sort_order) WHERE is_active = true;

-- ─── system_configs 테이블 (시스템 설정) ──────────────────

CREATE TABLE system_configs (
    key             VARCHAR(100) PRIMARY KEY,
    value           TEXT NOT NULL,
    description_fr  VARCHAR(500),
    description_ar  VARCHAR(500),
    data_type       VARCHAR(20) NOT NULL DEFAULT 'string'
        CHECK (data_type IN ('string', 'integer', 'boolean', 'json', 'datetime')),
    is_editable     BOOLEAN NOT NULL DEFAULT true,
    updated_by      UUID,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE system_configs IS '시스템 설정 (Configuration système)';

-- ─── standard_procedures 테이블 ───────────────────────────

CREATE TABLE standard_procedures (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_fr        VARCHAR(300) NOT NULL,
    title_ar        VARCHAR(300) NOT NULL,
    procedure_type  VARCHAR(50) NOT NULL,
    content_fr      TEXT NOT NULL,
    content_ar      TEXT NOT NULL,
    version         INTEGER NOT NULL DEFAULT 1,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    applies_to      JSONB DEFAULT '{}',
    published_at    TIMESTAMP WITH TIME ZONE,
    created_by      UUID NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ─── operation_manuals 테이블 (G-14) ──────────────────────

CREATE TABLE operation_manuals (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_fr        VARCHAR(300) NOT NULL,
    title_ar        VARCHAR(300) NOT NULL,
    manual_type     VARCHAR(50) NOT NULL CHECK (manual_type IN (
        'system_operation', 'user_guide', 'api_reference',
        'architecture', 'troubleshooting', 'security'
    )),
    content_fr      TEXT NOT NULL,
    content_ar      TEXT,
    version         VARCHAR(20) NOT NULL DEFAULT '1.0',
    file_path       VARCHAR(500),
    is_published    BOOLEAN NOT NULL DEFAULT false,
    published_at    TIMESTAMP WITH TIME ZONE,
    created_by      UUID NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE operation_manuals IS '운영 매뉴얼 (Manuels opérationnels) - G-14 기술이전 지원';

-- ─── data_migration_logs 테이블 ───────────────────────────

CREATE TABLE data_migration_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id        VARCHAR(50) NOT NULL,
    source_system   VARCHAR(50) NOT NULL DEFAULT 'epeople_v1',
    source_table    VARCHAR(100) NOT NULL,
    target_table    VARCHAR(100) NOT NULL,
    total_records   INTEGER NOT NULL DEFAULT 0,
    success_count   INTEGER NOT NULL DEFAULT 0,
    failure_count   INTEGER NOT NULL DEFAULT 0,
    skip_count      INTEGER NOT NULL DEFAULT 0,
    error_details   JSONB DEFAULT '[]',
    id_mapping      JSONB DEFAULT '{}',
    started_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at    TIMESTAMP WITH TIME ZONE,
    status          VARCHAR(20) NOT NULL DEFAULT 'running'
        CHECK (status IN ('running', 'completed', 'failed', 'rolled_back')),
    executed_by     UUID NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE data_migration_logs IS '데이터 마이그레이션 로그 - 레거시 e-People → e-People II';

CREATE INDEX idx_migration_batch ON data_migration_logs (batch_id);
CREATE INDEX idx_migration_status ON data_migration_logs (status, started_at DESC);
```

---

## 5. 인덱스 설계

### 5.1 인덱스 설계 원칙

| 원칙 | 설명 |
|------|------|
| **PK 인덱스** | PRIMARY KEY 선언 시 자동 생성 (B-tree) |
| **FK 인덱스** | 모든 FOREIGN KEY 컬럼에 인덱스 필수 (JOIN 성능) |
| **복합 인덱스** | 자주 함께 사용되는 WHERE 조건을 복합 인덱스로 커버 |
| **부분 인덱스** | WHERE 조건이 고정된 쿼리는 부분 인덱스로 스토리지 절약 |
| **GIN 인덱스** | JSONB 컬럼, 전문 검색(trigram)에 GIN 인덱스 사용 |
| **소프트 삭제** | `WHERE deleted_at IS NULL` 조건을 부분 인덱스에 포함 |

### 5.2 핵심 쿼리 패턴별 인덱스 설계

#### 5.2.1 민원 목록 조회 (가장 빈번한 쿼리)

```sql
-- 쿼리 패턴: 시민이 본인 민원 목록 조회
-- SELECT * FROM complaints WHERE citizen_id_encrypted = ? AND deleted_at IS NULL
--   ORDER BY submitted_at DESC LIMIT 10 OFFSET 0;
-- 커버링 인덱스:
CREATE INDEX idx_complaints_citizen_submitted ON complaints
    (citizen_id_encrypted, submitted_at DESC)
    WHERE deleted_at IS NULL;

-- 쿼리 패턴: BRC 담당자 워크리스트
-- SELECT * FROM complaints
--   WHERE assigned_officer_id = ? AND status IN ('received','assigned','processing')
--     AND deleted_at IS NULL ORDER BY deadline_at ASC;
CREATE INDEX idx_complaints_officer_worklist ON complaints
    (assigned_officer_id, deadline_at ASC)
    WHERE deleted_at IS NULL AND status IN ('received', 'assigned', 'processing');

-- 쿼리 패턴: BCRC 관리자 기관별 민원 현황
-- SELECT * FROM complaints WHERE assigned_agency_id = ? AND status = ?
--   AND deleted_at IS NULL ORDER BY submitted_at DESC;
CREATE INDEX idx_complaints_agency_status ON complaints
    (assigned_agency_id, status, submitted_at DESC)
    WHERE deleted_at IS NULL;

-- 쿼리 패턴: 기한 임박 민원 (D-Day 배지)
-- SELECT * FROM complaints WHERE deadline_at BETWEEN NOW() AND NOW() + INTERVAL '3 days'
--   AND status IN ('received','assigned','processing') AND deleted_at IS NULL;
CREATE INDEX idx_complaints_deadline_upcoming ON complaints
    (deadline_at)
    WHERE deleted_at IS NULL AND status IN ('received', 'assigned', 'processing');

-- 쿼리 패턴: 기한 초과 민원
CREATE INDEX pidx_complaints_overdue ON complaints
    (deadline_at, assigned_agency_id)
    WHERE deleted_at IS NULL
      AND status IN ('received', 'assigned', 'processing')
      AND deadline_at < NOW();
```

#### 5.2.2 통계 관련 인덱스

```sql
-- 기간별 접수 건수 집계
CREATE INDEX idx_complaints_submitted_date ON complaints
    ((submitted_at::DATE))
    WHERE deleted_at IS NULL;

-- 유형별 통계
CREATE INDEX idx_complaints_type_submitted ON complaints
    (type, (submitted_at::DATE))
    WHERE deleted_at IS NULL;
```

#### 5.2.3 전문 검색 인덱스 (아랍어 + 프랑스어)

```sql
-- 민원 제목/내용 검색 (trigram 기반)
-- epeople2_complaint DB에 이미 생성됨
-- idx_complaints_title_fr_trgm, idx_complaints_title_ar_trgm

-- 추가: 내용 검색 (대용량 텍스트)
CREATE INDEX idx_complaints_content_fr_trgm ON complaints
    USING gin (content_fr gin_trgm_ops);

-- FAQ 검색 (epeople2_helpdesk)
-- idx_faq_question_fr_trgm 이미 생성됨

-- 지식베이스 전문 검색 (epeople2_helpdesk)
CREATE INDEX idx_kb_content_fr_trgm ON knowledge_base_articles
    USING gin (content_fr gin_trgm_ops);
```

### 5.3 인덱스 관리 지침

| 항목 | 지침 |
|------|------|
| **인덱스 크기 모니터링** | 월 1회 `pg_indexes_size()` 확인 |
| **사용하지 않는 인덱스** | `pg_stat_user_indexes.idx_scan = 0` 인덱스 분기별 검토 |
| **REINDEX** | 인덱스 팽창(bloat) 발생 시 `REINDEX CONCURRENTLY` 실행 |
| **인덱스 생성** | 운영 환경에서는 반드시 `CREATE INDEX CONCURRENTLY` 사용 |

---

## 6. 초기 데이터 (Seed Data)

### 6.1 기관 데이터 (73 BRC 샘플)

```sql
-- epeople2_admin 데이터베이스에 INSERT

-- BCRC (중앙민원실)
INSERT INTO agencies (id, name_fr, name_ar, type, parent_id, region_code, governorat_code, contact_email, is_active)
VALUES
('BCRC-001', 'Bureau Central des Relations avec le Citoyen', 'المكتب المركزي للعلاقات مع المواطن', 'BCRC', NULL, 'TUN', 'TUN', 'contact@bcrc.gov.tn', true);

-- DGGPC
INSERT INTO agencies (id, name_fr, name_ar, type, parent_id, region_code, governorat_code, contact_email, is_active)
VALUES
('DGGPC-001', 'Direction Générale de la Gouvernance et de la Prévention de la Corruption', 'الإدارة العامة للحوكمة ومكافحة الفساد', 'DGGPC', NULL, 'TUN', 'TUN', 'contact@dggpc.gov.tn', true);

-- BRC 기관 (73개 중 샘플 15개)
INSERT INTO agencies (id, name_fr, name_ar, type, parent_id, region_code, governorat_code, contact_email, is_active)
VALUES
('BRC-ENV-TUN-001', 'BRC - Ministère de l''Environnement - Tunis', 'مكتب العلاقات - وزارة البيئة - تونس', 'BRC', 'BCRC-001', 'TUN', 'TUN', 'brc@environnement.gov.tn', true),
('BRC-EDU-TUN-001', 'BRC - Ministère de l''Éducation - Tunis', 'مكتب العلاقات - وزارة التربية - تونس', 'BRC', 'BCRC-001', 'TUN', 'TUN', 'brc@education.gov.tn', true),
('BRC-SAN-TUN-001', 'BRC - Ministère de la Santé - Tunis', 'مكتب العلاقات - وزارة الصحة - تونس', 'BRC', 'BCRC-001', 'TUN', 'TUN', 'brc@sante.gov.tn', true),
('BRC-TRA-TUN-001', 'BRC - Ministère du Transport - Tunis', 'مكتب العلاقات - وزارة النقل - تونس', 'BRC', 'BCRC-001', 'TUN', 'TUN', 'brc@transport.gov.tn', true),
('BRC-INT-TUN-001', 'BRC - Ministère de l''Intérieur - Tunis', 'مكتب العلاقات - وزارة الداخلية - تونس', 'BRC', 'BCRC-001', 'TUN', 'TUN', 'brc@interieur.gov.tn', true),
('BRC-FIN-TUN-001', 'BRC - Ministère des Finances - Tunis', 'مكتب العلاقات - وزارة المالية - تونس', 'BRC', 'BCRC-001', 'TUN', 'TUN', 'brc@finances.gov.tn', true),
('BRC-AGR-TUN-001', 'BRC - Ministère de l''Agriculture - Tunis', 'مكتب العلاقات - وزارة الفلاحة - تونس', 'BRC', 'BCRC-001', 'TUN', 'TUN', 'brc@agriculture.gov.tn', true),
('BRC-EQP-TUN-001', 'BRC - Ministère de l''Équipement - Tunis', 'مكتب العلاقات - وزارة التجهيز - تونس', 'BRC', 'BCRC-001', 'TUN', 'TUN', 'brc@equipement.gov.tn', true),
('BRC-SOC-TUN-001', 'BRC - Ministère des Affaires Sociales - Tunis', 'مكتب العلاقات - وزارة الشؤون الاجتماعية - تونس', 'BRC', 'BCRC-001', 'TUN', 'TUN', 'brc@social.gov.tn', true),
('BRC-JUS-TUN-001', 'BRC - Ministère de la Justice - Tunis', 'مكتب العلاقات - وزارة العدل - تونس', 'BRC', 'BCRC-001', 'TUN', 'TUN', 'brc@justice.gov.tn', true),
('BRC-COM-TUN-001', 'BRC - Ministère du Commerce - Tunis', 'مكتب العلاقات - وزارة التجارة - تونس', 'BRC', 'BCRC-001', 'TUN', 'TUN', 'brc@commerce.gov.tn', true),
('BRC-IND-TUN-001', 'BRC - Ministère de l''Industrie - Tunis', 'مكتب العلاقات - وزارة الصناعة - تونس', 'BRC', 'BCRC-001', 'TUN', 'TUN', 'brc@industrie.gov.tn', true),
('BRC-CUL-TUN-001', 'BRC - Ministère de la Culture - Tunis', 'مكتب العلاقات - وزارة الثقافة - تونس', 'BRC', 'BCRC-001', 'TUN', 'TUN', 'brc@culture.gov.tn', true),
('BRC-MUN-TUN-001', 'BRC - Municipalité de Tunis', 'مكتب العلاقات - بلدية تونس', 'BRC', 'BCRC-001', 'TUN', 'TUN', 'brc@commune-tunis.gov.tn', true),
('BRC-GOV-SFX-001', 'BRC - Gouvernorat de Sfax', 'مكتب العلاقات - ولاية صفاقس', 'BRC', 'BCRC-001', 'SFX', 'SFX', 'brc@sfax.gov.tn', true);
```

### 6.2 SLA 설정 데이터

```sql
-- 기본 SLA 설정 (모든 BRC 공통)
-- 실제 구현 시 각 BRC별로 INSERT 필요

INSERT INTO sla_configs (agency_id, complaint_type, sla_hours, extension_allowed, max_extension_days)
SELECT a.id, ct.type, ct.hours, ct.ext_allowed, ct.max_ext
FROM agencies a
CROSS JOIN (VALUES
    ('grievance',  1440, true,  30),    -- 60일
    ('proposal',    720, true,  15),    -- 30일
    ('inquiry',     168, true,   7),    -- 7일
    ('suggestion',  720, true,  15),    -- 30일
    ('report',      360, false,  0)     -- 15일 (연장 불가)
) AS ct(type, hours, ext_allowed, max_ext)
WHERE a.type = 'BRC';
```

### 6.3 사용자 역할 (테스트 계정)

```sql
-- epeople2_auth 데이터베이스에 INSERT
-- 비밀번호: test1234 → bcrypt 해시

INSERT INTO users (user_number, username, password_hash, name_fr, name_ar, primary_role, agency_id, is_active)
VALUES
('USR-000001', 'citizen@test.tn', '$2b$12$LJ3m4ys3Lk.Ry/5Kq5Kque8dBKnLtNGZEYDGqFr8U5V8hK.CX.He', 'Ahmed Citoyen', 'أحمد مواطن', 'CITIZEN', NULL, true),
('USR-000002', 'officer@brc.tn', '$2b$12$LJ3m4ys3Lk.Ry/5Kq5Kque8dBKnLtNGZEYDGqFr8U5V8hK.CX.He', 'Fatma Agent', 'فاطمة عميلة', 'BRC_OFFICER', 'BRC-ENV-TUN-001', true),
('USR-000003', 'admin@bcrc.tn', '$2b$12$LJ3m4ys3Lk.Ry/5Kq5Kque8dBKnLtNGZEYDGqFr8U5V8hK.CX.He', 'Mehdi Admin', 'مهدي مدير', 'BCRC_ADMIN', 'BCRC-001', true),
('USR-000004', 'dggpc@gov.tn', '$2b$12$LJ3m4ys3Lk.Ry/5Kq5Kque8dBKnLtNGZEYDGqFr8U5V8hK.CX.He', 'Nour DGGPC', 'نور المفتش', 'DGGPC_OFFICER', 'DGGPC-001', true),
('USR-000005', 'manager@brc.tn', '$2b$12$LJ3m4ys3Lk.Ry/5Kq5Kque8dBKnLtNGZEYDGqFr8U5V8hK.CX.He', 'Khaled Manager', 'خالد المسؤول', 'BRC_MANAGER', 'BRC-ENV-TUN-001', true);
```

### 6.4 민원 분류 코드 (3단계)

```sql
-- epeople2_complaint 데이터베이스에 INSERT

-- L1: 대분류 (6개)
INSERT INTO complaint_categories (code, name_fr, name_ar, level, parent_code, sort_order) VALUES
('01', 'Environnement', 'البيئة', 1, NULL, 1),
('02', 'Éducation', 'التعليم', 1, NULL, 2),
('03', 'Transport', 'النقل', 1, NULL, 3),
('04', 'Urbanisme', 'التعمير', 1, NULL, 4),
('05', 'Fiscalité et Administration', 'الجباية والإدارة', 1, NULL, 5),
('06', 'Santé', 'الصحة', 1, NULL, 6),
('07', 'Sécurité', 'الأمن', 1, NULL, 7),
('08', 'Autres', 'أخرى', 1, NULL, 99);

-- L2: 중분류 (샘플 20개)
INSERT INTO complaint_categories (code, name_fr, name_ar, level, parent_code, sort_order) VALUES
('0101', 'Pollution atmosphérique', 'تلوث الهواء', 2, '01', 1),
('0102', 'Eau', 'الماء', 2, '01', 2),
('0103', 'Déchets', 'النفايات', 2, '01', 3),
('0104', 'Espaces verts', 'المساحات الخضراء', 2, '01', 4),
('0201', 'Enseignement primaire', 'التعليم الابتدائي', 2, '02', 1),
('0202', 'Enseignement secondaire', 'التعليم الثانوي', 2, '02', 2),
('0203', 'Enseignement supérieur', 'التعليم العالي', 2, '02', 3),
('0204', 'Formation professionnelle', 'التكوين المهني', 2, '02', 4),
('0301', 'Routes', 'الطرقات', 2, '03', 1),
('0302', 'Transport public', 'النقل العمومي', 2, '03', 2),
('0303', 'Permis de conduire', 'رخص السياقة', 2, '03', 3),
('0401', 'Permis de construire', 'رخص البناء', 2, '04', 1),
('0402', 'Voirie', 'الطرق المعبدة', 2, '04', 2),
('0403', 'Éclairage public', 'الإنارة العمومية', 2, '04', 3),
('0501', 'Impôts', 'الضرائب', 2, '05', 1),
('0502', 'Documents administratifs', 'الوثائق الإدارية', 2, '05', 2),
('0503', 'État civil', 'الحالة المدنية', 2, '05', 3),
('0601', 'Hôpitaux', 'المستشفيات', 2, '06', 1),
('0602', 'Centres de santé', 'مراكز الصحة', 2, '06', 2),
('0603', 'Médicaments', 'الأدوية', 2, '06', 3);

-- L3: 소분류 (샘플 30개)
INSERT INTO complaint_categories (code, name_fr, name_ar, level, parent_code, default_agency_id, sort_order) VALUES
('010101', 'Émissions industrielles', 'انبعاثات صناعية', 3, '0101', 'BRC-ENV-TUN-001', 1),
('010102', 'Émissions véhiculaires', 'انبعاثات المركبات', 3, '0101', 'BRC-ENV-TUN-001', 2),
('010201', 'Eau potable', 'مياه الشرب', 3, '0102', 'BRC-ENV-TUN-001', 1),
('010202', 'Eaux usées', 'مياه الصرف', 3, '0102', 'BRC-ENV-TUN-001', 2),
('010203', 'Eau d''irrigation', 'مياه الري', 3, '0102', 'BRC-AGR-TUN-001', 3),
('010301', 'Collecte des déchets', 'جمع النفايات', 3, '0103', 'BRC-MUN-TUN-001', 1),
('010302', 'Déchets industriels', 'نفايات صناعية', 3, '0103', 'BRC-ENV-TUN-001', 2),
('020101', 'Infrastructure scolaire', 'البنية التحتية المدرسية', 3, '0201', 'BRC-EDU-TUN-001', 1),
('020102', 'Enseignants', 'المعلمون', 3, '0201', 'BRC-EDU-TUN-001', 2),
('020201', 'Lycées', 'المعاهد', 3, '0202', 'BRC-EDU-TUN-001', 1),
('020301', 'Universités', 'الجامعات', 3, '0203', 'BRC-EDU-TUN-001', 1),
('020302', 'Bourses', 'المنح', 3, '0203', 'BRC-EDU-TUN-001', 2),
('030101', 'État des routes', 'حالة الطرقات', 3, '0301', 'BRC-EQP-TUN-001', 1),
('030102', 'Signalisation', 'التشوير', 3, '0301', 'BRC-EQP-TUN-001', 2),
('030201', 'Bus', 'الحافلات', 3, '0302', 'BRC-TRA-TUN-001', 1),
('030202', 'Métro léger', 'المترو الخفيف', 3, '0302', 'BRC-TRA-TUN-001', 2),
('040101', 'Délais de permis', 'آجال الرخص', 3, '0401', 'BRC-MUN-TUN-001', 1),
('040301', 'Panne d''éclairage', 'عطل الإنارة', 3, '0403', 'BRC-MUN-TUN-001', 1),
('050101', 'Déclaration fiscale', 'التصريح الجبائي', 3, '0501', 'BRC-FIN-TUN-001', 1),
('050201', 'Carte d''identité', 'بطاقة التعريف', 3, '0502', 'BRC-INT-TUN-001', 1),
('050301', 'Acte de naissance', 'شهادة الولادة', 3, '0503', 'BRC-INT-TUN-001', 1),
('060101', 'Urgences', 'الاستعجالي', 3, '0601', 'BRC-SAN-TUN-001', 1),
('060102', 'Hospitalisation', 'الاستشفاء', 3, '0601', 'BRC-SAN-TUN-001', 2),
('060201', 'Soins de base', 'العلاج الأساسي', 3, '0602', 'BRC-SAN-TUN-001', 1),
('060301', 'Disponibilité', 'التوفر', 3, '0603', 'BRC-SAN-TUN-001', 1);
```

### 6.5 튀니지 24개 Gouvernorat (행정구역)

```sql
-- epeople2_admin 공통코드로 등록
INSERT INTO common_codes (group_code, code, name_fr, name_ar, sort_order) VALUES
('GOVERNORAT', 'TUN', 'Tunis', 'تونس', 1),
('GOVERNORAT', 'ARI', 'Ariana', 'أريانة', 2),
('GOVERNORAT', 'BNA', 'Ben Arous', 'بن عروس', 3),
('GOVERNORAT', 'MAN', 'Manouba', 'منوبة', 4),
('GOVERNORAT', 'NAB', 'Nabeul', 'نابل', 5),
('GOVERNORAT', 'ZAG', 'Zaghouan', 'زغوان', 6),
('GOVERNORAT', 'BIZ', 'Bizerte', 'بنزرت', 7),
('GOVERNORAT', 'BEJ', 'Béja', 'باجة', 8),
('GOVERNORAT', 'JEN', 'Jendouba', 'جندوبة', 9),
('GOVERNORAT', 'KEF', 'Le Kef', 'الكاف', 10),
('GOVERNORAT', 'SIL', 'Siliana', 'سليانة', 11),
('GOVERNORAT', 'SOU', 'Sousse', 'سوسة', 12),
('GOVERNORAT', 'MON', 'Monastir', 'المنستير', 13),
('GOVERNORAT', 'MAH', 'Mahdia', 'المهدية', 14),
('GOVERNORAT', 'SFX', 'Sfax', 'صفاقس', 15),
('GOVERNORAT', 'KAI', 'Kairouan', 'القيروان', 16),
('GOVERNORAT', 'KAS', 'Kasserine', 'القصرين', 17),
('GOVERNORAT', 'SBZ', 'Sidi Bouzid', 'سيدي بوزيد', 18),
('GOVERNORAT', 'GAB', 'Gabès', 'قابس', 19),
('GOVERNORAT', 'MED', 'Médenine', 'مدنين', 20),
('GOVERNORAT', 'TAT', 'Tataouine', 'تطاوين', 21),
('GOVERNORAT', 'GAF', 'Gafsa', 'قفصة', 22),
('GOVERNORAT', 'TOZ', 'Tozeur', 'توزر', 23),
('GOVERNORAT', 'KEB', 'Kébili', 'قبلي', 24);
```

### 6.6 공통 코드

```sql
-- 민원 상태 코드
INSERT INTO common_codes (group_code, code, name_fr, name_ar, sort_order) VALUES
('COMPLAINT_STATUS', 'received', 'Reçue', 'مستلمة', 1),
('COMPLAINT_STATUS', 'assigned', 'Assignée', 'موزعة', 2),
('COMPLAINT_STATUS', 'processing', 'En cours de traitement', 'قيد المعالجة', 3),
('COMPLAINT_STATUS', 'completed', 'Traitée', 'معالجة', 4),
('COMPLAINT_STATUS', 'closed', 'Clôturée', 'مغلقة', 5);

-- 민원 유형 코드
INSERT INTO common_codes (group_code, code, name_fr, name_ar, metadata, sort_order) VALUES
('COMPLAINT_TYPE', 'grievance', 'Réclamation', 'تظلم', '{"sla_days": 60, "icon": "AlertCircle"}', 1),
('COMPLAINT_TYPE', 'proposal', 'Suggestion', 'اقتراح', '{"sla_days": 30, "icon": "Lightbulb"}', 2),
('COMPLAINT_TYPE', 'inquiry', 'Demande de renseignement', 'استفسار', '{"sla_days": 7, "icon": "HelpCircle"}', 3),
('COMPLAINT_TYPE', 'suggestion', 'Doléance', 'ملاحظة', '{"sla_days": 30, "icon": "MessageSquare"}', 4),
('COMPLAINT_TYPE', 'report', 'Signalement', 'بلاغ', '{"sla_days": 15, "icon": "Flag"}', 5);

-- 사용자 역할 코드
INSERT INTO common_codes (group_code, code, name_fr, name_ar, sort_order) VALUES
('USER_ROLE', 'CITIZEN', 'Citoyen', 'مواطن', 1),
('USER_ROLE', 'ANONYMOUS', 'Anonyme', 'مجهول', 2),
('USER_ROLE', 'BRC_OFFICER', 'Agent BRC', 'عميل مكتب العلاقات', 3),
('USER_ROLE', 'BRC_MANAGER', 'Responsable BRC', 'مسؤول مكتب العلاقات', 4),
('USER_ROLE', 'BCRC_ADMIN', 'Administrateur BCRC', 'مدير المكتب المركزي', 5),
('USER_ROLE', 'DGGPC_OFFICER', 'Agent DGGPC', 'عميل الإدارة العامة', 6),
('USER_ROLE', 'DGGPC_MANAGER', 'Responsable DGGPC', 'مسؤول الإدارة العامة', 7),
('USER_ROLE', 'SYS_ADMIN', 'Administrateur système', 'مدير النظام', 8);
```

---

## 7. 데이터 마이그레이션 전략

### 7.1 마이그레이션 개요

레거시 e-People 시스템에서 e-People II로의 데이터 마이그레이션은 다음 원칙에 따라 수행한다.

| 원칙 | 설명 |
|------|------|
| **Big Bang 방식** | 지정된 마이그레이션 기간에 일괄 이관 (병행운영 최소화) |
| **ID 재생성** | 레거시 ID → 신규 ID 매핑 테이블 유지 |
| **데이터 정제** | 마이그레이션 과정에서 데이터 품질 검증 및 정제 |
| **롤백 가능** | 마이그레이션 실패 시 전체 롤백 가능한 트랜잭션 설계 |

### 7.2 ID 매핑 전략

```sql
-- 레거시 ID → 신규 ID 매핑 테이블 (epeople2_admin에 생성)
CREATE TABLE legacy_id_mappings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type     VARCHAR(50) NOT NULL,     -- 'complaint', 'user', 'agency'
    legacy_id       VARCHAR(100) NOT NULL,    -- 기존 시스템 ID
    new_id          VARCHAR(100) NOT NULL,    -- 새 시스템 ID (CMP-YYYY-NNNNNN 등)
    new_uuid        UUID,                     -- 새 시스템 내부 UUID
    migrated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    batch_id        VARCHAR(50),

    CONSTRAINT uq_legacy_mapping UNIQUE (entity_type, legacy_id)
);

CREATE INDEX idx_legacy_entity ON legacy_id_mappings (entity_type, legacy_id);
CREATE INDEX idx_legacy_new ON legacy_id_mappings (entity_type, new_id);
```

### 7.3 데이터 정제 규칙

| # | 규칙 | 상세 |
|---|------|------|
| 1 | **유형 매핑** | 레거시 단일 유형 → 5유형으로 재분류 (키워드 기반 자동 + 수동 검토) |
| 2 | **다국어 필드** | 레거시 단일 필드 → `_fr`/`_ar` 분리 (아랍어 감지 후 분리) |
| 3 | **날짜 변환** | 로컬 시간 → UTC 변환 |
| 4 | **개인정보 암호화** | 평문 데이터 → AES-256-GCM 암호화 |
| 5 | **상태 매핑** | 레거시 상태 코드 → 신규 ENUM 매핑 |
| 6 | **중복 제거** | 동일 시민·동일 내용 중복 민원 식별 및 병합 |

### 7.4 ETL 파이프라인 설계

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Extract  │───>│ Transform│───>│  Load    │───>│ Verify   │
│          │    │          │    │          │    │          │
│ Legacy DB│    │ 정제규칙 │    │ New DB   │    │ 검증쿼리 │
│ → CSV/   │    │ ID매핑   │    │ Batch    │    │ 카운트   │
│   JSON   │    │ 암호화   │    │ INSERT   │    │ 정합성   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### 7.5 마이그레이션 검증 쿼리

```sql
-- 1. 건수 검증
SELECT 'complaints' AS entity,
       (SELECT COUNT(*) FROM legacy_db.complaints) AS legacy_count,
       (SELECT COUNT(*) FROM epeople2_complaint.complaints) AS new_count,
       (SELECT COUNT(*) FROM epeople2_admin.legacy_id_mappings WHERE entity_type = 'complaint') AS mapped_count;

-- 2. ID 매핑 누락 확인
SELECT legacy_id FROM epeople2_admin.legacy_id_mappings
WHERE entity_type = 'complaint' AND new_uuid NOT IN (
    SELECT id FROM epeople2_complaint.complaints
);

-- 3. 필수 필드 NULL 검증
SELECT COUNT(*) AS null_titles FROM epeople2_complaint.complaints
WHERE title_fr IS NULL OR title_ar IS NULL;
```

### 7.6 롤백 전략

```sql
-- 마이그레이션 롤백 (배치 ID 기준)
BEGIN;
    DELETE FROM epeople2_complaint.complaints
    WHERE id IN (
        SELECT new_uuid FROM epeople2_admin.legacy_id_mappings
        WHERE batch_id = 'BATCH-2025-001' AND entity_type = 'complaint'
    );
    DELETE FROM epeople2_admin.legacy_id_mappings WHERE batch_id = 'BATCH-2025-001';
COMMIT;
```

---

## 8. 보안 설계

### 8.1 컬럼 레벨 암호화 (AES-256-GCM)

#### 암호화 대상 컬럼

| 데이터베이스 | 테이블 | 컬럼 | 데이터 예시 |
|------------|--------|------|------------|
| epeople2_auth | users | email_encrypted | ahmed@example.tn |
| epeople2_auth | users | phone_encrypted | +216 70 123 456 |
| epeople2_auth | users | citizen_id_encrypted | 00123456 |
| epeople2_auth | anonymous_tokens | token_encrypted | ANON-7f3a9b2c-... |
| epeople2_complaint | complaints | citizen_id_encrypted | UUID |
| epeople2_anticorruption | corruption_reports | reporter_id_encrypted | UUID |
| epeople2_anticorruption | corruption_reports | anonymous_token_encrypted | ANON-... |
| epeople2_notification | sms_log | phone_number_encrypted | +216... |
| epeople2_notification | email_log | email_to_encrypted | user@... |
| epeople2_helpdesk | citizen_profiles | phone_encrypted | +216... |
| epeople2_helpdesk | citizen_profiles | email_encrypted | user@... |

#### 암호화/복호화 함수

```sql
-- 암호화 키는 Vault(HashiCorp) 또는 KMS에서 관리
-- 데이터베이스 내부에 키를 직접 저장하지 않음

-- 암호화 함수 (애플리케이션 레벨 권장, DB 레벨 예시)
CREATE OR REPLACE FUNCTION encrypt_personal_data(
    p_plaintext TEXT,
    p_key BYTEA
) RETURNS BYTEA AS $$
BEGIN
    RETURN pgp_sym_encrypt(p_plaintext, encode(p_key, 'hex'), 'cipher-algo=aes256');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 복호화 함수
CREATE OR REPLACE FUNCTION decrypt_personal_data(
    p_encrypted BYTEA,
    p_key BYTEA
) RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(p_encrypted, encode(p_key, 'hex'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 마스킹 함수 (화면 표시용)
CREATE OR REPLACE FUNCTION mask_email(p_email TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN CONCAT(LEFT(p_email, 3), '***@***.', SPLIT_PART(p_email, '.', -1));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mask_phone(p_phone TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN CONCAT(LEFT(p_phone, 7), '***', RIGHT(p_phone, 2));
END;
$$ LANGUAGE plpgsql;
```

### 8.2 Row-Level Security (RLS)

```sql
-- epeople2_complaint DB에서 기관별 데이터 격리

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- BRC 담당자: 자신에게 배분된 민원만 조회
CREATE POLICY policy_officer_complaints ON complaints
    FOR SELECT
    USING (
        assigned_officer_id = current_setting('app.current_user_id')::UUID
        OR assigned_agency_id = current_setting('app.current_agency_id')
    );

-- BCRC 관리자: 전체 민원 조회 가능
CREATE POLICY policy_bcrc_all_complaints ON complaints
    FOR ALL
    USING (
        current_setting('app.current_role') = 'BCRC_ADMIN'
    );

-- 시민: 본인 민원만 조회
CREATE POLICY policy_citizen_complaints ON complaints
    FOR SELECT
    USING (
        citizen_id_encrypted = current_setting('app.current_citizen_id_enc')::BYTEA
    );
```

### 8.3 데이터베이스 사용자 역할 및 권한

```sql
-- 서비스 계정 (최소 권한 원칙)
CREATE ROLE svc_auth_app LOGIN PASSWORD 'vault_managed';
CREATE ROLE svc_complaint_app LOGIN PASSWORD 'vault_managed';
CREATE ROLE svc_anticorruption_app LOGIN PASSWORD 'vault_managed';
CREATE ROLE svc_statistics_app LOGIN PASSWORD 'vault_managed';
CREATE ROLE svc_readonly LOGIN PASSWORD 'vault_managed';  -- 읽기 전용 (리포팅)

-- Auth Service 권한
GRANT CONNECT ON DATABASE epeople2_auth TO svc_auth_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO svc_auth_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO svc_auth_app;

-- Complaint Service 권한
GRANT CONNECT ON DATABASE epeople2_complaint TO svc_complaint_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO svc_complaint_app;
-- DELETE 권한 없음 (소프트 삭제만 허용)
REVOKE DELETE ON ALL TABLES IN SCHEMA public FROM svc_complaint_app;

-- 읽기 전용 (통계/리포팅)
GRANT CONNECT ON DATABASE epeople2_statistics TO svc_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO svc_readonly;
```

### 8.4 감사 로깅 트리거

```sql
-- 민원 테이블 변경 시 감사 로그 자동 기록 (epeople2_complaint)
CREATE OR REPLACE FUNCTION audit_complaint_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO epeople2_auth.audit_log (
        user_id, action, resource_type, resource_id, details, created_at
    ) VALUES (
        current_setting('app.current_user_id', true)::UUID,
        TG_OP,
        'complaint',
        COALESCE(NEW.id, OLD.id)::TEXT,
        jsonb_build_object(
            'old', CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) END,
            'new', CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) END
        ),
        NOW()
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_complaints
    AFTER INSERT OR UPDATE OR DELETE ON complaints
    FOR EACH ROW EXECUTE FUNCTION audit_complaint_changes();
```

### 8.5 INPDP 준수 (튀니지 개인정보보호법)

| 요건 | 구현 |
|------|------|
| **데이터 수집 동의** | `complaints.consent_given = true` 필수 CHECK 제약 |
| **접근 로그** | `audit_log` 테이블에 모든 개인정보 열람 기록 |
| **데이터 최소화** | 서비스별 필요 최소 컬럼만 저장 |
| **보존 기간** | `retention_policies` 테이블로 자동 만료 관리 |
| **삭제 권리** | `deleted_at` 소프트 삭제 후, 보존기간 경과 시 물리 삭제 |
| **이동 권리** | 시민 데이터 JSON 내보내기 API 제공 |

### 8.6 데이터 보존 및 폐기

```sql
-- 보존 기간 경과 데이터 물리 삭제 (월 1회 배치 실행)
-- 민원: 종결 후 10년
-- 감사 로그: 7년
-- 세션: 30일
-- SMS/이메일 로그: 3년

CREATE OR REPLACE FUNCTION purge_expired_data()
RETURNS void AS $$
BEGIN
    -- 종결 후 10년 경과 민원
    DELETE FROM complaints
    WHERE closed_at < NOW() - INTERVAL '10 years'
      AND deleted_at IS NOT NULL;

    -- 7년 경과 감사 로그
    DELETE FROM audit_log
    WHERE created_at < NOW() - INTERVAL '7 years';

    -- 30일 경과 세션
    DELETE FROM user_sessions
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
```

---

## 9. 성능 최적화

### 9.1 쿼리 최적화 원칙

| 원칙 | 설명 | 적용 사례 |
|------|------|-----------|
| **QO-01** 인덱스 우선 | WHERE, JOIN, ORDER BY 절에 사용되는 모든 컬럼 인덱스 | 워크리스트 status + deadline 복합 인덱스 |
| **QO-02** N+1 방지 | 목록 조회 시 JOIN 또는 배치 로딩 | 민원 목록 + 담당기관 JOIN |
| **QO-03** 페이지네이션 | OFFSET 대신 커서 기반(keyset) 페이지네이션 | `WHERE id > :last_id ORDER BY id LIMIT 20` |
| **QO-04** 부분 인덱스 | 자주 필터링되는 조건 부분 인덱스 | `WHERE deleted_at IS NULL` |
| **QO-05** 커버링 인덱스 | SELECT 절 컬럼까지 인덱스에 포함 | 목록 조회 시 INCLUDE 절 활용 |
| **QO-06** 준비된 문장 | PreparedStatement 사용으로 파싱 오버헤드 제거 | 모든 CRUD 쿼리 |
| **QO-07** 배치 처리 | 대량 삽입/갱신 시 단건 대신 배치 | 통계 집계, 마이그레이션 |

### 9.2 테이블 파티셔닝

#### 9.2.1 파티셔닝 대상 테이블

| 테이블 | 파티셔닝 키 | 전략 | 예상 연간 건수 | 파티션 단위 |
|--------|-------------|------|----------------|-------------|
| `complaints` | `created_at` | RANGE | 50,000+ | 연도별 |
| `complaint_histories` | `created_at` | RANGE | 200,000+ | 연도별 |
| `audit_log` | `created_at` | RANGE | 500,000+ | 월별 |
| `daily_statistics` | `stat_date` | RANGE | 365 | 연도별 |
| `monthly_statistics` | `stat_month` | RANGE | 12 | 연도별 |
| `sms_log` | `sent_at` | RANGE | 100,000+ | 월별 |
| `email_log` | `sent_at` | RANGE | 100,000+ | 월별 |
| `notifications` | `created_at` | RANGE | 200,000+ | 월별 |

#### 9.2.2 민원 테이블 파티셔닝 DDL

```sql
-- ============================================================
-- 민원 테이블 범위 파티셔닝 (연도별)
-- ============================================================

-- 기존 complaints 테이블을 파티셔닝 테이블로 변환
-- 주의: 운영 중 변환 시 pg_partman 사용 권장

CREATE TABLE complaints_partitioned (
    LIKE complaints INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- 2024~2030 파티션 생성 (프로젝트 기간)
CREATE TABLE complaints_y2024 PARTITION OF complaints_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE complaints_y2025 PARTITION OF complaints_partitioned
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE complaints_y2026 PARTITION OF complaints_partitioned
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE complaints_y2027 PARTITION OF complaints_partitioned
    FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');
CREATE TABLE complaints_y2028 PARTITION OF complaints_partitioned
    FOR VALUES FROM ('2028-01-01') TO ('2029-01-01');
CREATE TABLE complaints_y2029 PARTITION OF complaints_partitioned
    FOR VALUES FROM ('2029-01-01') TO ('2030-01-01');
CREATE TABLE complaints_y2030 PARTITION OF complaints_partitioned
    FOR VALUES FROM ('2030-01-01') TO ('2031-01-01');

-- 기본 파티션 (범위 밖 데이터 수용)
CREATE TABLE complaints_default PARTITION OF complaints_partitioned DEFAULT;
```

#### 9.2.3 감사 로그 파티셔닝 DDL

```sql
-- ============================================================
-- 감사 로그 월별 파티셔닝
-- ============================================================

CREATE TABLE audit_log_partitioned (
    LIKE audit_log INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- 자동 파티션 생성 (pg_partman 활용)
-- pg_partman 설치 후 설정
CREATE EXTENSION IF NOT EXISTS pg_partman;

SELECT partman.create_parent(
    p_parent_table   := 'public.audit_log_partitioned',
    p_control        := 'created_at',
    p_type           := 'range',
    p_interval       := '1 month',
    p_premake        := 6,          -- 6개월 선행 생성
    p_start_partition := '2024-01-01'
);

-- pg_partman 자동 유지보수 (cron으로 매일 실행)
-- SELECT partman.run_maintenance();
```

#### 9.2.4 알림/SMS/이메일 로그 파티셔닝

```sql
-- ============================================================
-- 알림 테이블 월별 파티셔닝
-- ============================================================

CREATE TABLE notifications_partitioned (
    LIKE notifications INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- SMS 로그 월별 파티셔닝
CREATE TABLE sms_log_partitioned (
    LIKE sms_log INCLUDING ALL
) PARTITION BY RANGE (sent_at);

-- 이메일 로그 월별 파티셔닝
CREATE TABLE email_log_partitioned (
    LIKE email_log INCLUDING ALL
) PARTITION BY RANGE (sent_at);

-- pg_partman으로 월별 자동 관리
SELECT partman.create_parent('public.notifications_partitioned', 'created_at', 'range', '1 month', p_premake := 6);
SELECT partman.create_parent('public.sms_log_partitioned', 'sent_at', 'range', '1 month', p_premake := 6);
SELECT partman.create_parent('public.email_log_partitioned', 'sent_at', 'range', '1 month', p_premake := 6);
```

### 9.3 커서 기반 페이지네이션

```sql
-- ============================================================
-- OFFSET 기반 (비권장) — 대량 데이터 시 성능 저하
-- ============================================================
-- SELECT * FROM complaints ORDER BY created_at DESC OFFSET 10000 LIMIT 20;
-- → 10,020행 스캔 후 10,000행 버림

-- ============================================================
-- 커서 기반 (권장) — 일정한 성능
-- ============================================================

-- 1) 최초 페이지
SELECT id, display_number, title_fr, title_ar, status, deadline,
       created_at
  FROM complaints
 WHERE deleted_at IS NULL
   AND status = 'processing'
 ORDER BY created_at DESC, id DESC
 LIMIT 20;

-- 2) 다음 페이지 (이전 페이지 마지막 행의 created_at, id 전달)
SELECT id, display_number, title_fr, title_ar, status, deadline,
       created_at
  FROM complaints
 WHERE deleted_at IS NULL
   AND status = 'processing'
   AND (created_at, id) < (:last_created_at, :last_id)
 ORDER BY created_at DESC, id DESC
 LIMIT 20;

-- 지원 인덱스
CREATE INDEX idx_complaints_cursor ON complaints (
    status, created_at DESC, id DESC
) WHERE deleted_at IS NULL;
```

### 9.4 Materialized View (구체화된 뷰)

```sql
-- ============================================================
-- 기관별 성과 요약 (MV) — BCRC 대시보드용
-- ============================================================

CREATE MATERIALIZED VIEW mv_agency_performance AS
SELECT
    a.id                        AS agency_id,
    a.name_fr                   AS agency_name_fr,
    a.name_ar                   AS agency_name_ar,
    a.governorate,
    COUNT(c.id)                 AS total_complaints,
    COUNT(c.id) FILTER (WHERE c.status = 'completed')
                                AS completed_count,
    COUNT(c.id) FILTER (WHERE c.status = 'processing' AND c.deadline < NOW())
                                AS overdue_count,
    ROUND(
        COUNT(c.id) FILTER (WHERE c.status = 'completed')::numeric /
        NULLIF(COUNT(c.id), 0) * 100, 1
    )                           AS completion_rate,
    ROUND(AVG(
        EXTRACT(EPOCH FROM (c.completed_at - c.created_at)) / 86400
    )::numeric, 1)             AS avg_processing_days,
    ROUND(AVG(s.score)::numeric, 2)
                                AS avg_satisfaction
FROM agencies a
LEFT JOIN complaints c ON c.assigned_agency_id = a.id
    AND c.deleted_at IS NULL
LEFT JOIN satisfaction_scores s ON s.complaint_id = c.id
GROUP BY a.id, a.name_fr, a.name_ar, a.governorate
WITH DATA;

-- 유니크 인덱스 (REFRESH CONCURRENTLY 필수 조건)
CREATE UNIQUE INDEX idx_mv_agency_perf_id ON mv_agency_performance (agency_id);

-- 성과 미달 기관 빠른 조회 (G-11)
CREATE INDEX idx_mv_agency_perf_rate ON mv_agency_performance (completion_rate)
    WHERE completion_rate < 80;

-- ============================================================
-- 반복 민원 분석 (MV) — G-06 대응
-- ============================================================

CREATE MATERIALIZED VIEW mv_repeated_complaints AS
SELECT
    citizen_id,
    category_l1,
    category_l2,
    COUNT(*)                    AS complaint_count,
    MIN(created_at)             AS first_complaint_at,
    MAX(created_at)             AS last_complaint_at,
    ARRAY_AGG(display_number ORDER BY created_at)
                                AS complaint_numbers
FROM complaints
WHERE deleted_at IS NULL
GROUP BY citizen_id, category_l1, category_l2
HAVING COUNT(*) >= 3
WITH DATA;

CREATE UNIQUE INDEX idx_mv_repeated_citizen_cat
    ON mv_repeated_complaints (citizen_id, category_l1, category_l2);

-- ============================================================
-- 일일 통계 요약 (MV)
-- ============================================================

CREATE MATERIALIZED VIEW mv_daily_summary AS
SELECT
    DATE(created_at)            AS stat_date,
    type,
    status,
    COUNT(*)                    AS count,
    AVG(EXTRACT(EPOCH FROM (
        CASE WHEN completed_at IS NOT NULL
             THEN completed_at - created_at
             ELSE NOW() - created_at
        END
    )) / 86400)::numeric(10,1)  AS avg_days
FROM complaints
WHERE deleted_at IS NULL
GROUP BY DATE(created_at), type, status
WITH DATA;

CREATE UNIQUE INDEX idx_mv_daily_summary_pk
    ON mv_daily_summary (stat_date, type, status);

-- ============================================================
-- MV 갱신 스케줄 (pg_cron)
-- ============================================================

-- pg_cron 확장 설치
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 기관 성과: 매 1시간 갱신
SELECT cron.schedule('refresh_agency_perf', '0 * * * *',
    'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_agency_performance');

-- 반복 민원: 매일 02:00 갱신
SELECT cron.schedule('refresh_repeated', '0 2 * * *',
    'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_repeated_complaints');

-- 일일 요약: 매일 01:00 갱신
SELECT cron.schedule('refresh_daily_summary', '0 1 * * *',
    'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_summary');
```

### 9.5 Connection Pooling (PgBouncer 상세 설정)

```ini
; ============================================================
; PgBouncer 설정 (/etc/pgbouncer/pgbouncer.ini)
; ============================================================

[databases]
; 서비스별 데이터베이스 연결
epeople2_auth           = host=pg-primary port=5432 dbname=epeople2_auth
epeople2_complaint      = host=pg-primary port=5432 dbname=epeople2_complaint
epeople2_anticorruption = host=pg-primary port=5432 dbname=epeople2_anticorruption
epeople2_eparticipation = host=pg-primary port=5432 dbname=epeople2_eparticipation
epeople2_statistics     = host=pg-replica port=5432 dbname=epeople2_statistics
epeople2_document       = host=pg-primary port=5432 dbname=epeople2_document
epeople2_notification   = host=pg-primary port=5432 dbname=epeople2_notification
epeople2_helpdesk       = host=pg-primary port=5432 dbname=epeople2_helpdesk
epeople2_admin          = host=pg-primary port=5432 dbname=epeople2_admin

; 통계 서비스는 읽기 전용 → Replica 연결
epeople2_statistics_ro  = host=pg-replica port=5432 dbname=epeople2_statistics

[pgbouncer]
; 풀링 모드: transaction (세션 수 절약)
pool_mode = transaction

; 연결 수 설정
max_client_conn         = 1000      ; 최대 클라이언트 연결
default_pool_size       = 25        ; DB당 기본 풀 크기
min_pool_size           = 5         ; DB당 최소 풀 크기
reserve_pool_size       = 5         ; 예비 풀
reserve_pool_timeout    = 3         ; 예비 풀 활성화 대기(초)

; 서버 연결 관리
server_lifetime         = 3600      ; 서버 연결 최대 수명(초)
server_idle_timeout     = 600       ; 유휴 서버 연결 해제(초)
server_connect_timeout  = 15        ; 서버 연결 타임아웃(초)
server_login_retry      = 15        ; 서버 연결 재시도 간격(초)

; 클라이언트 관리
client_idle_timeout     = 0         ; 유휴 클라이언트 해제 (0=무제한)
client_login_timeout    = 60        ; 로그인 타임아웃(초)

; 보안
auth_type               = scram-sha-256
auth_file               = /etc/pgbouncer/userlist.txt

; 로깅
log_connections         = 1
log_disconnections      = 1
log_pooler_errors       = 1
stats_period            = 60        ; 통계 로그 주기(초)

; 관리 콘솔
listen_addr             = 0.0.0.0
listen_port             = 6432
admin_users             = pgbouncer_admin
stats_users             = pgbouncer_stats
```

#### PgBouncer 풀 크기 산정 근거

```
총 PostgreSQL max_connections    = 300
예약 (슈퍼유저, 모니터링)        = 20
가용 연결                        = 280

서비스별 할당:
  epeople2_complaint (Primary)   = 50  (가장 높은 트래픽)
  epeople2_auth                  = 40  (로그인/세션)
  epeople2_notification          = 30  (실시간 알림)
  epeople2_helpdesk              = 25
  epeople2_eparticipation        = 25
  epeople2_anticorruption        = 25
  epeople2_document              = 25
  epeople2_admin                 = 20
  epeople2_statistics            = 20
  epeople2_statistics_ro (Replica) = 20
  ──────────────────────────────────
  합계                           = 280
```

### 9.6 Read Replica 활용 전략

```
┌─────────────────────────────────────────────────────────────┐
│                      쿼리 라우팅 전략                         │
├──────────────────────────┬──────────────────────────────────┤
│       Primary (R/W)      │        Replica (R/O)             │
├──────────────────────────┼──────────────────────────────────┤
│ 민원 등록/수정/삭제       │ 통계 대시보드 조회               │
│ 상태 변경 트랜잭션        │ 기관 성과 리포트                 │
│ 이관 처리                │ 반복 민원 분석                   │
│ 부패신고 등록             │ 워크리스트 조회 (2초 지연 허용)   │
│ 사용자 인증               │ 제안 목록 조회                   │
│ 알림 발송 기록            │ 검색 쿼리                       │
│ 감사 로그 기록            │ 내보내기/CSV 생성                │
└──────────────────────────┴──────────────────────────────────┘
```

#### Spring Data JPA 읽기 전용 라우팅 예시

```java
// 서비스 레이어에서 @Transactional(readOnly = true)로 Replica 자동 라우팅
@Service
public class StatisticsService {

    @Transactional(readOnly = true)  // → Replica로 라우팅
    public AgencyPerformanceDTO getAgencyPerformance(String agencyId) {
        return agencyPerformanceRepository.findByAgencyId(agencyId);
    }

    @Transactional  // → Primary로 라우팅
    public void refreshDailyStatistics() {
        // Materialized View 갱신
    }
}
```

### 9.7 PostgreSQL 서버 튜닝

```ini
# ============================================================
# postgresql.conf 성능 최적화 설정
# 기준 서버: 16 CPU / 64GB RAM / NVMe SSD
# ============================================================

# ── 메모리 ──
shared_buffers          = 16GB          # RAM의 25%
effective_cache_size    = 48GB          # RAM의 75%
work_mem               = 64MB           # 정렬/해시 작업 메모리
maintenance_work_mem   = 2GB            # VACUUM, 인덱스 생성
huge_pages             = try            # 대용량 페이지 활용

# ── WAL (Write-Ahead Log) ──
wal_level              = replica        # 스트리밍 복제용
max_wal_size           = 4GB
min_wal_size           = 1GB
wal_compression        = zstd           # WAL 압축 (PG15+)
wal_buffers            = 64MB
checkpoint_completion_target = 0.9
archive_mode           = on
archive_command        = 'pgbackrest --stanza=epeople2 archive-push %p'

# ── 복제 ──
max_wal_senders        = 10
max_replication_slots  = 10
hot_standby            = on
hot_standby_feedback   = on

# ── 병렬 쿼리 ──
max_parallel_workers_per_gather = 4
max_parallel_workers            = 8
max_parallel_maintenance_workers = 4
parallel_tuple_cost    = 0.01
parallel_setup_cost    = 100.0

# ── 쿼리 플래너 ──
random_page_cost       = 1.1           # SSD 환경
effective_io_concurrency = 200         # NVMe SSD
default_statistics_target = 200        # 통계 정밀도 향상

# ── VACUUM ──
autovacuum             = on
autovacuum_max_workers = 4
autovacuum_naptime     = 30s
autovacuum_vacuum_threshold = 50
autovacuum_vacuum_scale_factor = 0.05  # 기본 0.2 → 0.05로 강화
autovacuum_analyze_threshold = 50
autovacuum_analyze_scale_factor = 0.02
autovacuum_vacuum_cost_delay = 2ms

# ── Locale (아랍어/프랑스어 지원) ──
lc_collate             = 'und-x-icu'   # ICU 기본 정렬
lc_ctype               = 'und-x-icu'
default_text_search_config = 'pg_catalog.simple'

# ── 로깅 ──
log_min_duration_statement = 500        # 500ms 이상 쿼리 로그
log_checkpoints        = on
log_connections        = on
log_disconnections     = on
log_lock_waits         = on
log_temp_files         = 0              # 모든 임시 파일 로그
log_autovacuum_min_duration = 0         # 모든 autovacuum 로그

# ── 연결 ──
max_connections        = 300
listen_addresses       = '*'
tcp_keepalives_idle    = 60
tcp_keepalives_interval = 10
tcp_keepalives_count   = 6

# ── 확장 ──
shared_preload_libraries = 'pg_stat_statements,pg_cron,pg_partman_bgw,pgaudit'
```

### 9.8 VACUUM 전략

| 테이블 | UPDATE 빈도 | VACUUM 전략 | 비고 |
|--------|-------------|-------------|------|
| `complaints` | 높음 (상태 변경) | 공격적 autovacuum (scale_factor=0.02) | Dead tuple 빠르게 회수 |
| `complaint_histories` | INSERT only | autovacuum 기본값 | Append-only 패턴 |
| `audit_log` | INSERT only | 월별 파티션 DROP으로 대체 | 파티셔닝 활용 |
| `notifications` | 높음 (읽음 처리) | 공격적 autovacuum | is_read 갱신 빈번 |
| `user_sessions` | 높음 (갱신/만료) | 공격적 autovacuum | TTL 기반 삭제 빈번 |

```sql
-- complaints 테이블 개별 autovacuum 설정
ALTER TABLE complaints SET (
    autovacuum_vacuum_scale_factor = 0.02,
    autovacuum_analyze_scale_factor = 0.01,
    autovacuum_vacuum_threshold = 50,
    fillfactor = 80  -- UPDATE 빈번 → 여유 공간 확보
);

-- complaint_histories (INSERT only → fillfactor 100)
ALTER TABLE complaint_histories SET (
    autovacuum_vacuum_scale_factor = 0.1,
    fillfactor = 100
);

-- notifications 테이블 (is_read 갱신 빈번)
ALTER TABLE notifications SET (
    autovacuum_vacuum_scale_factor = 0.02,
    autovacuum_vacuum_threshold = 100,
    fillfactor = 85
);
```

---

## 10. Redis 캐시 설계

### 10.1 Redis 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    Redis 7 Cluster                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Redis Master  │  │ Redis Master  │  │ Redis Master  │     │
│  │  (Shard 1)   │  │  (Shard 2)   │  │  (Shard 3)   │      │
│  │  DB 0: Session│  │  DB 0: Cache  │  │  DB 0: Queue  │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐      │
│  │ Redis Replica │  │ Redis Replica │  │ Redis Replica │     │
│  │  (Shard 1)   │  │  (Shard 2)   │  │  (Shard 3)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  Sentinel: 3 nodes (quorum = 2)                            │
│  Total Memory: 16GB (per shard)                            │
│  Persistence: AOF + RDB                                    │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 Key 네이밍 규칙

```
형식: {서비스}:{도메인}:{식별자}:{속성}

규칙:
  - 소문자 사용
  - 콜론(:) 구분자
  - 중괄호({}) 해시 태그 (같은 슬롯 보장)
  - TTL 필수 (무기한 키 금지)
```

#### Key 네이밍 패턴 상세

| 용도 | Key 패턴 | Value 타입 | TTL | 예시 |
|------|----------|-----------|-----|------|
| **세션** | `auth:session:{session_id}` | Hash | 30분 | `auth:session:abc123def` |
| **사용자 캐시** | `auth:user:{user_id}` | Hash | 10분 | `auth:user:USR-000001` |
| **로그인 시도** | `auth:login_attempt:{ip}` | String (count) | 15분 | `auth:login_attempt:192.168.1.1` |
| **민원 상세** | `complaint:detail:{complaint_id}` | String (JSON) | 5분 | `complaint:detail:CMP-2024-000042` |
| **민원 목록** | `complaint:list:{user_id}:{page}` | String (JSON) | 2분 | `complaint:list:USR-000001:1` |
| **기관 정보** | `admin:agency:{agency_id}` | Hash | 1시간 | `admin:agency:BRC-ENV-TUN-001` |
| **기관 전체** | `admin:agencies:all` | String (JSON) | 1시간 | `admin:agencies:all` |
| **카테고리 트리** | `admin:categories:tree` | String (JSON) | 6시간 | `admin:categories:tree` |
| **SLA 설정** | `admin:sla:{complaint_type}` | Hash | 1시간 | `admin:sla:grievance` |
| **통계 대시보드** | `stat:dashboard:{scope}:{date}` | String (JSON) | 5분 | `stat:dashboard:national:2024-04-01` |
| **기관 성과** | `stat:agency_perf:{agency_id}` | String (JSON) | 15분 | `stat:agency_perf:BRC-ENV-TUN-001` |
| **알림 미읽음 수** | `notif:unread:{user_id}` | String (count) | 1분 | `notif:unread:USR-000001` |
| **제안 공감 수** | `epart:proposal:likes:{proposal_id}` | String (count) | 5분 | `epart:proposal:likes:PRP-2024-000001` |
| **공감 여부** | `epart:proposal:liked:{proposal_id}:{user_id}` | String (1/0) | 1시간 | `epart:proposal:liked:PRP-001:USR-001` |
| **분산 락** | `lock:{resource}:{id}` | String (token) | 30초 | `lock:complaint:CMP-2024-000042` |
| **Rate Limit** | `ratelimit:{endpoint}:{ip}` | String (count) | 1분 | `ratelimit:/api/complaints:192.168.1.1` |
| **API 응답** | `api:response:{hash}` | String (JSON) | 1분 | `api:response:a1b2c3d4` |

### 10.3 캐시 전략 (Cache Strategy)

#### 10.3.1 전략별 적용 대상

| 전략 | 설명 | 적용 대상 |
|------|------|-----------|
| **Cache-Aside (Lazy Loading)** | 캐시 미스 시 DB 조회 후 캐시 저장 | 민원 상세, 사용자 정보 |
| **Write-Through** | DB 저장 시 동시에 캐시 갱신 | 알림 미읽음 수, 공감 수 |
| **Write-Behind (Write-Back)** | 캐시에 먼저 쓰고 비동기로 DB 반영 | 조회수 카운터, 통계 카운터 |
| **Read-Through** | 캐시가 자동으로 DB 조회 (라이브러리 필요) | 카테고리 트리, 기관 목록 |
| **Refresh-Ahead** | TTL 만료 전 미리 갱신 | 대시보드 통계, 기관 성과 |

#### 10.3.2 Cache-Aside 구현 예시

```python
# Python (FastAPI + Redis) 예시
import json
import redis
from typing import Optional

redis_client = redis.Redis(host='redis-cluster', port=6379, decode_responses=True)

async def get_complaint_detail(complaint_id: str) -> dict:
    """민원 상세 조회 — Cache-Aside 패턴"""
    cache_key = f"complaint:detail:{complaint_id}"

    # 1) 캐시 조회
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)

    # 2) 캐시 미스 → DB 조회
    complaint = await db.fetch_complaint(complaint_id)
    if not complaint:
        return None

    # 3) 캐시 저장 (TTL: 5분)
    redis_client.setex(
        cache_key,
        timedelta(minutes=5),
        json.dumps(complaint, default=str)
    )

    return complaint

async def update_complaint_status(complaint_id: str, new_status: str):
    """민원 상태 변경 — 캐시 무효화"""
    # 1) DB 업데이트
    await db.update_complaint_status(complaint_id, new_status)

    # 2) 관련 캐시 삭제 (Write-Through)
    cache_key = f"complaint:detail:{complaint_id}"
    redis_client.delete(cache_key)

    # 3) 목록 캐시도 무효화 (패턴 삭제)
    # SCAN으로 관련 키 탐색 후 삭제
    for key in redis_client.scan_iter(f"complaint:list:*"):
        redis_client.delete(key)
```

#### 10.3.3 분산 락 구현

```python
import uuid
import time

class DistributedLock:
    """Redis 기반 분산 락 — 민원 동시 수정 방지"""

    def __init__(self, redis_client, resource: str, ttl: int = 30):
        self.redis = redis_client
        self.resource = resource
        self.token = str(uuid.uuid4())
        self.ttl = ttl
        self.key = f"lock:{resource}"

    def acquire(self, retry_count: int = 3, retry_delay: float = 0.5) -> bool:
        """락 획득 시도"""
        for i in range(retry_count):
            # SET NX EX (원자적 획득)
            if self.redis.set(self.key, self.token, nx=True, ex=self.ttl):
                return True
            time.sleep(retry_delay)
        return False

    def release(self) -> bool:
        """락 해제 (Lua 스크립트로 원자적 해제)"""
        lua_script = """
        if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
        else
            return 0
        end
        """
        return self.redis.eval(lua_script, 1, self.key, self.token)

# 사용 예시
async def process_complaint_transfer(complaint_id: str, target_agency_id: str):
    """민원 이관 처리 — 분산 락 적용"""
    lock = DistributedLock(redis_client, f"complaint:{complaint_id}")

    if not lock.acquire():
        raise ConcurrentModificationError("다른 담당자가 현재 처리 중입니다")

    try:
        await db.transfer_complaint(complaint_id, target_agency_id)
        # 캐시 무효화
        redis_client.delete(f"complaint:detail:{complaint_id}")
    finally:
        lock.release()
```

### 10.4 세션 관리

```python
# 세션 데이터 구조 (Redis Hash)
# Key: auth:session:{session_id}
# TTL: 30분 (활동 시 갱신)

session_data = {
    "user_id":     "USR-000001",
    "email":       "officer@brc.tn",
    "role":        "brc_officer",
    "agency_id":   "BRC-ENV-TUN-001",
    "login_at":    "2024-04-01T09:00:00Z",
    "last_active": "2024-04-01T09:15:00Z",
    "ip_address":  "192.168.1.100",
    "user_agent":  "Mozilla/5.0..."
}

# 세션 관련 Redis 명령
"""
HSET auth:session:{sid} user_id "USR-000001" ...
EXPIRE auth:session:{sid} 1800   -- 30분 TTL

# 활동 시 TTL 갱신
EXPIRE auth:session:{sid} 1800

# 강제 로그아웃 (세션 삭제)
DEL auth:session:{sid}

# 사용자의 모든 활성 세션 조회
SMEMBERS auth:user_sessions:{user_id}

# 동시 세션 제한 (최대 3개)
SCARD auth:user_sessions:{user_id}
"""
```

### 10.5 Rate Limiting

```python
# Sliding Window Rate Limiter
# 엔드포인트별 IP당 요청 제한

RATE_LIMITS = {
    "/api/complaints":          {"max": 30,  "window": 60},   # 30회/분
    "/api/complaints/new":      {"max": 5,   "window": 60},   # 5회/분
    "/api/auth/login":          {"max": 5,   "window": 300},  # 5회/5분
    "/api/reports/new":         {"max": 3,   "window": 60},   # 3회/분
    "/api/proposals/like":      {"max": 60,  "window": 60},   # 60회/분
    "/api/statistics/export":   {"max": 3,   "window": 300},  # 3회/5분
}

async def check_rate_limit(endpoint: str, client_ip: str) -> bool:
    """슬라이딩 윈도우 레이트 리미트 검사"""
    config = RATE_LIMITS.get(endpoint)
    if not config:
        return True

    key = f"ratelimit:{endpoint}:{client_ip}"
    now = time.time()
    window = config["window"]

    pipe = redis_client.pipeline()
    pipe.zremrangebyscore(key, 0, now - window)  # 윈도우 밖 제거
    pipe.zadd(key, {str(now): now})              # 현재 요청 추가
    pipe.zcard(key)                              # 윈도우 내 요청 수
    pipe.expire(key, window)                     # TTL 설정
    results = pipe.execute()

    request_count = results[2]
    return request_count <= config["max"]
```

### 10.6 캐시 무효화 전략

| 이벤트 | 무효화 대상 키 | 방식 |
|--------|----------------|------|
| 민원 상태 변경 | `complaint:detail:{id}`, `complaint:list:*`, `stat:dashboard:*` | 즉시 삭제 |
| 민원 이관 | `complaint:detail:{id}`, `complaint:list:*` | 즉시 삭제 |
| 사용자 정보 변경 | `auth:user:{user_id}` | 즉시 삭제 |
| 기관 정보 변경 | `admin:agency:{id}`, `admin:agencies:all` | 즉시 삭제 |
| 카테고리 변경 | `admin:categories:tree` | 즉시 삭제 |
| SLA 설정 변경 | `admin:sla:{type}`, `admin:sla:all` | 즉시 삭제 |
| 알림 읽음 처리 | `notif:unread:{user_id}` | 카운터 감소 (DECR) |
| 제안 공감 클릭 | `epart:proposal:likes:{id}` | 카운터 증가 (INCR) |
| 통계 MV 갱신 | `stat:dashboard:*`, `stat:agency_perf:*` | 패턴 삭제 |

```python
# 이벤트 기반 캐시 무효화 (Pub/Sub)

# Publisher (서비스 레이어)
async def on_complaint_status_changed(complaint_id: str, new_status: str):
    """민원 상태 변경 이벤트 발행"""
    event = {
        "type": "complaint.status_changed",
        "complaint_id": complaint_id,
        "new_status": new_status,
        "timestamp": datetime.utcnow().isoformat()
    }
    redis_client.publish("cache_invalidation", json.dumps(event))

# Subscriber (캐시 관리 워커)
async def cache_invalidation_handler():
    """캐시 무효화 이벤트 구독 및 처리"""
    pubsub = redis_client.pubsub()
    pubsub.subscribe("cache_invalidation")

    for message in pubsub.listen():
        if message["type"] != "message":
            continue

        event = json.loads(message["data"])
        event_type = event["type"]

        if event_type == "complaint.status_changed":
            cid = event["complaint_id"]
            redis_client.delete(f"complaint:detail:{cid}")
            # 목록 캐시 패턴 삭제
            for key in redis_client.scan_iter("complaint:list:*"):
                redis_client.delete(key)
            # 통계 캐시 무효화
            for key in redis_client.scan_iter("stat:dashboard:*"):
                redis_client.delete(key)
```

### 10.7 Redis 설정 파일

```conf
# ============================================================
# redis.conf — e-People II Redis 7 설정
# ============================================================

# ── 네트워크 ──
bind 0.0.0.0
port 6379
protected-mode yes
requirepass ${REDIS_PASSWORD}

# ── 메모리 ──
maxmemory 16gb
maxmemory-policy allkeys-lru    # LRU 정책으로 메모리 초과 시 제거

# ── 영속성 (AOF + RDB 병용) ──
# RDB 스냅샷
save 900 1       # 900초 내 1건 변경 시
save 300 10      # 300초 내 10건 변경 시
save 60 10000    # 60초 내 10000건 변경 시
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb

# AOF (Append Only File)
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec            # 성능-안정성 균형
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# ── 복제 ──
replica-serve-stale-data yes
replica-read-only yes
repl-diskless-sync yes
repl-diskless-sync-delay 5

# ── 보안 ──
# ACL 규칙 (Redis 6+)
# user default off                  # 기본 사용자 비활성화
# user epeople_app on >password ~* &* +@all -@dangerous
# user epeople_readonly on >password ~* &* +@read

# ── 슬로우 로그 ──
slowlog-log-slower-than 10000   # 10ms 이상
slowlog-max-len 256

# ── 클라이언트 ──
timeout 300                     # 유휴 연결 300초 후 해제
tcp-keepalive 60
maxclients 10000

# ── Lua 스크립트 ──
lua-time-limit 5000             # 5초 제한

# ── Cluster ──
# cluster-enabled yes
# cluster-config-file nodes.conf
# cluster-node-timeout 5000
```

### 10.8 메모리 사용량 추정

| 캐시 대상 | 키 수 (피크) | 평균 Value 크기 | 예상 메모리 |
|-----------|-------------|----------------|-------------|
| 세션 | 2,000 | 500B | 1 MB |
| 사용자 캐시 | 5,000 | 300B | 1.5 MB |
| 민원 상세 | 10,000 | 2 KB | 20 MB |
| 민원 목록 | 5,000 | 5 KB | 25 MB |
| 기관 정보 | 100 | 1 KB | 0.1 MB |
| 카테고리 트리 | 1 | 50 KB | 0.05 MB |
| 통계 대시보드 | 200 | 3 KB | 0.6 MB |
| 기관 성과 | 100 | 2 KB | 0.2 MB |
| 알림 카운터 | 5,000 | 8B | 0.04 MB |
| 공감 카운터 | 2,000 | 8B | 0.016 MB |
| Rate Limit | 10,000 | 100B | 1 MB |
| 분산 락 | 100 | 36B | 0.004 MB |
| API 응답 캐시 | 5,000 | 3 KB | 15 MB |
| **합계** | **~44,500** | | **~65 MB** |

> 실제 Redis 메모리 사용량은 데이터 구조 오버헤드로 인해 약 2~3배 → **~200 MB** 예상.
> 16GB 할당 시 충분한 여유 확보.

---

## 11. 백업 및 복구

### 11.1 백업 정책 요약

| 항목 | 목표 | 비고 |
|------|------|------|
| **RPO (Recovery Point Objective)** | 1시간 | 최대 1시간 데이터 손실 허용 |
| **RTO (Recovery Time Objective)** | 4시간 | 장애 발생 후 4시간 내 복구 |
| **보존 기간** | 일일: 30일, 주간: 12주, 월간: 24개월 | 3단계 보존 |
| **백업 위치** | 로컬 + 원격(S3 호환 OBS) | 3-2-1 규칙 준수 |
| **암호화** | AES-256 | 백업 파일 암호화 필수 |
| **검증** | 주 1회 복원 테스트 | 자동화된 복원 검증 |

### 11.2 백업 유형 및 스케줄

```
┌─────────────────────────────────────────────────────────────┐
│                    백업 스케줄 매트릭스                       │
├──────────┬──────────┬──────────────┬────────┬───────────────┤
│ 유형      │ 주기     │ 시간          │ 보존   │ 방식          │
├──────────┼──────────┼──────────────┼────────┼───────────────┤
│ WAL 아카이브 │ 연속    │ 실시간        │ 7일    │ pgBackRest    │
│ 증분 백업   │ 매시간  │ 매시 00분     │ 48시간 │ pgBackRest    │
│ 차등 백업   │ 매일    │ 02:00 UTC    │ 30일   │ pgBackRest    │
│ 전체 백업   │ 주 1회  │ 일요일 03:00 │ 12주   │ pgBackRest    │
│ 논리 백업   │ 월 1회  │ 1일 04:00    │ 24개월 │ pg_dump       │
│ Redis RDB  │ 매시간  │ 매시 30분     │ 7일    │ BGSAVE        │
│ Redis AOF  │ 연속    │ 실시간        │ 3일    │ appendonly    │
└──────────┴──────────┴──────────────┴────────┴───────────────┘
```

### 11.3 pgBackRest 설정

```ini
# ============================================================
# /etc/pgbackrest/pgbackrest.conf
# ============================================================

[global]
# 저장소 설정
repo1-type=posix
repo1-path=/backup/pgbackrest
repo1-retention-full=4          # 전체 백업 4세대 보존
repo1-retention-diff=30         # 차등 백업 30세대 보존
repo1-cipher-type=aes-256-cbc
repo1-cipher-pass=${BACKUP_ENCRYPTION_KEY}

# 원격 저장소 (S3 호환)
repo2-type=s3
repo2-s3-endpoint=obs.tn-tunis-1.cloud
repo2-s3-bucket=epeople2-backup
repo2-s3-region=tn-tunis-1
repo2-s3-key=${S3_ACCESS_KEY}
repo2-s3-key-secret=${S3_SECRET_KEY}
repo2-retention-full=12         # 원격: 12세대 보존
repo2-cipher-type=aes-256-cbc
repo2-cipher-pass=${BACKUP_ENCRYPTION_KEY}

# 압축
compress-type=zst               # zstd 압축
compress-level=6

# 병렬 처리
process-max=4

# 로깅
log-level-console=info
log-level-file=detail
log-path=/var/log/pgbackrest

[epeople2]
# PostgreSQL 연결
pg1-path=/var/lib/postgresql/15/main
pg1-port=5432
pg1-user=pgbackrest
pg1-database=epeople2_complaint

# 모든 데이터베이스 백업
pg1-database=*
```

### 11.4 백업 실행 스크립트

```bash
#!/bin/bash
# ============================================================
# /opt/epeople2/scripts/backup.sh
# e-People II 데이터베이스 백업 스크립트
# ============================================================

set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/epeople2/backup_${TIMESTAMP}.log"
ALERT_WEBHOOK="${ALERT_WEBHOOK_URL}"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

alert() {
    curl -s -X POST "$ALERT_WEBHOOK" \
        -H "Content-Type: application/json" \
        -d "{\"text\": \"[e-People II Backup] $1\"}" || true
}

# ── 1. 전체 백업 (주간) ──
full_backup() {
    log "Starting full backup..."
    pgbackrest --stanza=epeople2 --type=full backup
    pgbackrest --stanza=epeople2 --type=full --repo=2 backup  # 원격
    log "Full backup completed"
    alert "✅ Weekly full backup completed successfully"
}

# ── 2. 차등 백업 (일간) ──
diff_backup() {
    log "Starting differential backup..."
    pgbackrest --stanza=epeople2 --type=diff backup
    log "Differential backup completed"
}

# ── 3. 증분 백업 (매시간) ──
incr_backup() {
    log "Starting incremental backup..."
    pgbackrest --stanza=epeople2 --type=incr backup
    log "Incremental backup completed"
}

# ── 4. 논리 백업 (월간) ──
logical_backup() {
    log "Starting logical backup (pg_dump)..."
    BACKUP_DIR="/backup/logical/${TIMESTAMP}"
    mkdir -p "$BACKUP_DIR"

    # 데이터베이스별 논리 백업
    for DB in epeople2_auth epeople2_complaint epeople2_anticorruption \
              epeople2_eparticipation epeople2_statistics epeople2_document \
              epeople2_notification epeople2_helpdesk epeople2_admin; do
        log "  Dumping ${DB}..."
        pg_dump -h localhost -U backup_user -Fc -Z 6 \
            --file="${BACKUP_DIR}/${DB}.dump" "${DB}"
    done

    # 글로벌 객체 (역할, 테이블스페이스)
    pg_dumpall -h localhost -U backup_user --globals-only \
        --file="${BACKUP_DIR}/globals.sql"

    # 암호화 및 원격 전송
    tar czf - "${BACKUP_DIR}" | \
        openssl enc -aes-256-cbc -salt -pass env:BACKUP_ENCRYPTION_KEY | \
        aws s3 cp - "s3://epeople2-backup/logical/${TIMESTAMP}.tar.gz.enc"

    log "Logical backup completed"
    alert "✅ Monthly logical backup completed"
}

# ── 5. Redis 백업 ──
redis_backup() {
    log "Starting Redis backup..."
    redis-cli -a "${REDIS_PASSWORD}" BGSAVE
    sleep 5  # BGSAVE 완료 대기

    # RDB 파일 복사
    cp /var/lib/redis/dump.rdb "/backup/redis/dump_${TIMESTAMP}.rdb"

    # 원격 전송
    aws s3 cp "/backup/redis/dump_${TIMESTAMP}.rdb" \
        "s3://epeople2-backup/redis/dump_${TIMESTAMP}.rdb"

    # 7일 이상 로컬 백업 삭제
    find /backup/redis -name "dump_*.rdb" -mtime +7 -delete

    log "Redis backup completed"
}

# ── 6. 백업 검증 ──
verify_backup() {
    log "Verifying backup integrity..."
    pgbackrest --stanza=epeople2 check
    pgbackrest --stanza=epeople2 info
    log "Backup verification passed"
}

# ── 실행 분기 ──
case "${1:-incr}" in
    full)    full_backup && verify_backup ;;
    diff)    diff_backup && verify_backup ;;
    incr)    incr_backup ;;
    logical) logical_backup ;;
    redis)   redis_backup ;;
    verify)  verify_backup ;;
    *)       echo "Usage: $0 {full|diff|incr|logical|redis|verify}" ;;
esac
```

### 11.5 cron 스케줄

```cron
# ============================================================
# /etc/cron.d/epeople2-backup
# ============================================================

# 증분 백업: 매시간
0 * * * *   backup  /opt/epeople2/scripts/backup.sh incr >> /var/log/epeople2/backup_cron.log 2>&1

# 차등 백업: 매일 02:00 UTC
0 2 * * *   backup  /opt/epeople2/scripts/backup.sh diff >> /var/log/epeople2/backup_cron.log 2>&1

# 전체 백업: 매주 일요일 03:00 UTC
0 3 * * 0   backup  /opt/epeople2/scripts/backup.sh full >> /var/log/epeople2/backup_cron.log 2>&1

# 논리 백업: 매월 1일 04:00 UTC
0 4 1 * *   backup  /opt/epeople2/scripts/backup.sh logical >> /var/log/epeople2/backup_cron.log 2>&1

# Redis 백업: 매시간 30분
30 * * * *  backup  /opt/epeople2/scripts/backup.sh redis >> /var/log/epeople2/backup_cron.log 2>&1

# 백업 검증: 매일 06:00 UTC
0 6 * * *   backup  /opt/epeople2/scripts/backup.sh verify >> /var/log/epeople2/backup_cron.log 2>&1

# pg_partman 유지보수: 매일 00:30 UTC
30 0 * * *  postgres psql -d epeople2_complaint -c "SELECT partman.run_maintenance();" >> /var/log/epeople2/partman.log 2>&1

# MV 갱신은 pg_cron으로 관리 (Section 9.4 참조)
```

### 11.6 PITR (Point-In-Time Recovery)

```bash
#!/bin/bash
# ============================================================
# /opt/epeople2/scripts/pitr_restore.sh
# 시점 복구 (PITR) 스크립트
# ============================================================

set -euo pipefail

# 복구 대상 시점 (예: 장애 발생 1분 전)
TARGET_TIME="${1:?Usage: $0 'YYYY-MM-DD HH:MM:SS'}"

echo "=== e-People II PITR 복구 ==="
echo "Target time: ${TARGET_TIME}"
echo ""
echo "WARNING: 이 작업은 현재 데이터베이스를 덮어씁니다!"
read -p "계속하시겠습니까? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "취소되었습니다."
    exit 1
fi

# 1. 현재 서비스 중지
echo "[1/6] Stopping PostgreSQL service..."
systemctl stop postgresql

# 2. 현재 데이터 디렉토리 백업 (안전장치)
echo "[2/6] Backing up current data directory..."
BACKUP_DIR="/var/lib/postgresql/15/main_before_pitr_$(date +%Y%m%d_%H%M%S)"
cp -a /var/lib/postgresql/15/main "$BACKUP_DIR"

# 3. pgBackRest PITR 복구 실행
echo "[3/6] Running pgBackRest restore to target time..."
pgbackrest --stanza=epeople2 \
    --delta \
    --type=time \
    --target="${TARGET_TIME}" \
    --target-action=promote \
    restore

# 4. PostgreSQL 시작
echo "[4/6] Starting PostgreSQL..."
systemctl start postgresql

# 5. 복구 상태 확인
echo "[5/6] Verifying recovery..."
sleep 10
psql -U postgres -c "SELECT pg_is_in_recovery();"
psql -U postgres -c "SELECT NOW(), txid_current();"

# 6. 각 데이터베이스 무결성 검사
echo "[6/6] Running integrity checks..."
for DB in epeople2_auth epeople2_complaint epeople2_anticorruption \
          epeople2_eparticipation epeople2_statistics epeople2_document \
          epeople2_notification epeople2_helpdesk epeople2_admin; do
    echo "  Checking ${DB}..."
    psql -U postgres -d "$DB" -c "SELECT count(*) FROM pg_stat_user_tables;" > /dev/null
    echo "  ${DB}: OK"
done

echo ""
echo "=== PITR 복구 완료 ==="
echo "Target time: ${TARGET_TIME}"
echo "이전 데이터: ${BACKUP_DIR}"
```

### 11.7 복구 시나리오별 절차

| 시나리오 | 복구 방식 | 예상 RTO | 절차 |
|----------|-----------|---------|------|
| **테이블 삭제 실수** | PITR | 1시간 | 1) 장애 시점 확인 → 2) PITR 실행 → 3) 대상 테이블 복원 |
| **데이터 오염** | PITR | 2시간 | 1) 오염 시점 확인 → 2) 별도 인스턴스에 PITR → 3) 정상 데이터 추출 → 4) 운영 DB 반영 |
| **디스크 장애** | 전체 복구 | 3시간 | 1) 신규 인스턴스 → 2) pgBackRest full restore → 3) WAL replay |
| **Primary 서버 장애** | Failover | 30분 | 1) Replica 자동 승격 (Patroni) → 2) 연결 전환 → 3) 신규 Replica 구성 |
| **Redis 데이터 손실** | RDB 복원 | 10분 | 1) Redis 중지 → 2) dump.rdb 복사 → 3) Redis 시작 |
| **리전 장애** | 원격 복구 | 4시간 | 1) 원격 S3 백업 확인 → 2) 다른 리전에 복구 → 3) DNS 전환 |

### 11.8 3-2-1 백업 규칙 준수

```
┌─────────────────────────────────────────────────────────────┐
│                   3-2-1 백업 규칙                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [3] 최소 3개 사본                                          │
│      ├── ① Primary DB (운영 데이터)                         │
│      ├── ② 로컬 백업 (/backup/pgbackrest)                  │
│      └── ③ 원격 백업 (S3 OBS)                              │
│                                                             │
│  [2] 최소 2종류 매체                                        │
│      ├── ① NVMe SSD (운영 + 로컬 백업)                     │
│      └── ② 오브젝트 스토리지 (원격 백업)                     │
│                                                             │
│  [1] 최소 1개 오프사이트                                    │
│      └── ① S3 호환 OBS (다른 AZ)                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 12. 모니터링

### 12.1 모니터링 아키텍처

```
┌──────────────────────────────────────────────────────────────────────┐
│                      모니터링 아키텍처                                │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐    ┌──────────────┐    ┌────────────┐                  │
│  │PostgreSQL │───▶│postgres_     │───▶│ Prometheus │──▶ Grafana      │
│  │  Primary  │    │  exporter    │    │  (15s 간격)│   Dashboard     │
│  └──────────┘    └──────────────┘    └────────────┘                  │
│                                            │                         │
│  ┌──────────┐    ┌──────────────┐          │       ┌────────────┐   │
│  │PostgreSQL │───▶│postgres_     │──────────┘  ┌──▶│ AlertManager│   │
│  │  Replica  │    │  exporter    │             │    │  → Slack    │   │
│  └──────────┘    └──────────────┘             │    │  → Email    │   │
│                                               │    │  → PagerDuty│   │
│  ┌──────────┐    ┌──────────────┐             │    └────────────┘   │
│  │  Redis    │───▶│redis_exporter│─────────────┘                     │
│  │  Cluster  │    └──────────────┘                                   │
│  └──────────┘                                                        │
│                                                                      │
│  ┌──────────┐    ┌──────────────┐                                    │
│  │ PgBouncer│───▶│pgbouncer_    │──────────────────▶ Prometheus      │
│  │          │    │  exporter    │                                     │
│  └──────────┘    └──────────────┘                                    │
│                                                                      │
│  ┌──────────┐                          ┌────────────┐               │
│  │Application│─── Loki (로그) ────────▶│  Grafana   │               │
│  │  Logs    │                          │  Log Panel │               │
│  └──────────┘                          └────────────┘               │
└──────────────────────────────────────────────────────────────────────┘
```

### 12.2 PostgreSQL 모니터링 메트릭

#### 12.2.1 핵심 메트릭 및 임계값

| 카테고리 | 메트릭 | Warning | Critical | 확인 쿼리/방법 |
|----------|--------|---------|----------|--------------|
| **연결** | 활성 연결 수 | > 200 | > 270 | `pg_stat_activity` |
| **연결** | 유휴 in-transaction | > 10 | > 20 | `state = 'idle in transaction'` |
| **복제** | Replication lag (초) | > 5 | > 30 | `pg_stat_replication` |
| **복제** | WAL 송신 지연 (바이트) | > 100MB | > 500MB | `sent_lsn - replay_lsn` |
| **트랜잭션** | 초당 트랜잭션 (TPS) | < 10 | < 5 | `pg_stat_database` |
| **트랜잭션** | 트랜잭션 Rollback 비율 | > 5% | > 10% | `xact_rollback / xact_commit` |
| **락** | 대기 중인 락 | > 5 | > 10 | `pg_locks` |
| **락** | 데드락 발생 | > 0 | > 3/시간 | `deadlocks` in `pg_stat_database` |
| **캐시** | Buffer hit ratio | < 95% | < 90% | `blks_hit / (blks_hit + blks_read)` |
| **디스크** | 테이블스페이스 사용률 | > 70% | > 85% | `pg_tablespace_size()` |
| **디스크** | WAL 디스크 사용량 | > 10GB | > 20GB | `pg_wal_lsn_diff()` |
| **Vacuum** | Dead tuple 비율 | > 10% | > 20% | `pg_stat_user_tables` |
| **Vacuum** | 마지막 autovacuum | > 1일 | > 3일 | `last_autovacuum` |
| **슬로우 쿼리** | 500ms+ 쿼리 수 | > 10/분 | > 50/분 | `pg_stat_statements` |
| **슬로우 쿼리** | 평균 쿼리 시간 | > 100ms | > 500ms | `mean_exec_time` |
| **Bloat** | 테이블 bloat | > 30% | > 50% | `pgstattuple` |
| **인덱스** | 미사용 인덱스 크기 | > 1GB | > 5GB | `pg_stat_user_indexes` |

#### 12.2.2 모니터링 쿼리

```sql
-- ============================================================
-- 1. 활성 연결 현황
-- ============================================================
SELECT
    datname                     AS database,
    state,
    COUNT(*)                    AS connection_count,
    MAX(NOW() - state_change)   AS max_duration
FROM pg_stat_activity
WHERE pid != pg_backend_pid()
GROUP BY datname, state
ORDER BY datname, state;

-- ============================================================
-- 2. 슬로우 쿼리 TOP 10 (pg_stat_statements)
-- ============================================================
SELECT
    LEFT(query, 100)            AS query_preview,
    calls,
    ROUND(total_exec_time::numeric / 1000, 2)
                                AS total_time_sec,
    ROUND(mean_exec_time::numeric, 2)
                                AS avg_time_ms,
    ROUND(stddev_exec_time::numeric, 2)
                                AS stddev_ms,
    rows
FROM pg_stat_statements
WHERE dbid = (SELECT oid FROM pg_database WHERE datname = 'epeople2_complaint')
ORDER BY mean_exec_time DESC
LIMIT 10;

-- ============================================================
-- 3. 테이블별 Dead Tuple 현황
-- ============================================================
SELECT
    schemaname || '.' || relname AS table_name,
    n_live_tup                   AS live_tuples,
    n_dead_tup                   AS dead_tuples,
    ROUND(
        n_dead_tup::numeric /
        NULLIF(n_live_tup + n_dead_tup, 0) * 100, 1
    )                            AS dead_pct,
    last_autovacuum,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC
LIMIT 20;

-- ============================================================
-- 4. 인덱스 사용률 (미사용 인덱스 식별)
-- ============================================================
SELECT
    schemaname || '.' || relname AS table_name,
    indexrelname                  AS index_name,
    idx_scan                     AS index_scans,
    pg_size_pretty(pg_relation_size(indexrelid))
                                 AS index_size,
    pg_size_pretty(pg_relation_size(relid))
                                 AS table_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND pg_relation_size(indexrelid) > 1024 * 1024  -- 1MB 이상
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================================
-- 5. 복제 지연 확인
-- ============================================================
SELECT
    client_addr,
    state,
    sent_lsn,
    write_lsn,
    flush_lsn,
    replay_lsn,
    pg_wal_lsn_diff(sent_lsn, replay_lsn) AS replay_lag_bytes,
    ROUND(pg_wal_lsn_diff(sent_lsn, replay_lsn)::numeric / 1024 / 1024, 2)
                                            AS replay_lag_mb
FROM pg_stat_replication;

-- ============================================================
-- 6. 테이블/인덱스 크기 TOP 20
-- ============================================================
SELECT
    schemaname || '.' || tablename AS table_name,
    pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename))
                                   AS total_size,
    pg_size_pretty(pg_relation_size(schemaname || '.' || tablename))
                                   AS table_size,
    pg_size_pretty(
        pg_total_relation_size(schemaname || '.' || tablename) -
        pg_relation_size(schemaname || '.' || tablename)
    )                              AS index_size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC
LIMIT 20;

-- ============================================================
-- 7. 락 대기 현황
-- ============================================================
SELECT
    blocked_locks.pid          AS blocked_pid,
    blocked_activity.query     AS blocked_query,
    blocking_locks.pid         AS blocking_pid,
    blocking_activity.query    AS blocking_query,
    NOW() - blocked_activity.query_start AS wait_duration
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity
    ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks
    ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity
    ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- ============================================================
-- 8. 버퍼 캐시 히트율
-- ============================================================
SELECT
    datname,
    ROUND(
        blks_hit::numeric /
        NULLIF(blks_hit + blks_read, 0) * 100, 2
    ) AS cache_hit_ratio
FROM pg_stat_database
WHERE datname LIKE 'epeople2_%'
ORDER BY datname;
```

### 12.3 Redis 모니터링

| 메트릭 | Warning | Critical | 확인 명령 |
|--------|---------|----------|----------|
| 메모리 사용량 | > 12GB (75%) | > 14.4GB (90%) | `INFO memory` |
| 연결 수 | > 8,000 | > 9,500 | `INFO clients` |
| 초당 명령 수 (OPS) | > 50,000 | > 80,000 | `INFO stats` |
| 키 히트율 | < 90% | < 80% | `keyspace_hits / (hits + misses)` |
| 키 제거 (eviction) | > 0 | > 100/분 | `evicted_keys` |
| 복제 지연 | > 1MB | > 10MB | `INFO replication` |
| 슬로우 로그 | > 10/분 | > 50/분 | `SLOWLOG GET` |
| RDB 마지막 저장 | > 2시간 | > 6시간 | `rdb_last_save_time` |
| AOF 재작성 진행 | 진행 중 | - | `aof_rewrite_in_progress` |

### 12.4 PgBouncer 모니터링

```sql
-- PgBouncer 관리 콘솔 (포트 6432)

-- 풀별 연결 현황
SHOW POOLS;
-- cl_active: 활성 클라이언트, cl_waiting: 대기 중 클라이언트
-- sv_active: 활성 서버, sv_idle: 유휴 서버

-- 데이터베이스별 통계
SHOW STATS;
-- total_xact_count: 총 트랜잭션 수
-- total_query_count: 총 쿼리 수
-- avg_xact_time: 평균 트랜잭션 시간

-- 연결 상세
SHOW SERVERS;
SHOW CLIENTS;
```

| PgBouncer 메트릭 | Warning | Critical |
|-----------------|---------|----------|
| cl_waiting (대기 클라이언트) | > 10 | > 50 |
| sv_active (활성 서버 연결) | > 80% pool | > 95% pool |
| avg_query_time | > 100ms | > 500ms |

### 12.5 Alerting 규칙 (Prometheus AlertManager)

```yaml
# ============================================================
# /etc/prometheus/rules/epeople2_alerts.yml
# ============================================================

groups:
  - name: epeople2_postgresql
    rules:
      # ── 연결 수 경고 ──
      - alert: PostgreSQLHighConnections
        expr: pg_stat_activity_count > 200
        for: 5m
        labels:
          severity: warning
          service: database
        annotations:
          summary: "PostgreSQL 연결 수 높음 ({{ $value }})"
          description: "5분간 연속 200개 이상 연결. 확인 필요."

      - alert: PostgreSQLCriticalConnections
        expr: pg_stat_activity_count > 270
        for: 2m
        labels:
          severity: critical
          service: database
        annotations:
          summary: "PostgreSQL 연결 수 위험 ({{ $value }}/300)"
          description: "max_connections(300)에 근접. 즉시 조치 필요."

      # ── 복제 지연 ──
      - alert: PostgreSQLReplicationLag
        expr: pg_replication_lag_seconds > 30
        for: 3m
        labels:
          severity: critical
          service: database
        annotations:
          summary: "복제 지연 {{ $value }}초"
          description: "Read Replica 복제 지연이 30초 초과. 통계 조회 데이터 정합성 영향."

      # ── 슬로우 쿼리 ──
      - alert: PostgreSQLSlowQueries
        expr: rate(pg_stat_statements_mean_exec_time_ms{datname=~"epeople2_.*"}[5m]) > 500
        for: 5m
        labels:
          severity: warning
          service: database
        annotations:
          summary: "평균 쿼리 시간 500ms 초과"
          description: "{{ $labels.datname }} 데이터베이스 쿼리 성능 저하."

      # ── Dead Tuple ──
      - alert: PostgreSQLHighDeadTuples
        expr: pg_stat_user_tables_n_dead_tup / (pg_stat_user_tables_n_live_tup + 1) > 0.2
        for: 30m
        labels:
          severity: warning
          service: database
        annotations:
          summary: "Dead tuple 비율 20% 초과 ({{ $labels.relname }})"
          description: "VACUUM 실행 확인 필요."

      # ── 디스크 사용률 ──
      - alert: PostgreSQLDiskUsageHigh
        expr: (pg_database_size_bytes / pg_tablespace_size_bytes) * 100 > 85
        for: 10m
        labels:
          severity: critical
          service: database
        annotations:
          summary: "디스크 사용률 85% 초과"
          description: "디스크 확장 또는 데이터 정리 필요."

      # ── 버퍼 캐시 히트율 ──
      - alert: PostgreSQLLowCacheHitRatio
        expr: pg_stat_database_blks_hit / (pg_stat_database_blks_hit + pg_stat_database_blks_read + 1) < 0.90
        for: 15m
        labels:
          severity: warning
          service: database
        annotations:
          summary: "캐시 히트율 90% 미만"
          description: "shared_buffers 확장 또는 쿼리 최적화 필요."

  - name: epeople2_redis
    rules:
      # ── Redis 메모리 ──
      - alert: RedisHighMemory
        expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.90
        for: 5m
        labels:
          severity: critical
          service: cache
        annotations:
          summary: "Redis 메모리 90% 초과"
          description: "키 제거(eviction) 발생 가능. 메모리 확장 또는 TTL 조정 필요."

      # ── Redis 키 제거 ──
      - alert: RedisEvictions
        expr: rate(redis_evicted_keys_total[5m]) > 0
        for: 5m
        labels:
          severity: warning
          service: cache
        annotations:
          summary: "Redis 키 제거 발생"
          description: "메모리 부족으로 키가 제거되고 있음."

      # ── Redis 연결 ──
      - alert: RedisHighConnections
        expr: redis_connected_clients > 9500
        for: 2m
        labels:
          severity: critical
          service: cache
        annotations:
          summary: "Redis 연결 수 위험 ({{ $value }}/10000)"

  - name: epeople2_pgbouncer
    rules:
      # ── PgBouncer 대기 클라이언트 ──
      - alert: PgBouncerHighWaiting
        expr: pgbouncer_pools_client_waiting > 50
        for: 3m
        labels:
          severity: critical
          service: connection_pool
        annotations:
          summary: "PgBouncer 대기 클라이언트 50 초과"
          description: "풀 크기 증가 또는 쿼리 최적화 필요."
```

### 12.6 Grafana 대시보드 구성

| 대시보드 | 패널 | 갱신 주기 |
|----------|------|-----------|
| **PostgreSQL Overview** | 연결 현황, TPS, 캐시 히트율, 디스크 사용량, 복제 지연 | 15초 |
| **Query Performance** | 슬로우 쿼리 TOP 10, 평균 응답시간, 쿼리 분포 | 30초 |
| **Table Health** | Dead tuple, Bloat, 테이블 크기, 인덱스 사용률 | 1분 |
| **Replication** | WAL 생성량, 복제 지연(초/바이트), Replica 상태 | 15초 |
| **Redis Overview** | 메모리 사용량, OPS, 히트율, 키 수, 연결 수 | 15초 |
| **PgBouncer** | 풀 사용률, 대기 큐, 평균 쿼리 시간, 연결 분포 | 15초 |
| **Backup Status** | 마지막 백업 시간, 백업 크기, 성공/실패, WAL 아카이브 상태 | 5분 |
| **e-People II Business** | 일일 민원 접수, 처리 완료, 기한 초과, SLA 준수율 | 1분 |

### 12.7 로그 관리

```yaml
# ============================================================
# PostgreSQL 로그 → Loki 수집 (Promtail 설정)
# /etc/promtail/config.yml
# ============================================================

server:
  http_listen_port: 9080

positions:
  filename: /var/lib/promtail/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: postgresql
    static_configs:
      - targets:
          - localhost
        labels:
          job: postgresql
          service: epeople2
          __path__: /var/log/postgresql/postgresql-15-main.log

    pipeline_stages:
      # 슬로우 쿼리 라벨링
      - match:
          selector: '{job="postgresql"}'
          stages:
            - regex:
                expression: 'duration: (?P<duration>[0-9.]+) ms'
            - labels:
                duration:
            - metrics:
                query_duration:
                  type: Histogram
                  description: "PostgreSQL query duration"
                  source: duration
                  config:
                    buckets: [10, 50, 100, 250, 500, 1000, 5000]

  - job_name: pgbouncer
    static_configs:
      - targets:
          - localhost
        labels:
          job: pgbouncer
          service: epeople2
          __path__: /var/log/pgbouncer/pgbouncer.log

  - job_name: redis
    static_configs:
      - targets:
          - localhost
        labels:
          job: redis
          service: epeople2
          __path__: /var/log/redis/redis-server.log
```

### 12.8 헬스체크 엔드포인트

```python
# ============================================================
# 애플리케이션 헬스체크 API
# GET /api/health
# ============================================================

from fastapi import FastAPI, Response
from datetime import datetime
import asyncpg
import redis

app = FastAPI()

@app.get("/api/health")
async def health_check():
    """종합 헬스체크"""
    checks = {}
    overall_status = "healthy"

    # 1. PostgreSQL Primary 연결 확인
    try:
        conn = await asyncpg.connect(dsn=PG_PRIMARY_DSN)
        result = await conn.fetchval("SELECT 1")
        await conn.close()
        checks["postgresql_primary"] = {"status": "healthy", "latency_ms": 0}
    except Exception as e:
        checks["postgresql_primary"] = {"status": "unhealthy", "error": str(e)}
        overall_status = "unhealthy"

    # 2. PostgreSQL Replica 연결 확인
    try:
        conn = await asyncpg.connect(dsn=PG_REPLICA_DSN)
        result = await conn.fetchval("SELECT 1")
        await conn.close()
        checks["postgresql_replica"] = {"status": "healthy"}
    except Exception as e:
        checks["postgresql_replica"] = {"status": "degraded", "error": str(e)}
        if overall_status == "healthy":
            overall_status = "degraded"

    # 3. Redis 연결 확인
    try:
        r = redis.Redis(host=REDIS_HOST, port=6379)
        r.ping()
        checks["redis"] = {"status": "healthy"}
    except Exception as e:
        checks["redis"] = {"status": "unhealthy", "error": str(e)}
        overall_status = "unhealthy"

    # 4. PgBouncer 연결 확인
    try:
        conn = await asyncpg.connect(dsn=PGBOUNCER_DSN)
        await conn.close()
        checks["pgbouncer"] = {"status": "healthy"}
    except Exception as e:
        checks["pgbouncer"] = {"status": "unhealthy", "error": str(e)}
        overall_status = "unhealthy"

    status_code = 200 if overall_status == "healthy" else \
                  207 if overall_status == "degraded" else 503

    return Response(
        content={
            "status": overall_status,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "version": "1.0.0",
            "checks": checks
        },
        status_code=status_code
    )
```

---

## 13. 부록

### 13.1 테이블 요약 매트릭스

#### 13.1.1 데이터베이스별 테이블 수 및 예상 크기

| 데이터베이스 | 테이블 수 | ENUM 수 | 트리거 수 | 예상 1년 크기 | 비고 |
|-------------|-----------|---------|-----------|-------------|------|
| `epeople2_auth` | 8 | 2 | 2 | 500 MB | 사용자/세션/인증 |
| `epeople2_complaint` | 12 | 4 | 4 | 5 GB | 민원 전체 (최대) |
| `epeople2_anticorruption` | 5 | 3 | 1 | 1 GB | 부패신고 (별도 분리) |
| `epeople2_eparticipation` | 5 | 2 | 1 | 800 MB | 국민제안/공감 |
| `epeople2_statistics` | 8 | 2 | 0 | 2 GB | 통계/리포트 |
| `epeople2_document` | 8 | 3 | 0 | 3 GB | 문서/첨부파일 메타 |
| `epeople2_notification` | 5 | 3 | 0 | 1.5 GB | 알림/SMS/이메일 |
| `epeople2_helpdesk` | 9 | 3 | 0 | 1 GB | 헬프데스크/CTI |
| `epeople2_admin` | 7 | 1 | 0 | 200 MB | 기관/설정/공통코드 |
| **합계** | **67** | **23** | **8** | **~15 GB** | |

#### 13.1.2 전체 테이블 목록

| # | 데이터베이스 | 테이블명 | 설명 | 파티셔닝 | 예상 연간 행 수 |
|---|-------------|----------|------|----------|---------------|
| 1 | auth | `users` | 사용자 마스터 | - | 10,000 |
| 2 | auth | `user_roles` | 사용자-역할 매핑 | - | 10,000 |
| 3 | auth | `user_sessions` | 로그인 세션 | - | 100,000 |
| 4 | auth | `login_attempts` | 로그인 시도 이력 | - | 50,000 |
| 5 | auth | `pki_certificates` | PKI 인증서 | - | 1,000 |
| 6 | auth | `anonymous_tokens` | 익명 신고 토큰 | - | 5,000 |
| 7 | auth | `substitute_configs` | 대리인 설정 (G-09) | - | 500 |
| 8 | auth | `audit_log` | 인증 감사 로그 | 월별 | 200,000 |
| 9 | complaint | `complaints` | 민원 마스터 | 연도별 | 50,000 |
| 10 | complaint | `complaint_histories` | 처리 이력 | 연도별 | 200,000 |
| 11 | complaint | `complaint_attachments` | 민원 첨부파일 | - | 100,000 |
| 12 | complaint | `complaint_categories` | 3단계 분류체계 | - | 500 (마스터) |
| 13 | complaint | `complaint_transfers` | 이관 이력 (G-02) | - | 10,000 |
| 14 | complaint | `joint_processes` | 공동 처리 (G-03) | - | 2,000 |
| 15 | complaint | `joint_process_agencies` | 공동 처리 참여기관 | - | 5,000 |
| 16 | complaint | `deadline_extensions` | 기한 연장 (G-04) | - | 5,000 |
| 17 | complaint | `satisfaction_scores` | 만족도 평가 | - | 30,000 |
| 18 | complaint | `similar_complaints` | 유사 민원 (G-07) | - | 20,000 |
| 19 | complaint | `answer_templates` | 답변 템플릿 (G-08) | - | 200 |
| 20 | complaint | `group_complaints` | 집단 민원 (G-12) | - | 1,000 |
| 21 | anticorruption | `corruption_reports` | 부패신고 마스터 | - | 5,000 |
| 22 | anticorruption | `corruption_report_histories` | 조사 이력 | - | 20,000 |
| 23 | anticorruption | `corruption_report_attachments` | 신고 첨부파일 | - | 10,000 |
| 24 | anticorruption | `investigation_notes` | 수사 메모 | - | 10,000 |
| 25 | anticorruption | `whistleblower_protection` | 공익신고자 보호 | - | 1,000 |
| 26 | eparticipation | `proposals` | 국민제안 마스터 | - | 10,000 |
| 27 | eparticipation | `proposal_reviews` | 제안 심사 | - | 10,000 |
| 28 | eparticipation | `proposal_likes` | 제안 공감 (G-05) | - | 50,000 |
| 29 | eparticipation | `implementation_updates` | 채택 제안 이행현황 | - | 2,000 |
| 30 | eparticipation | `proposal_attachments` | 제안 첨부파일 | - | 20,000 |
| 31 | statistics | `daily_statistics` | 일별 통계 | 연도별 | 365 |
| 32 | statistics | `monthly_statistics` | 월별 통계 | 연도별 | 12 |
| 33 | statistics | `agency_performance` | 기관 성과 (G-11) | - | 876 (73x12) |
| 34 | statistics | `repeated_complaints_analysis` | 반복 민원 (G-06) | - | 1,000 |
| 35 | statistics | `overdue_complaints_analysis` | 기한 초과 분석 | - | 5,000 |
| 36 | statistics | `report_templates` | 리포트 템플릿 | - | 20 |
| 37 | statistics | `generated_reports` | 생성된 리포트 | - | 1,000 |
| 38 | statistics | `export_logs` | 내보내기 로그 | - | 5,000 |
| 39 | document | `documents` | 문서 마스터 | - | 200,000 |
| 40 | document | `document_versions` | 문서 버전 이력 | - | 300,000 |
| 41 | document | `document_access_controls` | 문서 접근 권한 | - | 500,000 |
| 42 | document | `access_attempt_logs` | 접근 시도 로그 | - | 1,000,000 |
| 43 | document | `distribution_records` | 문서 배포 기록 | - | 100,000 |
| 44 | document | `integrity_verifications` | 무결성 검증 | - | 200,000 |
| 45 | document | `watermark_configs` | 워터마크 설정 | - | 100 |
| 46 | document | `retention_policies` | 보존 정책 | - | 50 |
| 47 | notification | `notifications` | 알림 마스터 | 월별 | 200,000 |
| 48 | notification | `notification_preferences` | 알림 설정 | - | 10,000 |
| 49 | notification | `sms_log` | SMS 발송 로그 | 월별 | 100,000 |
| 50 | notification | `email_log` | 이메일 발송 로그 | 월별 | 100,000 |
| 51 | notification | `delivery_confirmations` | 전달확인 (G-10) | - | 50,000 |
| 52 | helpdesk | `helpdesk_tickets` | 상담 티켓 | - | 30,000 |
| 53 | helpdesk | `ticket_notes` | 상담 노트 | - | 60,000 |
| 54 | helpdesk | `citizen_profiles` | 시민 상담 프로필 | - | 10,000 |
| 55 | helpdesk | `agent_profiles` | 상담원 프로필 | - | 100 |
| 56 | helpdesk | `agent_performance` | 상담원 성과 | - | 1,200 |
| 57 | helpdesk | `cti_call_events` | CTI 통화 이벤트 | - | 50,000 |
| 58 | helpdesk | `faq_articles` | FAQ 문서 | - | 200 |
| 59 | helpdesk | `knowledge_base_articles` | 지식베이스 | - | 500 |
| 60 | helpdesk | `helpdesk_sla_configs` | 헬프데스크 SLA | - | 20 |
| 61 | admin | `agencies` | 기관 마스터 (계층) | - | 100 |
| 62 | admin | `sla_configs` | SLA 설정 | - | 10 |
| 63 | admin | `common_codes` | 공통 코드 | - | 500 |
| 64 | admin | `system_configs` | 시스템 설정 | - | 100 |
| 65 | admin | `standard_procedures` | 표준 처리 절차 | - | 50 |
| 66 | admin | `operation_manuals` | 운영 매뉴얼 (G-14) | - | 30 |
| 67 | admin | `data_migration_logs` | 마이그레이션 로그 | - | 10,000 |

### 13.2 컬럼 네이밍 규칙

| 규칙 | 접두사/접미사 | 예시 | 설명 |
|------|-------------|------|------|
| 기본키 | `id` | `id` | UUID v7 |
| 외래키 | `{테이블}_id` | `complaint_id`, `agency_id` | 참조 테이블명 + `_id` |
| 표시용 번호 | `display_number` | `CMP-2024-000001` | 연번 형식 표시 ID |
| 프랑스어 | `{필드}_fr` | `title_fr`, `name_fr` | 프랑스어 텍스트 |
| 아랍어 | `{필드}_ar` | `title_ar`, `name_ar` | 아랍어 텍스트 |
| 상태 | `status` | `status` | ENUM 타입 |
| 불리언 | `is_{형용사}` | `is_active`, `is_read` | true/false |
| 일시 | `{동사}_at` | `created_at`, `deleted_at` | TIMESTAMPTZ |
| 사용자 | `{동사}_by` | `created_by`, `updated_by` | UUID FK |
| 카운트 | `{대상}_count` | `transfer_count`, `like_count` | INTEGER |
| 점수 | `{대상}_score` | `satisfaction_score` | 1~5 또는 DECIMAL |
| 비율 | `{대상}_rate` | `completion_rate` | DECIMAL(5,2) |
| 일수 | `{대상}_days` | `processing_days`, `sla_days` | INTEGER |
| 금액 | `{대상}_amount` | - | DECIMAL(15,3) TND |
| JSON 데이터 | `{대상}_data` | `metadata`, `extra_data` | JSONB |
| 암호화 | `encrypted_{필드}` | `encrypted_citizen_id` | AES-256 암호화 |

### 13.3 데이터 타입 표준

| 용도 | PostgreSQL 타입 | 크기 | 비고 |
|------|----------------|------|------|
| 기본키 (PK) | `UUID` | 16B | `gen_random_uuid()` |
| 표시 번호 | `VARCHAR(20)` | 가변 | `CMP-2024-000001` 형식 |
| 짧은 코드 | `VARCHAR(10)` | 가변 | 상태, 유형 코드 |
| 이름 (프/아) | `VARCHAR(200)` | 가변 | 아랍어 고려 충분한 길이 |
| 제목 | `VARCHAR(500)` | 가변 | 제목, 요약 |
| 본문 | `TEXT` | 가변 | 제한 없는 텍스트 |
| 이메일 | `VARCHAR(255)` | 가변 | RFC 5321 준수 |
| 전화번호 | `VARCHAR(20)` | 가변 | 국제 형식 +216-XX-XXX-XXX |
| 주민번호 (CIN) | `VARCHAR(20)` | 가변 | 암호화 저장 |
| IP 주소 | `INET` | 가변 | IPv4/IPv6 |
| URL | `VARCHAR(2048)` | 가변 | RFC 2616 최대 길이 |
| 파일 경로 | `VARCHAR(1024)` | 가변 | S3 key 등 |
| 정수 카운트 | `INTEGER` | 4B | 이관 횟수, 공감 수 |
| 긴 카운트 | `BIGINT` | 8B | 시퀀스, 대량 카운터 |
| 비율/점수 | `DECIMAL(5,2)` | 가변 | 0.00 ~ 100.00 |
| 금액 (TND) | `DECIMAL(15,3)` | 가변 | 튀니지 디나르 (밀림 단위) |
| 불리언 | `BOOLEAN` | 1B | `DEFAULT false` |
| 일시 | `TIMESTAMPTZ` | 8B | `DEFAULT NOW()`, UTC 저장 |
| 날짜만 | `DATE` | 4B | 통계 날짜 키 |
| 시간만 | `TIME` | 8B | 근무시간 설정 |
| 기간 | `INTERVAL` | 16B | SLA 기간 |
| 열거형 | `ENUM (커스텀)` | 4B | `complaint_status` 등 |
| JSON 데이터 | `JSONB` | 가변 | 메타데이터, 유연한 속성 |
| 파일 내용 | `BYTEA` | 가변 | 암호화된 바이너리 (비권장, S3 사용) |
| 배열 | `TEXT[]` | 가변 | 태그, 키워드 |
| 위치 | `POINT` | 16B | 경도/위도 |
| 범위 | `TSTZRANGE` | 가변 | 유효 기간 |

### 13.4 ENUM 타입 전체 목록

| # | ENUM 이름 | 데이터베이스 | 값 목록 |
|---|----------|-------------|---------|
| 1 | `user_role` | auth | `citizen`, `brc_head`, `brc_officer`, `bcrc_admin`, `bcrc_officer`, `dggpc_admin`, `dggpc_officer`, `system_admin`, `helpdesk_agent` |
| 2 | `auth_provider` | auth | `local`, `pki`, `oauth2` |
| 3 | `complaint_type` | complaint | `grievance`, `proposal`, `inquiry`, `suggestion`, `report` |
| 4 | `complaint_status` | complaint | `received`, `assigned`, `processing`, `completed`, `closed`, `rejected`, `transferred` |
| 5 | `transfer_reason` | complaint | `wrong_agency`, `requires_expertise`, `jurisdiction_change`, `workload_balance` |
| 6 | `extension_status` | complaint | `requested`, `approved`, `rejected` |
| 7 | `corruption_report_type` | anticorruption | `bribery`, `embezzlement`, `abuse_of_power`, `conflict_of_interest`, `fraud`, `nepotism`, `other` |
| 8 | `corruption_report_status` | anticorruption | `received`, `preliminary_review`, `under_investigation`, `completed`, `closed`, `referred` |
| 9 | `reporter_type` | anticorruption | `named`, `anonymous`, `confidential` |
| 10 | `proposal_status` | eparticipation | `submitted`, `under_review`, `accepted`, `rejected`, `implementing`, `completed` |
| 11 | `proposal_category` | eparticipation | `policy`, `infrastructure`, `digital`, `environment`, `education`, `health`, `economy`, `culture`, `other` |
| 12 | `stat_scope` | statistics | `national`, `governorate`, `agency` |
| 13 | `report_format` | statistics | `pdf`, `excel`, `csv`, `json` |
| 14 | `document_type` | document | `complaint_attachment`, `report_attachment`, `proposal_attachment`, `response_document`, `internal_memo`, `policy_document` |
| 15 | `access_level` | document | `public`, `internal`, `confidential`, `restricted` |
| 16 | `verification_status` | document | `verified`, `failed`, `pending` |
| 17 | `notification_type` | notification | `status_change`, `assignment`, `deadline_warning`, `transfer`, `response`, `system_alert`, `sms`, `email` |
| 18 | `notification_channel` | notification | `in_app`, `sms`, `email`, `push` |
| 19 | `delivery_status` | notification | `pending`, `sent`, `delivered`, `failed`, `bounced` |
| 20 | `ticket_status` | helpdesk | `open`, `in_progress`, `waiting_response`, `resolved`, `closed` |
| 21 | `ticket_priority` | helpdesk | `low`, `medium`, `high`, `urgent` |
| 22 | `ticket_channel` | helpdesk | `phone`, `email`, `web`, `walk_in`, `chatbot` |
| 23 | `agency_level` | admin | `ministry`, `governorate`, `municipality`, `special` |

### 13.5 스토리지 용량 추정

#### 5년 운영 기준 (2024~2028)

| 구분 | 연간 증가량 | 5년 누적 | 인덱스 포함 | 백업 포함 |
|------|-----------|---------|------------|----------|
| **데이터** | 15 GB | 75 GB | 120 GB | 360 GB |
| **WAL** | 50 GB | - | - | 50 GB (7일 보존) |
| **백업 (로컬)** | - | - | - | 240 GB (30일) |
| **백업 (원격)** | - | - | - | 600 GB (24개월) |
| **Redis** | 0.2 GB | - | - | 2 GB |
| **합계** | | | | **~1.25 TB** |

#### 권장 스토리지 구성

```
┌─────────────────────────────────────────────────────────────┐
│                    스토리지 구성                              │
├────────────────┬──────────┬────────────┬────────────────────┤
│ 용도            │ 타입     │ 용량        │ RAID              │
├────────────────┼──────────┼────────────┼────────────────────┤
│ PostgreSQL Data │ NVMe SSD │ 500 GB     │ RAID 10           │
│ PostgreSQL WAL  │ NVMe SSD │ 100 GB     │ RAID 1 (별도 디스크)│
│ 로컬 백업       │ SAS HDD  │ 1 TB       │ RAID 5            │
│ Redis Data      │ NVMe SSD │ 50 GB      │ RAID 1            │
│ OS + App        │ SAS SSD  │ 100 GB     │ RAID 1            │
├────────────────┼──────────┼────────────┼────────────────────┤
│ 합계            │          │ ~1.75 TB   │                    │
└────────────────┴──────────┴────────────┴────────────────────┘
```

### 13.6 용어 사전 (Glossary)

| 약어/용어 | 정의 |
|----------|------|
| **BCRC** | Bureau Central des Relations avec le Citoyen — 튀니지 총리실 산하 중앙 시민관계국 |
| **BRC** | Bureau des Relations avec le Citoyen — 각 부처/기관 소속 시민관계실 |
| **DGGPC** | Direction Générale de la Gouvernance et de Prévention de la Corruption — 반부패청 |
| **INPDP** | Instance Nationale de Protection des Données Personnelles — 튀니지 개인정보보호원 |
| **CNI** | Centre National de l'Informatique — 국가정보화센터 |
| **CIN** | Carte d'Identité Nationale — 국민신분증 (8자리) |
| **TND** | Tunisian Dinar — 튀니지 디나르 (화폐, 밀림 단위) |
| **SLA** | Service Level Agreement — 서비스 수준 합의 (처리 기한) |
| **RLS** | Row-Level Security — 행 수준 보안 (PostgreSQL) |
| **PITR** | Point-In-Time Recovery — 시점 복구 |
| **WAL** | Write-Ahead Log — 선행 기록 로그 |
| **MV** | Materialized View — 구체화된 뷰 |
| **DDL** | Data Definition Language — 데이터 정의 언어 |
| **DML** | Data Manipulation Language — 데이터 조작 언어 |
| **ERD** | Entity Relationship Diagram — 개체 관계도 |
| **FK** | Foreign Key — 외래키 |
| **PK** | Primary Key — 기본키 |
| **UUID** | Universally Unique Identifier — 범용 고유 식별자 |
| **ICU** | International Components for Unicode — 유니코드 국제 구성요소 |
| **RTL** | Right-to-Left — 오른쪽에서 왼쪽 (아랍어 텍스트 방향) |
| **ODA** | Official Development Assistance — 공적 개발 원조 |
| **KOICA** | Korea International Cooperation Agency — 한국국제협력단 |
| **PMC** | Project Management Consulting — 프로젝트 관리 컨설팅 |
| **PC1** | Primary Contractor 1 — 1차 시스템 개발업체 |
| **DA** | Data Architect — 데이터 아키텍트 |
| **AA** | Application Architect — 애플리케이션 아키텍트 |
| **TA** | Technical Architect — 기술 아키텍트 |
| **AOF** | Append-Only File — Redis 영속성 메커니즘 |
| **RDB** | Redis Database — Redis 스냅샷 파일 |
| **LRU** | Least Recently Used — 최근 최소 사용 (캐시 교체 정책) |
| **CTI** | Computer Telephony Integration — 컴퓨터 전화 통합 |
| **OBS** | Object Block Storage — 오브젝트 블록 스토리지 |

### 13.7 갭 기능 ↔ 테이블 매핑

| Gap ID | 갭 기능명 | 관련 테이블 | 핵심 컬럼/트리거 |
|--------|----------|------------|-----------------|
| G-01 | 5개 민원 유형 분류 | `complaints` | `type` (ENUM: 5종), `complaint_categories` (3단계) |
| G-02 | 이관 남용 통제 | `complaint_transfers`, `complaints` | `transfer_count`, `trg_transfer_bcrc_report` (>=3 자동 보고) |
| G-03 | 공동 처리 | `joint_processes`, `joint_process_agencies` | `lead_agency_id`, `contributing_agency_id` |
| G-04 | 기한 연장 | `deadline_extensions`, `complaints` | `extension_status`, `trg_extension_auto_update` |
| G-05 | 국민제안 공감 | `proposal_likes`, `proposals` | `like_count`, `trg_proposal_like_count` |
| G-06 | 반복 민원 분석 | `repeated_complaints_analysis`, `mv_repeated_complaints` | `citizen_id`, `complaint_count >= 3` |
| G-07 | 유사 민원 검색 | `similar_complaints` | `similarity_score`, `matched_fields` (JSONB) |
| G-08 | 답변 템플릿 | `answer_templates` | `category_l1`, `template_body_fr/ar`, `usage_count` |
| G-09 | 대리인 설정 | `substitute_configs` | `delegator_id`, `substitute_id`, `valid_from/to` |
| G-10 | 전달확인 | `delivery_confirmations` | `confirmed_at`, `confirmation_method` |
| G-11 | 기관 성과 | `agency_performance`, `mv_agency_performance` | `completion_rate < 80%` 빨간 강조 |
| G-12 | 집단 민원 | `group_complaints` | `representative_complaint_id`, `member_count` |
| G-14 | 운영 매뉴얼 | `operation_manuals` | `manual_type`, `effective_date` |

### 13.8 설계 원칙 체크리스트

PC1 개발업체가 구현 시 아래 체크리스트를 확인하여 설계 원칙 준수 여부를 검증한다.

| # | 체크 항목 | 관련 원칙 | 확인 |
|---|----------|----------|------|
| 1 | 민원 DB와 부패신고 DB가 완전히 분리되어 있는가? | DP-01 | [ ] |
| 2 | 모든 텍스트 컬럼에 `_fr`, `_ar` 접미사가 있는가? | DP-02 | [ ] |
| 3 | 민원 ID가 `CMP-YYYY-NNNNNN` 형식인가? | DP-03 | [ ] |
| 4 | 부패신고 ID가 `RPT-YYYY-NNNNNN` 형식인가? | DP-03 | [ ] |
| 5 | 모든 일시 컬럼이 `TIMESTAMPTZ`이고 UTC 기준인가? | DP-04 | [ ] |
| 6 | 서비스별 별도 데이터베이스를 사용하는가? | DP-05 | [ ] |
| 7 | `citizen_id`, `phone`, `email`이 AES-256-GCM 암호화되는가? | DP-06 | [ ] |
| 8 | 모든 테이블에 `created_at`, `updated_at`, `created_by`, `updated_by`가 있는가? | 공통 | [ ] |
| 9 | 삭제 시 `deleted_at` 소프트 삭제를 사용하는가? | 공통 | [ ] |
| 10 | PK가 UUID v7인가? | 공통 | [ ] |
| 11 | 인덱스에 `WHERE deleted_at IS NULL` 부분 인덱스를 사용하는가? | QO-04 | [ ] |
| 12 | RLS 정책이 기관별 데이터 격리를 보장하는가? | 보안 | [ ] |
| 13 | 이관 3회 이상 시 BCRC 자동 보고 트리거가 동작하는가? | G-02 | [ ] |
| 14 | 기한 연장 승인 시 deadline 자동 갱신 트리거가 동작하는가? | G-04 | [ ] |
| 15 | 제안 공감 시 `like_count` 자동 갱신 트리거가 동작하는가? | G-05 | [ ] |
| 16 | 백업이 3-2-1 규칙을 준수하는가? | 백업 | [ ] |
| 17 | PITR이 1시간 RPO를 충족하는가? | 백업 | [ ] |
| 18 | 모든 모니터링 메트릭에 Warning/Critical 임계값이 설정되었는가? | 모니터링 | [ ] |
| 19 | Redis 캐시 키에 TTL이 설정되었는가 (무기한 키 금지)? | 캐시 | [ ] |
| 20 | INPDP 개인정보보호 요건이 준수되는가? | 보안 | [ ] |

### 13.9 변경 이력

| 버전 | 일자 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| v0.1 | 2024-06-01 | PMC DA | 초안 작성 (ERD, 핵심 테이블) |
| v0.5 | 2024-07-15 | PMC DA | DDL 전체 작성, 인덱스 설계 추가 |
| v0.8 | 2024-08-30 | PMC DA | 보안, 백업, 모니터링 추가 |
| v0.9 | 2024-09-15 | PMC DA/AA | Redis 캐시 설계, 성능 최적화 추가 |
| v1.0 | 2024-10-01 | PMC DA | 최종 검토, 부록 완성, 릴리스 |

---

*문서 버전: v1.0 | 상세 데이터베이스 설계서 | PMC DA 전문가 작성 | KOICA ODA Tunisia e-People II*
