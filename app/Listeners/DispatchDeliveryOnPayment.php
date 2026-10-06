<?php

namespace App\Listeners;

use App\Events\OrderPaid;
use App\Jobs\DispatchDeliveryJob;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * Listens for OrderPaid and asynchronously queues the delivery dispatch.
 *
 * We use ShouldQueue on the listener itself so that the IPN response to
 * SSLCommerz is not delayed by delivery scheduling overhead.
 */
class DispatchDeliveryOnPayment implements ShouldQueue
{
    public function handle(OrderPaid $event): void
    {
        // Dispatch the delivery job — this is queued via Redis/database queue
        DispatchDeliveryJob::dispatch($event->order)
            ->onQueue('deliveries');
    }
}
