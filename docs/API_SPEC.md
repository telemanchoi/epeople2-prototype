# API_SPEC.md — API 명세서

> e-People II 프로토타입 | MSW Mock API 구현 기준  
> PMC 응용시스템 설계 전문가 (AA) 작성

---

## 1. API 공통 규칙

### 1.1 Base URL

```
개발(Mock) : http://localhost:3000/api
스테이징   : https://staging.epeople2.gov.tn/api
운영       : https://epeople2.gov.tn/api
```

### 1.2 인증

모든 API(공개 API 제외)는 `Authorization` 헤더에 Bearer 토큰 필요.

```http
Authorization: Bearer <access_token>
```

| 엔드포인트 | 인증 필요 | 비고 |
|-----------|-----------|------|
| `POST /auth/login` | ❌ | 공개 |
| `POST /auth/anonymous-token` | ❌ | 공개 |
| `GET /citizen/*` | ✅ | CITIZEN 역할 |
| `GET /backoffice/*` | ✅ | BRC_OFFICER 이상 |
| `GET /admin/*` | ✅ | BCRC_ADMIN 이상 |

### 1.3 공통 응답 형식

```typescript
// 성공 (단건)
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-03-01T09:30:00Z"
}

// 성공 (목록)
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "perPage": 10,
    "total": 127,
    "totalPages": 13
  },
  "timestamp": "2024-03-01T09:30:00Z"
}

// 에러
{
  "success": false,
  "error": {
    "code": "COMPLAINT_NOT_FOUND",       // 에러 코드
    "messageKr": "해당 민원을 찾을 수 없습니다.",
    "messageAr": "لم يتم العثور على الشكوى",
    "messageFr": "Plainte introuvable."
  },
  "timestamp": "2024-03-01T09:30:00Z"
}
```

### 1.4 공통 에러 코드

| HTTP | 에러 코드 | 설명 |
|------|-----------|------|
| 400 | `VALIDATION_ERROR` | 입력값 유효성 검사 실패 |
| 401 | `UNAUTHORIZED` | 인증 토큰 없음 또는 만료 |
| 403 | `FORBIDDEN` | 권한 없음 |
| 404 | `NOT_FOUND` | 리소스 없음 |
| 409 | `CONFLICT` | 중복 데이터 |
| 422 | `TRANSFER_LIMIT_EXCEEDED` | 이관 횟수 초과 |
| 429 | `RATE_LIMIT` | 요청 횟수 초과 |
| 500 | `SERVER_ERROR` | 서버 내부 오류 |

### 1.5 공통 쿼리 파라미터 (목록 API)

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `page` | number | 1 | 페이지 번호 |
| `perPage` | number | 10 | 페이지당 건수 (max: 100) |
| `sortBy` | string | `createdAt` | 정렬 기준 필드 |
| `sortOrder` | `asc\|desc` | `desc` | 정렬 방향 |
| `lang` | `ar\|fr` | `fr` | 응답 언어 (다국어 필드) |

---

## 2. 인증 API (`/auth`)

### POST /auth/login
일반 ID/PW 로그인.

**Request Body**
```json
{
  "username": "officer@brc.tn",
  "password": "test1234"
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
    "expiresIn": 3600,
    "user": {
      "id": "USR-001",
      "name": "Ahmed Ben Ali",
      "nameAr": "أحمد بن علي",
      "role": "BRC_OFFICER",
      "agency": {
        "id": "BRC-ENV-TUN-001",
        "nameFr": "BRC - Ministère de l'Environnement"
      }
    }
  }
}
```

**Mock 동작**: `username`이 테스트 계정 목록에 있으면 200, 아니면 401.

---

### POST /auth/refresh
Access Token 갱신.

**Request Body**
```json
{ "refreshToken": "eyJhbGciOiJIUzI1NiJ9..." }
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...(new)",
    "expiresIn": 3600
  }
}
```

---

### POST /auth/logout
로그아웃 (서버 측 토큰 무효화).

**Response 200**: `{ "success": true }`

---

### POST /auth/anonymous-token
부패 신고용 익명 토큰 발급.

**Response 201**
```json
{
  "success": true,
  "data": {
    "token": "ANON-7f3a9b2c-4e1d-4a8f-b6c3-2d1e9f0a3b7c",
    "expiresAt": "2025-03-01T09:30:00Z",
    "notice": "이 토큰을 안전하게 보관하세요. 신고 상태 조회에 사용됩니다."
  }
}
```

