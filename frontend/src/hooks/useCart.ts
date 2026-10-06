import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Cart } from "@/types";

export function useCart() {
  const queryClient = useQueryClient();

  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const { data } = await api.get<Cart>("/cart");
      return data;
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
      const { data } = await api.post<Cart>("/cart/items", { product_id: productId, quantity });
      return data;
    },
    onSuccess: (newCart) => {
      queryClient.setQueryData(["cart"], newCart);
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
      const { data } = await api.patch<Cart>(`/cart/items/${productId}`, { quantity });
      return data;
    },
    onSuccess: (newCart) => {
      queryClient.setQueryData(["cart"], newCart);
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (productId: number) => {
      const { data } = await api.delete<Cart>(`/cart/items/${productId}`);
      return data;
    },
    onSuccess: (newCart) => {
      queryClient.setQueryData(["cart"], newCart);
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
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
    updateItem: updateItemMutation.mutate,
    removeItem: removeItemMutation.mutate,
    clearCart: clearCartMutation.mutate,
  };
}
