<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class OrderService
{
    /**
     * Create an order from a validated checkout payload.
     *
     * Uses a DB transaction + pessimistic lock (SELECT FOR UPDATE) on each product
     * to ensure stock never goes negative under concurrent load.
     *
     * Prices are calculated server-side from the DB — frontend values are ignored.
     *
     * @param  array $customerData  Validated customer fields
     * @param  array $items         [['product_id' => int, 'quantity' => int], ...]
     * @return Order
     * @throws \RuntimeException    If stock is insufficient for any item
     */
    public function create(array $customerData, array $items): Order
    {
        return DB::transaction(function () use ($customerData, $items) {
            $orderLines = [];
            $subtotal   = 0;

            foreach ($items as $item) {
                // Lock the product row to prevent concurrent over-sell
                $product = Product::active()
                    ->lockForUpdate()
                    ->find($item['product_id']);

                if (! $product) {
                    throw new \RuntimeException("Product #{$item['product_id']} is not available.");
                }

                if ($product->stock < $item['quantity']) {
                    throw new \RuntimeException(
                        "Insufficient stock for \"{$product->name}\". "
                        . "Available: {$product->stock}, requested: {$item['quantity']}."
                    );
                }

                // Deduct stock atomically
                $product->decrement('stock', $item['quantity']);

                $lineSubtotal = $product->price * $item['quantity'];
                $subtotal    += $lineSubtotal;

                $orderLines[] = [
                    'product_id' => $product->id,
                    'quantity'   => $item['quantity'],
                    'unit_price' => $product->price, // Price snapshot
                    'subtotal'   => $lineSubtotal,
                ];
            }

            $total = $subtotal; // Extend here for discounts/tax/shipping

            $order = Order::create([
                ...$customerData,
                'subtotal' => $subtotal,
                'total'    => $total,
                'status'   => Order::STATUS_PENDING,
            ]);

            foreach ($orderLines as $line) {
                $order->items()->create($line);
            }

            return $order;
        });
    }

    /**
     * Cancel an order and restore stock.
     * Only pending/confirmed orders can be cancelled.
     */
    public function cancel(Order $order): void
    {
        if (! $order->isCancellable()) {
            throw new \RuntimeException("Order #{$order->id} cannot be cancelled in status: {$order->status}.");
        }

        DB::transaction(function () use ($order) {
            // Restore stock for each item
            foreach ($order->items as $item) {
                Product::where('id', $item->product_id)
                    ->increment('stock', $item->quantity);
            }

            $order->update(['status' => Order::STATUS_CANCELLED]);
        });
    }

    /**
     * Update an order's status (admin action).
     */
    public function updateStatus(Order $order, string $status): void
    {
        $order->update(['status' => $status]);
    }
}