---

### POST /auth/pki-callback
PKI(Tuntrust) 인증 완료 콜백 처리.

**Request Body**
```json
{
  "authCode": "PKI_AUTH_CODE_FROM_TUNTRUST",
  "provider": "mobile_id"
}
```

**Response 200**: 일반 로그인 응답과 동일.  
**Mock 동작**: `authCode`가 `TEST_PKI_CODE`이면 성공 처리.

---

## 3. 민원 API (`/complaints`)

### GET /complaints
민원 목록 조회. 역할에 따라 반환 범위가 다름.
- `CITIZEN`: 본인 접수 민원만
- `BRC_OFFICER`: 본인 배분 민원
- `BRC_MANAGER`: 소속 BRC 전체 민원
- `BCRC_ADMIN`: 전체 민원

**Query Parameters**

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `status` | `received\|assigned\|processing\|completed\|closed` | 상태 필터 |
| `type` | `grievance\|proposal\|inquiry\|suggestion\|report` | 유형 필터 |
| `agencyId` | string | 기관 ID 필터 (BCRC_ADMIN용) |
| `overdue` | boolean | 기한 초과 건만 조회 |
| `search` | string | 제목·민원번호 키워드 검색 |
| `dateFrom` | ISO date | 접수일 시작 |
| `dateTo` | ISO date | 접수일 종료 |

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "CMP-2024-000042",
      "type": "grievance",
      "titleFr": "Problème de raccordement d'eau potable",
      "titleAr": "مشكلة في توصيل مياه الشرب",
      "status": "processing",
      "categoryPath": {
        "l1": { "code": "01", "nameFr": "Environnement", "nameAr": "البيئة" },
        "l2": { "code": "0102", "nameFr": "Eau", "nameAr": "الماء" },
        "l3": { "code": "010201", "nameFr": "Eau potable", "nameAr": "مياه الشرب" }
      },
      "assignedAgency": {
        "id": "BRC-ENV-TUN-001",
        "nameFr": "BRC - Ministère de l'Environnement - Tunis",
        "nameAr": "مكتب العلاقات - وزارة البيئة"
      },
      "submittedAt": "2024-03-01T09:30:00Z",
      "deadline": "2024-04-30T23:59:59Z",
      "daysRemaining": 18,
      "transferCount": 1,
      "hasAttachments": true,
      "satisfactionScore": null
    }
  ],
  "pagination": { "page": 1, "perPage": 10, "total": 127, "totalPages": 13 }
}
```

---

### POST /complaints
민원 신청 (시민 전용).

**Request Body**
```json
{
  "type": "grievance",
  "categoryL1": "01",
  "categoryL2": "0102",
  "categoryL3": "010201",
  "titleAr": "مشكلة في توصيل مياه الشرب",
  "titleFr": "Problème de raccordement d'eau potable",
  "contentAr": "...",
  "contentFr": "...",
  "regionCode": "TUN-01",
  "incidentDate": "2024-02-28",
  "attachmentIds": ["ATT-001", "ATT-002"],
  "consentGiven": true
}
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "id": "CMP-2024-000128",
    "status": "received",
    "submittedAt": "2024-03-05T10:00:00Z",
    "deadline": "2024-05-04T23:59:59Z",
    "assignedAgency": {
      "id": "BRC-ENV-TUN-001",
      "nameFr": "BRC - Ministère de l'Environnement"
    },
    "message": {
      "fr": "Votre plainte a été enregistrée avec succès.",
      "ar": "تم تسجيل شكواكم بنجاح."
    }
  }
}
```

---

### GET /complaints/:id
민원 상세 조회.

**Response 200**
```json
{
  "success": true,
  "data": {
    "id": "CMP-2024-000042",
    "type": "grievance",
    "titleFr": "Problème de raccordement d'eau potable",
    "titleAr": "مشكلة في توصيل مياه الشرب",
    "contentFr": "Depuis 3 mois, l'eau potable dans notre quartier...",
    "contentAr": "منذ 3 أشهر، لا تصل المياه إلى حينا...",
    "status": "processing",
    "categoryPath": { ... },
    "regionCode": "TUN-01",
    "incidentDate": "2024-02-28",
    "assignedAgency": { ... },
    "assignedOfficer": {
      "id": "USR-042",
      "name": "Ahmed Ben Ali",
      "nameAr": "أحمد بن علي"
    },
    "submittedAt": "2024-03-01T09:30:00Z",
    "deadline": "2024-04-30T23:59:59Z",
    "daysRemaining": 18,
    "transferCount": 1,
    "attachments": [
      {
        "id": "ATT-001",
        "filename": "photo1.jpg",
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
        "toAgency": { "id": "BRC-MUN-001", "nameFr": "BRC - Mairie de Tunis" },
        "timestamp": "2024-03-01T14:00:00Z"
      },
      {
        "id": "HIST-003",
        "action": "transferred",
        "actionLabelFr": "Transférée",
        "actionLabelAr": "محوّلة",
        "fromAgency": { "id": "BRC-MUN-001", "nameFr": "BRC - Mairie de Tunis" },
        "toAgency": { "id": "BRC-ENV-TUN-001", "nameFr": "BRC - Ministère de l'Environnement" },
        "reasonFr": "Changement d'organisme compétent",
        "reasonAr": "تغيير الجهة المختصة",
        "timestamp": "2024-03-03T10:00:00Z"
      }
    ],
    "satisfactionScore": null,
    "answer": null
  }
}
```

---

### PATCH /complaints/:id/status
민원 상태 변경 (BRC_OFFICER 이상).

**Request Body**
```json
{
  "status": "completed",
  "answerFr": "Suite à notre intervention, le problème de raccordement a été résolu...",
  "answerAr": "بعد تدخلنا، تم حل مشكلة التوصيل..."
}
```

**Response 200**: 업데이트된 민원 객체 반환.

---

### POST /complaints/:id/transfer
민원 이관 요청.

**Request Body**
```json
{
  "targetAgencyId": "BRC-ENV-TUN-001",
  "reasonFr": "Cette plainte relève de la compétence du Ministère de l'Environnement...",
  "reasonAr": "هذه الشكوى تندرج ضمن اختصاص وزارة البيئة..."
}
```

**Response 200**: 업데이트된 민원 객체.  
**Response 422** (이관 횟수 초과):
```json
{
  "success": false,
  "error": {
    "code": "TRANSFER_LIMIT_EXCEEDED",
    "currentCount": 3,
    "messageFr": "Cette plainte a déjà été transférée 3 fois. Signalement automatique au BCRC.",
    "messageAr": "تم تحويل هذه الشكوى 3 مرات. إشعار تلقائي إلى BCRC."
  }
}
```

---

### POST /complaints/:id/extend-deadline
처리기한 연장 신청.

**Request Body**
```json
{
  "requestedAdditionalDays": 15,
  "reasonFr": "Une expertise technique supplémentaire est nécessaire...",
  "reasonAr": "يلزم إجراء خبرة تقنية إضافية..."
}
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "extensionRequestId": "EXT-001",
    "status": "pending_approval",
    "currentDeadline": "2024-04-30T23:59:59Z",
    "requestedDeadline": "2024-05-15T23:59:59Z"
  }
}
```

---

### POST /complaints/:id/joint-process
공동 처리 시작 요청 (다기관 협업, G-03).

**Request Body**
```json
{
  "cooperatingAgencyIds": ["BRC-ENV-TUN-001", "BRC-INFRA-001"],
  "reasonFr": "Cette plainte nécessite la coopération de plusieurs organismes..."
}
```

**Response 201**: 공동처리 요청 객체 반환.

---

### POST /complaints/:id/satisfaction
만족도 평가 제출 (시민 전용, 완료 후 7일 이내).

**Request Body**
```json
{ "score": 4, "commentFr": "Traitement rapide, mais la réponse manquait de détails." }
```

**Response 201**: `{ "success": true }`

---

### GET /complaints/duplicate-check
중복·반복 민원 확인 (제출 전 유사 민원 존재 여부, G-12).

**Query Parameters**: `categoryL2`, `regionCode`

**Response 200**
```json
{
  "success": true,
  "data": {
    "hasSimilar": true,
    "similarComplaints": [
      {
        "id": "CMP-2024-000035",
        "titleFr": "Problème d'eau dans le quartier Lac",
        "status": "processing",
        "submittedAt": "2024-02-20T00:00:00Z"
      }
    ],
    "message": {
      "fr": "Des plaintes similaires ont déjà été soumises. Souhaitez-vous rejoindre la plainte collective ?",
      "ar": "تم تقديم شكاوى مماثلة بالفعل. هل تريد الانضمام إلى الشكوى الجماعية؟"
    }
  }
}
```

---

## 4. 부패 신고 API (`/reports`)

> **보안 주의**: 민원 API와 완전히 분리된 서비스. 응답에 신고자 식별 정보 절대 포함 금지.

### POST /reports
부패 신고 접수.

**Request Body**
```json
{
  "type": "bribery",
  "targetAgencyId": "AGY-MIN-001",
  "incidentDate": "2024-02-15",
  "locationFr": "Tunis, Cité Olympique",
  "contentFr": "...",
  "contentAr": "...",
  "attachmentIds": ["ATT-RPT-001"],
  "isAnonymous": true,
  "anonymousToken": "ANON-7f3a9b2c-..."
}
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "reportId": "RPT-2024-000018",
    "status": "received",
    "trackingCode": "TRACK-8f3b2a1c",
    "message": {
      "fr": "Votre signalement a été enregistré. Conservez ce code de suivi.",
      "ar": "تم تسجيل بلاغكم. احتفظ بهذا الرمز للمتابعة."
    }
  }
}
```

---

### GET /reports/track
익명 신고 추적 조회 (토큰 기반).

**Query Parameters**: `token=ANON-7f3a9b2c-...`

**Response 200**
```json
{
  "success": true,
  "data": {
    "reportId": "RPT-2024-000018",
    "status": "under_investigation",
    "lastUpdatedAt": "2024-03-10T00:00:00Z",
    "statusMessage": {
      "fr": "Votre signalement est en cours d'instruction.",
      "ar": "بلاغكم قيد التحقيق."
    }
  }
}
```

---

### GET /reports (DGGPC 전용)
신고 목록. DGGPC_OFFICER 이상만 접근 가능.

**Query Parameters**: `status`, `type`, `agencyId`, `dateFrom`, `dateTo`

**Response 200**: 신고 목록 (시민 식별 정보 마스킹 처리).

---

### PATCH /reports/:id/status (DGGPC 전용)
신고 처리 상태 변경.

---

## 5. 국민제안 API (`/proposals`)

### GET /proposals
제안 목록 (공개).

**Query Parameters**

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `status` | `pending\|under_review\|accepted\|rejected` | 상태 필터 |
| `categoryL1` | string | 분류 필터 |
| `sortBy` | `createdAt\|likeCount\|status` | 정렬 기준 |

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "PRP-2024-000005",
      "titleFr": "Améliorer l'éclairage public dans les quartiers périphériques",
      "titleAr": "تحسين الإنارة العمومية في الأحياء الطرفية",
      "status": "under_review",
      "categoryPath": { "l1": { "nameFr": "Urbanisme" } },
      "likeCount": 142,
      "isLikedByMe": false,
      "submittedAt": "2024-02-10T00:00:00Z",
      "assignedAgency": { "nameFr": "Ministère de l'Équipement" },
      "reviewResult": null
    }
  ],
  "pagination": { ... }
}
```

