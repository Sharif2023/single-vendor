import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Cart } from "@/types";
import { useCallback } from "react";

// Module-level map to track pending debounced updates per product ID
const debounceTimers = new Map<number, NodeJS.Timeout>();
const pendingQuantities = new Map<number, number>();

export function useCart() {
  const queryClient = useQueryClient();

  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const { data } = await api.get<Cart>("/cart");
      return data;
    },
  });

  // Helper to optimistically update the cache with new quantity
  const updateCacheQuantity = useCallback(
    (productId: number, newQty: number) => {
      const previousCart = queryClient.getQueryData<Cart>(["cart"]);
      if (!previousCart) return previousCart;

      const updatedItems = previousCart.items
        .map((item) => {
          if (item.product_id === productId) {
            const lineSubtotal = Math.round(item.price * newQty * 100) / 100;
            return {
              ...item,
              quantity: newQty,
              subtotal: lineSubtotal,
              in_stock: item.stock >= newQty,
            };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);

      const newSubtotal = Math.round(
        updatedItems.reduce((acc, it) => acc + it.subtotal, 0) * 100
      ) / 100;

      const newCart: Cart = {
        ...previousCart,
        items: updatedItems,
        subtotal: newSubtotal,
        total: newSubtotal,
        count: updatedItems.length,
      };

      queryClient.setQueryData<Cart>(["cart"], newCart);
      return newCart;
    },
    [queryClient]
  );

  // Instant debounced item quantity update
  const updateItem = useCallback(
    (
      { productId, quantity }: { productId: number; quantity: number },
      options?: { onError?: () => void; onSuccess?: (cart: Cart) => void }
    ) => {
      // 1. Instant optimistic update in cache
      updateCacheQuantity(productId, quantity);
      pendingQuantities.set(productId, quantity);

      // 2. Clear existing debounce timer
      const existingTimer = debounceTimers.get(productId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // 3. Debounce network PATCH by 350ms
      const timer = setTimeout(async () => {
        try {
          debounceTimers.delete(productId);
          const targetQty = pendingQuantities.get(productId) ?? quantity;
          pendingQuantities.delete(productId);

          const { data } = await api.patch<Cart>(`/cart/items/${productId}`, {
            quantity: targetQty,
          });

          // Only apply server cart if no new timer was scheduled during the request
          if (!debounceTimers.has(productId)) {
            queryClient.setQueryData(["cart"], data);
            options?.onSuccess?.(data);
          }
        } catch (error) {
          queryClient.invalidateQueries({ queryKey: ["cart"] });
          options?.onError?.();
        }
      }, 350);

      debounceTimers.set(productId, timer);
    },
    [queryClient, updateCacheQuantity]
  );

  // Synchronous step quantity helper for instant responsive clicks (+1 / -1)
  const stepQuantity = useCallback(
    (productId: number, delta: number, options?: { onError?: () => void }) => {
      const currentCart = queryClient.getQueryData<Cart>(["cart"]);
      const item = currentCart?.items.find((i) => i.product_id === productId);
      if (!item) return;

      const currentQty = pendingQuantities.get(productId) ?? item.quantity;
      const targetQty = Math.max(1, Math.min(item.stock, currentQty + delta));
      if (targetQty === currentQty) return;

      updateItem({ productId, quantity: targetQty }, options);
    },
    [queryClient, updateItem]
  );

  // Flush any pending updates immediately (e.g. before navigating to checkout)
  const flushUpdates = useCallback(async () => {
    const promises: Promise<void>[] = [];
    debounceTimers.forEach((timer, productId) => {
      clearTimeout(timer);
      const targetQty = pendingQuantities.get(productId);
      if (targetQty !== undefined) {
        promises.push(
          api
            .patch<Cart>(`/cart/items/${productId}`, { quantity: targetQty })
            .then(({ data }) => {
              queryClient.setQueryData(["cart"], data);
            })
            .catch(() => {})
        );
      }
    });
    debounceTimers.clear();
    pendingQuantities.clear();
    await Promise.all(promises);
  }, [queryClient]);

  const addItemMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
      const { data } = await api.post<Cart>("/cart/items", { product_id: productId, quantity });
      return data;
    },
    onMutate: async ({ productId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previousCart = queryClient.getQueryData<Cart>(["cart"]);
      if (previousCart) {
        const existing = previousCart.items.find((i) => i.product_id === productId);
        let updatedItems: Cart["items"];
        if (existing) {
          const newQty = existing.quantity + quantity;
          updatedItems = previousCart.items.map((i) =>
            i.product_id === productId
              ? {
                  ...i,
                  quantity: newQty,
                  subtotal: Math.round(i.price * newQty * 100) / 100,
                  in_stock: i.stock >= newQty,
                }
              : i
          );
        } else {
          updatedItems = [...previousCart.items];
        }
        const newSubtotal = Math.round(
          updatedItems.reduce((acc, it) => acc + it.subtotal, 0) * 100
        ) / 100;
        queryClient.setQueryData<Cart>(["cart"], {
          ...previousCart,
          items: updatedItems,
          subtotal: newSubtotal,
          total: newSubtotal,
          count: existing ? previousCart.count : previousCart.count + 1,
        });
      }
      return { previousCart };
    },
    onSuccess: (newCart) => {
      queryClient.setQueryData(["cart"], newCart);
    },
    onError: (_err, _vars, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(["cart"], context.previousCart);
      }
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (productId: number) => {
      // Clear any pending debounce timer for this product
      const existingTimer = debounceTimers.get(productId);
      if (existingTimer) {
        clearTimeout(existingTimer);
        debounceTimers.delete(productId);
        pendingQuantities.delete(productId);
      }
      const { data } = await api.delete<Cart>(`/cart/items/${productId}`);
      return data;
    },
    onMutate: async (productId: number) => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previousCart = queryClient.getQueryData<Cart>(["cart"]);
      if (previousCart) {
        const updatedItems = previousCart.items.filter((item) => item.product_id !== productId);
        const newSubtotal = Math.round(
          updatedItems.reduce((acc, it) => acc + it.subtotal, 0) * 100
        ) / 100;
        queryClient.setQueryData<Cart>(["cart"], {
          ...previousCart,
          items: updatedItems,
          subtotal: newSubtotal,
          total: newSubtotal,
          count: updatedItems.length,
        });
      }
      return { previousCart };
    },
    onSuccess: (newCart) => {
      queryClient.setQueryData(["cart"], newCart);
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      debounceTimers.forEach((timer) => clearTimeout(timer));
      debounceTimers.clear();
      pendingQuantities.clear();
      const { data } = await api.delete<Cart>("/cart");
      return data;
    },
    onSuccess: (newCart) => {
      queryClient.setQueryData(["cart"], newCart);
    },
  });

  return {
    cartQuery,
    addItem: addItemMutation.mutate,
    isAdding: addItemMutation.isPending,
    updateItem,
    stepQuantity,
    flushUpdates,
    removeItem: removeItemMutation.mutate,
    clearCart: clearCartMutation.mutate,
  };
}
