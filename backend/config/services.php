<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // ── SSLCommerz ────────────────────────────────────────────────────────────
    'sslcommerz' => [
        'store_id'       => env('SSLCOMMERZ_STORE_ID'),
        'store_password' => env('SSLCOMMERZ_STORE_PASSWORD'),
        'is_sandbox'     => env('SSLCOMMERZ_SANDBOX', true),
        'success_url'    => env('SSLCOMMERZ_SUCCESS_URL', env('APP_URL') . '/api/payment/success'),
        'fail_url'       => env('SSLCOMMERZ_FAIL_URL', env('APP_URL') . '/api/payment/fail'),
        'cancel_url'     => env('SSLCOMMERZ_CANCEL_URL', env('APP_URL') . '/api/payment/cancel'),
        'ipn_url'        => env('SSLCOMMERZ_IPN_URL', env('APP_URL') . '/api/payment/ipn'),
    ],

    // ── CarryBee ──────────────────────────────────────────────────────────────
    'carrybee' => [
        'api_url' => env('CARRYBEE_API_URL', 'https://api.carrybee.com/v1'),
        'api_key' => env('CARRYBEE_API_KEY'),
    ],

];
