import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '服务条款 - 川渝云图',
  description: '川渝云图平台服务条款',
}

export default function TermsPage() {
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
            <span className="font-medium text-foreground">服务条款</span>
            <span className="text-muted-foreground">|</span>
            <Link
              className="text-muted-foreground transition-colors hover:text-foreground"
              href="/privacy"
            >
              隐私政策
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-6 py-12">
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <h1 className="mb-2 font-bold text-3xl">服务条款</h1>
          <p className="mb-8 text-muted-foreground text-sm">生效日期：2026年2月20日</p>

          <section className="mb-8 space-y-4">
            <h2 className="font-semibold text-xl">1. 引言</h2>
            <p className="text-foreground/90 leading-relaxed">
              欢迎使用川渝云图平台（以下简称"平台"）。平台由川渝云图团队（以下简称"我们"）运营。访问或使用我们的服务即表示您同意本服务条款。
            </p>
          </section>

          <section className="mb-8 space-y-4">
            <h2 className="font-semibold text-xl">2. 平台服务</h2>
            <p className="text-foreground/90 leading-relaxed">
              川渝云图平台基于开源3D编辑器引擎开发，提供农村自建房在线3D设计工具。您可以使用平台进行房屋设计、生成3D效果图、分享设计方案，并获取本地施工队报价。
            </p>
            <p className="text-foreground/90 leading-relaxed">
              平台及其相关服务（包括用户账户、云存储、项目托管、线索交易）由我们运营和管理。本条款约束您对平台的使用。
            </p>
          </section>

          <section className="mb-8 space-y-4">
            <h2 className="font-semibold text-xl">3. 账户与认证</h2>
            <p className="text-foreground/90 leading-relaxed">
              使用平台的某些功能需要创建账户。我们支持微信授权登录和手机号验证码登录。您有责任维护账户安全，并对账户下发生的所有活动负责。
            </p>
          </section>

          <section className="mb-8 space-y-4">
            <h2 className="font-semibold text-xl">4. 使用规范</h2>
            <p className="text-foreground/90 leading-relaxed">您同意不会：</p>
            <ul className="list-disc space-y-2 pl-6 text-foreground/90">
              <li>将平台用于任何非法目的或违反适用法律法规</li>
              <li>上传、分享或传播侵犯知识产权的内容</li>
              <li>试图未经授权访问平台或其系统</li>
              <li>干扰或破坏平台的基础设施</li>
              <li>上传恶意代码、病毒或有害内容</li>
              <li>骚扰、辱骂或伤害其他用户</li>
              <li>使用平台发送垃圾信息或未经请求的通信</li>
              <li>提交虚假留资信息或恶意占用线索资源</li>
            </ul>
          </section>

          <section className="mb-8 space-y-4">
            <h2 className="font-semibold text-xl">5. 您的内容与知识产权</h2>
            <p className="text-foreground/90 leading-relaxed">
              您保留对您在平台上创建或上传的所有内容、项目和数据（"您的内容"）的完全所有权。使用平台即表示您授予我们有限的许可，仅用于存储、展示和传输您的内容以向您提供服务。
            </p>
            <p className="text-foreground/90 leading-relaxed">
              我们不对您的内容主张任何所有权。您可以随时导出或删除您的内容。
            </p>
          </section>

          <section className="mb-8 space-y-4">
            <h2 className="font-semibold text-xl">6. 线索交易规则</h2>
            <p className="text-foreground/90 leading-relaxed">
              平台提供业主留资与施工队线索匹配服务。相关规则如下：
            </p>
            <ul className="list-disc space-y-2 pl-6 text-foreground/90">
              <li>每条线索最多向3家施工队出售</li>
              <li>线索有效期为30天，7天后自动降价</li>
              <li>施工队购买线索后需在48小时内联系业主</li>
              <li>业主投诉经核实后可申请退款</li>
              <li>平台对线索信息的真实性不承担担保责任</li>
            </ul>
          </section>

          <section className="mb-8 space-y-4">
            <h2 className="font-semibold text-xl">7. 账户终止</h2>
            <p className="text-foreground/90 leading-relaxed">
              如果您违反本条款或从事我们认为对平台或其他用户有害的行为，我们保留暂停或终止您账户的权利。您也可以随时通过平台内的反馈功能联系我们删除账户。
            </p>
          </section>

          <section className="mb-8 space-y-4">
            <h2 className="font-semibold text-xl">8. 免责声明</h2>
            <p className="text-foreground/90 leading-relaxed">
              平台按"现状"和"可用"基础提供，不提供任何明示或暗示的保证，包括但不限于适销性、特定用途适用性和非侵权的暗示保证。
            </p>
            <p className="text-foreground/90 leading-relaxed">
              我们不保证平台不会中断、无错误或不含有害组件。3D设计仅供参考，实际施工请以专业建筑师的设计图纸为准。
            </p>
          </section>

          <section className="mb-8 space-y-4">
            <h2 className="font-semibold text-xl">9. 责任限制</h2>
            <p className="text-foreground/90 leading-relaxed">
              在法律允许的最大范围内，川渝云图团队不对因您使用平台而产生的任何间接、附带、特殊、后果性或惩罚性损害承担责任，包括数据丢失、利润损失或商誉损失。
            </p>
          </section>

          <section className="mb-8 space-y-4">
            <h2 className="font-semibold text-xl">10. 条款变更</h2>
            <p className="text-foreground/90 leading-relaxed">
              我们可能会不时更新本条款。如有重大变更，我们将在平台上发布更新后的条款通知您。在变更发布后继续使用本平台即表示您接受修订后的条款。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-semibold text-xl">11. 联系我们</h2>
            <p className="text-foreground/90 leading-relaxed">
              如果您对本条款有任何疑问，请通过平台内的反馈功能联系我们。
            </p>
          </section>
        </article>
      </main>
    </div>
  )
}
