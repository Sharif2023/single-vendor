<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'sku',
        'description',
        'price',
        'discount_price',
        'stock',
        'status',
        'image_url',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'discount_price' => 'decimal:2',
        'stock' => 'integer',
    ];

    // ─── Relationships ──────────────────────────────────────────────────────────

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('order')->orderBy('id');
    }

    // ─── Scopes ─────────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeLowStock($query, int $threshold = 10)
    {
        return $query->where('stock', '<=', $threshold)->where('stock', '>', 0);
    }

    public function scopeOutOfStock($query)
    {
        return $query->where('stock', 0);
    }

    /**
     * Search scope: Full-text on PostgreSQL with fallback for SQLite/MySQL.
     */
    public function scopeSearch($query, string $term)
    {
        $term = trim($term);
        if (empty($term)) {
            return $query;
        }

        if (\DB::connection()->getDriverName() === 'pgsql') {
            return $query->where(function ($q) use ($term) {
                $q->whereRaw(
                    "to_tsvector('english', name || ' ' || COALESCE(description, '')) @@ plainto_tsquery('english', ?)",
                    [$term]
                )->orWhere('name', 'ilike', "%{$term}%");
            });
        }

        return $query->where(function ($q) use ($term) {
            $q->where('name', 'like', "%{$term}%")
              ->orWhere('description', 'like', "%{$term}%")
              ->orWhere('sku', 'like', "%{$term}%");
        });
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isInStock(): bool
    {
        return $this->stock > 0;
    }
}
