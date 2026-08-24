# TOEIC フレーズ単語帳

TOEICでよく出る語を、短いフレーズで覚えるアプリです。

見出し語は試験の事務・会議・旅行・人事で使う語です。フレーズと日本語はオリジナルで、書籍の例文は収録していません。

## できること

- 短いフレーズでカード学習（英フレーズ + 日本語）
- 4択クイズ（英 → 和 / 和 → 英）
- 間隔反復、発音、学習記録（この端末に保存）

## 構成

| パート | 語数 | 内容 |
| --- | --- | --- |
| 基礎 | 1–800 | 常に出る基本語 |
| 必修 | 801–1500 | 重要語 |
| 発展 | 1501–2000 | 差がつく語 |

全 2000 語 / 20 UNIT。

## 開発

```bash
npm install
npm run dev
npm test
npm run build
```

## Android アプリ

既存の Web アプリを Capacitor で包んでいます。学習データはこれまで通り端末内（WebView の localStorage）に保存されます。

必要なもの:

- [Android Studio](https://developer.android.com/studio)（Ladybug 以降。JDK 21 同梱）
- Android SDK（API 24 以上。実機またはエミュレータ）

```bash
npm install
npm run build:android
npm run android:open
```

Android Studio で端末またはエミュレータを選び、Run するとインストールされます。APK を書き出す場合は **Build → Build Bundle(s) / APK(s) → Build APK(s)** です。

Web の見た目を変えたあとは、毎回 `npm run build:android` してから Run してください。

## Web で開く

https://eternitybios-dot.github.io/TOEIC-tango/
