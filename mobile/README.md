# UI Atlas for iOS & Android

99種類のUIパターンを操作しながら学べるFlutterアプリです。検索、カテゴリ・プラットフォーム絞り込み、実在アプリ例、比較、アクセシビリティの要点、8問クイズ、学習進捗、お気に入りを収録しています。

## 動作環境

- Flutter 3.47.2
- Dart 3.13.2
- iOS 15.0以上
- AndroidはFlutter 3.47.2の標準`minSdkVersion`以上

## 起動

```bash
flutter pub get
flutter run
```

接続先を指定する場合:

```bash
flutter devices
flutter run -d <device-id>
```

## 品質チェック

```bash
dart format --output=none --set-exit-if-changed lib test
flutter analyze
flutter test
```

テストでは、教材99件と10カテゴリの整合性、99デモの標準画面・小画面・文字200%描画、検索と複合絞り込み、詳細遷移、次の教材へ移動した際の先頭復帰、進捗・お気に入り、8問クイズ、コントラスト、操作ラベル、Android/iOSのタップ領域を確認します。

## ビルド

```bash
flutter build apk --release
flutter build appbundle --release
flutter build ios --simulator
```

生成物:

- APK: `build/app/outputs/flutter-apk/app-release.apk`
- Android App Bundle: `build/app/outputs/bundle/release/app-release.aab`
- iOS Simulator app: `build/ios/iphonesimulator/Runner.app`

初期状態のAndroid releaseビルドはローカル動作確認用のdebug鍵を利用します。Google Playへ公開する前に`android/app/build.gradle.kts`へ安全なリリース署名を設定してください。App Storeへ公開する場合も、XcodeでApple Developer TeamとBundle Identifierを確認して実機用アーカイブを作成してください。秘密鍵や署名情報はリポジトリへコミットしないでください。

## 主な構成

- `lib/src/data/`: 99教材と8問クイズ
- `lib/src/domain/`: 教材モデルと検索正規化
- `lib/src/screens/`: 図鑑、詳細、クイズ、保存画面
- `lib/src/state/`: 進捗・お気に入りの端末内永続化
- `lib/src/widgets/pattern_demo.dart`: 99種類の操作可能なデモ
- `test/`: データ、状態、主要導線、レスポンシブ、アクセシビリティ検証
