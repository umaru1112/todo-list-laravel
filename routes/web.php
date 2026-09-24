<?php

use App\Http\Controllers\TodoController;
use Illuminate\Support\Facades\Route;

// SPAのエントリーポイント（初回アクセス時に一覧を含むページを返す）
Route::get('/', [TodoController::class, 'index'])->name('todos.index');

// ToDo用API（単一ユーザー運用のため認証なし。throttleで簡易的な過剰アクセス対策を行う）
Route::prefix('api/todos')->middleware('throttle:60,1')->group(function () {
    Route::get('/', [TodoController::class, 'list'])->name('todos.list');
    Route::post('/', [TodoController::class, 'store'])->name('todos.store');
    Route::put('/{todo}', [TodoController::class, 'update'])->name('todos.update');
    Route::patch('/{todo}/complete', [TodoController::class, 'toggleComplete'])->name('todos.complete');
    Route::post('/bulk-delete', [TodoController::class, 'bulkDestroy'])->name('todos.bulkDestroy');
    Route::post('/bulk-complete', [TodoController::class, 'bulkComplete'])->name('todos.bulkComplete');
    Route::delete('/{todo}', [TodoController::class, 'destroy'])->name('todos.destroy');
});
