<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Cart is session-based (no authentication required).
 * The cart stores product IDs + quantities in the user's session.
 *
 * Why session-based? This is a guest checkout flow.
 * We don't require customer accounts, so we use the Laravel session
 * (backed by Redis in production) as a lightweight cart store.
 *
 * Stock validation happens at checkout — the cart itself doesn't decrement stock.
 */
class CartController extends Controller
{
    private const SESSION_KEY = 'cart';

    /**
     * Get the current cart contents with live product prices.
     * GET /api/cart
     */
    public function index(Request $request): JsonResponse
    {
        $cart = $this->getCart($request);
        return response()->json($this->enrichCart($cart));
    }

    /**
     * Add or merge an item into the cart.
     * POST /api/cart/items
     */
    public function addItem(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'quantity'   => 'required|integer|min:1|max:100',
        ]);

        $cart = $this->getCart($request);
        $pid  = $data['product_id'];

        // If product already in cart, merge quantity
        if (isset($cart[$pid])) {
            $cart[$pid] = min($cart[$pid] + $data['quantity'], 100);
        } else {
            $cart[$pid] = $data['quantity'];
        }

        $request->session()->put(self::SESSION_KEY, $cart);

        return response()->json($this->enrichCart($cart));
    }

    /**
     * Update item quantity. Set to 0 to remove.
     * PATCH /api/cart/items/{productId}
     */
    public function updateItem(Request $request, int $productId): JsonResponse
    {
        $data = $request->validate([
            'quantity' => 'required|integer|min:0|max:100',
        ]);

        $cart = $this->getCart($request);

        if ($data['quantity'] === 0) {
            unset($cart[$productId]);
        } else {
            $cart[$productId] = $data['quantity'];
        }

        $request->session()->put(self::SESSION_KEY, $cart);

        return response()->json($this->enrichCart($cart));
    }

    /**
     * Remove a single item from the cart.
     * DELETE /api/cart/items/{productId}
     */
    public function removeItem(Request $request, int $productId): JsonResponse
    {
        $cart = $this->getCart($request);
        unset($cart[$productId]);
        $request->session()->put(self::SESSION_KEY, $cart);

        return response()->json($this->enrichCart($cart));
    }

    /**
     * Clear the entire cart.
     * DELETE /api/cart
     */
    public function clear(Request $request): JsonResponse
    {
        $request->session()->forget(self::SESSION_KEY);
        return response()->json(['items' => [], 'subtotal' => 0, 'total' => 0, 'count' => 0]);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    private function getCart(Request $request): array
    {
        return $request->session()->get(self::SESSION_KEY, []);
    }

    /**
     * Enrich cart with live product data (name, price, stock).
     * N+1 avoided: fetch all products in one query.
     */
    private function enrichCart(array $cart): array
    {
        if (empty($cart)) {
            return ['items' => [], 'subtotal' => 0.0, 'total' => 0.0, 'count' => 0];
        }

        $products = \App\Models\Product::active()
            ->whereIn('id', array_keys($cart))
            ->get()
            ->keyBy('id');

        $items    = [];
        $subtotal = 0.0;

        foreach ($cart as $productId => $quantity) {
            $product = $products->get($productId);

            if (! $product) {
                continue; // Product deleted/deactivated — skip silently
            }

            $currentPrice = $product->discount_price !== null ? $product->discount_price : $product->price;
            $lineSubtotal = round($currentPrice * $quantity, 2);
            $subtotal    += $lineSubtotal;

            $items[] = [
                'product_id' => $product->id,
                'name'       => $product->name,
                'sku'        => $product->sku,
                'price'      => (float) $currentPrice,
                'quantity'   => $quantity,
                'subtotal'   => $lineSubtotal,
                'in_stock'   => $product->stock >= $quantity,
                'stock'      => $product->stock,
                'image_url'  => $product->image_url,
            ];
        }

        return [
            'items'    => $items,
            'subtotal' => round($subtotal, 2),
            'total'    => round($subtotal, 2),
            'count'    => count($items),
        ];
    }
}
