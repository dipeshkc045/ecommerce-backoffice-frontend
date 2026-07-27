import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Order, OrderStatus } from "./types";

const ordersKey = {
  all: ["orders"] as const,
  user: (userId: string) => ["orders", "user", userId] as const,
  detail: (id: string) => ["orders", id] as const,
};

export function useOrders(userId: string) {
  return useQuery({
    queryKey: ordersKey.user(userId),
    queryFn: () =>
      apiClient.get<Order[]>(`/orders/user/${userId}`),
    enabled: !!userId,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: OrderStatus;
    }) => apiClient.patch<Order>(`/orders/${id}`, { status }),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["orders"],
      });
    },
  });
}