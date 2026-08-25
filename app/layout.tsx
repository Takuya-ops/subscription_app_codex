import type { Metadata } from 'next';
import { env } from 'cloudflare:workers';
import './globals.css';

const configuredOrigin = (env as unknown as { NEXT_PUBLIC_SITE_URL?: string }).NEXT_PUBLIC_SITE_URL;
const metadataBase = new URL(configuredOrigin?.startsWith('https://') ? configuredOrigin : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase,
  title: 'Looply | サブスクを、納得して続ける',
  description: '支払い・利用実感・更新日をまとめて管理し、続けるべきサブスクを見える化する管理アプリ。',
  applicationName: 'Looply',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon-192.png', apple: '/icon-192.png' },
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Looply' },
  openGraph: {
    type: 'website',
    title: 'Looply | サブスクを、納得して続ける',
    description: '支払い・利用実感・更新日をまとめて、続ける価値を見える化。',
    images: [{ url: '/og.png', width: 1792, height: 925, alt: 'Looply — サブスクを、納得して続ける。' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Looply | サブスクを、納得して続ける',
    description: '支払い・利用実感・更新日をまとめて、続ける価値を見える化。',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body>{children}</body></html>;
}
