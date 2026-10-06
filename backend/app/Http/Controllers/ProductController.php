<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProductResource;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Public-facing product controller.
 * Endpoints are cached at the service layer.
 */
class ProductController extends Controller
{
    public function __construct(private ProductService $productService) {}

    /**
     * List active products with search and pagination.
     * GET /api/products
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $products = $this->productService->list($request->only(['search', 'per_page', 'page', 'sort']));

        return ProductResource::collection($products);
    }

    /**
     * Show a single active product.
     * GET /api/products/{id}
     */
    public function show(int $id): JsonResponse
    {
        $product = $this->productService->findPublic($id);

        if (! $product) {
            return response()->json(['message' => 'Product not found.'], 404);
        }

        return response()->json(new ProductResource($product));
    }
}
