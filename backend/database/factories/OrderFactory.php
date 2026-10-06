<?php

namespace Database\Factories;

use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        $subtotal = 0; // Will be set during seeding
        return [
            'customer_name'    => $this->faker->name(),
            'customer_email'   => $this->faker->unique()->safeEmail(),
            'customer_phone'   => '01' . $this->faker->numerify('#########'),
            'customer_address' => $this->faker->numberBetween(1, 999) . ', '
                . $this->faker->streetName() . ', '
                . $this->faker->randomElement(['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna']),
            'subtotal'         => 0,
            'total'            => 0,
            'status'           => Order::STATUS_PENDING,
            'created_at'       => $this->faker->dateTimeBetween('-3 weeks', 'now'),
        ];
    }
}
