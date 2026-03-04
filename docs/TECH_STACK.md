# TECH_STACK.md — 기술 스택 선택 근거 및 상세 가이드

> e-People II 프로토타입 | PMC AA 전문가 작성

---

## 1. 기술 스택 전체 구성

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Prototype)                   │
│                                                           │
│  React 18 + TypeScript + Vite                            │
│  Tailwind CSS + Headless UI                              │
│  React Router v6                                          │
│  Zustand (전역 상태) + React Query (서버 상태)           │
│  i18next (아랍어/프랑스어)                               │
│  Recharts (통계 차트)                                    │
│  MSW (Mock Service Worker)                               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              Backend Reference Architecture               │
│              (PC1 개발업체 구현 대상)                    │
│                                                           │
│  API Gateway (Kong / Nginx)                               │
│  MSA Services (Spring Boot Java 또는 Node.js)            │
│  PostgreSQL + Redis                                       │
│  RabbitMQ / Kafka (비동기 이벤트)                        │
│  MinIO (파일 스토리지)                                   │
│  Kubernetes (CNI Private Cloud)                          │
│  CI/CD: GitLab CI / Jenkins                              │
│  Monitoring: Prometheus + Grafana                        │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 프론트엔드 기술 선택 근거

### 2.1 React 18 + TypeScript

**선택 이유**:
- 전 세계 및 튀니지 개발자 커뮤니티에서 가장 광범위하게 사용되는 프레임워크
- TypeScript로 타입 안정성 확보 → 프로토타입 후 실제 개발로의 전환 용이
- MSA 각 서비스의 UI를 독립적인 마이크로 프론트엔드로 분리 가능한 구조
- KOICA 요건 COR-002(범용 언어)·COR-003(글로벌 표준 프레임워크) 충족

**대안 검토**:
- Vue.js: React 대비 튀니지 현지 개발자 풀이 작음
- Angular: 학습 곡선이 높고 프로토타입에 과중

### 2.2 Vite

**선택 이유**:
- 개발 서버 HMR(Hot Module Replacement) 속도가 Webpack 대비 10~100배 빠름
- 저사양 개발 환경에서도 빠른 빌드 가능 (튀니지 현지 개발 환경 고려)
- Tree-shaking 내장으로 번들 크기 최소화

### 2.3 Tailwind CSS

**선택 이유**:
- RTL(아랍어 우→좌) 레이아웃 지원: `rtl:` 변형 클래스 네이티브 지원
- 별도 CSS 파일 없이 컴포넌트 내에서 스타일 관리 → 유지보수 용이
- 저사양 기기 최적화: PurgeCSS로 사용하지 않는 스타일 자동 제거

**RTL 적용 예시**:
```tsx
// Tailwind RTL 지원
<div className="ml-4 rtl:ml-0 rtl:mr-4">
  텍스트
</div>

// 또는 dir 속성 활용
<html lang="ar" dir="rtl">
```

### 2.4 i18next + react-i18next

**선택 이유**:
- React 생태계에서 가장 성숙한 다국어(i18n) 라이브러리
- 아랍어 복수형, 날짜 포맷, 숫자 포맷 지역화 지원
- 번역 파일을 JSON으로 관리 → 번역가와의 협업 용이

**파일 구조**:
```
src/locales/
├── ar/
│   ├── common.json    # 공통 텍스트
│   ├── complaint.json # 민원 관련
│   ├── auth.json      # 인증 관련
│   └── admin.json     # 관리 관련
└── fr/
    ├── common.json
    ├── complaint.json
    ├── auth.json
    └── admin.json
```

**사용 예시**:
```tsx
import { useTranslation } from 'react-i18next';

const ComplaintForm = () => {
  const { t, i18n } = useTranslation('complaint');
  const isRTL = i18n.language === 'ar';
  
  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <label>{t('form.title.label')}</label>
      <input placeholder={t('form.title.placeholder')} />
      <button>{t('form.submit')}</button>
    </div>
  );
};
```

**번역 파일 예시** (`ar/complaint.json`):
```json
{
  "form": {
    "title": {
      "label": "عنوان الشكوى",
      "placeholder": "أدخل عنوان الشكوى"
    },
    "submit": "تقديم الشكوى",
    "types": {
      "grievance": "تظلم",
      "proposal": "اقتراح",
      "inquiry": "استفسار",
      "suggestion": "ملاحظة",
      "report": "بلاغ"
    }
  },
  "status": {
    "received": "مستلمة",
    "assigned": "محالة",
    "processing": "قيد المعالجة",
    "completed": "مكتملة",
    "closed": "مغلقة"
  }
}
```

### 2.5 Zustand (전역 상태 관리)

**선택 이유**:
- Redux 대비 보일러플레이트 코드 90% 감소
- TypeScript 지원 우수
- Step Wizard 같은 멀티 스텝 폼의 상태 관리에 최적

