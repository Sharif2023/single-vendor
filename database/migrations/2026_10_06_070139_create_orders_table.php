<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone');
            $table->text('customer_address');
            $table->decimal('subtotal', 10, 2);
            $table->decimal('total', 10, 2);
            $table->enum('status', [
                'pending',
                'confirmed',
                'paid',
                'processing',
                'shipped',
                'delivered',
                'cancelled',
                'refunded',
            ])->default('pending');
            $table->string('notes')->nullable();
            $table->timestamps();

            // Performance indexes
            $table->index('status');
            $table->index('created_at');
            $table->index('customer_email');
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
