import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '川渝云图 - 3D别墅方案预览',
  description: '在线3D预览别墅设计方案，支持360度全景查看。免费获取本地施工报价。',
  openGraph: {
    title: '川渝云图 - 3D别墅方案预览',
    description: '快来看看这个3D别墅设计方案！支持手机端360度全景查看。',
    type: 'website',
    siteName: '川渝云图',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: '#1f2433',
}

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
