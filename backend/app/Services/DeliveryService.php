<?php

namespace App\Services;

use App\Models\Delivery;
use App\Models\Order;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DeliveryService
{
    private string $apiUrl;
    private string $apiKey;

    public function __construct()
    {
        $this->apiUrl = config('services.carrybee.api_url', 'https://api.carrybee.com/v1');
        $this->apiKey = config('services.carrybee.api_key', '');
    }

    /**
     * Dispatch a delivery to CarryBee for a paid order.
     * Called from DispatchDeliveryJob (async, not in user request path).
     *
     * Returns the updated Delivery model.
     *
     * @throws \RuntimeException on API failure (job will retry)
     */
    public function dispatch(Order $order): Delivery
    {
        $delivery = $order->delivery ?? Delivery::create([
            'order_id' => $order->id,
            'status'   => Delivery::STATUS_PENDING,
            'carrier'  => 'CarryBee',
        ]);

        // Increment attempt count
        $delivery->increment('attempt_count');

        $payload = [
            'merchant_order_id' => (string) $order->id,
            'recipient_name'    => $order->customer_name,
            'recipient_phone'   => $order->customer_phone,
            'recipient_email'   => $order->customer_email,
            'recipient_address' => $order->customer_address,
            'amount_to_collect' => 0, // Already paid online
            'order_amount'      => $order->total,
            'item_description'  => $this->buildItemDescription($order),
        ];

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey,
            'Accept'        => 'application/json',
        ])
            ->timeout(20)
            ->retry(2, 500) // HTTP-level retry for transient failures
            ->post("{$this->apiUrl}/parcels", $payload);

        if (! $response->successful()) {
            $errorBody = $response->body();
            Log::error('CarryBee dispatch failed', [
                'order_id' => $order->id,
                'status'   => $response->status(),
                'body'     => $errorBody,
            ]);
            throw new \RuntimeException("CarryBee API error [{$response->status()}]: {$errorBody}");
        }

        $data = $response->json();

        $delivery->update([
            'consignment_id' => $data['consignment_id'] ?? $data['id'] ?? null,
            'tracking_url'   => $data['tracking_url'] ?? null,
            'status'         => Delivery::STATUS_DISPATCHED,
            'api_response'   => $data,
            'dispatched_at'  => now(),
            'failed_reason'  => null,
        ]);

        Log::info('CarryBee dispatch succeeded', [
            'order_id'       => $order->id,
            'consignment_id' => $delivery->consignment_id,
        ]);

        return $delivery;
    }

    /**
     * Sync delivery status from CarryBee for in-transit deliveries.
     * Called by the scheduler.
     */
    public function syncStatus(Delivery $delivery): void
    {
        if (! $delivery->consignment_id) {
            return;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Accept'        => 'application/json',
            ])
                ->timeout(10)
                ->get("{$this->apiUrl}/parcels/{$delivery->consignment_id}");

            if (! $response->successful()) {
                return;
            }

            $data = $response->json();
            $remoteStatus = $data['status'] ?? null;

            $statusMap = [
                'delivered'   => Delivery::STATUS_DELIVERED,
                'in_transit'  => Delivery::STATUS_IN_TRANSIT,
                'returned'    => Delivery::STATUS_RETURNED,
            ];

            if ($remoteStatus && isset($statusMap[$remoteStatus])) {
                $delivery->update(['status' => $statusMap[$remoteStatus], 'api_response' => $data]);

                // If delivered, update order status
                if ($statusMap[$remoteStatus] === Delivery::STATUS_DELIVERED) {
                    $delivery->order?->update(['status' => Order::STATUS_DELIVERED]);
                }
            }
        } catch (\Exception $e) {
            Log::warning('CarryBee status sync failed', [
                'delivery_id' => $delivery->id,
                'error'       => $e->getMessage(),
            ]);
        }
    }

    private function buildItemDescription(Order $order): string
    {
        return $order->items->map(fn ($i) => "{$i->product->name} x{$i->quantity}")->join(', ');
    }
}
