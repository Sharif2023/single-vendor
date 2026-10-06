import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Product, PaginatedResponse } from "@/types";

export function useProducts(page = 1, search = "", sort = "") {
  return useQuery({
    queryKey: ["products", { page, search, sort }],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Product>>("/products", {
        params: { page, search, sort },
      });
      return data;
    },
    retry: 2,
    staleTime: 60 * 1000,
  });
}

export function useProduct(id: number | null) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data } = await api.get<Product>(`/products/${id}`);
      return data;
    },
    enabled: !!id,
    retry: 2,
    staleTime: 60 * 1000,
  });
}
