# User Story Generation Plan

## Overview
요구사항 문서(`aidlc-docs/inception/requirements/requirements.md`)와 입력 자료(`requirements/`)를 기반으로 INVEST 기준의 User Story와 Persona를 생성합니다.

## Methodology

### Story Format
표준 형식: `As a <Persona>, I want <Goal>, so that <Benefit>.`

### Acceptance Criteria Format
EARS 패턴 (Easy Approach to Requirements Syntax) 사용:
- WHEN ... THE ... SHALL ...
- WHILE ..., WHEN ..., THE ... SHALL ...
- IF ..., THEN THE ... SHALL ...

### INVEST Criteria
- **Independent**: 다른 스토리에 의존 최소화
- **Negotiable**: 구현 세부 강제 안 함
- **Valuable**: 사용자/운영자 가치 명확
- **Estimable**: 1~3일 내 구현 가능 단위
- **Small**: 단일 사용자 여정 단계
- **Testable**: AC로 검증 가능

---

## Plan Steps

### Phase 1: Persona 정의
- [x] 1.1 5개 Persona 식별 및 명세 작성
  - 이사 예정자 (1인 가구) — Primary
  - 이사 예정자 (가족) — Primary
  - 환경/건강 민감 사용자 — Sub-segment
  - 운영자 (superadmin)
  - 운영자 (admin)
- [x] 1.2 각 Persona의 목표·관심사·기술 친숙도·시나리오 작성
- [x] 1.3 Persona × Story 매핑 테이블 작성
- [x] 1.4 `aidlc-docs/inception/user-stories/personas.md` 저장

### Phase 2: User Story 생성
- [x] 2.1 사용자 측 Story 생성 (FR-1 ~ FR-8 기반)
- [x] 2.2 운영자 측 Story 생성 (FR-9 ~ FR-12 기반)
- [x] 2.3 각 Story에 ID 부여 (US-XXX), Persona 지정, AC 작성
- [x] 2.4 INVEST 자가 검증
- [x] 2.5 `aidlc-docs/inception/user-stories/stories.md` 저장

### Phase 3: Mapping & Verification
- [x] 3.1 FR ↔ Story 추적성 매트릭스 작성
- [x] 3.2 Persona ↔ Story 매핑 테이블 작성
- [x] 3.3 누락된 FR이 없는지 확인 (FR-1~12 모두 매핑됨, FR-13/14는 횡단/Out-of-Scope)

---

## Embedded Planning Questions

### Question P1: Story Breakdown Approach
어떤 방식으로 사용자 스토리를 그룹핑할까요?

A) Feature-Based — FR 카테고리(검색/등록/실거래가/인프라/환경/안전/리포트/비교/운영) 기준으로 그룹핑
B) User Journey-Based — 사용자 여정 단계(탐색→등록→분석→비교→결정) 기준으로 그룹핑
C) Persona-Based — 각 Persona별로 스토리 그룹핑
D) Hybrid — Feature 기반 + 운영자/사용자 분리
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question P2: Story Granularity
스토리 세분화 수준은?

A) Standard — 사용자 여정 단계당 1개 스토리, 1~3일 구현 단위 (권장)
B) Fine-grained — 더 작은 단위로 분해 (반나절~1일)
C) Epic + Sub-stories — 큰 Epic 정의 후 sub-stories로 분해
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question P3: Persona 상세 수준
Persona 명세의 상세 수준은?

A) Standard — 이름·목표·관심사·시나리오·기술 친숙도 (권장)
B) Lightweight — 이름·역할·핵심 목표만
C) Comprehensive — 인구통계·심리·일과·페인포인트·인용문 포함 (UX 리서치 수준)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question P4: 사용자 sub-segment 처리
이사 예정자 내 sub-segment(1인 가구, 가족, 환경 민감)을 어떻게 다룰까요?

A) 별도 Persona로 분리하되 공통 스토리는 "이사 예정자(공통)" Persona로 표시
B) Persona는 통합("이사 예정자")하고 스토리에서 sub-segment 시나리오만 언급
C) 모든 sub-segment를 별도 Persona로 분리하고 모든 스토리에 매핑
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question P5: 운영자 역할 구분
운영자 Persona를 어떻게 구분할까요?

A) superadmin과 admin 두 Persona로 분리 (권한 차이 명확화)
B) 단일 "운영자" Persona로 통합하고 권한은 스토리 AC에서 구분
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question P6: AC 형식
Acceptance Criteria 형식은?

A) EARS 패턴 (WHEN/WHILE/IF...THEN) — requirements.md와 일관성 유지 (권장)
B) Given-When-Then (BDD 스타일)
C) Plain bullet list
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Mandatory Artifacts
- [ ] `aidlc-docs/inception/user-stories/personas.md` — Persona 명세
- [ ] `aidlc-docs/inception/user-stories/stories.md` — User Stories + AC + 매핑 테이블
