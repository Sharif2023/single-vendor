<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    /**
     * Business dashboard metrics — cached for 2 minutes.
     * GET /api/admin/dashboard
     */
    public function index(): JsonResponse
    {
        $data = Cache::remember('dashboard:stats', 120, fn () => $this->buildStats());

        return response()->json($data);
    }

    private function buildStats(): array
    {
        $now      = now();
        $thirtyDaysAgo = $now->copy()->subDays(30);
        $sevenDaysAgo  = $now->copy()->subDays(7);

        // ── Order Counts ─────────────────────────────────────────────────────────
        $orderCounts = Order::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $totalOrders     = array_sum($orderCounts);
        $pendingOrders   = $orderCounts['pending'] ?? 0;
        $paidOrders      = $orderCounts['paid'] ?? 0;
        $cancelledOrders = $orderCounts['cancelled'] ?? 0;
        $deliveredOrders = $orderCounts['delivered'] ?? 0;

        // ── Revenue ──────────────────────────────────────────────────────────────
        $totalRevenue = Order::whereIn('status', ['paid', 'processing', 'shipped', 'delivered'])
            ->sum('total');

        $revenueThisWeek = Order::whereIn('status', ['paid', 'processing', 'shipped', 'delivered'])
            ->where('created_at', '>=', $sevenDaysAgo)
            ->sum('total');

        $revenueLastWeek = Order::whereIn('status', ['paid', 'processing', 'shipped', 'delivered'])
            ->whereBetween('created_at', [$now->copy()->subDays(14), $sevenDaysAgo])
            ->sum('total');

        // ── Revenue Trend (last 30 days, daily) ──────────────────────────────────
        $revenueTrend = Order::select(
            DB::raw("DATE(created_at) as date"),
            DB::raw("SUM(total) as revenue"),
            DB::raw("COUNT(*) as orders")
        )
            ->whereIn('status', ['paid', 'processing', 'shipped', 'delivered'])
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->groupBy(DB::raw("DATE(created_at)"))
            ->orderBy('date')
            ->get()
            ->toArray();

        // ── Inventory Alerts ─────────────────────────────────────────────────────
        $lowStockProducts = Product::active()
            ->where('stock', '>', 0)
            ->where('stock', '<=', 10)
            ->select('id', 'name', 'sku', 'stock')
            ->orderBy('stock')
            ->limit(10)
            ->get()
            ->toArray();

        $outOfStockCount = Product::active()->where('stock', 0)->count();

        // ── Top-Selling Products (last 30 days) ──────────────────────────────────
        $topProducts = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->whereIn('orders.status', ['paid', 'processing', 'shipped', 'delivered'])
            ->where('orders.created_at', '>=', $thirtyDaysAgo)
            ->select(
                'products.id',
                'products.name',
                'products.sku',
                DB::raw('SUM(order_items.quantity) as total_sold'),
                DB::raw('SUM(order_items.subtotal) as total_revenue')
            )
            ->groupBy('products.id', 'products.name', 'products.sku')
            ->orderByDesc('total_sold')
            ->limit(10)
            ->get()
            ->toArray();

        // ── Payment Summary ───────────────────────────────────────────────────────
        $paymentCounts = Payment::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        // ── Delivery Summary ──────────────────────────────────────────────────────
        $deliveryCounts = Delivery::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        // ── Recent Orders ─────────────────────────────────────────────────────────
        $recentOrders = Order::with('payment')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn ($o) => [
                'id'             => $o->id,
                'customer_name'  => $o->customer_name,
                'total'          => (float) $o->total,
                'status'         => $o->status,
                'payment_status' => $o->payment?->status ?? 'none',
                'created_at'     => $o->created_at->toISOString(),
            ])
            ->values()
            ->toArray();

        return [
            'orders' => [
                'total'     => $totalOrders,
                'pending'   => $pendingOrders,
                'paid'      => $paidOrders,
                'cancelled' => $cancelledOrders,
                'delivered' => $deliveredOrders,
                'by_status' => $orderCounts,
            ],
            'revenue' => [
                'total'      => round((float) $totalRevenue, 2),
                'this_week'  => round((float) $revenueThisWeek, 2),
                'last_week'  => round((float) $revenueLastWeek, 2),
                'trend'      => $revenueTrend,
            ],
            'inventory' => [
                'low_stock'          => $lowStockProducts,
                'out_of_stock_count' => $outOfStockCount,
                'total_products'     => Product::active()->count(),
            ],
            'top_products' => $topProducts,
            'payments'     => $paymentCounts,
            'deliveries'   => $deliveryCounts,
            'recent_orders' => $recentOrders,
        ];
    }
}
