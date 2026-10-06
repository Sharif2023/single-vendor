<?php

namespace App\Services;

use App\Events\OrderPaid;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PaymentService
{
    /**
     * Initiate an SSLCommerz payment session for the given order.
     * Returns the redirect URL for the customer.
     */
    public function initiate(Order $order): string
    {
        $post = [
            'store_id'            => config('services.sslcommerz.store_id'),
            'store_passwd'        => config('services.sslcommerz.store_password'),
            'total_amount'        => $order->total,
            'currency'            => 'BDT',
            'tran_id'             => 'ORDER-' . $order->id . '-' . time(),
            'success_url'         => config('services.sslcommerz.success_url'),
            'fail_url'            => config('services.sslcommerz.fail_url'),
            'cancel_url'          => config('services.sslcommerz.cancel_url'),
            'ipn_url'             => config('services.sslcommerz.ipn_url'),
            'cus_name'            => $order->customer_name,
            'cus_email'           => $order->customer_email,
            'cus_phone'           => $order->customer_phone,
            'cus_add1'            => $order->customer_address,
            'cus_city'            => 'Dhaka',
            'cus_country'         => 'Bangladesh',
            'shipping_method'     => 'NO',
            'product_name'        => 'Order #' . $order->id,
            'product_category'    => 'General',
            'product_profile'     => 'general',
        ];

        $storeId = config('services.sslcommerz.store_id');
        $storePassword = config('services.sslcommerz.store_password');

        // If credentials are not yet configured (e.g. fresh installation / local development),
        // safely provide a mock gateway redirect so users can test checkout end-to-end.
        if (empty($storeId) || empty($storePassword)) {
            $mockTranId = 'ORDER-' . $order->id . '-' . time();
            Payment::updateOrCreate(
                ['order_id' => $order->id],
                [
                    'provider'    => 'sslcommerz',
                    'session_key' => 'mock-session-' . $order->id,
                    'amount'      => $order->total,
                    'status'      => Payment::STATUS_PENDING,
                ]
            );

            return route('payment.success', [
                'tran_id' => $mockTranId,
                'val_id'  => 'MOCK-VAL-' . strtoupper(Str::random(10)),
                'status'  => 'VALID',
            ]);
        }

        $apiUrl = config('services.sslcommerz.is_sandbox')
            ? 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php'
            : 'https://securepay.sslcommerz.com/gwprocess/v4/api.php';

        $response = \Illuminate\Support\Facades\Http::timeout(15)->asForm()->post($apiUrl, $post);

        if (! $response->successful()) {
            Log::error('SSLCommerz initiation HTTP failed', ['status' => $response->status()]);
            throw new \RuntimeException('Payment gateway error. Please try again.');
        }

        $data = $response->json();

        if (($data['status'] ?? '') !== 'SUCCESS') {
            Log::error('SSLCommerz initiation failed', ['response' => $data]);
            throw new \RuntimeException('Payment gateway rejected the request.');
        }

        // Create/update payment record in pending state
        Payment::updateOrCreate(
            ['order_id' => $order->id],
            [
                'provider'    => 'sslcommerz',
                'session_key' => $data['sessionkey'] ?? null,
                'amount'      => $order->total,
                'status'      => Payment::STATUS_PENDING,
            ]
        );

        return $data['GatewayPageURL'];
    }

    /**
     * Handle IPN (server-to-server) callback from SSLCommerz.
     * This is the authoritative verification path — frontend callbacks are NOT trusted.
     *
     * Idempotent: calling this multiple times for the same paid transaction is safe.
     */
    public function handleIpn(array $payload): bool
    {
        $transactionId  = $payload['tran_id'] ?? null;
        $validationId   = $payload['val_id'] ?? null;
        $status         = $payload['status'] ?? null;

        if (! $transactionId) {
            Log::warning('IPN received without tran_id', $payload);
            return false;
        }

        // Extract order ID from our tran_id format: ORDER-{id}-{timestamp}
        if (! preg_match('/^ORDER-(\d+)-/', $transactionId, $matches)) {
            Log::warning('IPN: Cannot parse order ID from tran_id', ['tran_id' => $transactionId]);
            return false;
        }

        $orderId = (int) $matches[1];

        return DB::transaction(function () use ($orderId, $transactionId, $validationId, $status, $payload) {
            // Lock the payment row to prevent concurrent updates
            $payment = Payment::where('order_id', $orderId)->lockForUpdate()->first();

            if (! $payment) {
                Log::warning('IPN: No payment found for order', ['order_id' => $orderId]);
                return false;
            }

            // ── Idempotency: already processed ──────────────────────────────────
            if ($payment->isPaid()) {
                Log::info('IPN: Duplicate callback for already-paid order', ['order_id' => $orderId]);
                return true; // Return true so SSL gets a 200 and stops retrying
            }

            // ── Verify with SSLCommerz API ────────────────────────────────────
            if ($status === 'VALID' || $status === 'VALIDATED') {
                $verified = $this->verify($validationId);

                if ($verified) {
                    $payment->update([
                        'transaction_id' => $validationId,
                        'status'         => Payment::STATUS_PAID,
                        'raw_response'   => $payload,
                        'paid_at'        => now(),
                    ]);

                    $order = Order::find($orderId);
                    if ($order && $order->status === Order::STATUS_PENDING) {
                        $order->update(['status' => Order::STATUS_PAID]);

                        // Fire event — listener will queue delivery job
                        event(new OrderPaid($order));
                    }

                    return true;
                }
            }

            // Payment failed or invalid
            $payment->update([
                'status'       => Payment::STATUS_FAILED,
                'raw_response' => $payload,
            ]);

            return false;
        });
    }

    /**
     * Verify a payment with SSLCommerz validation API.
     */
    public function verify(string $validationId): bool
    {
        $apiUrl = config('services.sslcommerz.is_sandbox')
            ? 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php'
            : 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php';

        try {
            $response = \Http::timeout(10)->get($apiUrl, [
                'val_id'       => $validationId,
                'store_id'     => config('services.sslcommerz.store_id'),
                'store_passwd'  => config('services.sslcommerz.store_password'),
                'v'            => 1,
                'format'       => 'json',
            ]);

            $data = $response->json();

            return in_array($data['status'] ?? '', ['VALID', 'VALIDATED']);
        } catch (\Exception $e) {
            Log::error('SSLCommerz verification failed', ['error' => $e->getMessage()]);
            return false;
        }
    }
}
