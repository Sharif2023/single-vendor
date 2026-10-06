<?php

namespace App\Http\Controllers;

use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CheckoutController extends Controller
{
    public function __construct(
        private OrderService $orderService,
        private PaymentService $paymentService
    ) {}

    /**
     * Process checkout: validate → create order → initiate payment.
     * POST /api/checkout
     *
     * Returns the SSLCommerz redirect URL for the customer.
     * All prices are calculated server-side.
     */
    public function checkout(Request $request): JsonResponse
    {
        $data = $request->validate([
            'customer_name'    => 'required|string|max:255',
            'customer_email'   => 'required|email|max:255',
            'customer_phone'   => 'required|string|max:20',
            'customer_address' => 'required|string|max:1000',
            'items'            => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.quantity'   => 'required|integer|min:1|max:100',
        ]);

        // Check for duplicate product IDs in the cart
        $productIds = array_column($data['items'], 'product_id');
        if (count($productIds) !== count(array_unique($productIds))) {
            return response()->json([
                'message' => 'Duplicate products in cart. Please merge quantities.',
            ], 422);
        }

        try {
            $order = $this->orderService->create(
                [
                    'customer_name'    => $data['customer_name'],
                    'customer_email'   => $data['customer_email'],
                    'customer_phone'   => $data['customer_phone'],
                    'customer_address' => $data['customer_address'],
                ],
                $data['items']
            );

            $paymentUrl = $this->paymentService->initiate($order);

            return response()->json([
                'order_id'    => $order->id,
                'payment_url' => $paymentUrl,
                'total'       => (float) $order->total,
            ], 201);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Get order details for confirmation page.
     * GET /api/orders/{id}
     */
    public function show(int $id): JsonResponse
    {
        $order = Order::with(['items.product', 'payment', 'delivery'])->find($id);

        if (! $order) {
            return response()->json(['message' => 'Order not found.'], 404);
        }

        return response()->json(new OrderResource($order));
    }
}
