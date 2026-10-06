<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'customer_name'    => $this->customer_name,
            'customer_email'   => $this->customer_email,
            'customer_phone'   => $this->customer_phone,
            'customer_address' => $this->customer_address,
            'subtotal'         => (float) $this->subtotal,
            'total'            => (float) $this->total,
            'status'           => $this->status,
            'notes'            => $this->notes,
            'items'            => OrderItemResource::collection($this->whenLoaded('items')),
            'payment'          => $this->whenLoaded('payment', fn () => [
                'id'             => $this->payment?->id,
                'provider'       => $this->payment?->provider,
                'transaction_id' => $this->payment?->transaction_id,
                'amount'         => (float) ($this->payment?->amount ?? 0),
                'status'         => $this->payment?->status,
                'paid_at'        => $this->payment?->paid_at?->toISOString(),
            ]),
            'delivery'         => $this->whenLoaded('delivery', fn () => $this->delivery ? [
                'id'             => $this->delivery->id,
                'consignment_id' => $this->delivery->consignment_id,
                'carrier'        => $this->delivery->carrier,
                'status'         => $this->delivery->status,
                'tracking_url'   => $this->delivery->tracking_url,
                'dispatched_at'  => $this->delivery->dispatched_at?->toISOString(),
                'failed_reason'  => $this->delivery->failed_reason,
            ] : null),
            'created_at'       => $this->created_at?->toISOString(),
            'updated_at'       => $this->updated_at?->toISOString(),
        ];
    }
}
