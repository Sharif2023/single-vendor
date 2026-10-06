<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->unsignedInteger('quantity');
            // Snapshot of price at time of order — never references live product price
            $table->decimal('unit_price', 10, 2);
            $table->decimal('subtotal', 10, 2);
            $table->timestamps();

            $table->index('order_id');
            $table->index('product_id');

            // Ensure positive quantity
        });

        \DB::statement('ALTER TABLE order_items ADD CONSTRAINT quantity_positive CHECK (quantity > 0)');
        \DB::statement('ALTER TABLE order_items ADD CONSTRAINT unit_price_positive CHECK (unit_price > 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
