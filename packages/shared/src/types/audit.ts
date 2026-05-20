/** 감사 로그 작업 결과 */
export type AuditResult = 'success' | 'failure';

/** 감사 로그 항목 */
export interface AuditLogEntry {
  id?: string;
  adminId: string;
  adminEmail: string;
  /** 작업 종류 (예: 'admin.login', 'cache.refresh', 'weight.update') */
  action: string;
  /** 작업 대상 (예: regionCode, adminId, presetId) */
  target: string;
  /** 작업 추가 정보 */
  details: Record<string, unknown>;
  result: AuditResult;
  timestamp: string;
}
