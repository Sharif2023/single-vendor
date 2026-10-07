<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    private static array $products = [
        ['name' => 'Apple iPhone 15 Pro Max', 'category' => 'Electronics', 'price' => 1199.99, 'desc' => 'The ultimate iPhone with aerospace-grade titanium design, A17 Pro chip, and a powerful new 5x telephoto camera system.'],
        ['name' => 'Samsung Galaxy S24 Ultra', 'category' => 'Electronics', 'price' => 1299.50, 'desc' => 'Experience the new era of mobile AI. Features a titanium exterior, 6.8-inch flat display, and built-in S Pen.'],
        ['name' => 'Sony WH-1000XM5 Headphones', 'category' => 'Electronics', 'price' => 348.00, 'desc' => 'Industry-leading noise canceling headphones with Auto NC Optimizer, crystal clear hands-free calling, and up to 30 hours of battery life.'],
        ['name' => 'MacBook Pro 16-inch (M3 Max)', 'category' => 'Electronics', 'price' => 3499.00, 'desc' => 'Mind-blowing performance with the M3 Max chip. Features a brilliant Liquid Retina XDR display and up to 22 hours of battery life.'],
        ['name' => 'Dell XPS 15 Laptop', 'category' => 'Electronics', 'price' => 1899.99, 'desc' => 'Power your passions with a beautiful 15.6-inch OLED touch display, Intel Core i7 processor, and NVIDIA RTX graphics.'],
        ['name' => 'Keychron Q1 Pro Keyboard', 'category' => 'Electronics', 'price' => 199.00, 'desc' => 'A fully customizable 75% layout custom mechanical keyboard with QMK/VIA support, full aluminum body, and double-gasket design.'],
        ['name' => 'Logitech MX Master 3S', 'category' => 'Electronics', 'price' => 99.99, 'desc' => 'Iconic mouse remastered. Features an 8000 DPI track-on-glass sensor and Quiet Clicks for an ultimate workflow experience.'],
        ['name' => 'LG 27" 4K UHD Monitor', 'category' => 'Electronics', 'price' => 299.50, 'desc' => 'Vibrant 4K UHD resolution with IPS technology. Includes AMD FreeSync, sRGB 98% color gamut, and adjustable stand.'],
        ['name' => 'Dyson V15 Detect Vacuum', 'category' => 'Home', 'price' => 749.99, 'desc' => 'The most powerful, intelligent cordless vacuum. Features laser illumination to reveal microscopic dust and piezo sensor to size particles.'],
        ['name' => 'Philips Hue Smart Bulb Starter Kit', 'category' => 'Home', 'price' => 129.99, 'desc' => 'Transform your home with smart lighting. Includes 3 color smart bulbs and the Hue Bridge for complete control.'],
        ['name' => 'Nespresso Vertuo Plus', 'category' => 'Kitchen', 'price' => 159.00, 'desc' => 'Experience the perfect cup of coffee or espresso at the touch of a button with Centrifusion technology.'],
        ['name' => 'KitchenAid Artisan Stand Mixer', 'category' => 'Kitchen', 'price' => 449.99, 'desc' => 'The iconic kitchen staple. 5-quart capacity, 10 speeds, and includes flat beater, dough hook, and wire whip.'],
        ['name' => 'Ninja Professional Blender', 'category' => 'Kitchen', 'price' => 89.99, 'desc' => 'Features 1000 watts of professional performance power with Total Crushing technology for perfect ice crushing and blending.'],
        ['name' => 'Levi\'s Original Trucker Jacket', 'category' => 'Clothing', 'price' => 79.50, 'desc' => 'The original jean jacket since 1967. A symbol of self-expression, tailored with a regular fit.'],
        ['name' => 'Nike Air Force 1 \'07', 'category' => 'Clothing', 'price' => 110.00, 'desc' => 'The radiance lives on in the Nike Air Force 1 \'07, the b-ball icon that puts a fresh spin on what you know best.'],
        ['name' => 'Patagonia Better Sweater', 'category' => 'Clothing', 'price' => 139.00, 'desc' => 'A warm, low-bulk quarter-zip pullover made of soft, sweater-knit recycled polyester fleece.'],
        ['name' => 'Atomic Habits by James Clear', 'category' => 'Books', 'price' => 14.99, 'desc' => 'An Easy & Proven Way to Build Good Habits & Break Bad Ones. A completely practical and actionable guide.'],
        ['name' => 'The Pragmatic Programmer', 'category' => 'Books', 'price' => 32.50, 'desc' => 'Your journey to mastery, 20th Anniversary Edition. A modern classic for software developers.'],
        ['name' => 'Clean Code by Robert C. Martin', 'category' => 'Books', 'price' => 38.99, 'desc' => 'A Handbook of Agile Software Craftsmanship. Learn how to write robust, maintainable, and clean code.'],
        ['name' => 'YETI Rambler 20 oz Tumbler', 'category' => 'Home', 'price' => 35.00, 'desc' => 'Double-wall vacuum insulated tumbler with MagSlider Lid. Keeps your drinks piping hot or icy cold.'],
        ['name' => 'Bose SoundLink Flex', 'category' => 'Electronics', 'price' => 149.00, 'desc' => 'A portable Bluetooth speaker that delivers crisp, clear sound. Waterproof, dustproof, and built to survive drops.'],
        ['name' => 'Herman Miller Aeron Chair', 'category' => 'Home', 'price' => 1250.00, 'desc' => 'The benchmark for ergonomic seating. Features 8Z Pellicle suspension material and PostureFit SL back support.'],
        ['name' => 'Instant Pot Duo 7-in-1', 'category' => 'Kitchen', 'price' => 99.95, 'desc' => 'Electric pressure cooker, slow cooker, rice cooker, steamer, sauté, yogurt maker, and warmer in one.'],
        ['name' => 'Adidas Ultraboost Light', 'category' => 'Clothing', 'price' => 190.00, 'desc' => 'Experience epic energy with the lightest Ultraboost ever made. Features BOOST technology for maximum return.'],
        ['name' => 'Designing Data-Intensive Applications', 'category' => 'Books', 'price' => 42.99, 'desc' => 'The big ideas behind reliable, scalable, and maintainable systems by Martin Kleppmann.'],
        ['name' => 'Apple Watch Series 9', 'category' => 'Electronics', 'price' => 399.00, 'desc' => 'Smarter, brighter, mightier. Features the S9 chip, a super-bright display, and the magical double tap gesture.'],
        ['name' => 'Anker PowerCore 10000', 'category' => 'Electronics', 'price' => 25.99, 'desc' => 'One of the smallest and lightest 10000mAh portable chargers. Provides almost three-and-a-half iPhone 8 charges.'],
        ['name' => 'Kindle Paperwhite (16 GB)', 'category' => 'Electronics', 'price' => 149.99, 'desc' => 'Now with a 6.8" display, adjustable warm light, and up to 10 weeks of battery life.'],
        ['name' => 'Vitamix 5200 Blender', 'category' => 'Kitchen', 'price' => 499.95, 'desc' => 'Professional-grade blending. The size and shape of the classic 64-ounce container is ideal for blending medium to large batches.'],
        ['name' => 'Carhartt Trade Canvas Backpack', 'category' => 'Clothing', 'price' => 45.00, 'desc' => 'Durable, versatile backpack made from heavy-duty canvas. Includes a large main compartment and zippered front pocket.']
    ];

    private static array $usedSkus = [];

    public function definition(): array
    {
        $item = $this->faker->randomElement(self::$products);
        $sku  = $this->generateUniqueSku($item['category']);

        return [
            'name'        => $item['name'],
            'sku'         => $sku,
            'description' => $item['desc'],
            'price'       => $item['price'],
            'stock'       => $this->faker->numberBetween(10, 500),
            'status'      => $this->faker->randomFloat(0, 0, 100) > 15 ? 'active' : 'inactive',
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (Product $product) {
            $product->images()->create([
                'image_url'  => 'https://picsum.photos/seed/' . $product->id . '/600/600',
                'order'      => 0,
                'is_primary' => true,
            ]);
            
            // Re-fetch to load the new image relation if needed later in the seeder
            $product->load('images');
        });
    }

    public function active(): static
    {
        return $this->state(['status' => 'active', 'stock' => $this->faker->numberBetween(10, 300)]);
    }

    public function outOfStock(): static
    {
        return $this->state(['stock' => 0, 'status' => 'active']);
    }

    private function generateUniqueSku(string $category): string
    {
        $prefix = strtoupper(substr($category, 0, 3));
        do {
            $sku = $prefix . '-' . strtoupper($this->faker->lexify('???')) . '-' . $this->faker->numerify('####');
        } while (in_array($sku, self::$usedSkus));

        self::$usedSkus[] = $sku;
        return $sku;
    }
}