---

### POST /proposals
제안 작성 (로그인 필요).

**Request Body**
```json
{
  "titleFr": "...",
  "titleAr": "...",
  "contentFr": "...",
  "contentAr": "...",
  "categoryL1": "04",
  "attachmentIds": []
}
```

**Response 201**: 생성된 제안 객체.

---

### POST /proposals/:id/like
공감 토글 (로그인 필요).

**Response 200**
```json
{
  "success": true,
  "data": { "liked": true, "likeCount": 143 }
}
```

---

### PATCH /proposals/:id/review (BCRC_ADMIN 전용)
제안 심사 결과 등록.

**Request Body**
```json
{
  "result": "accepted",
  "reviewCommentFr": "Cette proposition a été retenue et sera intégrée dans le plan d'action 2025.",
  "reviewCommentAr": "تم قبول هذا الاقتراح وسيتم إدراجه في خطة العمل 2025.",
  "implementationPlanFr": "Lancement du projet au T3 2025..."
}
```

---

## 6. 통계 API (`/statistics`)

### GET /statistics/overview
전체 현황 요약 (대시보드 KPI용).

**Query Parameters**: `dateFrom`, `dateTo`, `agencyId`

**Response 200**
```json
{
  "success": true,
  "data": {
    "totalReceived": 3842,
    "totalCompleted": 3156,
    "completionRate": 82.1,
    "avgProcessingDays": 14.3,
    "overdueCount": 47,
    "avgSatisfactionScore": 3.8,
    "changeVsLastPeriod": {
      "received": +12.3,
      "completionRate": -1.2
    }
  }
}
```

