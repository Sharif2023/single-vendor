<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSettingsController extends Controller
{
    // Allowed configurable settings keys
    private const ALLOWED_KEYS = [
        'payment_enabled',
        'sslcommerz_store_id',
        'sslcommerz_store_password',
        'sslcommerz_is_sandbox',
        'carrybee_api_key',
        'store_name',
        'store_email',
        'store_phone',
    ];

    /**
     * Get all settings.
     * GET /api/admin/settings
     */
    public function index(): JsonResponse
    {
        $settings = Setting::whereIn('key', self::ALLOWED_KEYS)->get()
            ->map(fn ($s) => [
                'key'         => $s->key,
                'value'       => $s->type === 'boolean' ? filter_var($s->value, FILTER_VALIDATE_BOOLEAN) : $s->value,
                'type'        => $s->type,
                'description' => $s->description,
            ]);

        return response()->json($settings);
    }

    /**
     * Update one or more settings.
     * PUT /api/admin/settings
     */
    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'settings'           => 'required|array',
            'settings.*.key'     => 'required|string|in:' . implode(',', self::ALLOWED_KEYS),
            'settings.*.value'   => 'required',
        ]);

        foreach ($data['settings'] as $setting) {
            $type = $this->inferType($setting['key']);
            Setting::set($setting['key'], $setting['value'], $type);
        }

        return response()->json(['message' => 'Settings updated.']);
    }

    private function inferType(string $key): string
    {
        $booleans = ['payment_enabled', 'sslcommerz_is_sandbox'];
        return in_array($key, $booleans) ? 'boolean' : 'string';
    }
}
