<?php

namespace App\Services;

use App\Models\Delivery;
use App\Models\Order;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DeliveryService
{
    private string $apiUrl;
    private ?string $clientId;
    private ?string $clientSecret;
    private ?string $clientContext;

    public function __construct()
    {
        $this->apiUrl        = config('services.carrybee.api_url', 'https://api.carrybee.com/v1');
        $this->clientId      = config('services.carrybee.client_id');
        $this->clientSecret  = config('services.carrybee.client_secret');
        $this->clientContext = config('services.carrybee.client_context');
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

        $address = trim($order->customer_address);
        if (strlen($address) < 10) {
            $address = $address . ', Bangladesh';
        }

        $payload = [
            'store_id'           => (int) config('services.carrybee.store_id', 3753),
            'delivery_type'      => 1, // Standard Delivery
            'product_type'       => 1, // Parcel
            'merchant_order_id'  => 'ORDER-' . $order->id,
            'recipient_name'     => $order->customer_name,
            'recipient_phone'    => $order->customer_phone,
            'recipient_address'  => $address,
            'item_weight'        => max(1, (int) $order->items->sum('quantity')),
            'collectable_amount' => 0, // Online paid
        ];

        $response = Http::withHeaders([
            'Client-Id'      => $this->clientId,
            'Client-Secret'  => $this->clientSecret,
            'Client-Context' => $this->clientContext,
            'Accept'         => 'application/json',
        ])
            ->timeout(20)
            ->retry(2, 500) // HTTP-level retry for transient failures
            ->post("{$this->apiUrl}/api/v2/orders", $payload);

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
        $orderData = $data['data']['order'] ?? $data;
        $consignmentId = $orderData['consignment_id'] ?? null;
        $trackingUrl = !empty($orderData['tracking_link']) 
            ? $orderData['tracking_link'] 
            : ($consignmentId ? "https://carrybee.com/track?consignmentId={$consignmentId}" : null);

        $delivery->update([
            'consignment_id' => $consignmentId,
            'tracking_url'   => $trackingUrl,
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
                'Client-Id'      => $this->clientId,
                'Client-Secret'  => $this->clientSecret,
                'Client-Context' => $this->clientContext,
                'Accept'         => 'application/json',
            ])
                ->timeout(10)
                ->get("{$this->apiUrl}/api/v2/orders/{$delivery->consignment_id}");

            if (! $response->successful()) {
                return;
            }

            $data = $response->json();
            $orderData = $data['data']['order'] ?? $data;
            $transferStatusId = $orderData['transfer_status_id'] ?? null;

            // CarryBee transfer_status_id mapping
            if ($transferStatusId === 1) {
                $delivery->update(['status' => Delivery::STATUS_DISPATCHED, 'api_response' => $data]);
            } elseif ($transferStatusId === 2) {
                $delivery->update(['status' => Delivery::STATUS_IN_TRANSIT, 'api_response' => $data]);
            } elseif ($transferStatusId >= 3) {
                $delivery->update(['status' => Delivery::STATUS_DELIVERED, 'api_response' => $data]);
                $delivery->order?->update(['status' => Order::STATUS_DELIVERED]);
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