---

### GET /statistics/trend
기간별 민원 추이.

**Query Parameters**: `period=monthly&dateFrom=2024-01-01&dateTo=2024-12-31`

**Response 200**
```json
{
  "success": true,
  "data": [
    { "period": "2024-01", "received": 312, "completed": 289, "overdue": 8 },
    { "period": "2024-02", "received": 298, "completed": 271, "overdue": 11 },
    { "period": "2024-03", "received": 341, "completed": 305, "overdue": 14 }
  ]
}
```

---

### GET /statistics/by-type
유형별 통계.

**Response 200**
```json
{
  "success": true,
  "data": [
    { "type": "grievance",  "count": 1842, "percentage": 47.9, "avgDays": 18.2 },
    { "type": "inquiry",    "count": 1124, "percentage": 29.2, "avgDays": 4.1  },
    { "type": "suggestion", "count": 512,  "percentage": 13.3, "avgDays": 22.1 },
    { "type": "proposal",   "count": 243,  "percentage": 6.3,  "avgDays": 24.8 },
    { "type": "report",     "count": 121,  "percentage": 3.1,  "avgDays": 11.3 }
  ]
}
```

---

### GET /statistics/by-agency
기관별 성과 통계.

**Query Parameters**: `dateFrom`, `dateTo`, `limit=20`

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "agency": { "id": "BRC-ENV-TUN-001", "nameFr": "BRC - Environnement - Tunis" },
      "received": 234,
      "completed": 198,
      "completionRate": 84.6,
      "avgProcessingDays": 12.4,
      "slaComplianceRate": 91.2,
      "satisfactionScore": 4.1,
      "transferCount": 18,
      "overdueCount": 6
    }
  ]
}
```

---

### GET /statistics/repeated-complaints
반복 민원 분석 (G-06).

**Query Parameters**: `minRepeatCount=3&dateFrom&dateTo`

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "citizenId": "***masked***",
      "repeatCount": 7,
      "categories": ["환경 > 수질", "환경 > 대기"],
      "lastComplaintAt": "2024-03-01T00:00:00Z",
      "totalUnresolved": 3
    }
  ]
}
```

