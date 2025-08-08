# Mini CRM - 社内営業リード・案件管理ツール

営業リード、案件、活動を管理するための社内向けCRMシステムです。

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **バックエンド**: Hono.js, TypeScript
- **データベース**: MySQL 8
- **ORM**: Prisma
- **認証**: JWT (HttpOnly Cookie)
- **コンテナ**: Docker & Docker Compose

## 主な機能

- ✅ ユーザー認証（Email/Password）
- ✅ ダッシュボード（KPI表示）
- ✅ リード管理（CRUD、検索、フィルタリング）
- ✅ 案件管理（カンバンUI、ドラッグ&ドロップ）
- ✅ 活動管理（タスク、メモ、通話、メール）
- ✅ 企業管理
- ✅ 楽観的更新とロールバック

## セットアップ手順

### 前提条件

- Docker Desktop がインストールされていること
- Node.js 20+ (ローカル開発用)
- Git

### 1. リポジトリのクローン

```bash
git clone https://github.com/hirosuke0520/opus4-1-docker.git
cd opus4-1-docker
```

### 2. 環境変数の設定

```bash
cp .env.example .env
```

必要に応じて `.env` ファイルを編集してください。

### 3. Dockerコンテナの起動

```bash
docker compose up -d
```

初回起動時は、イメージのビルドに数分かかります。

### 4. データベースのマイグレーション

```bash
docker compose exec api npm run prisma:migrate
```

### 5. シードデータの投入

```bash
docker compose exec api npm run prisma:seed
```

これにより以下のデータが作成されます：
- ユーザー: 2件（admin@minicrm.local, member@minicrm.local）
- 企業: 5件
- リード: 50件
- 案件: 30件
- 活動: 100件

### 6. アプリケーションへのアクセス

- **フロントエンド**: http://localhost:3000
- **API**: http://localhost:8787
- **MySQL**: localhost:3306

### ログイン情報

| Email | Password | Role |
|-------|----------|------|
| admin@minicrm.local | admin123 | Admin |
| member@minicrm.local | member123 | Member |

## 開発

### ローカル開発環境の起動

```bash
# APIサーバーの開発モード起動
cd apps/api
npm install
npm run dev

# フロントエンドの開発モード起動
cd apps/web
npm install
npm run dev
```

### ディレクトリ構成

```
opus4-1-docker/
├── apps/
│   ├── api/            # Hono.js APIサーバー
│   │   ├── prisma/     # Prismaスキーマ、マイグレーション
│   │   ├── src/        # ソースコード
│   │   └── tests/      # APIテスト
│   └── web/            # Next.jsフロントエンド
│       ├── app/        # App Router
│       ├── components/ # Reactコンポーネント
│       └── lib/        # ユーティリティ
├── e2e/                # Playwright E2Eテスト
└── docker-compose.yml  # Docker設定
```

## テスト実行

### APIテスト

```bash
docker compose exec api npm test
```

テストケース：
- 認証API（ログイン成功/失敗、バリデーション）
- リードAPI（検索、ページネーション、フィルタリング）
- 案件API（ステージ更新の冪等性）

### E2Eテスト

```bash
cd e2e
npm install
npm test
```

シナリオ：
1. ログイン
2. リード作成
3. 案件作成
4. カンバンでステージ変更
5. 活動の追加と完了

## API仕様

### 認証

- `POST /auth/login` - ログイン
- `POST /auth/logout` - ログアウト
- `GET /auth/me` - 現在のユーザー情報

### リソース

- `GET/POST /companies` - 企業一覧/作成
- `GET/PATCH/DELETE /companies/:id` - 企業詳細/更新/削除
- `GET/POST /leads` - リード一覧/作成（検索、フィルタ対応）
- `GET/PATCH/DELETE /leads/:id` - リード詳細/更新/削除
- `GET/POST /deals` - 案件一覧/作成
- `GET/PATCH/DELETE /deals/:id` - 案件詳細/更新/削除
- `GET/POST /activities` - 活動一覧/作成
- `GET/PATCH/DELETE /activities/:id` - 活動詳細/更新/削除

### クエリパラメータ

- `page` - ページ番号（デフォルト: 1）
- `pageSize` - ページサイズ（デフォルト: 20）
- `q` - 検索クエリ（リードの名前/メール/電話）
- `status` - ステータスフィルタ
- `companyId` - 企業IDフィルタ

## パフォーマンス最適化

- データベースインデックス設定済み
- N+1問題対策（Prisma include/select）
- 楽観的更新（カンバンUI）
- サーバーサイドページネーション

## セキュリティ

- JWT認証（HttpOnly Cookie）
- CSRF保護（Originチェック）
- パスワードハッシュ化（bcrypt）
- 入力バリデーション（Zod）

## トラブルシューティング

### コンテナが起動しない

```bash
# コンテナの状態確認
docker compose ps

# ログ確認
docker compose logs api
docker compose logs web
docker compose logs db
```

### データベース接続エラー

```bash
# データベースの再起動
docker compose restart db

# マイグレーションの再実行
docker compose exec api npx prisma migrate reset
```

### ポート競合

`.env` ファイルでポート番号を変更してください：
```
API_PORT=8788
NEXT_PUBLIC_API_URL=http://localhost:8788
```

## ライセンス

MIT