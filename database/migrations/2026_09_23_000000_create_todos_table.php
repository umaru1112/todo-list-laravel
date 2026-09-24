<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('todos', function (Blueprint $table) {
            $table->id();
            $table->string('title', 255);
            $table->text('content')->nullable();
            $table->boolean('is_completed')->default(false);
            $table->timestamps();

            // 一覧表示（未完了優先ソート）を高速化するためのインデックス
            $table->index('is_completed');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('todos');
    }
};
