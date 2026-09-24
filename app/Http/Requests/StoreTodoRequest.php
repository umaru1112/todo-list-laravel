<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTodoRequest extends FormRequest
{
    /**
     * 単一ユーザー・認証なし運用のため常に許可する。
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string', 'max:5000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'タイトルは必須です。',
            'title.max' => 'タイトルは255文字以内で入力してください。',
            'content.max' => '内容は5000文字以内で入力してください。',
        ];
    }
}
