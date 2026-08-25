import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Looply — サブスク管理',
    short_name: 'Looply',
    description: '支払い・利用実感・更新日をまとめて、続ける価値を見える化します。',
    start_url: '/',
    display: 'standalone',
    background_color: '#F5F7F3',
    theme_color: '#1D6B47',
    lang: 'ja',
    categories: ['finance', 'productivity', 'utilities'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
