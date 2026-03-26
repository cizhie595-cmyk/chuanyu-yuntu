import { Agentation } from 'agentation'
import { GeistPixelSquare } from 'geist/font/pixel'
import type { Metadata } from 'next'
import { Noto_Sans_SC } from 'next/font/google'
import localFont from 'next/font/local'
import Script from 'next/script'
import './globals.css'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
})

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans-sc',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '川渝云图 - 农村自建房3D设计工具',
  description:
    '免费在线3D别墅设计工具，支持墙体、门窗、屋顶、家具布局，一键生成3D效果图。专为川渝地区农村自建房打造。',
  keywords: ['川渝云图', '农村自建房', '3D设计', '别墅设计', '自建房设计工具', '免费设计'],
  openGraph: {
    title: '川渝云图 - 农村自建房3D设计工具',
    description: '免费在线3D别墅设计，一键生成效果图，匹配本地施工队',
    type: 'website',
    siteName: '川渝云图',
    locale: 'zh_CN',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      className={`${geistSans.variable} ${geistMono.variable} ${GeistPixelSquare.variable} ${notoSansSC.variable}`}
      lang="zh-CN"
    >
      <head>
        {process.env.NODE_ENV === 'development' && (
          <Script
            crossOrigin="anonymous"
            src="//unpkg.com/react-scan/dist/auto.global.js"
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body className="font-sans">
        {children}
        {process.env.NODE_ENV === 'development' && <Agentation />}
      </body>
    </html>
  )
}
