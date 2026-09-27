<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTodoRequest;
use App\Http\Requests\UpdateTodoRequest;
use App\Http\Resources\TodoResource;
use App\Models\Todo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class TodoController extends Controller
{
    /**
     * SPAのエントリーポイント（Bladeを1回だけ返す）
     */
    public function index(): View
    {
        return view('todos.index');
    }

    /**
     * ToDo一覧をページネーション付きで取得する。
     * GET /api/todos?page=1&status=pending|completed
     */
    public function list(Request $request): JsonResponse
    {
        $perPage = 20;
        $status = $request->query('status', 'pending');

        $todos = Todo::query()
            ->when($status === 'completed', fn ($q) => $q->where('is_completed', true))
            ->when($status === 'pending', fn ($q) => $q->where('is_completed', false))
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json([
            'data' => TodoResource::collection($todos->items()),
            'meta' => [
                'current_page' => $todos->currentPage(),
                'last_page' => $todos->lastPage(),
                'per_page' => $todos->perPage(),
                'total' => $todos->total(),
            ],
        ]);
    }

    /**
     * 新規ToDoを登録する。
     * POST /api/todos
     */
    public function store(StoreTodoRequest $request): JsonResponse
    {
        $todo = Todo::create($request->validated());

        return response()->json([
            'data' => new TodoResource($todo),
        ], 201);
    }

    /**
     * 既存ToDoの内容を更新する。
     * PUT /api/todos/{todo}
     */
    public function update(UpdateTodoRequest $request, Todo $todo): JsonResponse
    {
        $todo->update($request->validated());

        return response()->json([
            'data' => new TodoResource($todo),
        ]);
    }

    /**
     * 完了状態を反転させる。
     * PATCH /api/todos/{todo}/complete
     */
    public function toggleComplete(Todo $todo): JsonResponse
    {
        $todo->update([
            'is_completed' => ! $todo->is_completed,
        ]);

        return response()->json([
            'data' => new TodoResource($todo),
        ]);
    }

    /**
     * ToDoを削除する。
     * DELETE /api/todos/{todo}
     */
    public function destroy(Todo $todo): JsonResponse
    {
        $todo->delete();

        return response()->json(null, 204);
    }

    /**
     * 選択した複数のToDoを一括削除する。
     * POST /api/todos/bulk-delete
     */
    public function bulkDestroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:todos,id'],
        ]);

        Todo::whereIn('id', $validated['ids'])->delete();

        return response()->json(null, 204);
    }

    /**
     * 選択した複数のToDoの完了状態を一括で変更する（デフォルトは完了にする）。
     * POST /api/todos/bulk-complete
     */
    public function bulkComplete(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:todos,id'],
            'is_completed' => ['sometimes', 'boolean'],
        ]);

        $isCompleted = $validated['is_completed'] ?? true;

        Todo::whereIn('id', $validated['ids'])->update(['is_completed' => $isCompleted]);

        return response()->json([
            'message' => $isCompleted ? '選択したToDoを完了にしました' : '選択したToDoを進行中に戻しました',
        ]);
    }
}
