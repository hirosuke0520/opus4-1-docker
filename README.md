# Mini CRM - 社内営業リード・案件管理ツール

営業リード、案件、活動を管理するための社内向けフルスタックCRMシステムです。Docker一発起動で即座に利用可能。

## 🚀 主な機能

### 認証・権限
- ✅ JWT認証（HttpOnlyクッキー、SameSite=Lax）
- ✅ ローカルユーザー管理（bcryptパスワードハッシュ）
- ✅ Admin/Memberロール表示

### ダッシュボード
- ✅ 本日の新規リード数
- ✅ オープン案件の総額と件数
- ✅ 今週期限の未完了アクティビティ数
- ✅ 最新リード・案件の一覧表示

### リード管理
- ✅ CRUD操作（作成・読取・更新・削除）
- ✅ 検索機能（名前、メール、電話番号）
- ✅ フィルタリング（ステータス、企業）
- ✅ ページネーション
- ✅ 詳細画面（関連案件・活動のタブ表示）
- ✅ スコアリング（0-100）

### 案件管理（カンバンボード）
- ✅ ドラッグ&ドロップでステージ変更
- ✅ 楽観的更新（即座のUI反映）
- ✅ エラー時の自動ロールバック
- ✅ キーボードアクセシビリティ（ドロップダウンでも変更可）
- ✅ 案件詳細ページ（編集・削除機能付き）
- ✅ ステージ別の案件総額表示

### 活動管理
- ✅ タイプ別活動（NOTE/TASK/CALL/EMAIL）
- ✅ 完了/未完了の切り替え
- ✅ 期限設定
- ✅ リード詳細画面でのインライン管理

### 企業管理
- ✅ CRUD操作
- ✅ リード数の自動集計表示
- ✅ ドメイン・メモ管理

## 🛠 技術スタック

- **フロントエンド**: Next.js 14 (App Router), TypeScript, Tailwind CSS, React Hook Form
- **バックエンド**: Hono.js, TypeScript, Zod
- **データベース**: MySQL 8
- **ORM**: Prisma
- **認証**: JWT (HttpOnly Cookie)
- **DnD**: @dnd-kit（カンバンボード）
- **テスト**: Vitest（API）, Playwright（E2E）
- **コンテナ**: Docker & Docker Compose

## 📦 セットアップ

### 前提条件
- Docker Desktop
- Git
- Node.js 20+ (E2Eテスト実行時のみ)

### クイックスタート（3分で起動）

```bash
# 1. リポジトリのクローン
git clone https://github.com/hirosuke0520/opus4-1-docker.git
cd opus4-1-docker

# 2. 環境変数の設定
cp .env.example .env

# 3. Docker起動（初回はビルドに3-5分、マイグレーション・シード自動実行）
docker compose up -d

# 4. ブラウザでアクセス
open http://localhost:3000
```

> 📝 **Note**: 初回起動時、データベースの準備とマイグレーション・シードが自動的に実行されます。

### アクセスURL

| サービス | URL | 説明 |
|---------|-----|------|
| フロントエンド | http://localhost:3000 | Next.jsアプリケーション |
| API | http://localhost:8787 | Hono.js APIサーバー |
| API Health | http://localhost:8787/health | ヘルスチェック |
| MySQL | localhost:3306 | データベース |

### ログイン情報

| Email | Password | Role | 説明 |
|-------|----------|------|------|
| admin@minicrm.local | admin123 | Admin | 管理者アカウント |
| member@minicrm.local | member123 | Member | 一般ユーザーアカウント |

### 初期データ
シードコマンド実行後、以下のサンプルデータが投入されます：
- 👤 ユーザー: 2件
- 🏢 企業: 5件
- 📋 リード: 50件
- 💼 案件: 30件
- ✅ 活動: 100件

## 💻 開発

### ディレクトリ構成

