<?php

namespace Tests\Feature;

use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_successful_checkout_deducts_stock()
    {
        Http::fake([
            'sandbox.sslcommerz.com/*' => Http::response(['status' => 'SUCCESS', 'GatewayPageURL' => 'http://example.com/pay'], 200),
            'securepay.sslcommerz.com/*' => Http::response(['status' => 'SUCCESS', 'GatewayPageURL' => 'http://example.com/pay'], 200),
        ]);

        $product = Product::factory()->create([
            'price' => 100,
            'discount_price' => null,
            'stock_quantity' => 10,
        ]);

        $payload = [
            'customer_name'    => 'John Doe',
            'customer_email'   => 'john@example.com',
            'customer_phone'   => '1234567890',
            'customer_address' => '123 Main St',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity'   => 2,
                ]
            ]
        ];

        $response = $this->postJson('/api/checkout', $payload);

        $response->assertStatus(200)
                 ->assertJsonStructure(['message', 'redirect_url', 'order_id']);

        $this->assertDatabaseHas('orders', [
            'customer_email' => 'john@example.com',
            'total'          => 200,
        ]);

        // Assert stock was deducted
        $this->assertEquals(8, $product->fresh()->stock_quantity);
    }

    public function test_checkout_fails_if_insufficient_stock()
    {
        $product = Product::factory()->create([
            'price' => 100,
            'stock_quantity' => 1,
        ]);

        $payload = [
            'customer_name'    => 'John Doe',
            'customer_email'   => 'john@example.com',
            'customer_phone'   => '1234567890',
            'customer_address' => '123 Main St',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity'   => 5, // Requesting more than available
                ]
            ]
        ];

        $response = $this->postJson('/api/checkout', $payload);

        $response->assertStatus(422)
                 ->assertJsonFragment(['message' => "Insufficient stock for product: {$product->name}"]);

        // Assert stock was NOT deducted
        $this->assertEquals(1, $product->fresh()->stock_quantity);
    }

    public function test_checkout_fails_if_product_does_not_exist()
    {
        $payload = [
            'customer_name'    => 'John Doe',
            'customer_email'   => 'john@example.com',
            'customer_phone'   => '1234567890',
            'customer_address' => '123 Main St',
            'items' => [
                [
                    'product_id' => 9999,
                    'quantity'   => 1,
                ]
            ]
        ];

        $response = $this->postJson('/api/checkout', $payload);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['items.0.product_id']);
    }

    public function test_checkout_calculates_discount_price_correctly()
    {
        Http::fake([
            'sandbox.sslcommerz.com/*' => Http::response(['status' => 'SUCCESS', 'GatewayPageURL' => 'http://example.com/pay'], 200),
            'securepay.sslcommerz.com/*' => Http::response(['status' => 'SUCCESS', 'GatewayPageURL' => 'http://example.com/pay'], 200),
        ]);

        $product = Product::factory()->create([
            'price' => 100,
            'discount_price' => 80, // Discount active
            'stock_quantity' => 10,
        ]);

        $payload = [
            'customer_name'    => 'John Doe',
            'customer_email'   => 'john@example.com',
            'customer_phone'   => '1234567890',
            'customer_address' => '123 Main St',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity'   => 2,
                ]
            ]
        ];

        $response = $this->postJson('/api/checkout', $payload);

        $response->assertStatus(200);

        // 2 items * $80 discount price = $160
        $this->assertDatabaseHas('orders', [
            'total' => 160,
        ]);
    }
}
