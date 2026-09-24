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
     * GET /api/todos?page=1
     */
    public function list(Request $request): JsonResponse
    {
        $perPage = 20;

        $todos = Todo::query()
            ->orderBy('is_completed') // 未完了を先に表示
            ->orderByDesc('created_at') // 同じ状態内では新しい順
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
     * 選択した複数のToDoを一括で完了状態にする。
     * POST /api/todos/bulk-complete
     */
    public function bulkComplete(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:todos,id'],
        ]);

        Todo::whereIn('id', $validated['ids'])->update(['is_completed' => true]);

        return response()->json(['message' => '選択したToDoを完了にしました']);
    }
}
