<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deliveries', function (Blueprint $table) {
            $table->id();
            // One delivery record per order
            $table->foreignId('order_id')->unique()->constrained('orders')->cascadeOnDelete();
            $table->string('consignment_id')->nullable()->index();
            $table->string('carrier')->default('CarryBee');
            $table->enum('status', [
                'pending',     // Job queued but not sent yet
                'dispatched',  // Successfully sent to CarryBee
                'in_transit',  // Picked up by courier
                'delivered',   // Delivered to customer
                'failed',      // CarryBee API failed permanently
                'returned',    // Returned to seller
            ])->default('pending');
            $table->string('tracking_url')->nullable();
            $table->json('api_response')->nullable(); // Full CarryBee API response
            $table->string('failed_reason')->nullable();
            $table->unsignedTinyInteger('attempt_count')->default(0);
            $table->timestamp('dispatched_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deliveries');
    }
};
