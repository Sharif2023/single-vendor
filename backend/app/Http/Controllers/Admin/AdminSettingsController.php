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
        'carrybee_store_id',
        'store_name',
        'store_email',
        'store_phone',
        'store_address',
    ];

    /**
     * Get all settings.
     * GET /api/admin/settings
     */
    public function index(): JsonResponse
    {
        $settings = Setting::whereIn('key', self::ALLOWED_KEYS)->get()
            ->map(fn ($s) => [
                'id'          => $s->id,
                'key'         => $s->key,
                'value'       => $s->type === 'boolean' ? filter_var($s->value, FILTER_VALIDATE_BOOLEAN) : $s->value,
                'type'        => $s->type,
                'description' => $s->description ?: ucwords(str_replace('_', ' ', $s->key)),
            ]);

        return response()->json($settings);
    }

    /**
     * Update one or more settings.
     * PUT /api/admin/settings
     */
    public function update(Request $request): JsonResponse
    {
        $rawSettings = $request->input('settings', $request->all());

        if (is_array($rawSettings)) {
            // Case 1: List of items [{ key: 'store_name', value: '...' }]
            if (isset($rawSettings[0]) && is_array($rawSettings[0]) && isset($rawSettings[0]['key'])) {
                foreach ($rawSettings as $item) {
                    if (in_array($item['key'], self::ALLOWED_KEYS, true)) {
                        $type = $this->inferType($item['key']);
                        Setting::set($item['key'], $item['value'] ?? '', $type);
                    }
                }
            } else {
                // Case 2: Key-value map { store_name: '...', ... }
                foreach ($rawSettings as $key => $value) {
                    if (in_array($key, self::ALLOWED_KEYS, true)) {
                        $type = $this->inferType($key);
                        Setting::set($key, $value ?? '', $type);
                    }
                }
            }
        }

        return response()->json(['message' => 'Settings updated successfully.']);
    }

    private function inferType(string $key): string
    {
        $booleans = ['payment_enabled', 'sslcommerz_is_sandbox'];
        return in_array($key, $booleans, true) ? 'boolean' : 'string';
    }
}