---

### GET /statistics/long-overdue
장기 미처리 민원 (G-06).

**Query Parameters**: `minDays=30`

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "complaintId": "CMP-2024-000012",
      "type": "grievance",
      "titleFr": "...",
      "daysOverdue": 45,
      "assignedAgency": { "nameFr": "BRC - Santé" },
      "assignedOfficer": { "name": "..." }
    }
  ]
}
```

---

## 7. 기관 API (`/agencies`)

### GET /agencies
기관 목록.

**Query Parameters**: `type=BRC`, `region`, `isActive=true`, `search`

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "BRC-ENV-TUN-001",
      "nameFr": "Bureau des Relations avec le Citoyen - Ministère de l'Environnement",
      "nameAr": "مكتب العلاقات مع المواطن - وزارة البيئة",
      "type": "BRC",
      "region": "TUN",
      "isActive": true,
      "contactEmail": "brc@environnement.gov.tn",
      "slaHours": {
        "grievance": 1440,
        "inquiry": 168,
        "proposal": 720,
        "suggestion": 720,
        "report": 360
      }
    }
  ]
}
```

---

### GET /agencies/:id/performance
기관 성과 상세.

**Response 200**: 기관 성과 통계 상세 (by-agency 응답 + 월별 추이 포함).

---

## 8. 분류 코드 API (`/categories`)

