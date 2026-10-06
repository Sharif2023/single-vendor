<?php

namespace Database\Seeders;

use App\Models\Delivery;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use Faker\Factory as FakerFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $faker = FakerFactory::create();

        $this->command->info('Seeding admin...');
        $this->seedAdmin();

        $this->command->info('Seeding products...');
        $products = $this->seedProducts();

        $this->command->info('Seeding settings...');
        $this->seedSettings();

        $this->command->info('Seeding orders (100) with inventory consistency...');
        $this->seedOrders($faker, $products);

        $this->command->info('Done!');
    }

    private function seedAdmin(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@store.com'],
            [
                'name'     => 'Store Admin',
                'password' => Hash::make('password'),
                'role'     => 'admin',
            ]
        );
    }

    private function seedProducts(): \Illuminate\Support\Collection
    {
        // 30 active products with good initial stock
        $products = Product::factory()->count(25)->active()->create();

        // 5 with low stock
        $products = $products->merge(
            Product::factory()->count(5)->create([
                'status' => 'active',
                'stock'  => fn () => rand(1, 10),
            ])
        );

        // 5 inactive
        Product::factory()->count(5)->create(['status' => 'inactive']);

        // 2 out of stock
        Product::factory()->count(2)->outOfStock()->create();

        return $products;
    }

    private function seedSettings(): void
    {
        $settings = [
            ['key' => 'payment_enabled',          'value' => 'true',  'type' => 'boolean',  'description' => 'Enable/disable payment processing'],
            ['key' => 'sslcommerz_store_id',       'value' => '',      'type' => 'string',   'description' => 'SSLCommerz Store ID'],
            ['key' => 'sslcommerz_store_password',  'value' => '',      'type' => 'string',   'description' => 'SSLCommerz Store Password'],
            ['key' => 'sslcommerz_is_sandbox',      'value' => 'true',  'type' => 'boolean',  'description' => 'Use SSLCommerz sandbox mode'],
            ['key' => 'carrybee_api_key',           'value' => '',      'type' => 'string',   'description' => 'CarryBee API key'],
            ['key' => 'store_name',                 'value' => 'My Store', 'type' => 'string', 'description' => 'Store display name'],
            ['key' => 'store_email',                'value' => 'store@example.com', 'type' => 'string', 'description' => 'Store contact email'],
        ];

        foreach ($settings as $s) {
            Setting::updateOrCreate(['key' => $s['key']], $s);
        }
    }

    /**
     * Seed 100 orders over the last 3 weeks.
     *
     * Inventory Consistency Strategy:
     * ─────────────────────────────────
     * We track the "stock consumed by orders" separately from the current DB stock.
     * The algorithm:
     * 1. Start with each product's base stock (what's seeded).
     * 2. For paid/delivered/shipped/processing orders → deduct from stock (these consumed real inventory).
     * 3. For cancelled orders → do NOT deduct (cancelled = stock returned).
     * 4. For pending/confirmed orders → deduct temporarily (pending stock).
     * 5. Ensure remaining stock in DB never goes negative.
     *
     * This mirrors real application logic where the OrderService decrements on creation
     * and the cancel logic restores stock.
     */
    private function seedOrders(\Faker\Generator $faker, \Illuminate\Support\Collection $products): void
    {
        // Track how much stock each product has available for orders
        $availableStock = $products->keyBy('id')->map(fn ($p) => $p->stock)->toArray();

        $statusDistribution = [
            'paid'       => 40,
            'delivered'  => 25,
            'shipped'    => 10,
            'processing' => 5,
            'pending'    => 10,
            'cancelled'  => 10,
        ];

        // Expand distribution into an array
        $statuses = [];
        foreach ($statusDistribution as $status => $count) {
            $statuses = array_merge($statuses, array_fill(0, $count, $status));
        }

        shuffle($statuses);

        $ordersCreated = 0;
        $attempts      = 0;

        while ($ordersCreated < 100 && $attempts < 500) {
            $attempts++;

            // Pick 1-4 products for this order
            $itemCount = rand(1, 4);
            $selectedProducts = $products->where('status', 'active')
                ->filter(fn ($p) => $availableStock[$p->id] > 0)
                ->shuffle()
                ->take($itemCount);

            if ($selectedProducts->isEmpty()) {
                break; // No stock left for any product
            }

            $status    = $statuses[$ordersCreated % count($statuses)];
            $createdAt = $faker->dateTimeBetween('-3 weeks', 'now');

            // Build order items
            $orderItems = [];
            $subtotal   = 0;
            $canCreate  = true;

            foreach ($selectedProducts as $product) {
                $maxQty = min(5, $availableStock[$product->id]);
                if ($maxQty < 1) {
                    continue;
                }
                $qty      = rand(1, $maxQty);
                $subtotal += $product->price * $qty;

                $orderItems[] = [
                    'product_id' => $product->id,
                    'quantity'   => $qty,
                    'unit_price' => $product->price,
                    'subtotal'   => $product->price * $qty,
                ];
            }

            if (empty($orderItems)) {
                continue;
            }

            // Deduct stock for non-cancelled orders
            // Cancelled orders get stock returned, so no net deduction
            if ($status !== 'cancelled') {
                foreach ($orderItems as $item) {
                    $availableStock[$item['product_id']] -= $item['quantity'];
                    if ($availableStock[$item['product_id']] < 0) {
                        $canCreate = false;
                        // Restore and skip
                        foreach ($orderItems as $ri) {
                            $availableStock[$ri['product_id']] += $ri['quantity'];
                        }
                        break;
                    }
                }
            }

            if (! $canCreate) {
                continue;
            }

            $total = $subtotal;

            $order = Order::create([
                'customer_name'    => $faker->name(),
                'customer_email'   => $faker->safeEmail(),
                'customer_phone'   => '01' . $faker->numerify('#########'),
                'customer_address' => $faker->numberBetween(1, 999) . ', ' . $faker->streetAddress() . ', ' . $faker->randomElement(['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi']),
                'subtotal'         => $subtotal,
                'total'            => $total,
                'status'           => $status,
                'created_at'       => $createdAt,
                'updated_at'       => $createdAt,
            ]);

            foreach ($orderItems as $item) {
                OrderItem::create([
                    'order_id'   => $order->id,
                    'product_id' => $item['product_id'],
                    'quantity'   => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'subtotal'   => $item['subtotal'],
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);
            }

            // Seed payments
            $paymentStatus = match ($status) {
                'paid', 'processing', 'shipped', 'delivered' => 'paid',
                'pending', 'confirmed'                        => $faker->randomElement(['pending', 'failed']),
                'cancelled'                                   => $faker->randomElement(['failed', 'cancelled']),
                default                                       => 'pending',
            };

            if ($status !== 'pending') {
                Payment::create([
                    'order_id'       => $order->id,
                    'provider'       => 'sslcommerz',
                    'transaction_id' => $paymentStatus === 'paid' ? 'VAL-' . strtoupper($faker->lexify('??????????')) : null,
                    'amount'         => $total,
                    'status'         => $paymentStatus,
                    'paid_at'        => $paymentStatus === 'paid' ? $createdAt : null,
                    'created_at'     => $createdAt,
                    'updated_at'     => $createdAt,
                ]);
            }

            // Seed delivery for paid/shipped/delivered orders
            if (in_array($status, ['shipped', 'delivered', 'processing'])) {
                $deliveryStatus = match ($status) {
                    'delivered' => 'delivered',
                    'shipped'   => 'in_transit',
                    default     => 'dispatched',
                };

                Delivery::create([
                    'order_id'       => $order->id,
                    'consignment_id' => 'CB-' . strtoupper($faker->lexify('??????????')),
                    'carrier'        => 'CarryBee',
                    'status'         => $deliveryStatus,
                    'tracking_url'   => 'https://track.carrybee.com/CB-' . $faker->lexify('??????????'),
                    'attempt_count'  => 1,
                    'dispatched_at'  => $createdAt,
                    'created_at'     => $createdAt,
                    'updated_at'     => $createdAt,
                ]);
            }

            $ordersCreated++;
        }

        // Update product stocks in DB to reflect orders
        foreach ($availableStock as $productId => $remainingStock) {
            Product::where('id', $productId)->update(['stock' => max(0, $remainingStock)]);
        }

        $this->command->info("Created {$ordersCreated} orders.");
    }
}