**스토어 구조**:
```typescript
// stores/complaintFormStore.ts
interface ComplaintFormStore {
  step: number;
  formData: {
    type: ComplaintType | null;
    categoryL1: string;
    categoryL2: string;
    categoryL3: string;
    title: string;
    content: string;
    attachments: File[];
  };
  setStep: (step: number) => void;
  setFormData: (data: Partial<ComplaintFormStore['formData']>) => void;
  reset: () => void;
}

// stores/authStore.ts
interface AuthStore {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}
```

### 2.6 React Query (서버 상태 관리)

**선택 이유**:
- API 데이터 캐싱, 로딩 상태, 에러 처리를 자동으로 관리
- 낙관적 업데이트(Optimistic Update) 지원으로 UX 향상
- MSW와 완벽하게 통합

**사용 예시**:
```typescript
// hooks/useComplaints.ts
export const useComplaints = (filters: ComplaintFilters) => {
  return useQuery({
    queryKey: ['complaints', filters],
    queryFn: () => fetchComplaints(filters),
    staleTime: 30_000, // 30초 캐시
  });
};

export const useSubmitComplaint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitComplaint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
    },
  });
};
```

### 2.7 MSW (Mock Service Worker)

**선택 이유**:
- 실제 네트워크 요청을 인터셉트하여 목 응답 제공
- 개발 서버와 프로덕션 빌드 모두에서 동작
- 실제 API 완성 전 독립적인 프론트엔드 개발 가능

**핸들러 예시**:
```typescript
// mocks/handlers/complaints.ts
import { http, HttpResponse } from 'msw';
import complaintsData from '../data/complaints.json';

export const complaintHandlers = [
  http.get('/api/complaints', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const filtered = status
      ? complaintsData.filter(c => c.status === status)
      : complaintsData;
    return HttpResponse.json({ data: filtered, pagination: { total: filtered.length } });
  }),

  http.post('/api/complaints', async ({ request }) => {
    const body = await request.json();
    const newComplaint = {
      id: `CMP-2024-${String(Date.now()).slice(-6)}`,
      ...body,
      status: 'received',
      submittedAt: new Date().toISOString(),
    };
    return HttpResponse.json(newComplaint, { status: 201 });
  }),

  http.get('/api/complaints/:id', ({ params }) => {
    const complaint = complaintsData.find(c => c.id === params.id);
    if (!complaint) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(complaint);
  }),
];
```

### 2.8 Recharts (차트 라이브러리)

**선택 이유**:
- React 기반 순수 SVG 차트 → 서버사이드 렌더링 호환
- 반응형 디자인 내장 (ResponsiveContainer)
- 아랍어 RTL 환경에서 안정적으로 동작

**사용 예시**:
```tsx
// components/features/statistics/ComplaintTrendChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const ComplaintTrendChart = ({ data }: { data: TrendData[] }) => {
  const { t } = useTranslation('statistics');
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="received" stroke="#1D4ED8" name={t('chart.received')} />
        <Line type="monotone" dataKey="completed" stroke="#16A34A" name={t('chart.completed')} />
      </LineChart>
    </ResponsiveContainer>
  );
};
```

---

## 3. 백엔드 레퍼런스 아키텍처 (PC1 개발 참고용)

### 3.1 MSA 서비스 분리 구조

```
API Gateway (Kong)
│
├── /api/auth/*        → Auth Service (인증·권한)
├── /api/complaints/*  → Complaint Service (민원 접수·처리)
├── /api/reports/*     → Anti-Corruption Service (부패 신고)
├── /api/proposals/*   → eParticipation Service (국민제안)
├── /api/statistics/*  → Statistics Service (통계·분석)
├── /api/documents/*   → Document Service (EDMS·CDMS)
├── /api/notifications/* → Notification Service (알림·SMS·이메일)
├── /api/helpdesk/*    → Helpdesk Service (1881 헬프데스크)
└── /api/admin/*       → Admin Service (공통코드·기관·사용자 관리)
```

### 3.2 기술 스택 권장 (PC1 구현 시)

| 영역 | 권장 기술 | 이유 |
|------|-----------|------|
| API 서버 | Spring Boot 3.x (Java) | CNI 기술인력 Java 역량, 장기 유지보수 용이 |
| 대안 API | Node.js (Express/Fastify) | 경량, 빠른 개발 속도 |
| 데이터베이스 | PostgreSQL 15 | 오픈소스, 아랍어 Full-text Search 지원 |
| 캐시 | Redis 7 | 세션, API 캐시, 분산 락 |
| 메시지 브로커 | RabbitMQ | ELISE 비동기 연계, 알림 발송 큐 |
| 파일 스토리지 | MinIO | S3 호환 오픈소스 (CNI 내부 배포) |
| API 게이트웨이 | Kong (OSS) | Rate Limiting, Auth, Logging 통합 |
| 컨테이너 오케스트레이션 | Kubernetes (K8s) | CNI Private Cloud 환경 |
| CI/CD | GitLab CI | 오픈소스, 코드 저장소 통합 |
| 모니터링 | Prometheus + Grafana | 오픈소스 MSA 모니터링 표준 |
| 로그 | ELK Stack (Elasticsearch + Logstash + Kibana) | 분산 로그 수집·분석 |

