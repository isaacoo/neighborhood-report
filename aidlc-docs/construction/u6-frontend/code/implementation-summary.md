# Code Implementation Summary — U-6 frontend

## Overview
React 18 + Vite 5 + TypeScript SPA. Apple/Linear 스타일 프리미엄 UI.

## Architecture
```
App.tsx
├── Sidebar (사이드바 네비게이션)
├── CandidatesProvider (React Context + LocalStorage)
└── Routes
    ├── / → HomePage (검색 + 후보지 등록)
    ├── /candidates → CandidateListPage (목록 + 관리)
    ├── /reports/:regionCode → ReportPage (종합 리포트)
    └── /compare → ComparisonPage (비교 테이블)
```

## Implemented Files

### Pages
| File | Route | Description |
|------|-------|-------------|
| `pages/HomePage.tsx` | / | 검색 + 후보지 등록 + 비교 CTA |
| `pages/CandidateListPage.tsx` | /candidates | 카드 목록 + 별칭/삭제 |
| `pages/ReportPage.tsx` | /reports/:code | 레이더 차트 + 5개 카테고리 + 실거래가 + 대기질 + 교통 + 안전 |
| `pages/ComparisonPage.tsx` | /compare | 비교 테이블 + 인사이트 카드 |

### Components
| File | Description |
|------|-------------|
| `components/Sidebar.tsx` | 사이드바 네비게이션 (홈/후보지/비교/서비스) |
| `components/RadarChart.tsx` | SVG 펜타곤 레이더 차트 (5개 카테고리) |
| `components/PriceBarChart.tsx` | 면적대별 가격 범위 수평 bar chart |
| `components/Icons.tsx` | SVG 아이콘 컴포넌트 (15개) |

### Infrastructure
| File | Description |
|------|-------------|
| `infrastructure/apiClient.ts` | axios 기반 Backend REST API 호출 |
| `infrastructure/candidateStorage.ts` | LocalStorage CRUD (5개 제한, 중복 방지) |
| `infrastructure/CandidatesContext.tsx` | React Context + Provider |
| `infrastructure/format.ts` | 가격 포맷팅 유틸 |
| `infrastructure/mapTile.ts` | OpenStreetMap 타일 URL 생성 |

### Styling
| File | Description |
|------|-------------|
| `styles.css` | 전체 디자인 시스템 (CSS custom properties, 반응형) |

## Design System

### Colors
- Primary: #3B82F6 (soft blue)
- Background: #f6f8fb
- Card: #ffffff
- Text: #0b1220
- Muted: #6b7280

### Typography
- Font: -apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR'
- Headings: 700 weight, -0.02em tracking
- Body: 14px, 1.5 line-height

### Components
- Border radius: 12~28px
- Shadows: subtle (0 1px 2px → 0 12px 40px)
- Cards: white bg, 1px border, 24px padding
- Buttons: 10px 16px padding, 10px radius

### Responsive
- Desktop: sidebar + main (240px + fluid)
- Tablet (≤900px): sidebar hidden, mobile topbar
- Mobile (≤600px): single column, compact spacing

## User Stories Covered (UI)
- US-001~002: 검색 UI + 결과 없음 안내
- US-003~008: 후보지 등록/삭제/별칭/목록 (LocalStorage)
- US-009~012: 실거래가 테이블 + bar chart + 기간 선택
- US-013~015: 인프라 점수 카드
- US-016~018: 대기질 배지 + 측정소 정보
- US-019: 안전 시설 목록
- US-021~024: 종합 점수 + 레이더 차트 + 강점/주의점 + 재시도
- US-025~028: 비교 테이블 + 정렬 + 인사이트 + 모바일 대응

## Accessibility
- ARIA labels on interactive elements
- data-testid attributes for automation
- Color + text for status (not color-only)
- Keyboard navigable (native HTML elements)
- Min touch target 44px on mobile
