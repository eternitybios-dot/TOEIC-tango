# TOEIC 単語帳（Target ベース）

英単語ターゲット系の高頻度語と、TOEIC でよく出るビジネス語を組み合わせた単語学習アプリです。

見出し語は受験・TOEIC で頻出の語彙をベースにしています。定義・例文はオリジナルで、書籍の文章は収録していません。

## できること

- カード学習（タップで裏返し、もう一度 / 覚えた）
- 4択クイズ（英→和 / 和→英）
- 間隔反復（簡易 SM-2）
- 発音（ブラウザの音声合成）
- 進捗・連続学習日数（この端末の localStorage）

## 構成

| パート | 内容 | 目安スコア |
| --- | --- | --- |
| 基礎 | Target 序盤帯の高頻度語 | 〜600 |
| 必修 | Target 中盤帯 | 〜730 |
| 発展 | Target 終盤帯 | 〜860 |
| ビジネス | TOEIC 頻出 | 〜990 |

全 420 語 / 10 UNIT。

## 開発

```bash
npm install
npm run dev
npm test
npm run build
```

学習記録はブラウザ内に保存されます。サーバーやアカウントは使いません。

## Web で開く

1. リポジトリの [Pages 設定](https://github.com/eternitybios-dot/TOEIC-tango/settings/pages) を開く
2. **Build and deployment → Source** を **GitHub Actions** にする
3. 公開 URL: https://eternitybios-dot.github.io/TOEIC-tango/
