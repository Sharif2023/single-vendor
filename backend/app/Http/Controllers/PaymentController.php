<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    public function __construct(private PaymentService $paymentService) {}

    /**
     * SSLCommerz success redirect (from customer browser).
     * This is NOT authoritative — we redirect to frontend and let IPN handle the actual update.
     * POST /api/payment/success
     */
    public function success(Request $request): \Illuminate\Http\RedirectResponse
    {
        $orderId = $this->extractOrderId($request->input('tran_id', ''));

        // Fallback for local testing: Since SSLCommerz cannot send IPN to localhost,
        // we'll optimistically mark the order as paid if it returns to the success URL.
        // DO NOT use this pattern in production!
        if (config('app.env') === 'local' && $orderId) {
            $order = Order::find($orderId);
            if ($order && $order->status === Order::STATUS_PENDING) {
                $order->update(['status' => Order::STATUS_PAID]);
                Payment::where('order_id', $orderId)->update(['status' => Payment::STATUS_PAID]);
            }
        }

        $redirectUrl = env('FRONTEND_URL', 'http://localhost:3000') . '/payment/success?order_id=' . $orderId;
        return redirect($redirectUrl);
    }

    /**
     * SSLCommerz failure redirect.
     * POST /api/payment/fail
     */
    public function fail(Request $request): \Illuminate\Http\RedirectResponse
    {
        $orderId    = $this->extractOrderId($request->input('tran_id', ''));
        $redirectUrl = env('FRONTEND_URL', 'http://localhost:3000') . '/payment/failed?order_id=' . $orderId;
        return redirect($redirectUrl);
    }

    /**
     * SSLCommerz cancel redirect.
     * POST /api/payment/cancel
     */
    public function cancel(Request $request): \Illuminate\Http\RedirectResponse
    {
        $orderId    = $this->extractOrderId($request->input('tran_id', ''));
        $redirectUrl = env('FRONTEND_URL', 'http://localhost:3000') . '/payment/failed?order_id=' . $orderId . '&reason=cancelled';
        return redirect($redirectUrl);
    }

    /**
     * SSLCommerz IPN (Instant Payment Notification) — server-to-server.
     * This is the AUTHORITATIVE payment verification endpoint.
     *
     * SSLCommerz posts to this URL and retries until it gets a 200 response.
     * Our handler is idempotent — safe to call multiple times.
     *
     * POST /api/payment/ipn
     */
    public function ipn(Request $request): Response
    {
        Log::info('IPN received', $request->all());

        $handled = $this->paymentService->handleIpn($request->all());

        // Always return 200 to prevent SSLCommerz from retrying indefinitely
        // Our internal idempotency handles duplicate calls safely
        return response('OK', 200);
    }

    /**
     * Get payment status for an order (frontend polling).
     * GET /api/orders/{id}/payment-status
     */
    public function status(int $orderId): JsonResponse
    {
        $order = Order::with('payment')->find($orderId);

        if (! $order) {
            return response()->json(['message' => 'Order not found.'], 404);
        }

        return response()->json([
            'order_id'       => $order->id,
            'order_status'   => $order->status,
            'payment_status' => $order->payment?->status ?? 'none',
        ]);
    }

    private function extractOrderId(string $tranId): int
    {
        if (preg_match('/^ORDER-(\d+)-/', $tranId, $matches)) {
            return (int) $matches[1];
        }
        return 0;
    }
}
