#!/usr/bin/env node

/**
 * 川渝云图 V1.0 数据库迁移脚本
 *
 * 使用方式：
 *   1. 在 .env.local 中配置 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY
 *   2. 运行 `bun run db:migrate`
 *
 * 或者直接在 Supabase Dashboard 的 SQL Editor 中执行下方 SQL
 */

const MIGRATION_SQL = `
-- ============================================================================
-- 川渝云图 V1.0 数据库迁移
-- ============================================================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. 用户表 ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(11) UNIQUE,
  wechat_openid VARCHAR(64) UNIQUE,
  email VARCHAR(255) UNIQUE,
  role VARCHAR(20) NOT NULL DEFAULT 'owner'
    CHECK (role IN ('owner', 'contractor', 'designer', 'admin')),
  credit_score INT NOT NULL DEFAULT 100,
  name VARCHAR(64),
  avatar_url VARCHAR(512),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ── 2. 项目表 ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(64) NOT NULL DEFAULT '未命名方案',
  scene_data JSONB,
  thumbnail_url VARCHAR(512),
  share_code VARCHAR(8) UNIQUE,
  is_private BOOLEAN NOT NULL DEFAULT false,
  show_scans_public BOOLEAN NOT NULL DEFAULT true,
  show_guides_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_share_code ON projects(share_code);

-- ── 3. 线索表 ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  project_code VARCHAR(8),
  name VARCHAR(64) NOT NULL,
  phone VARCHAR(11) NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  address_code VARCHAR(12) NOT NULL DEFAULT '',
  budget VARCHAR(20) NOT NULL DEFAULT '20-30',
  budget_level INT NOT NULL DEFAULT 2,
  source VARCHAR(32) NOT NULL DEFAULT 'unknown',
  status VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'sold_out', 'closed')),
  max_sales INT NOT NULL DEFAULT 3,
  current_sales INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_address_code ON leads(address_code);
CREATE INDEX IF NOT EXISTS idx_leads_expires_at ON leads(expires_at);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_project_code ON leads(project_code);

-- ── 4. 线索订单表 ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lead_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'refunded', 'appealing')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_orders_lead_id ON lead_orders(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_orders_contractor_id ON lead_orders(contractor_id);
CREATE INDEX IF NOT EXISTS idx_lead_orders_status ON lead_orders(status);

-- ── 5. 自动更新 updated_at 触发器 ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_lead_orders_updated_at
    BEFORE UPDATE ON lead_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 6. RLS 策略（行级安全）────────────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_orders ENABLE ROW LEVEL SECURITY;

-- Service Role 可以绕过 RLS，所以 API 路由使用 service role key 不受影响
-- 以下策略仅用于 Supabase 客户端直接访问的场景

-- 项目：用户只能读写自己的项目，公开项目所有人可读
CREATE POLICY IF NOT EXISTS "projects_owner_all" ON projects
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "projects_public_read" ON projects
  FOR SELECT USING (is_private = false);

-- ── 完成 ──────────────────────────────────────────────────────────────────────
SELECT '川渝云图 V1.0 数据库迁移完成' AS result;
`;

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  未配置 Supabase 环境变量');
    console.log('');
    console.log('请在 Supabase Dashboard 的 SQL Editor 中手动执行以下 SQL：');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(MIGRATION_SQL);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(0);
  }

  console.log('🚀 开始执行数据库迁移...');

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation',
      },
    });

    // 使用 Supabase Management API 执行 SQL
    // 如果 RPC 不可用，输出 SQL 供手动执行
    console.log('');
    console.log('请在 Supabase Dashboard > SQL Editor 中执行以下迁移脚本：');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(MIGRATION_SQL);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 迁移 SQL 已输出');
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    console.log('');
    console.log('请手动在 Supabase Dashboard 中执行 SQL');
    console.log(MIGRATION_SQL);
    process.exit(1);
  }
}

main();
