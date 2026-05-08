import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdditionalFlag, CookingStatus, ProductCategory } from "../models/enums";
import { api } from '../api/api';
import type { Product } from '../models/product';

export const useProducts = (filters: {
    category?: ProductCategory;
    status?: CookingStatus;
    flags?: AdditionalFlag[];
    search?: string;
    sortBy?: string;
}) => {
    return useQuery({
        queryKey: ["products", filters],
        queryFn: async () => {
            const res = await api.get<Product[]>("/products", {
                params: filters
            });
            return res.data;
        }
    });
};

export const useProduct = (id: number) => useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
        const res = await api.get<Product>(`/products/${id}`);
        return res.data;
    }
});

export const useCreateProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => api.post<Product>("/products", product),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["products"]
            });
        }
    });
};

export const useUpdateProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({id, ...product}: Product) => api.put<Product>(`/products/${id}`, product),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["products"]
            });
        }
    });
};

export const useDeleteProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.delete(`/products/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["products"]
            });
        }
    });
};