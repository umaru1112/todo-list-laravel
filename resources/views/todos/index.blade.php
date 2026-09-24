<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    {{-- Ajaxリクエストで送信するCSRFトークン --}}
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>ToDoリスト</title>
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
</head>
<body>
    <div class="container">
        <h1>ToDoリスト</h1>

        <form id="todo-form" class="todo-form" novalidate>
            <div class="form-group">
                <label for="title">タイトル<span class="required">*</span></label>
                <input type="text" id="title" name="title" maxlength="255" required>
            </div>
            <div class="form-group">
                <label for="content">内容</label>
                <textarea id="content" name="content" maxlength="5000" rows="3"></textarea>
            </div>
            <div id="form-error" class="form-error" role="alert"></div>
            <button type="submit" id="submit-btn">追加</button>
            <button type="button" id="cancel-edit-btn" class="hidden secondary">キャンセル</button>
        </form>

        <div id="loading" class="loading hidden">読み込み中...</div>

        <div class="toolbar">
            <label class="select-all-label">
                <input type="checkbox" id="select-all">
                全て選択
            </label>
            <span id="selected-count" class="selected-count"></span>
            <button type="button" id="bulk-complete-btn" disabled>選択を完了にする</button>
            <button type="button" id="bulk-delete-btn" class="danger" disabled>選択した項目を削除</button>
        </div>

        <ul id="todo-list" class="todo-list"></ul>

        <div id="pagination" class="pagination"></div>
    </div>

    {{-- 操作結果を知らせるトースト通知の表示先 --}}
    <div id="toast-container" class="toast-container" aria-live="polite"></div>

    <script src="{{ asset('js/todo.js') }}"></script>
</body>
</html>
