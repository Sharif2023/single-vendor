<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AdminOrderController extends Controller
{
    public function __construct(private OrderService $orderService) {}

    /**
     * List all orders with optional filters.
     * GET /api/admin/orders
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $status  = $request->input('status');
        $search  = $request->input('search');
        $perPage = min((int) $request->input('per_page', 15), 100);

        $query = Order::with(['payment', 'delivery'])
            ->orderByDesc('created_at');

        if ($status) {
            $query->where('status', $status);
        }

        if ($search) {
            $like = \DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where(function ($q) use ($search, $like) {
                $q->where('customer_name', $like, "%{$search}%")
                  ->orWhere('customer_email', $like, "%{$search}%")
                  ->orWhere('id', $search);
            });
        }

        return OrderResource::collection($query->paginate($perPage));
    }

    /**
     * Show a single order with all relations.
     * GET /api/admin/orders/{id}
     */
    public function show(int $id): JsonResponse
    {
        $order = Order::with(['items.product', 'payment', 'delivery'])->find($id);

        if (! $order) {
            return response()->json(['message' => 'Order not found.'], 404);
        }

        return response()->json(new OrderResource($order));
    }

    /**
     * Update an order's status (admin action).
     * PATCH /api/admin/orders/{id}/status
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $order = Order::findOrFail($id);

        $data = $request->validate([
            'status' => 'required|in:pending,confirmed,paid,processing,shipped,delivered,cancelled,refunded',
        ]);

        try {
            if ($data['status'] === Order::STATUS_CANCELLED) {
                $this->orderService->cancel($order);
            } else {
                $this->orderService->updateStatus($order, $data['status']);
            }
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(new OrderResource($order->fresh(['items.product', 'payment', 'delivery'])));
    }
}
