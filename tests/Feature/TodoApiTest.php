<?php

namespace Tests\Feature;

use App\Models\Todo;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TodoApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_todos(): void
    {
        Todo::factory()->count(3)->create();

        $response = $this->getJson('/api/todos');

        $response->assertOk()->assertJsonCount(3, 'data');
    }

    public function test_list_is_paginated_by_20(): void
    {
        Todo::factory()->count(25)->create();

        $response = $this->getJson('/api/todos');

        $response->assertOk()
            ->assertJsonCount(20, 'data')
            ->assertJsonPath('meta.total', 25)
            ->assertJsonPath('meta.last_page', 2);
    }

    public function test_can_create_todo(): void
    {
        $response = $this->postJson('/api/todos', [
            'title' => '牛乳を買う',
            'content' => 'スーパーで買う',
        ]);

        $response->assertCreated()->assertJsonPath('data.title', '牛乳を買う');

        $this->assertDatabaseHas('todos', ['title' => '牛乳を買う']);
    }

    public function test_title_is_required(): void
    {
        $response = $this->postJson('/api/todos', ['title' => '']);

        $response->assertStatus(422)->assertJsonValidationErrors('title');
    }

    public function test_can_update_todo(): void
    {
        $todo = Todo::factory()->create(['title' => '旧タイトル']);

        $response = $this->putJson("/api/todos/{$todo->id}", [
            'title' => '新タイトル',
            'content' => null,
        ]);

        $response->assertOk()->assertJsonPath('data.title', '新タイトル');
    }

    public function test_can_toggle_complete(): void
    {
        $todo = Todo::factory()->create(['is_completed' => false]);

        $response = $this->patchJson("/api/todos/{$todo->id}/complete");

        $response->assertOk()->assertJsonPath('data.is_completed', true);

        // もう一度呼ぶと元に戻る
        $this->patchJson("/api/todos/{$todo->id}/complete")
            ->assertJsonPath('data.is_completed', false);
    }

    public function test_can_delete_todo(): void
    {
        $todo = Todo::factory()->create();

        $response = $this->deleteJson("/api/todos/{$todo->id}");

        $response->assertNoContent();
        $this->assertDatabaseMissing('todos', ['id' => $todo->id]);
    }

    public function test_updating_nonexistent_todo_returns_404(): void
    {
        $response = $this->putJson('/api/todos/999', ['title' => 'テスト']);

        $response->assertNotFound();
    }
}
