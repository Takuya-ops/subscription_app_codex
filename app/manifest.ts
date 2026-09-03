import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'UI Atlas — 触って学ぶUI図鑑',
    short_name: 'UI Atlas',
    description: 'Web・スマホUIの名前と使いどころを、ライブデモで学べます。',
    start_url: '/',
    display: 'standalone',
    background_color: '#EEF2F8',
    theme_color: '#14213D',
    lang: 'ja',
    categories: ['education', 'design', 'productivity'],
    icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
