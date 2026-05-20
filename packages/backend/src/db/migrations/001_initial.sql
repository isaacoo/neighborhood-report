-- 운영자 계정 테이블
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- 가중치 설정 테이블
CREATE TABLE IF NOT EXISTS weight_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version VARCHAR(50) NOT NULL,
  weights JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 가중치 프리셋 테이블
CREATE TABLE IF NOT EXISTS weight_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  weights JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API 상태 기록 테이블
CREATE TABLE IF NOT EXISTS api_status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL,
  response_time_ms INTEGER,
  error_message TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 캐시 메타데이터 테이블
CREATE TABLE IF NOT EXISTS cache_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name VARCHAR(100) NOT NULL,
  region_code VARCHAR(20) NOT NULL,
  request_params JSONB,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_stale BOOLEAN DEFAULT FALSE
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_cache_metadata_region ON cache_metadata(region_code);
CREATE INDEX IF NOT EXISTS idx_cache_metadata_api ON cache_metadata(api_name);
CREATE INDEX IF NOT EXISTS idx_api_status_logs_api ON api_status_logs(api_name, recorded_at DESC);
