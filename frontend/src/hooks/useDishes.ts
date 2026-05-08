import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AdditionalFlag, DishCategory } from "../models/enums"
import { api } from "../api/api";
import type { Dish, DishDto } from "../models/dish";

export const useDishes = (filters: {
    category?: DishCategory;
    flags?: AdditionalFlag[];
    search?: string;
}) => {
    return useQuery({
        queryKey: ["dishes", filters],
        queryFn: async () => {
            const res = await api.get<Dish[]>("/dishes", {
                params: filters
            });
            return res.data;
        }
    });
};

export const useDish = (id: number) => {
    return useQuery({
        queryKey: ["dish", id],
        queryFn: async () => {
            const res = await api.get<Dish>(`/dishes/${id}`);
            return res.data;
        }
    });
};

export const useCreateDish = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (req: DishDto) => api.post<Dish>("/dishes", req),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["dishes"]
            });
        }
    });
};

export const useUpdateDish = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({id, ...req}: {id: number} & DishDto) => api.put<Dish>(`/dishes/${id}`, req),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["dishes"]
            });
        }
    });
};

export const useDeleteDish = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.delete(`/dishes/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["dishes"]
            });
        }
    });
};