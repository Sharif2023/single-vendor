<?php

use App\Http\Middleware\EnsureAdmin;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Register the 'admin' route middleware alias
        $middleware->alias([
            'admin' => EnsureAdmin::class,
        ]);

        // Trust all reverse proxies in production (Render, Cloudflare, load balancers)
        $middleware->trustProxies(at: '*');

        // Exclude API routes wrapped in 'web' middleware from CSRF checks
        $middleware->validateCsrfTokens(except: [
            'api/cart*',
            'api/checkout*',
            'api/payment/*'
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
