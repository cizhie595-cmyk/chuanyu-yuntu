import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '隐私政策 - 川渝云图',
  description: '川渝云图平台隐私政策',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-border border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center gap-4 text-sm">
            <Link
              className="text-muted-foreground transition-colors hover:text-foreground"
              href="/"
            >
              首页
            </Link>
            <span className="text-muted-foreground">/</span>
            <Link
              className="text-muted-foreground transition-colors hover:text-foreground"
              href="/terms"
            >
              服务条款
            </Link>
            <span className="text-muted-foreground">|</span>
            <span className="font-medium text-foreground">隐私政策</span>
          </nav>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-6 py-12">
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <h1 className="mb-2 font-bold text-3xl">隐私政策</h1>
          <p className="mb-8 text-muted-foreground text-sm">生效日期：2026年2月20日</p>

          <section className="mb-8 space-y-4">
            <h2 className="font-semibold text-xl">1. 引言</h2>
            <p className="text-foreground/90 leading-relaxed">
              川渝云图（以下简称"我们"）运营川渝云图平台及相关服务。本隐私政策说明了当您使用我们的服务时，我们如何收集、使用和保护您的信息。
            </p>
          </section>

          <section className="mb-8 space-y-4">
            <h2 className="font-semibold text-xl">2. 我们收集的信息</h2>

            <h3 className="mt-4 font-medium text-lg">账户信息</h3>
            <p className="text-foreground/90 leading-relaxed">
              当您创建账户时，我们可能收集：
            </p>
            <ul className="list-disc space-y-2 pl-6 text-foreground/90">
              <li>手机号码</li>
              <li>姓名</li>
              <li>微信头像和昵称</li>
              <li>微信授权登录信息</li>
            </ul>

            <h3 className="mt-4 font-medium text-lg">项目数据</h3>
            <p className="text-foreground/90 leading-relaxed">
              当您使用平台时，我们会存储您的项目数据，包括3D建筑设计、平面图及相关元数据。
            </p>

            <h3 className="mt-4 font-medium text-lg">留资信息</h3>
            <p className="text-foreground/90 leading-relaxed">
              当您通过H5预览页提交报价申请时，我们会收集您的姓名、手机号码、预算范围和建房地址。
            </p>

            <h3 className="mt-4 font-medium text-lg">使用分析</h3>
            <p className="text-foreground/90 leading-relaxed">
              我们使用匿名化的使用数据来改善平台体验，包括页面浏览量、性能指标和一般使用模式。
            </p>
          </section>

          <section className="mb-8 space-y-4">
            <h2 className="font-semibold text-xl">3. 我们如何使用您的信息</h2>
            <p className="text-foreground/90 leading-relaxed">我们使用您的信息用于：</p>
            <ul className="list-disc space-y-2 pl-6 text-foreground/90">
              <li>提供和维护您的账户</li>
              <li>存储和同步您的设计项目</li>
              <li>为您匹配本地施工队（基于留资信息）</li>
              <li>根据使用模式改善我们的服务</li>
              <li>发送功能更新通知（您可以在设置中关闭）</li>
              <li>响应客服请求</li>
              <li>确保平台安全并防止滥用</li>
            </ul>
          </section>

          <section className="mb-8 space-y-4">
            <h2 className="font-semibold text-xl">4. 数据存储</h2>
            <p className="text-foreground/90 leading-relaxed">
              您的数据存储在安全的云基础设施上。我们采取适当的技术和组织措施来保护您的数据安全。
            </p>
          </section>

          <section className="mb-8 space-y-4">
            <h2 className="font-semibold text-xl">5. 信息共享</h2>
            <p className="text-foreground/90 leading-relaxed">
              我们不会出售您的个人信息。在以下情况下，我们可能会共享您的信息：
            </p>
            <ul className="list-disc space-y-2 pl-6 text-foreground/90">
              <li>
                <strong>施工队匹配</strong> - 当包工头购买线索后，我们会向其提供您的联系方式以便为您提供报价服务
              </li>
              <li>
                <strong>法律要求</strong> - 当法律法规要求我们披露信息时
              </li>
              <li>
                <strong>安全保护</strong> - 为防止欺诈或保护用户安全时
              </li>
            </ul>
          </section>

          <section className="mb-8 space-y-4">
            <h2 className="font-semibold text-xl">6. Cookie使用</h2>
            <p className="text-foreground/90 leading-relaxed">
              我们使用必要的Cookie来保证平台正常运行：
            </p>
            <ul className="list-disc space-y-2 pl-6 text-foreground/90">
              <li>
                <strong>会话Cookie</strong> - 用于身份验证和保持登录状态
              </li>
              <li>
                <strong>分析Cookie</strong> - 用于收集匿名化的使用数据
              </li>
            </ul>
          </section>

          <section className="mb-8 space-y-4">
            <h2 className="font-semibold text-xl">7. 您的权利</h2>
            <p className="text-foreground/90 leading-relaxed">您有权：</p>
            <ul className="list-disc space-y-2 pl-6 text-foreground/90">
              <li>访问我们持有的您的个人数据</li>
              <li>要求更正不准确的数据</li>
              <li>要求删除您的数据</li>
              <li>导出您的项目数据</li>
              <li>退出营销通信</li>
            </ul>
            <p className="mt-4 text-foreground/90 leading-relaxed">
              如需行使上述任何权利，请通过平台内的反馈功能联系我们。
            </p>
          </section>

          <section className="mb-8 space-y-4">
            <h2 className="font-semibold text-xl">8. 数据保留</h2>
            <p className="text-foreground/90 leading-relaxed">
              在您的账户处于活跃状态期间，我们会保留您的数据。如果您删除账户，我们将在30天内删除您的个人数据和项目数据，法律法规要求保留的信息除外。
            </p>
          </section>

          <section className="mb-8 space-y-4">
            <h2 className="font-semibold text-xl">9. 未成年人保护</h2>
            <p className="text-foreground/90 leading-relaxed">
              本平台不面向14岁以下的未成年人。我们不会故意收集14岁以下未成年人的个人信息。如果您认为我们收集了此类信息，请立即联系我们。
            </p>
          </section>

          <section className="mb-8 space-y-4">
            <h2 className="font-semibold text-xl">10. 政策变更</h2>
            <p className="text-foreground/90 leading-relaxed">
              我们可能会不时更新本隐私政策。如有重大变更，我们将在平台上发布更新后的政策通知您。在变更发布后继续使用本平台即表示您接受修订后的政策。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-semibold text-xl">11. 联系我们</h2>
            <p className="text-foreground/90 leading-relaxed">
              如果您对本隐私政策或我们处理您数据的方式有任何疑问，请通过平台内的反馈功能联系我们。
            </p>
          </section>
        </article>
      </main>
    </div>
  )
}
