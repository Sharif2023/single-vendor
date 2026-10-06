<?php

use App\Models\Delivery;
use App\Models\Order;
use App\Services\DeliveryService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ── Scheduled Tasks ──────────────────────────────────────────────────────────

/**
 * Every 6 hours: sync delivery status from CarryBee for in-transit deliveries.
 *
 * Why scheduled? CarryBee doesn't always provide webhooks, so we poll.
 * We limit to in_transit status to avoid unnecessary API calls.
 * 6-hour interval is a business-acceptable freshness for delivery updates.
 */
Schedule::call(function () {
    $deliveryService = app(DeliveryService::class);

    Delivery::where('status', Delivery::STATUS_IN_TRANSIT)
        ->whereNotNull('consignment_id')
        ->with('order')
        ->chunk(50, function ($deliveries) use ($deliveryService) {
            foreach ($deliveries as $delivery) {
                $deliveryService->syncStatus($delivery);
                usleep(200000); // 200ms between requests to be polite to CarryBee API
            }
        });
})->everySixHours()->name('sync-delivery-status')->withoutOverlapping();

/**
 * Daily at 2am: cancel abandoned pending orders older than 24 hours.
 *
 * Why scheduled? Abandoned checkouts (user initiated payment but never completed)
 * hold stock in a 'pending' state but never progress. Daily cleanup releases that stock.
 *
 * At 2am to minimize impact on active users. 24h grace period is generous.
 */
Schedule::call(function () {
    $abandoned = Order::where('status', Order::STATUS_PENDING)
        ->where('created_at', '<', now()->subHours(24))
        ->with('items')
        ->get();

    $orderService = app(\App\Services\OrderService::class);

    foreach ($abandoned as $order) {
        try {
            $orderService->cancel($order);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to cancel abandoned order', [
                'order_id' => $order->id,
                'error'    => $e->getMessage(),
            ]);
        }
    }
})->dailyAt('02:00')->name('cancel-abandoned-orders')->withoutOverlapping();
