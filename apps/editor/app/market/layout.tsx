import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: '抢单大厅 - 川渝云图',
  description: '川渝云图装修线索市场，精准匹配本地业主需求，助力包工头高效获客。',
  openGraph: {
    title: '抢单大厅 - 川渝云图',
    description: '精准装修线索，助力高效获客',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function MarketLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
