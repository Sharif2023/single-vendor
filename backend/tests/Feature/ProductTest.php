<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
    }

    public function test_public_can_list_and_search_active_products(): void
    {
        Product::factory()->create([
            'name'   => 'Gaming Keyboard Pro',
            'sku'    => 'ELE-KEY-001',
            'status' => 'active',
            'price'  => 120.00,
        ]);
        Product::factory()->create([
            'name'   => 'Office Chair Ergonomic',
            'sku'    => 'HOM-CHR-002',
            'status' => 'active',
            'price'  => 250.00,
        ]);
        Product::factory()->create([
            'name'   => 'Draft Mouse',
            'sku'    => 'ELE-MOU-003',
            'status' => 'inactive',
        ]);

        $response = $this->getJson('/api/products?search=Gaming');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Gaming Keyboard Pro');
    }

    public function test_admin_can_create_product_with_valid_data(): void
    {
        $payload = [
            'name'        => 'Wireless Headphones',
            'sku'         => 'AUD-WHP-100',
            'description' => 'Premium active noise-cancelling headphones',
            'price'       => 199.99,
            'stock'       => 50,
            'status'      => 'active',
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/admin/products', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('sku', 'AUD-WHP-100');

        $this->assertDatabaseHas('products', [
            'sku'   => 'AUD-WHP-100',
            'stock' => 50,
        ]);
    }

    public function test_product_creation_enforces_unique_sku(): void
    {
        Product::factory()->create(['sku' => 'UNI-SKU-999']);

        $payload = [
            'name'        => 'Duplicate SKU Product',
            'sku'         => 'UNI-SKU-999',
            'description' => 'Should fail unique constraint',
            'price'       => 50.00,
            'stock'       => 10,
            'status'      => 'active',
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/admin/products', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['sku']);
    }

    public function test_product_creation_rejects_negative_stock(): void
    {
        $payload = [
            'name'        => 'Negative Stock Product',
            'sku'         => 'NEG-STK-001',
            'description' => 'Should fail validation',
            'price'       => 50.00,
            'stock'       => -5,
            'status'      => 'active',
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/admin/products', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['stock']);
    }

    public function test_admin_can_update_product_and_patch_stock(): void
    {
        $product = Product::factory()->create([
            'sku'   => 'UP-PRD-001',
            'stock' => 20,
            'price' => 100.00,
        ]);

        // Quick stock patch
        $response = $this->actingAs($this->admin, 'sanctum')
            ->patchJson("/api/admin/products/{$product->id}/stock", [
                'stock' => 35,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('stock', 35);

        $this->assertEquals(35, $product->fresh()->stock);
    }

    public function test_admin_can_delete_product(): void
    {
        $product = Product::factory()->create(['sku' => 'DEL-PRD-001']);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/admin/products/{$product->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted('products', ['id' => $product->id]);
    }
}
