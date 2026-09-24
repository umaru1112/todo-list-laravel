<?php

namespace Database\Factories;

use App\Models\Todo;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Todo>
 */
class TodoFactory extends Factory
{
    protected $model = Todo::class;

    public function definition(): array
    {
        return [
            'title' => $this->faker->sentence(4),
            'content' => $this->faker->optional()->paragraph(),
            'is_completed' => false,
        ];
    }
}
