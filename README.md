# and AJ paw-pads — 公式サイト

本リポジトリは **and AJ paw-pads 公式HP** 専用です。
モックアップ・検証用の `leon202622/test` リポジトリとは分離して管理します。

## 概要

愛犬・愛猫のためのハンドメイドアクセサリーショップ「and AJ paw-pads」の公式Webサイト。

**公開URL（GitHub Pages）:** https://leon202622.github.io/and-aj-pawpads-site/

---

## SCOR 方式・参考構成

本サイトは **公式HP（世界観・商品紹介）** と **BASE（購入・決済・注文管理）** を分離する SCOR 方式を採用しています。

### ページ構成（SCOR インスパイア）

| セクション | 内容 |
|-----------|------|
| CONCEPT | ブランドコンセプト・世界観紹介 |
| COLLECTION | 商品ラインナップ（カード表示・BASEへ誘導） |
| MAKER'S MESSAGE | 作り手のメッセージ・ハンドメイドの想い |
| SEMI ORDER | カスタムオーダー案内（Instagram DM 誘導） |
| GALLERY | お客様写真・イベント様子 |
| EVENTS | 出店予定情報（Instagram一次情報明記） |
| FAQ | よくある質問（購入・オーダー・イベント） |
| CONTACT | Online Shop / Instagram / Creema 導線 |

> **参考レイアウト:** SCORワイヤー（https://scorwire.com/）の構成・余白感・ブランド感を参考にしています。色はジャカード teal 系を維持。

| 役割 | 場所 |
|------|------|
| ブランド紹介・商品紹介・ギャラリー・イベント情報 | **本サイト（GitHub Pages）** |
| 商品一覧・カート・決済・注文管理 | **BASE**（外部リンク） |
| オーダー相談・DM対応 | **Instagram** |
| サブ購入導線 | **Creema** |

### 方針

- **本HP内にカート・決済・個人情報入力フォームは作りません**
- Online Shop ボタンは BASE への外部リンクのみ
- Instagram DM によるオーダー相談導線を維持
- Creema はサブ導線として維持

> **BASE URL は現時点で仮URL（`https://andajpawpads.base.shop/`）です。**
> BASE ショップ開設後、`index.html` 内の全リンクを実URLへ更新してください。

---

## ディレクトリ構成

```
and-aj-pawpads-site/
├── index.html              # メインページ
├── assets/
│   ├── css/
│   │   └── style.css       # スタイルシート（jacquard-teal テーマ）
│   └── images/             # 画像ファイル（ギャラリー等）
└── README.md
```

## ページセクション

- **Hero** — ブランド名・キャッチコピー・主要CTAボタン
- **About** — ブランド紹介
- **Products** — 商品カテゴリ一覧（BASEへ誘導）
- **Gallery** — お客様写真・イベント様子
- **Events** — 出店予定イベント情報
- **Order / Contact** — 購入・オーダー・お問い合わせ導線

## 外部リンク

| サービス | URL | 用途 |
|---------|-----|------|
| BASE | https://andajpawpads.base.shop/ | メイン購入導線（**仮URL**） |
| Instagram | https://www.instagram.com/and.aj.pawpads | DM相談・情報発信 |
| Creema | https://www.creema.jp/c/and_aj_pawpads | サブ購入導線 |

---

## 画像の追加方法

`assets/images/` にファイルを追加後、`index.html` のギャラリーセクション内コメントアウト部分を有効化してください。

```html
<!-- 例 -->
<img src="assets/images/gallery-01.jpg" alt="お客様写真 1">
```

---

## デプロイ（GitHub Pages）

### 初回セットアップ（推奨）

```bash
cd C:\work\andaj\and-aj-pawpads-site
git init
git add .
git commit -m "Initial commit"
git branch -M main
gh repo create and-aj-pawpads-site --public --source=. --remote=origin --push
```

### リモートリポジトリが作成済みの場合

```bash
git remote add origin https://github.com/Leon202622/and-aj-pawpads-site.git
git push -u origin main
```

### GitHub Pages 有効化

1. リポジトリページ → Settings → Pages
2. Source: `Deploy from a branch`
3. Branch: `main` / `/ (root)` → Save
4. 公開URL: **https://leon202622.github.io/and-aj-pawpads-site/**

---

## 関連リポジトリ

| リポジトリ | 用途 |
|-----------|------|
| `leon202622/and-aj-pawpads-site`（本リポジトリ） | 公式HP本番用 |
| `leon202622/test` | モックアップ・デザイン検証用（保持） |

- デザイン参考（モックアップ）: [test/mockups/04-jacquard-teal](https://leon202622.github.io/test/mockups/04-jacquard-teal/index.html)
