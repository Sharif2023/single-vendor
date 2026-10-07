<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Models\ProductImage;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

class AdminProductController extends Controller
{
    public function __construct(private ProductService $productService) {}

    /**
     * List all products (including inactive) with search and pagination.
     * GET /api/admin/products
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $search      = $request->input('search');
        $status      = $request->input('status');
        $stockStatus = $request->input('stock_status');
        $category    = $request->input('category');
        $sort        = $request->input('sort', 'newest');
        $perPage     = min((int) $request->input('per_page', 15), 100);

        $query = Product::with('images')->withTrashed();

        if ($search) {
            $like = \DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where(function ($q) use ($search, $like) {
                $q->where('name', $like, "%{$search}%")
                  ->orWhere('sku', $like, "%{$search}%");
            });
        }

        if ($status && in_array($status, ['active', 'inactive'], true)) {
            $query->where('status', $status);
        }

        if ($stockStatus) {
            if ($stockStatus === 'out_of_stock') {
                $query->where('stock', '<=', 0);
            } elseif ($stockStatus === 'low_stock') {
                $query->where('stock', '>', 0)->where('stock', '<=', 5);
            } elseif ($stockStatus === 'in_stock') {
                $query->where('stock', '>', 5);
            }
        }

        if ($category && $category !== 'all') {
            $query->where('sku', 'like', strtoupper($category) . '-%');
        }

        match ($sort) {
            'price_asc'  => $query->orderBy('price', 'asc'),
            'price_desc' => $query->orderBy('price', 'desc'),
            'stock_asc'  => $query->orderBy('stock', 'asc'),
            'stock_desc' => $query->orderBy('stock', 'desc'),
            'name_asc'   => $query->orderBy('name', 'asc'),
            default      => $query->orderByDesc('created_at')->orderByDesc('id'),
        };

        return ProductResource::collection($query->paginate($perPage));
    }

    /**
     * Create a new product.
     * POST /api/admin/products
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'         => 'required|string|max:255',
            'sku'          => 'required|string|max:100|unique:products,sku',
            'description'  => 'nullable|string',
            'price'        => 'required|numeric|min:0.01',
            'stock'        => 'required|integer|min:0',
            'status'       => 'required|in:active,inactive',
            'image_url'    => 'nullable|string|url|max:2048',
            'image'        => 'nullable|image|max:5120',
            'sub_images'   => 'nullable|array|max:5',
            'sub_images.*' => 'image|max:5120',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products');
            $data['image_url'] = \Illuminate\Support\Facades\Storage::url($path);
        }

        $product = $this->productService->create($data);

        if ($request->hasFile('sub_images')) {
            $order = 1;
            foreach ($request->file('sub_images') as $file) {
                if ($order > 5) break;
                $subPath = $file->store('products');
                $product->images()->create([
                    'image_url'  => \Illuminate\Support\Facades\Storage::url($subPath),
                    'order'      => $order++,
                    'is_primary' => false,
                ]);
            }
        }

        return response()->json(new ProductResource($product->load('images')), 201);
    }

    /**
     * Show a single product (admin view includes soft-deleted).
     * GET /api/admin/products/{id}
     */
    public function show(int $id): JsonResponse
    {
        $product = Product::with('images')->withTrashed()->find($id);

        if (! $product) {
            return response()->json(['message' => 'Product not found.'], 404);
        }

        return response()->json(new ProductResource($product));
    }

    /**
     * Update a product.
     * PUT /api/admin/products/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $product = Product::withTrashed()->findOrFail($id);

        $data = $request->validate([
            'name'               => 'sometimes|required|string|max:255',
            'sku'                => ['sometimes', 'required', 'string', 'max:100', Rule::unique('products', 'sku')->ignore($product->id)->whereNull('deleted_at')],
            'description'        => 'nullable|string',
            'price'              => 'sometimes|required|numeric|min:0.01',
            'stock'              => 'sometimes|required|integer|min:0',
            'status'             => 'sometimes|required|in:active,inactive',
            'image_url'          => 'nullable|string|url|max:2048',
            'image'              => 'nullable|image|max:5120',
            'sub_images'         => 'nullable|array|max:5',
            'sub_images.*'       => 'image|max:5120',
            'delete_image_ids'   => 'nullable|array',
            'delete_image_ids.*' => 'integer',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products');
            $data['image_url'] = \Illuminate\Support\Facades\Storage::url($path);
        }

        if (!empty($data['delete_image_ids'])) {
            $product->images()->whereIn('id', $data['delete_image_ids'])->delete();
        }

        $product = $this->productService->update($product, $data);

        if ($request->hasFile('sub_images')) {
            $currentCount = $product->images()->count();
            $maxAllowed = max(0, 5 - $currentCount);
            $order = $currentCount + 1;
            $files = array_slice($request->file('sub_images'), 0, $maxAllowed);
            foreach ($files as $file) {
                $subPath = $file->store('products');
                $product->images()->create([
                    'image_url'  => \Illuminate\Support\Facades\Storage::url($subPath),
                    'order'      => $order++,
                    'is_primary' => false,
                ]);
            }
        }

        return response()->json(new ProductResource($product->load('images')));
    }

    /**
     * Soft-delete a product.
     * DELETE /api/admin/products/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        $this->productService->delete($product);

        return response()->json(['message' => 'Product deleted successfully.']);
    }

    /**
     * Delete a single sub-image of a product.
     * DELETE /api/admin/products/{id}/images/{imageId}
     */
    public function destroyImage(int $id, int $imageId): JsonResponse
    {
        $product = Product::withTrashed()->findOrFail($id);
        $image = $product->images()->findOrFail($imageId);
        $image->delete();

        Cache::forget("product:{$product->id}");

        return response()->json([
            'message' => 'Image deleted successfully.',
            'images'  => $product->fresh()->images,
        ]);
    }

    /**
     * Update product stock (inventory adjustment).
     * PATCH /api/admin/products/{id}/stock
     */
    public function updateStock(Request $request, int $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        $data = $request->validate([
            'stock' => 'required|integer|min:0',
        ]);

        $product = $this->productService->adjustStock($product, $data['stock']);

        return response()->json(new ProductResource($product->load('images')));
    }
}
