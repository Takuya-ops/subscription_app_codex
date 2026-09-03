# UI Atlas

Web・スマホアプリで使われるUIの名前、適切な利用場面、避けるべき使い方を、実際に操作しながら学べるインタラクティブ図鑑です。

## デモ

**[UI Atlasを開く](https://looply-subscription-manager.minty-trail-0785.chatgpt.site)**

> 現在のデモ環境は所有者限定です。アクセス時にChatGPTでのサインインが必要です。

## 学べること

- トグル、アコーディオン、モーダル、タブ、フォーム、ナビゲーションなど99種類のUIパターン
- 各UIの日本語名・英語名・用途・使う場面・避ける場面
- GitHub、Slack、Spotify、Google Maps、Airbnbなど実在アプリのユースケース
- Web向け・スマホ向け・共通パターンの絞り込みと検索
- その場で触って挙動を確かめられるライブデモ
- 似たUIとの違い、アクセシビリティ上の注意点
- 8問の判断クイズによる理解度チェック

学習状況とお気に入りはブラウザに保存されます。スマートフォンにも対応し、ホーム画面へ追加できるPWAとして利用できます。

## ローカルで起動

```bash
npm install
npm run dev
```

品質チェックは次のコマンドで実行できます。

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## 技術構成

- React 19 / Next.js 16
- TypeScript
- Vinext / Vite
- OpenAI Sites
