# Operations Phase — Placeholder

## Status: PLACEHOLDER (Post-MVP)

본 단계는 AI-DLC 워크플로우의 향후 확장을 위한 placeholder입니다.

## 계획된 운영 항목

### 1. 배포 (Deployment)
- **운영 환경**: AWS ECS Fargate + RDS PostgreSQL + ElastiCache Redis + S3/CloudFront + ALB
- **로컬 환경**: Docker Compose (PostgreSQL + Redis + Backend + Frontend)
- **IaC**: AWS CDK 또는 Terraform
- **CI/CD**: GitHub Actions (lint → test → security scan → build → deploy)

### 2. 모니터링 (Monitoring)
- **로깅**: CloudWatch Logs (구조화 JSON)
- **메트릭**: CloudWatch Metrics (API 응답 시간, 에러율, 캐시 적중률)
- **알람**: CloudWatch Alarms (p95 > 2s, 에러율 > 5%, 캐시 갱신 실패)
- **대시보드**: CloudWatch Dashboard (API별 상태, 트래픽, 점수 분포)

### 3. 운영 절차 (Operations Procedures)
- **배포 롤백**: ECS 이전 task definition으로 즉시 롤백
- **캐시 갱신**: Admin Panel에서 수동 갱신 또는 스케줄 기반 자동 갱신
- **API 키 로테이션**: Secrets Manager에서 키 교체 → ECS task 재시작
- **DB 백업**: RDS 자동 백업 7일 보관 + 일일 스냅샷
- **인시던트 대응**: CloudWatch Alarm → SNS → 운영팀 알림

### 4. 보안 운영 (Security Operations)
- **의존성 취약점**: GitHub Dependabot + npm audit (주간)
- **컨테이너 스캔**: ECR 이미지 스캔
- **접근 제어**: IAM 최소 권한, VPC 내부 통신
- **감사 로그**: Admin Panel 모든 변경 작업 CloudWatch + DB 이중 기록

### 5. 확장 계획 (Scaling)
- **Auto Scaling**: CPU 70% 초과 시 ECS task 추가, 30% 미만 5분 지속 시 축소
- **Redis 클러스터**: 트래픽 증가 시 ElastiCache 클러스터 모드 전환
- **CDN**: CloudFront로 정적 자산 + API 응답 캐시 (GET 요청)

## MVP에서 Operations로의 전환 조건

다음 조건 충족 시 Operations Phase 정식 실행:
1. Admin Panel 구현 완료 (인증 + 가중치 + 캐시 관리)
2. PostgreSQL + Redis 정식 연동
3. Docker 기반 로컬 환경 검증
4. AWS CDK 스택 작성 + staging 배포 성공
5. GitHub Actions CI/CD 파이프라인 동작 확인
6. E2E 테스트 통과

## 참고 문서

- `aidlc-docs/inception/requirements/requirements.md` — NFR-8 (Deployability & Operability)
- `aidlc-docs/inception/application-design/unit-of-work.md` — U-7 infra-as-code
- `aidlc-docs/construction/u2-backend-foundation/functional-design/` — Auth/Cache/Audit 명세
