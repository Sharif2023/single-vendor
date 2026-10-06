<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('sku')->unique();
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->unsignedInteger('stock')->default(0);
            $table->enum('status', ['active', 'inactive'])->default('active')->index();
            $table->timestamps();
            $table->softDeletes();

            // Performance indexes
            $table->index('created_at');
            $table->index(['status', 'stock']);
        });

        // Full-text search index on name and description (PostgreSQL)
        \DB::statement("CREATE INDEX products_search_idx ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')))");

        // Enforce non-negative stock at DB level
        \DB::statement('ALTER TABLE products ADD CONSTRAINT stock_non_negative CHECK (stock >= 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
