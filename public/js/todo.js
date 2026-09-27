/**
 * ToDoリスト SPA フロントエンド処理
 * ページ遷移・リロードなしで、一覧取得／登録／更新／削除／完了切替／一括操作を行う。
 * ライブラリは使わず、ブラウザ標準の fetch() のみで実装。
 */
document.addEventListener('DOMContentLoaded', () => {
    // ---- DOM要素の取得 ----
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
    const form = document.getElementById('todo-form');
    const titleInput = document.getElementById('title');
    const contentInput = document.getElementById('content');
    const formError = document.getElementById('form-error');
    const submitBtn = document.getElementById('submit-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const listEl = document.getElementById('todo-list');
    const paginationEl = document.getElementById('pagination');
    const loadingEl = document.getElementById('loading');
    const selectAllCheckbox = document.getElementById('select-all');
    const selectedCountEl = document.getElementById('selected-count');
    const bulkCompleteBtn = document.getElementById('bulk-complete-btn');
    const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
    const toastContainer = document.getElementById('toast-container');
    const tabButtons = document.querySelectorAll('.tab-btn');

    // ---- 状態管理 ----
    let currentPage = 1;
    let currentStatus = 'pending'; // 'pending'（進行中） or 'completed'（完了）
    let editingId = null; // nullなら新規登録モード、値があれば編集モード
    const selectedIds = new Set(); // 一括操作用に選択中のToDo ID

    /**
     * fetch共通ヘッダー
     */
    function buildHeaders() {
        return {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-CSRF-TOKEN': csrfToken,
        };
    }

    function showError(message) {
        formError.textContent = message;
    }

    function clearError() {
        formError.textContent = '';
    }

    /**
     * 操作結果を知らせるトースト（バブル）を表示する
     */
    function showToast(message, isError = false) {
        const toast = document.createElement('div');
        toast.className = 'toast' + (isError ? ' toast-error' : '');
        toast.textContent = message;
        toastContainer.appendChild(toast);

        // 描画後にクラスを付けてフェードインさせる
        requestAnimationFrame(() => toast.classList.add('show'));

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    /**
     * 一覧をAPIから取得して描画する
     * 一覧の切り替え時にふわっとフェードするよう、描画前後でopacityを操作する。
     */
    async function fetchTodos(page = 1) {
        listEl.classList.add('is-transitioning');
        loadingEl.classList.remove('hidden');

        // fetchが速すぎてフェードアウトが見えない問題を防ぐため、最低限の時間を必ず待つ
        const minFade = new Promise((resolve) => setTimeout(resolve, 200));

        try {
            const [res] = await Promise.all([
                fetch(`/api/todos?page=${page}&status=${currentStatus}`, {
                    headers: buildHeaders(),
                }),
                minFade,
            ]);
            if (!res.ok) {
                throw new Error('一覧の取得に失敗しました。');
            }
            const json = await res.json();
            currentPage = json.meta.current_page;
            selectedIds.clear();
            renderList(json.data);
            renderPagination(json.meta);
            updateBulkToolbar();
        } catch (err) {
            showError(err.message);
        } finally {
            loadingEl.classList.add('hidden');
            // 次のフレームで解除することで、フェードイン(transition)がきちんと効く
            requestAnimationFrame(() => listEl.classList.remove('is-transitioning'));
        }
    }

    /**
     * タブ切り替え（進行中／完了）
     */
    tabButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            if (btn.dataset.status === currentStatus) return;
            currentStatus = btn.dataset.status;

            tabButtons.forEach((b) => {
                b.classList.toggle('active', b === btn);
                b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
            });

            // タブに応じて一括完了ボタンの文言を切り替える
            bulkCompleteBtn.textContent =
                currentStatus === 'completed' ? '選択を進行中に戻す' : '選択を完了にする';

            fetchTodos(1);
        });
    });

    /**
     * ToDo一覧をDOMに描画する
     */
    function renderList(todos) {
        listEl.innerHTML = '';

        if (todos.length === 0) {
            const li = document.createElement('li');
            li.className = 'empty';
            li.textContent = 'ToDoはまだありません。';
            listEl.appendChild(li);
            return;
        }

        todos.forEach((todo) => listEl.appendChild(renderItem(todo)));
    }

    /**
     * 1件分のToDo要素を組み立てる。
     * XSS対策として、ユーザー入力は必ず textContent で挿入する（innerHTMLは使用しない）。
     */
    function renderItem(todo) {
        const li = document.createElement('li');
        li.className = 'todo-item' + (todo.is_completed ? ' completed' : '');
        li.dataset.id = String(todo.id);

        // 一括操作用の選択チェックボックス（完了状態とは無関係）
        const selectCheckbox = document.createElement('input');
        selectCheckbox.type = 'checkbox';
        selectCheckbox.className = 'select-checkbox';
        selectCheckbox.setAttribute('aria-label', '一括操作用に選択');
        selectCheckbox.checked = selectedIds.has(todo.id);
        selectCheckbox.addEventListener('change', () => {
            if (selectCheckbox.checked) {
                selectedIds.add(todo.id);
            } else {
                selectedIds.delete(todo.id);
            }
            updateBulkToolbar();
        });

        const textWrap = document.createElement('div');
        textWrap.className = 'todo-text';

        const titleEl = document.createElement('p');
        titleEl.className = 'todo-title';
        titleEl.textContent = todo.title;
        textWrap.appendChild(titleEl);

        if (todo.content) {
            const contentEl = document.createElement('p');
            contentEl.className = 'todo-content';
            contentEl.textContent = todo.content;
            textWrap.appendChild(contentEl);
        }

        const actions = document.createElement('div');
        actions.className = 'todo-actions';

        // 完了状態トグルボタン（緑色ボタン。チェックボックスは使わない）
        const completeBtn = document.createElement('button');
        completeBtn.type = 'button';
        completeBtn.className = 'complete-toggle-btn' + (todo.is_completed ? ' is-completed' : '');
        completeBtn.textContent = todo.is_completed ? '進行中に戻す' : '完了にする';
        completeBtn.addEventListener('click', () => toggleComplete(todo));

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.textContent = '編集';
        editBtn.addEventListener('click', () => startEdit(todo));

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.textContent = '削除';
        deleteBtn.className = 'danger';
        deleteBtn.addEventListener('click', () => deleteTodo(todo));

        actions.append(completeBtn, editBtn, deleteBtn);
        li.append(selectCheckbox, textWrap, actions);
        return li;
    }

    /**
     * ページネーション（前へ／現在位置／次へ）を描画する
     */
    function renderPagination(meta) {
        paginationEl.innerHTML = '';
        if (meta.last_page <= 1) return;

        const prevBtn = document.createElement('button');
        prevBtn.type = 'button';
        prevBtn.textContent = '前へ';
        prevBtn.disabled = meta.current_page <= 1;
        prevBtn.addEventListener('click', () => fetchTodos(meta.current_page - 1));

        const info = document.createElement('span');
        info.textContent = `${meta.current_page} / ${meta.last_page} ページ（全${meta.total}件）`;

        const nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.textContent = '次へ';
        nextBtn.disabled = meta.current_page >= meta.last_page;
        nextBtn.addEventListener('click', () => fetchTodos(meta.current_page + 1));

        paginationEl.append(prevBtn, info, nextBtn);
    }

    /**
     * 一括操作ツールバー（選択件数・ボタンの有効/無効・全選択チェック）を更新する
     */
    function updateBulkToolbar() {
        const count = selectedIds.size;
        selectedCountEl.textContent = count > 0 ? `${count}件選択中` : '';
        bulkCompleteBtn.disabled = count === 0;
        bulkDeleteBtn.disabled = count === 0;

        const checkboxes = listEl.querySelectorAll('.select-checkbox');
        selectAllCheckbox.checked = checkboxes.length > 0 && count === checkboxes.length;
        selectAllCheckbox.indeterminate = count > 0 && count < checkboxes.length;
    }

    // 「全て選択」チェックボックス：現在のページ内の全件を選択/解除
    selectAllCheckbox.addEventListener('change', () => {
        const items = listEl.querySelectorAll('.todo-item');
        items.forEach((li) => {
            const id = Number(li.dataset.id);
            const checkbox = li.querySelector('.select-checkbox');
            if (selectAllCheckbox.checked) {
                selectedIds.add(id);
                if (checkbox) checkbox.checked = true;
            } else {
                selectedIds.delete(id);
                if (checkbox) checkbox.checked = false;
            }
        });
        updateBulkToolbar();
    });

    /**
     * 指定したIDのToDo要素をふわっと消してから一覧を再取得する
     */
    function animateRemoval(ids) {
        return new Promise((resolve) => {
            const idSet = new Set(ids.map(String));
            const items = Array.from(listEl.querySelectorAll('.todo-item')).filter((li) =>
                idSet.has(li.dataset.id)
            );
            if (items.length === 0) {
                resolve();
                return;
            }
            items.forEach((li) => li.classList.add('removing'));
            setTimeout(resolve, 220);
        });
    }

    // 選択項目を一括で完了 ⇔ 進行中に切り替える（タブに応じて方向が変わる）
    bulkCompleteBtn.addEventListener('click', async () => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;

        const makeCompleted = currentStatus !== 'completed'; // 進行中タブなら完了へ、完了タブなら進行中へ

        bulkCompleteBtn.disabled = true;
        try {
            const res = await fetch('/api/todos/bulk-complete', {
                method: 'POST',
                headers: buildHeaders(),
                body: JSON.stringify({ ids, is_completed: makeCompleted }),
            });
            if (!res.ok) throw new Error('一括更新に失敗しました。');

            showToast(`${ids.length}件を${makeCompleted ? '完了' : '進行中'}にしました`);
            await animateRemoval(ids);
            await fetchTodos(currentPage);
        } catch (err) {
            showToast(err.message, true);
        }
    });

    // 選択項目を一括削除する
    bulkDeleteBtn.addEventListener('click', async () => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;
        if (!window.confirm(`選択した${ids.length}件を削除しますか？`)) return;

        bulkDeleteBtn.disabled = true;
        try {
            const res = await fetch('/api/todos/bulk-delete', {
                method: 'POST',
                headers: buildHeaders(),
                body: JSON.stringify({ ids }),
            });
            if (!res.ok) throw new Error('一括削除に失敗しました。');

            showToast(`${ids.length}件を削除しました`);
            await animateRemoval(ids);
            await fetchTodos(1);
        } catch (err) {
            showToast(err.message, true);
        }
    });

    /**
     * 編集モードへ切り替え、フォームに既存の値を反映する
     */
    function startEdit(todo) {
        editingId = todo.id;
        titleInput.value = todo.title;
        contentInput.value = todo.content || '';
        submitBtn.textContent = '更新';
        cancelEditBtn.classList.remove('hidden');
        clearError();
        titleInput.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * フォームを新規登録モードに戻す
     */
    function resetForm() {
        editingId = null;
        form.reset();
        submitBtn.textContent = '追加';
        cancelEditBtn.classList.add('hidden');
        clearError();
    }
    cancelEditBtn.addEventListener('click', resetForm);

    /**
     * フォーム送信（新規登録 or 更新）
     */
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearError();

        const payload = {
            title: titleInput.value.trim(),
            content: contentInput.value.trim() || null,
        };

        submitBtn.disabled = true;
        try {
            const isEditing = editingId !== null;
            const url = isEditing ? `/api/todos/${editingId}` : '/api/todos';
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: buildHeaders(),
                body: JSON.stringify(payload),
            });

            if (res.status === 422) {
                const json = await res.json();
                const firstError = Object.values(json.errors)[0][0];
                showError(firstError);
                return;
            }
            if (!res.ok) {
                throw new Error('保存に失敗しました。');
            }

            const targetPage = isEditing ? currentPage : 1;
            showToast(isEditing ? `${payload.title}を更新しました` : `${payload.title}を追加しました`);
            resetForm();

            // 新規登録した項目は必ず「進行中」になるため、完了タブを見ていた場合は切り替える
            if (!isEditing && currentStatus !== 'pending') {
                currentStatus = 'pending';
                tabButtons.forEach((b) => {
                    const isPendingTab = b.dataset.status === 'pending';
                    b.classList.toggle('active', isPendingTab);
                    b.setAttribute('aria-selected', isPendingTab ? 'true' : 'false');
                });
                bulkCompleteBtn.textContent = '選択を完了にする';
            }

            await fetchTodos(targetPage);
        } catch (err) {
            showError(err.message);
        } finally {
            submitBtn.disabled = false;
        }
    });

    /**
     * 完了状態の切り替え（単体）
     */
    async function toggleComplete(todo) {
        try {
            const res = await fetch(`/api/todos/${todo.id}/complete`, {
                method: 'PATCH',
                headers: buildHeaders(),
            });
            if (!res.ok) {
                throw new Error('更新に失敗しました。');
            }
            const json = await res.json();
            const nowCompleted = json.data.is_completed;
            showToast(`${todo.title}を${nowCompleted ? '完了' : '進行中'}にしました`);
            await animateRemoval([todo.id]);
            await fetchTodos(currentPage);
        } catch (err) {
            showToast(err.message, true);
        }
    }

    /**
     * 削除（単体）
     */
    async function deleteTodo(todo) {
        if (!window.confirm(`「${todo.title}」を削除しますか？`)) return;
        try {
            const res = await fetch(`/api/todos/${todo.id}`, {
                method: 'DELETE',
                headers: buildHeaders(),
            });
            if (!res.ok) {
                throw new Error('削除に失敗しました。');
            }
            showToast(`${todo.title}を削除しました`);
            await animateRemoval([todo.id]);
            await fetchTodos(currentPage);
        } catch (err) {
            showToast(err.message, true);
        }
    }

    // ---- 初期表示 ----
    fetchTodos(1);
});