### GET /categories
민원 분류 코드 전체 트리.

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "code": "01",
      "nameFr": "Environnement",
      "nameAr": "البيئة",
      "children": [
        {
          "code": "0101",
          "nameFr": "Pollution atmosphérique",
          "nameAr": "تلوث الهواء",
          "children": [
            { "code": "010101", "nameFr": "Émissions industrielles", "nameAr": "انبعاثات صناعية" },
            { "code": "010102", "nameFr": "Émissions vehiculaires", "nameAr": "انبعاثات المركبات" }
          ]
        },
        {
          "code": "0102",
          "nameFr": "Eau",
          "nameAr": "الماء",
          "children": [
            { "code": "010201", "nameFr": "Eau potable", "nameAr": "مياه الشرب" },
            { "code": "010202", "nameFr": "Eaux usées", "nameAr": "مياه الصرف" }
          ]
        }
      ]
    }
  ]
}
```

---

### GET /categories/:code/agencies
특정 분류에 해당하는 담당 기관 추천.

**Response 200**
```json
{
  "success": true,
  "data": {
    "primaryAgency": {
      "id": "BRC-ENV-TUN-001",
      "nameFr": "BRC - Ministère de l'Environnement"
    },
    "alternativeAgencies": []
  }
}
```

---

## 9. 파일 첨부 API (`/attachments`)

### POST /attachments/upload
파일 업로드 (멀티파트).

**Request**: `multipart/form-data`, field: `file`

**Response 201**
```json
{
  "success": true,
  "data": {
    "id": "ATT-001",
    "filename": "evidence.pdf",
    "originalName": "증거자료.pdf",
    "sizeBytes": 1240000,
    "mimeType": "application/pdf",
    "uploadedAt": "2024-03-01T09:28:00Z"
  }
}
```

**Mock 동작**: 실제 파일을 저장하지 않고 파일명·크기 정보만 응답에 반환.  
**제한**: 최대 10MB, 허용 MIME: `image/jpeg`, `image/png`, `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.*`

---

## 10. 알림 API (`/notifications`)

### GET /notifications
현재 사용자의 알림 목록.

**Query Parameters**: `isRead=false`, `limit=20`

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "NOTIF-001",
      "type": "deadline_approaching",
      "titleFr": "Échéance imminente",
      "messageFr": "La plainte CMP-2024-000042 expire dans 1 jour.",
      "relatedId": "CMP-2024-000042",
      "isRead": false,
      "createdAt": "2024-04-29T09:00:00Z"
    },
    {
      "id": "NOTIF-002",
      "type": "new_complaint_assigned",
      "titleFr": "Nouvelle plainte assignée",
      "messageFr": "Une nouvelle plainte vous a été attribuée.",
      "relatedId": "CMP-2024-000128",
      "isRead": true,
      "createdAt": "2024-03-05T10:05:00Z"
    }
  ],
  "unreadCount": 5
}
```

---

### PATCH /notifications/:id/read
알림 읽음 처리.

**Response 200**: `{ "success": true }`

---

### PATCH /notifications/read-all
전체 알림 읽음 처리.

**Response 200**: `{ "success": true, "data": { "updatedCount": 5 } }`

---

## 11. MSW 구현 가이드

프로토타입에서 모든 API는 MSW로 구현한다. 아래 원칙을 지킨다.

### 구현 우선순위
Phase 1에서 반드시 구현할 핸들러:
```
POST /auth/login
GET  /complaints
POST /complaints
GET  /complaints/:id
PATCH /complaints/:id/status
POST /complaints/:id/transfer
GET  /categories
GET  /agencies
POST /attachments/upload
GET  /notifications
```

### 목 데이터 현실성 원칙
- 민원 목록: 50건 이상, 다양한 상태·유형·D-Day 분포 포함
- 기관 목록: BRC 73개 전체 (축약 정보로라도 모두 포함)
- 통계 데이터: 최근 12개월치 월별 데이터
- 아랍어 텍스트: 실제 아랍어 문장 사용 (영문 transliteration 금지)

### 에러 시나리오 목 구현
```typescript
// 이관 횟수 초과 시나리오
http.post('/api/complaints/:id/transfer', ({ params }) => {
  const complaint = findComplaint(params.id);
  if (complaint.transferCount >= 3) {
    return HttpResponse.json(
      { success: false, error: { code: 'TRANSFER_LIMIT_EXCEEDED', currentCount: 3 } },
      { status: 422 }
    );
  }
  // 정상 처리...
})
```

---

*문서 버전: v1.0 | API_SPEC | PMC AA 전문가 작성 | KOICA ODA Tunisia e-People II*
