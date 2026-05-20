# Build Instructions

## Prerequisites

- Node.js 20+
- npm 10+
- 공공데이터포털 API 인증키 (`.env` 파일)

## Environment Setup

```bash
# 1. 의존성 설치
npm install

# 2. .env 파일 생성 (루트 디렉토리)
cp .env.example .env
# DATA_GO_KR_API_KEY에 실제 키 입력
```

## Build Commands

```bash
# Shared 패키지 빌드 (TypeScript → JS + declaration)
npm run build --workspace=packages/shared

# Backend 타입 검증 (빌드 없이 실행 가능 - tsx 사용)
npx tsc --noEmit --project packages/backend/tsconfig.json

# Frontend 프로덕션 빌드
npm run build --workspace=packages/frontend
# 출력: packages/frontend/dist/
```

## Development Mode

```bash
# Backend (포트 4000, tsx watch)
npm run dev:backend

# Frontend (포트 3000, Vite HMR)
npm run dev:frontend
```

## Docker (Post-MVP)

```bash
docker-compose up -d  # PostgreSQL + Redis
npm run dev:backend
npm run dev:frontend
```

## Troubleshooting

| 문제 | 해결 |
|------|------|
| PowerShell 실행 정책 오류 | `cmd /c "npm install"` 사용 또는 `Set-ExecutionPolicy RemoteSigned` |
| 공공 API 403 | HTTPS만 지원. HTTP 호출 시 403 반환 |
| 실거래가 0건 | 최근 1개월 lag 적용됨. 2개월 전 데이터부터 조회 |
| HIRA 병원 0건 | sgguCd 매핑 확인 (서울 25개 자치구만 지원) |
