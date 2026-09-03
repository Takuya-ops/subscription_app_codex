# UI Atlas

Web・スマホアプリで使われるUIの名前、適切な利用場面、避けるべき使い方を、実際に操作しながら学べるインタラクティブ図鑑です。Web版に加え、iOS・Android向けのFlutterネイティブアプリを同梱しています。

## デモ

**[Web版 UI Atlasを開く](https://looply-subscription-manager.minty-trail-0785.chatgpt.site)**

> 現在のデモ環境は所有者限定です。アクセス時にChatGPTでのサインインが必要です。Flutter版は[`mobile/`](mobile/)からiOS SimulatorまたはAndroid端末で起動できます。

## 学べること

- トグル、アコーディオン、モーダル、タブ、フォーム、ナビゲーションなど99種類のUIパターン
- 各UIの日本語名・英語名・概要・使う場面・避ける場面
- GitHub、Slack、Spotify、Google Maps、Airbnbなど実在アプリのユースケース
- Web向け・スマホ向け・共通パターンの検索と絞り込み
- 99種類すべてをその場で操作できるライブデモ
- 似たUIとの違いとアクセシビリティ上の注意点
- 8問の判断クイズ、端末内の学習進捗、お気に入り保存

## Flutter版

Flutter 3.47.2 / Dart 3.13.2で実装しています。教材とデモはネット接続なしで利用でき、学習進捗とお気に入りは端末内に保存されます。

```bash
cd mobile
flutter pub get
flutter run
```

品質チェックとリリースビルド:

```bash
flutter analyze
flutter test
flutter build apk --release
flutter build appbundle --release
flutter build ios --simulator
```

ストアへ配布する際は、Androidのリリース署名とApple Developer Teamの署名設定を別途行ってください。詳しくは[`mobile/README.md`](mobile/README.md)を参照してください。

## Web版

```bash
npm install
npm run dev
```

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## 技術構成

- Mobile: Flutter / Dart / Material 3 / SharedPreferences
- Web: React 19 / Next.js 16 / TypeScript / Vinext / Vite
- Hosting: OpenAI Sites

ソースコード: [GitHub](https://github.com/Takuya-ops/subscription_app_codex)
