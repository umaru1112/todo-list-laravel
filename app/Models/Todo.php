<?php

namespace App\Models;

use Database\Factories\TodoFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Todo extends Model
{
    /** @use HasFactory<TodoFactory> */
    use HasFactory;

    /**
     * マスアサインメント脆弱性対策として、更新可能なカラムを明示的に限定する。
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'title',
        'content',
        'is_completed',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_completed' => 'boolean',
        ];
    }
}
