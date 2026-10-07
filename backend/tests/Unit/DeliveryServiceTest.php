<?php

namespace Tests\Unit;

use App\Models\Order;
use App\Models\Delivery;
use App\Services\DeliveryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class DeliveryServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_carrybee_dispatch_success()
    {
        Http::fake([
            'api.carrybee.com/v1/api/v2/orders' => Http::response([
                'error' => false,
                'data' => [
                    'order' => [
                        'consignment_id' => 'CARRYBEE-1234',
                        'tracking_link' => 'https://track.carrybee.com/CARRYBEE-1234'
                    ]
                ]
            ], 200),
        ]);

        $order = Order::create([
            'customer_name' => 'John',
            'customer_email' => 'john@example.com',
            'customer_phone' => '123',
            'customer_address' => 'Dhaka',
            'total' => 100,
            'status' => 'paid'
        ]);

        $service = new DeliveryService();
        $delivery = $service->dispatch($order);

        $this->assertEquals('CARRYBEE-1234', $delivery->consignment_id);
        $this->assertEquals('https://track.carrybee.com/CARRYBEE-1234', $delivery->tracking_url);
        $this->assertEquals(Delivery::STATUS_DISPATCHED, $delivery->status);
    }

    public function test_carrybee_dispatch_handles_api_failure()
    {
        Http::fake([
            'api.carrybee.com/v1/api/v2/orders' => Http::response([
                'error' => true,
                'message' => 'Unauthorized'
            ], 401),
        ]);

        $order = Order::create([
            'customer_name' => 'John',
            'customer_email' => 'john@example.com',
            'customer_phone' => '123',
            'customer_address' => 'Dhaka',
            'total' => 100,
            'status' => 'paid'
        ]);

        $service = new DeliveryService();

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('CarryBee API error [401]');

        $service->dispatch($order);
    }
}
