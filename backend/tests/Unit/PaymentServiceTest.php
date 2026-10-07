<?php

namespace Tests\Unit;

use App\Models\Order;
use App\Services\PaymentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PaymentServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_initiate_payment_success()
    {
        Http::fake([
            'sandbox.sslcommerz.com/*' => Http::response([
                'status' => 'SUCCESS',
                'GatewayPageURL' => 'https://sandbox.sslcommerz.com/gwprocess/v4/gw.php?Q=123'
            ], 200),
        ]);

        config(['services.sslcommerz.is_sandbox' => true]);
        config(['services.sslcommerz.store_id' => 'test_store']);
        config(['services.sslcommerz.store_password' => 'test_pass']);

        $order = Order::create([
            'customer_name' => 'Test',
            'customer_email' => 'test@test.com',
            'customer_phone' => '123',
            'customer_address' => 'Test',
            'total' => 100,
            'status' => 'pending'
        ]);

        $service = new PaymentService();
        $redirectUrl = $service->initiate($order);

        $this->assertEquals('https://sandbox.sslcommerz.com/gwprocess/v4/gw.php?Q=123', $redirectUrl);
        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'status'   => 'pending',
            'provider' => 'sslcommerz',
        ]);
    }

    public function test_initiate_payment_handles_api_failure()
    {
        Http::fake([
            'sandbox.sslcommerz.com/*' => Http::response([
                'status' => 'FAILED',
                'failedreason' => 'Store Credential Error'
            ], 200),
        ]);

        config(['services.sslcommerz.is_sandbox' => true]);
        config(['services.sslcommerz.store_id' => 'wrong_store']);
        config(['services.sslcommerz.store_password' => 'wrong_pass']);

        $order = Order::create([
            'customer_name' => 'Test',
            'customer_email' => 'test@test.com',
            'customer_phone' => '123',
            'customer_address' => 'Test',
            'total' => 100,
            'status' => 'pending'
        ]);

        $service = new PaymentService();

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('SSLCommerz rejected the request: Store Credential Error');

        $service->initiate($order);
    }
}
