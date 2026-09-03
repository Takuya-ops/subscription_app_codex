import type { Metadata } from 'next';
import { env } from 'cloudflare:workers';
import './globals.css';

const configuredOrigin = (env as unknown as { NEXT_PUBLIC_SITE_URL?: string }).NEXT_PUBLIC_SITE_URL;
const metadataBase = new URL(configuredOrigin?.startsWith('https://') ? configuredOrigin : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase,
  title: 'UI Atlas | 触って学ぶWeb・スマホUI図鑑',
  description: 'UIの名前、使いどころ、避ける場面、実在アプリの例をライブデモで学べるインタラクティブ図鑑。',
  applicationName: 'UI Atlas',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/favicon.svg' },
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'UI Atlas' },
  openGraph: {
    type: 'website',
    title: 'UI Atlas | 触って学ぶWeb・スマホUI図鑑',
    description: 'UIの名前と使い分けを、99のライブデモで学べるインタラクティブ図鑑。',
    images: [{ url: '/og.png', width: 1792, height: 925, alt: 'Looply — サブスクを、納得して続ける。' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UI Atlas | 触って学ぶWeb・スマホUI図鑑',
    description: 'UIの名前と使い分けを、99のライブデモで学べるインタラクティブ図鑑。',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body>{children}</body></html>;
}
