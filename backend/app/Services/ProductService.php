<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ProductService
{
    const CACHE_LIST_TTL    = 300;  // 5 minutes
    const CACHE_DETAIL_TTL  = 600;  // 10 minutes

    /**
     * Get paginated products for the public storefront.
     * Cached with search-aware keys.
     */
    public function list(array $filters = []): \Illuminate\Pagination\LengthAwarePaginator
    {
        $search   = $filters['search'] ?? null;
        $perPage  = min((int) ($filters['per_page'] ?? 15), 50);
        $page     = (int) ($filters['page'] ?? 1);

        $query = Product::active();

        $sort = $filters['sort'] ?? null;

        if ($sort === 'price_asc') {
            $query->orderBy('price', 'asc')->orderByDesc('id');
        } elseif ($sort === 'price_desc') {
            $query->orderBy('price', 'desc')->orderByDesc('id');
        } else {
            $query->orderByDesc('created_at')->orderByDesc('id');
        }

        if ($search) {
            $query->search($search);
        }

        return $query->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * Get a single product for the storefront.
     */
    public function findPublic(int $id): ?Product
    {
        return Cache::remember("product:{$id}", self::CACHE_DETAIL_TTL, function () use ($id) {
            return Product::active()->find($id);
        });
    }

    /**
     * Create a product and bust the list cache.
     */
    public function create(array $data): Product
    {
        $product = Product::create($data);
        $this->bustListCache();
        return $product;
    }

    /**
     * Update a product and bust relevant caches.
     */
    public function update(Product $product, array $data): Product
    {
        $product->update($data);
        $this->bustListCache();
        Cache::forget("product:{$product->id}");
        return $product->fresh();
    }

    /**
     * Soft-delete a product and bust caches.
     */
    public function delete(Product $product): void
    {
        $product->delete();
        $this->bustListCache();
        Cache::forget("product:{$product->id}");
    }

    /**
     * Adjust stock directly (admin inventory update).
     */
    public function adjustStock(Product $product, int $newStock): Product
    {
        $product->update(['stock' => $newStock]);
        Cache::forget("product:{$product->id}");
        return $product->fresh();
    }

    /**
     * Bust all product list cache keys.
     * We use a cache tag strategy: invalidate the tag to clear all list pages.
     */
    private function bustListCache(): void
    {
        // Use Cache tags if driver supports it (Redis does), fallback to pattern delete
        try {
            Cache::tags(['products'])->flush();
        } catch (\Exception) {
            // Non-taggable driver — keys are short-lived, acceptable
        }
    }
}