```
opus4-1-docker/
├── apps/
│   ├── api/                 # Hono.js APIサーバー
│   │   ├── prisma/         
│   │   │   ├── schema.prisma   # データベーススキーマ
│   │   │   └── seed.ts         # シードデータ
│   │   ├── src/
│   │   │   ├── routes/         # APIエンドポイント
│   │   │   ├── middleware/     # 認証・バリデーション
│   │   │   └── utils/          # ユーティリティ
│   │   └── tests/              # Vitestテスト
│   └── web/                 # Next.jsフロントエンド
│       ├── app/                # App Router
│       │   ├── dashboard/      # ダッシュボード
│       │   ├── leads/          # リード管理
│       │   ├── deals/          # 案件管理（カンバン）
│       │   └── companies/      # 企業管理
│       ├── components/         # 共通コンポーネント
│       └── lib/               # API通信・スキーマ
├── e2e/                     # Playwright E2Eテスト
├── docker-compose.yml       # Docker設定
└── run-e2e-tests.sh        # E2Eテスト実行スクリプト
```

### ローカル開発

```bash
# Dockerコンテナはそのままで、ホットリロードで開発
docker compose up -d

# ログ確認
docker compose logs -f api  # APIサーバーログ
docker compose logs -f web  # フロントエンドログ
```

## 🧪 テスト

### APIテスト（Vitest）

```bash
# Docker内で実行
docker compose exec api npm test

# カバレッジ付き
docker compose exec api npm run test:coverage
```

**テストケース**:
- ✅ 認証: ログイン成功/失敗、JWT検証、バリデーション
- ✅ リード: CRUD、検索、ページネーション、フィルタリング
- ✅ 案件: ステージ更新の冪等性、バリデーション

### E2Eテスト（Playwright）

```bash
# 自動実行スクリプト（推奨）
./run-e2e-tests.sh

# 手動実行
cd e2e
npm install
npx playwright install chromium
npm test

# UIモードでデバッグ
npm run test:ui
```

**テストシナリオ**:
1. ログイン → ダッシュボード表示
2. リード作成（フォーム入力）
3. 案件作成（リードに紐付け）
4. カンバンでステージ変更（ドロップダウン）
5. 活動の追加と完了切り替え

## 📡 API仕様

### エンドポイント一覧

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| **認証** |
| POST | `/auth/login` | ログイン（JWT発行） | ❌ |
| POST | `/auth/logout` | ログアウト | ✅ |
| GET | `/auth/me` | 現在のユーザー情報 | ✅ |
| **企業** |
| GET | `/companies` | 企業一覧 | ✅ |
| POST | `/companies` | 企業作成 | ✅ |
| GET | `/companies/:id` | 企業詳細 | ✅ |
| PATCH | `/companies/:id` | 企業更新 | ✅ |
| DELETE | `/companies/:id` | 企業削除 | ✅ |
| **リード** |
| GET | `/leads` | リード一覧（検索・フィルタ） | ✅ |
| POST | `/leads` | リード作成 | ✅ |
| GET | `/leads/:id` | リード詳細（関連データ含む） | ✅ |
| PATCH | `/leads/:id` | リード更新 | ✅ |
| DELETE | `/leads/:id` | リード削除 | ✅ |
| **案件** |
| GET | `/deals` | 案件一覧（ステージ別） | ✅ |
| POST | `/deals` | 案件作成 | ✅ |
| GET | `/deals/:id` | 案件詳細 | ✅ |
| PATCH | `/deals/:id` | 案件更新（ステージ変更含む） | ✅ |
| DELETE | `/deals/:id` | 案件削除 | ✅ |
| **活動** |
| GET | `/activities` | 活動一覧 | ✅ |
| POST | `/activities` | 活動作成 | ✅ |
| GET | `/activities/:id` | 活動詳細 | ✅ |
| PATCH | `/activities/:id` | 活動更新（完了切替含む） | ✅ |
| DELETE | `/activities/:id` | 活動削除 | ✅ |

### クエリパラメータ

