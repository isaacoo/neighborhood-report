/** 운영자 역할 */
export type AdminRole = 'superadmin' | 'admin';

/** 운영자 계정 */
export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

/** 로그인 요청 */
export interface LoginRequest {
  email: string;
  password: string;
}

/** 인증 토큰 응답 */
export interface AuthToken {
  accessToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

/** 계정 생성 요청 */
export interface CreateAdminRequest {
  email: string;
  password: string;
  role: AdminRole;
}

/** 비밀번호 변경 요청 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
