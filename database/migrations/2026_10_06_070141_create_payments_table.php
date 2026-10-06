<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            // One payment record per order — unique enforces this at DB level
            $table->foreignId('order_id')->unique()->constrained('orders')->cascadeOnDelete();
            $table->string('provider')->default('sslcommerz');
            $table->string('transaction_id')->unique()->nullable(); // val_id from SSL
            $table->string('session_key')->nullable(); // SSLCommerz session key
            $table->decimal('amount', 10, 2);
            $table->enum('status', ['pending', 'paid', 'failed', 'cancelled', 'refunded'])->default('pending');
            $table->json('raw_response')->nullable(); // full callback payload for audit
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('transaction_id');
            $table->index(['order_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