| パラメータ | 説明 | 使用例 |
|-----------|------|--------|
| `page` | ページ番号（デフォルト: 1） | `?page=2` |
| `pageSize` | 1ページの件数（デフォルト: 20） | `?pageSize=50` |
| `q` | 検索クエリ（名前/メール/電話） | `?q=john` |
| `status` | ステータスフィルタ | `?status=NEW` |
| `companyId` | 企業IDフィルタ | `?companyId=uuid` |
| `stage` | 案件ステージフィルタ | `?stage=PROPOSAL` |
| `completed` | 活動の完了状態 | `?completed=false` |

## 🔒 セキュリティ

### 実装済みセキュリティ対策

- 🔐 **JWT認証**: HttpOnlyクッキー、7日間有効
- 🛡️ **CSRF保護**: Originヘッダーチェック（同一オリジンのみ許可）
- 🔑 **パスワード**: bcryptハッシュ化（salt rounds: 10）
- ✅ **バリデーション**: Zodスキーマによる入力検証
- 🚫 **SQLインジェクション対策**: Prisma ORMのプリペアドステートメント
- 📝 **エラーハンドリング**: 統一フォーマット、詳細情報の隠蔽

## ⚡ パフォーマンス最適化

- **データベースインデックス**
  - `Lead(status, createdAt)`: ステータス別の最新リード取得
  - `Deal(stage)`: カンバンボードの高速表示
  - `Activity(leadId, completed, dueDate)`: 活動の効率的なフィルタリング

- **N+1問題対策**
  - Prismaの`include`/`select`を活用
  - 関連データの一括取得

- **楽観的更新**
  - カンバンボードで即座のUI反映
  - 失敗時の自動ロールバック

- **ページネーション**
  - サーバーサイド実装
  - 大量データ対応

## 🐛 トラブルシューティング

### よくある問題と解決方法

| 問題 | 原因 | 解決方法 |
|------|------|----------|
| **コンテナが起動しない** | Dockerが起動していない | Docker Desktopを起動 |
| **ポート競合エラー** | 3000/8787番ポートが使用中 | `.env`でポート変更 |
| **データベース接続エラー** | MySQLが起動していない | `docker compose restart db` |
| **マイグレーションエラー** | スキーマ不整合 | `docker compose exec api npx prisma migrate reset` |
| **ログインできない** | シードデータ未投入 | `docker compose restart api` (自動で再実行) |
| **画面が表示されない** | ビルドエラー | `docker compose down && docker compose up -d --build` |

### デバッグコマンド

```bash
# コンテナ状態確認
docker compose ps

# リアルタイムログ
docker compose logs -f

# 特定サービスのログ
docker compose logs api -n 100  # 最新100行
docker compose logs web --since 5m  # 過去5分

# コンテナに入る
docker compose exec api sh
docker compose exec web sh

# データベース確認
docker compose exec db mysql -uroot -ppassword minicrm

# 完全リセット
docker compose down -v  # ボリューム含めて削除
docker compose up -d --build
```

## 📊 データモデル

### ER図概要

```
User (認証)
  ├─ email (unique)
  ├─ passwordHash
  └─ role (ADMIN/MEMBER)

Company ─── Lead ─── Deal
    │        │        └─ stage (5段階)
    │        │        └─ amount
    │        └─── Activity
    │              └─ type (NOTE/TASK/CALL/EMAIL)
    │              └─ completed
    └─ domain
    └─ notes
```

### テーブル仕様

- **User**: 認証ユーザー管理
- **Company**: 企業マスタ（ユニーク制約: name）
- **Lead**: リード（見込み客）管理
- **Deal**: 案件管理（カンバンボード対応）
- **Activity**: 活動履歴（タスク・メモ等）

## 🚀 今後の拡張案

- [ ] メール通知機能
- [ ] ファイルアップロード
- [ ] レポート・分析機能
- [ ] Webhook連携
- [ ] モバイル対応（PWA）
- [ ] 多言語対応（i18n）
- [ ] リアルタイム更新（WebSocket）
- [ ] 高度な権限管理（RBAC）

## 📝 ライセンス

MIT License - 商用利用可能

## 🤝 コントリビューション

Issue・PRお待ちしています！
https://github.com/hirosuke0520/opus4-1-docker

---

Built with ❤️ using Next.js, Hono.js, Prisma, and Docker