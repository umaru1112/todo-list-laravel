# ToDoリスト（Laravel + Ajax / SPA）

単一ユーザー運用を前提とした、ページ遷移なしのToDo管理Webアプリケーションです。

## 1. ソースコード

このリポジトリ一式が成果物です。GitHub等に公開する場合は、このディレクトリをそのまま
リポジトリのルートとして push してください（Laravelの標準アプリ構成に、以下の
ToDo機能に関するファイルのみを追加・変更しています）。

```
app/Http/Controllers/TodoController.php
app/Http/Requests/StoreTodoRequest.php
app/Http/Requests/UpdateTodoRequest.php
app/Http/Resources/TodoResource.php
app/Models/Todo.php
database/factories/TodoFactory.php
database/migrations/2026_09_23_000000_create_todos_table.php
resources/views/todos/index.blade.php
public/css/app.css
public/js/todo.js
routes/web.php
tests/Feature/TodoApiTest.php
```

## 2. 動作確認方法（セットアップ手順）

このアプリはLaravelの標準インストーラー上に構築しています。お手元の環境で
以下の手順を実行してください（本番用にデプロイ済みURLを用意する場合は、
別途サーバー上で同じ手順を実施のうえURLを共有します）。

```bash
# 1. Laravel 11 の新規プロジェクトを作成
composer create-project laravel/laravel todo-list-laravel
cd todo-list-laravel

# 2. 本リポジトリのToDo関連ファイルを、上記の対応パスに上書きコピーする

# 3. .env を設定（MySQL接続情報）
cp .env.example .env
php artisan key:generate
# .env の DB_DATABASE / DB_USERNAME / DB_PASSWORD 等を環境に合わせて設定

# 4. マイグレーション実行
php artisan migrate

# 5. 開発サーバー起動
php artisan serve
# → http://127.0.0.1:8000 にアクセス
```

動作確認（自動テスト）:

```bash
php artisan test
```

## 3. 使用バージョン

- PHP: 8.5.10（8.2以上で動作想定）
- Laravel: 13.33.0
- MySQL: 26.7.0

## 4. 作成物についてのコメント

### 設計・実装時に配慮した点

- **安全性**: Form Requestによるサーバー側バリデーション、Modelの`$fillable`
  によるマスアサインメント対策、Bladeのcsrf-tokenを全Ajaxリクエストに付与、
  フロントエンドのDOM挿入は`textContent`のみを使用しXSSを防止、Eloquent/Query
  Builderのみ使用しSQLインジェクションを回避、APIルートに`throttle`ミドルウェア
  を設定し簡易的な過剰アクセス対策を実施。
- **保守性**: Controller・FormRequest・Resourceを役割ごとに分離し、単一責任を
  意識。フロントエンドはフレームワークを使わず`fetch()`のみで実装することで、
  依存関係を最小化し可読性を優先。
- **UX**: 完了/未完了の並び替え（未完了を上に表示）、編集中はフォームが
  「更新」ボタンに切り替わりキャンセル可能、バリデーションエラーをその場で表示。

### 判断に迷った点・トレードオフ

- **フロントエンドフレームワークの不使用**: Vue/Reactの利用は任意とされていた
  ため、依存の少なさとコードの見通しを優先しVanilla JSを選択。画面規模が
  今後拡大する場合はVue等への移行を検討。
- **編集UI**: モーダルではなくフォームを再利用するインライン編集方式を採用。
  実装をシンプルに保てる一方、同時に複数件を編集することはできない。
- **認証なし運用**: 課題要件どおり認証を省いたため、`routes/web.php`の
  APIエンドポイントは誰でもアクセス可能な状態。本番運用する場合は
  Sanctum等での認証導入が前提となる。
- **一覧の並び順**: 完了/未完了→作成日時の新しい順で固定。将来的に
  ソート・検索条件をユーザーが選べるようにする余地あり。

### 外部資料・生成AIの利用

- 本アプリケーションはClaude（Anthropic）を用いて設計・実装しました。
  要件定義に基づき、DB設計、API設計、CRUD実装、レスポンシブCSS、
  フロントエンドJS、自動テストを生成AIが作成し、人が要件との整合性を確認しています。

## 5. 開発に要したおおよその時間

要件整理・設計: 約40分
実装（バックエンドAPI + フロントエンドSPA + CSS）: 約2時間
テスト作成・動作確認: 約30分
合計: 約3.2時間

## 6. 改善案

1. **認証機能の追加**: 複数ユーザー対応や本番運用を見据え、Laravel Sanctum等で
   ログイン機能を実装する。
2. **検索・絞り込み**: タイトル検索、完了/未完了フィルタをAPIとUI双方に追加する。
3. **期限・優先度**: `due_date`や`priority`カラムを追加し、並び替え・リマインド
   機能を実装する。
4. **楽観的UI更新**: 現在は各操作後に一覧を再取得しているが、レスポンス内容を
   使ってDOMを直接更新することで体感速度を改善できる。
5. **ソフトデリート**: 誤削除対策として`SoftDeletes`を導入し、ゴミ箱機能を
   設ける。
6. **フロントエンドの型安全化**: 画面規模が拡大する場合はTypeScript導入や
   Vue/React化を検討する。
