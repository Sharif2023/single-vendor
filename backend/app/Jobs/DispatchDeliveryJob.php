<?php

namespace App\Jobs;

use App\Models\Delivery;
use App\Models\Order;
use App\Services\DeliveryService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Dispatches a paid order to CarryBee asynchronously.
 *
 * Retry strategy: 3 attempts with exponential backoff (60s, 300s, 900s).
 * On permanent failure: marks delivery as 'failed' and logs for manual review.
 *
 * Why async? CarryBee API has variable latency. Blocking the payment callback
 * response (which SSLCommerz polls) for delivery dispatch would:
 * 1. Delay the user's confirmation page
 * 2. Risk IPN timeout causing false payment failure
 * 3. Not be retryable on transient API errors
 */
class DispatchDeliveryJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $maxExceptions = 3;

    // Exponential backoff: 60s, 300s, 900s
    public function backoff(): array
    {
        return [60, 300, 900];
    }

    public function __construct(
        public readonly Order $order
    ) {}

    public function handle(DeliveryService $deliveryService): void
    {
        // Reload order to get fresh data
        $order = Order::with(['items.product', 'delivery'])->find($this->order->id);

        if (! $order) {
            Log::error('DispatchDeliveryJob: Order not found', ['order_id' => $this->order->id]);
            return;
        }

        if (! $order->canDispatchDelivery()) {
            Log::warning('DispatchDeliveryJob: Order not eligible for dispatch', [
                'order_id' => $order->id,
                'status'   => $order->status,
            ]);
            return;
        }

        // If already successfully dispatched, skip (idempotency)
        if ($order->delivery && $order->delivery->status === Delivery::STATUS_DISPATCHED) {
            Log::info('DispatchDeliveryJob: Already dispatched', ['order_id' => $order->id]);
            return;
        }

        $deliveryService->dispatch($order);
    }

    /**
     * Called when all retries are exhausted.
     * Marks the delivery as permanently failed.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('DispatchDeliveryJob permanently failed', [
            'order_id' => $this->order->id,
            'error'    => $exception->getMessage(),
        ]);

        Delivery::where('order_id', $this->order->id)->update([
            'status'        => Delivery::STATUS_FAILED,
            'failed_reason' => $exception->getMessage(),
        ]);
    }
}
