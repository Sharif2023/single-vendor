<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
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
        $search  = $request->input('search');
        $perPage = min((int) $request->input('per_page', 15), 100);

        $query = Product::withTrashed()->orderByDesc('created_at')->orderByDesc('id');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('sku', 'ilike', "%{$search}%");
            });
        }

        $status = $request->input('status');
        if ($status && in_array($status, ['active', 'inactive'])) {
            $query->where('status', $status);
        }

        return ProductResource::collection($query->paginate($perPage));
    }

    /**
     * Create a new product.
     * POST /api/admin/products
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|max:255',
            'sku'         => 'required|string|max:100|unique:products,sku',
            'description' => 'nullable|string',
            'price'       => 'required|numeric|min:0.01',
            'stock'       => 'required|integer|min:0',
            'status'      => 'required|in:active,inactive',
            'image_url'   => 'nullable|string|url|max:2048',
            'image'       => 'nullable|image|max:5120',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $data['image_url'] = url('storage/' . $path);
        }

        $product = $this->productService->create($data);

        return response()->json(new ProductResource($product), 201);
    }

    /**
     * Show a single product (admin view includes soft-deleted).
     * GET /api/admin/products/{id}
     */
    public function show(int $id): JsonResponse
    {
        $product = Product::withTrashed()->find($id);

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
            'name'        => 'sometimes|required|string|max:255',
            'sku'         => ['sometimes', 'required', 'string', 'max:100', Rule::unique('products', 'sku')->ignore($product->id)->whereNull('deleted_at')],
            'description' => 'nullable|string',
            'price'       => 'sometimes|required|numeric|min:0.01',
            'stock'       => 'sometimes|required|integer|min:0',
            'status'      => 'sometimes|required|in:active,inactive',
            'image_url'   => 'nullable|string|url|max:2048',
            'image'       => 'nullable|image|max:5120',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $data['image_url'] = url('storage/' . $path);
        }

        $product = $this->productService->update($product, $data);

        return response()->json(new ProductResource($product));
    }

    /**
     * Soft-delete a product.
     * DELETE /api/admin/products/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        $this->productService->delete($product);

        return response()->json(['message' => 'Product deleted.']);
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

        return response()->json(new ProductResource($product));
    }
}