### 3.3 데이터베이스 스키마 핵심 테이블 (참고용)

```sql
-- 민원 테이블
CREATE TABLE complaints (
  id              VARCHAR(20) PRIMARY KEY,     -- 'CMP-2024-000001'
  type            VARCHAR(20) NOT NULL,         -- grievance, proposal, ...
  category_l1     VARCHAR(10),
  category_l2     VARCHAR(10),
  category_l3     VARCHAR(10),
  title_ar        TEXT,                         -- 아랍어 제목
  title_fr        TEXT,                         -- 프랑스어 제목
  content_ar      TEXT,
  content_fr      TEXT,
  status          VARCHAR(20) NOT NULL DEFAULT 'received',
  citizen_id      VARCHAR(50),
  is_anonymous    BOOLEAN NOT NULL DEFAULT FALSE,
  anonymous_token VARCHAR(100),
  assigned_agency VARCHAR(20) REFERENCES agencies(id),
  assigned_officer VARCHAR(50) REFERENCES users(id),
  submitted_at    TIMESTAMP WITH TIME ZONE NOT NULL,
  deadline        TIMESTAMP WITH TIME ZONE,
  sla_hours       INTEGER,
  transfer_count  INTEGER DEFAULT 0,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 개인정보 암호화: citizen_id, anonymous_token은 AES-256 암호화 저장

-- 처리 이력 테이블
CREATE TABLE complaint_histories (
  id              BIGSERIAL PRIMARY KEY,
  complaint_id    VARCHAR(20) REFERENCES complaints(id),
  action          VARCHAR(50),   -- received, assigned, transferred, processed, completed
  from_agency     VARCHAR(20),
  to_agency       VARCHAR(20),
  officer_id      VARCHAR(50),
  note_ar         TEXT,
  note_fr         TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기관 테이블
CREATE TABLE agencies (
  id              VARCHAR(20) PRIMARY KEY,      -- 'BRC-ENV-001'
  name_ar         VARCHAR(200) NOT NULL,
  name_fr         VARCHAR(200) NOT NULL,
  type            VARCHAR(20),                  -- BCRC, BRC, DGGPC
  parent_id       VARCHAR(20) REFERENCES agencies(id),
  region          VARCHAR(10),
  is_active       BOOLEAN DEFAULT TRUE
);
```

### 3.4 API 표준 응답 형식

```json
// 성공 응답
{
  "success": true,
  "data": { ... },
  "pagination": {
    "page": 1,
    "perPage": 10,
    "total": 127,
    "totalPages": 13
  },
  "timestamp": "2024-03-01T09:30:00Z"
}

// 에러 응답
{
  "success": false,
  "error": {
    "code": "COMPLAINT_NOT_FOUND",
    "message": "해당 민원을 찾을 수 없습니다.",
    "messageAr": "لم يتم العثور على الشكوى المطلوبة",
    "messageFr": "La plainte demandée est introuvable."
  },
  "timestamp": "2024-03-01T09:30:00Z"
}
```

---

## 4. 개발 환경 설정

### 4.1 package.json 핵심 의존성

```json
{
  "name": "epeople2-prototype",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "zustand": "^4.4.6",
    "@tanstack/react-query": "^5.8.0",
    "i18next": "^23.7.0",
    "react-i18next": "^13.5.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.294.0",
    "@headlessui/react": "^1.7.17",
    "axios": "^1.6.2",
    "date-fns": "^3.0.0",
    "react-hook-form": "^7.49.0",
    "@hookform/resolvers": "^3.3.2",
    "zod": "^3.22.4",
    "react-dropzone": "^14.2.3",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.1.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@typescript-eslint/eslint-plugin": "^6.10.0",
    "@typescript-eslint/parser": "^6.10.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.53.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "msw": "^2.0.8",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "typescript": "^5.2.2",
    "vite": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

### 4.2 tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50: '#EFF6FF', 500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8' },
        epeople: { 500: '#0891B2', 600: '#0E7490' },
      },
      fontFamily: {
        arabic: ['Noto Sans Arabic', 'Arial', 'sans-serif'],
        latin:  ['Inter', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
```

### 4.3 vite.config.ts

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
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
```

---

*문서 버전: v1.0 | TECH_STACK | PMC AA 전문가 작성 | KOICA ODA Tunisia e-People II*
