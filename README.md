# Looply

支払い・利用実感・更新日をまとめ、サブスクリプションの「継続・見直し・解約候補」を見える化する管理アプリです。スマートフォンとWebブラウザの両方に対応しています。

## アプリを開く

**[Looplyの本番アプリを開く](https://looply-subscription-manager.minty-trail-0785.chatgpt.site)**

> ChatGPTでのサインインが必要です。現在の本番環境は所有者アカウントのみアクセスできます。

スマートフォンでは同じURLを開くと専用レイアウトになり、ブラウザの「ホーム画面に追加」からPWAとして起動できます。

## 動作確認

1. 上のリンクからLooplyを開きます。
2. 「ChatGPTで続ける」を選択してサインインします。
3. 「サブスクを追加」から料金、請求周期、開始日、次回更新日を登録します。
4. ホーム、更新カレンダー、分析レポートで支出と見直し候補を確認します。
5. 「連携・設定」では、Googleに接続してGmailの請求メールから候補を探し、内容を確認したものだけ登録できます。

CSVによる一括登録にも対応しています。Gmail連携はメールの変更・送信・削除ができない `gmail.readonly` だけを使用します。メール本文は解析後に破棄し、候補のサービス名・販売元・料金・周期・請求日と一方向ハッシュ化した参照IDだけを保存します。自動登録は行わず、本人が確認して選択した候補だけを一度に最大10件登録します。検索は20通ずつ行い、未確認のメールがある場合は「続きを探す」で段階的に確認できます。

## Google / Gmail設定

- Google Cloudプロジェクト: `looply-subscription-506608`
- OAuthクライアント種別: ウェブ アプリケーション
- 本番コールバック: `https://looply-subscription-manager.minty-trail-0785.chatgpt.site/api/integrations/google/callback`
- ローカルコールバック: `http://localhost:3000/api/integrations/google/callback`
- Gmail権限: `https://www.googleapis.com/auth/gmail.readonly`

現在はGoogle Auth Platformの「外部・テスト中」で、所有者をテストユーザーに登録しています。Googleのテスト公開仕様により、Gmail権限を含む認可は7日後に失効するため再接続が必要です。一般公開する場合は、所有するカスタムドメイン、プライバシーポリシー、GoogleのOAuth検証が別途必要です。

## 機密情報

実際の認証情報はローカルの `.env` と本番ホスティングの暗号化Secretだけに設定します。`.env` は権限 `0600` とし、秘密鍵、認証JSON、Cloudflareの `.dev.vars` などとともに `.gitignore` でGit管理対象外にしています。`.env.example` には公開可能なプロジェクトID、変数名、空のSecretプレースホルダーだけを記載しています。
