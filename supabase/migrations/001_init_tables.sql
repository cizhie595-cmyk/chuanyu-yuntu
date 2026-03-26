-- ============================================================================
-- 川渝云图 V1.0 数据库初始化迁移
-- 执行方式：在 Supabase SQL Editor 中运行，或通过 supabase db push
-- ============================================================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. 用户表 ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(11) UNIQUE,
  wechat_openid VARCHAR(64) UNIQUE,
  role VARCHAR(20) NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'contractor', 'designer')),
  credit_score INT NOT NULL DEFAULT 100,
  name VARCHAR(64),
  avatar_url VARCHAR(256),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. 项目表 ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(64) NOT NULL DEFAULT '未命名方案',
  scene_data JSONB,
  thumbnail_url VARCHAR(256),
  share_code VARCHAR(8) UNIQUE,
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 为 share_code 创建索引（H5预览页通过 share_code 查询）
CREATE INDEX IF NOT EXISTS idx_projects_share_code ON projects(share_code);

-- ── 3. 线索表 ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- 业主信息
  name VARCHAR(64) NOT NULL,
  phone VARCHAR(11) NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  address_code VARCHAR(12) NOT NULL DEFAULT '',
  -- 预算
  budget VARCHAR(20) NOT NULL DEFAULT '20-30',
  budget_level INT NOT NULL DEFAULT 2,
  -- 关联项目
  project_code VARCHAR(8),
  -- 来源追踪
  source VARCHAR(32) NOT NULL DEFAULT 'unknown',
  -- 线索状态
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'sold_out', 'closed')),
  max_sales INT NOT NULL DEFAULT 3,
  current_sales INT NOT NULL DEFAULT 0,
  -- 时间
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引：按状态和过期时间查询（线索大厅列表）
CREATE INDEX IF NOT EXISTS idx_leads_status_expires ON leads(status, expires_at DESC);
-- 索引：按地区代码查询
CREATE INDEX IF NOT EXISTS idx_leads_address_code ON leads(address_code);
-- 索引：防重复提交
CREATE INDEX IF NOT EXISTS idx_leads_phone_project ON leads(phone, project_code, created_at);

-- ── 4. 线索订单表 ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lead_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded', 'appealing')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引：防重复购买
CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_orders_unique ON lead_orders(lead_id, contractor_id)
  WHERE status IN ('pending', 'paid');

-- ── 5. RLS 策略（行级安全）──────────────────────────────────────────────────
-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_orders ENABLE ROW LEVEL SECURITY;

-- 线索表：任何人可以插入（C端留资），只有管理员可以查看完整信息
CREATE POLICY "leads_insert_public" ON leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "leads_select_service" ON leads
  FOR SELECT USING (auth.role() = 'service_role');

-- 项目表：公开项目任何人可查看
CREATE POLICY "projects_select_public" ON projects
  FOR SELECT USING (is_private = false OR auth.uid() = user_id);

-- ── 6. 自动更新 updated_at 触发器 ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_orders_updated_at
  BEFORE UPDATE ON lead_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
