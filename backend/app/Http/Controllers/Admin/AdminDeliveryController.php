<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Models\Order;
use App\Jobs\DispatchDeliveryJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminDeliveryController extends Controller
{
    /**
     * List all deliveries.
     * GET /api/admin/deliveries
     */
    public function index(Request $request): JsonResponse
    {
        $status  = $request->input('status');
        $search  = $request->input('search');
        $perPage = min((int) $request->input('per_page', 15), 100);

        $query = Delivery::with('order')
            ->orderByDesc('created_at');

        if ($status) {
            $query->where('status', $status);
        }

        if ($search) {
            $like = \DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where(function ($q) use ($search, $like) {
                $q->where('consignment_id', $like, "%{$search}%")
                  ->orWhere('tracking_code', $like, "%{$search}%");

                if (is_numeric($search)) {
                    $q->orWhere('id', (int) $search)
                      ->orWhere('order_id', (int) $search);
                }

                $q->orWhereHas('order', function ($oq) use ($search, $like) {
                    $oq->where('customer_name', $like, "%{$search}%")
                       ->orWhere('customer_phone', $like, "%{$search}%")
                       ->orWhere('customer_email', $like, "%{$search}%");
                });
            });
        }

        $deliveries = $query->paginate($perPage);

        return response()->json($deliveries);
    }

    /**
     * Retry a failed delivery.
     * PATCH /api/admin/deliveries/{id}/retry
     */
    public function retry(int $id): JsonResponse
    {
        $delivery = Delivery::with('order')->findOrFail($id);

        if ($delivery->status !== Delivery::STATUS_FAILED) {
            return response()->json(['message' => 'Only failed deliveries can be retried.'], 422);
        }

        $order = $delivery->order;

        if (! $order || ! $order->isPaid()) {
            return response()->json(['message' => 'Order is not in a paid state.'], 422);
        }

        // Reset status to pending and re-queue the job
        $delivery->update([
            'status'        => Delivery::STATUS_PENDING,
            'failed_reason' => null,
        ]);

        DispatchDeliveryJob::dispatch($order)->onQueue('deliveries');

        return response()->json(['message' => 'Delivery job re-queued.']);
    }
}
