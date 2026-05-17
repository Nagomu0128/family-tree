# family-tree

家系図をデータで管理する Next.js + Firebase の Web アプリ。PC / モバイル両対応のキャンバスで人物と関係を編集でき、招待制でコラボ編集できる。

## 主な機能

- Google サインイン (Firebase Auth)
- 複数ツリー / 役割 (owner / editor / viewer)
- react-flow キャンバス: 親子・配偶者・養子の可視化、pan / zoom / minimap
- 名前 (かな・漢字) インクリメンタル検索、基準人物からの親等フィルター、世代 / 性別 / 生年フィルター
- Undo / Redo (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z) + 変更履歴
- 公開リンク (読み取り専用) + PDF 出力 (SVG → 印刷ダイアログ)
- GEDCOM 5.5.1 import / export
- Firebase App Hosting でデプロイ

## セットアップ

```bash
npm install
cp .env.local.example .env.local   # Firebase Web 設定を埋める
npm run dev
```

Firebase コンソール側の準備:

1. プロジェクト作成 (例: `family-tree-e2751`)
2. **Authentication → Sign-in method** で Google プロバイダを有効化
3. **Firestore Database** を Native モード、リージョン `asia-northeast2` (大阪) で作成
4. Web アプリを登録し、表示された `firebaseConfig` を `.env.local` に貼り付け

## スクリプト

| コマンド | 用途 |
|---|---|
| `npm run dev` | 開発サーバー (Turbopack) |
| `npm run lint` | ESLint |
| `npm run format` / `format:check` | Prettier |
| `npm run build` | 本番ビルド |

## Firestore Rules / Indexes のデプロイ

```bash
# Firebase CLI が必要
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

ローカルの `firestore.rules` が本番に反映される。

## デプロイ (Firebase App Hosting)

1. Firebase コンソール → **App Hosting** → バックエンドを作成 (リージョン: `asia-northeast2`)
2. GitHub リポジトリを接続し、`main` ブランチを選択
3. ルートに `apphosting.yaml` がある状態で push → 自動デプロイ

> **注意**: Next.js 16 公式ドキュメントは Firebase App Hosting を「verified adapter」として明示していない。Firebase 公式ドキュメント (firebase.google.com/docs/app-hosting) で Next.js 16 の対応状況を確認してください。未対応の場合は Cloud Run + Dockerfile への移行を検討。

## CI

`.github/workflows/ci.yml` が PR / push (main) で:
- `npm ci`
- `npm run lint`
- `npm run build` (Firebase 変数はダミーで OK — クライアント SDK が初期化されないだけでビルドは通る)

## プロジェクト構造

```
app/
  trees/                  # ツリー一覧・編集
  share/[code]/           # 公開閲覧 (認証不要)
  login/                  # サインイン
components/
  family/                 # キャンバスと操作 UI
  trees/                  # ツリーシェル
  auth/                   # 認証関連
  ui/                     # 汎用 UI
lib/
  firebase/               # クライアント SDK 初期化
  auth/                   # AuthProvider / useAuth
  firestore/              # CRUD (trees, persons, relations, members, shareLinks, history)
  family/                 # 型 / レイアウト / 検索 / 親等 / Undo / SVG エクスポート
  gedcom/                 # import / export
```

## ライセンス

Private. 個人プロジェクト。
