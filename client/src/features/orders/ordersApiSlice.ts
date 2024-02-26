import { api } from "@/app/api/apiSlice";
import { CartItem } from "../cart";

export type DeliveryType = "delivery" | "self";
export type PaymentType = "pay_now" | "pay_receive";
export type OrderStatus =
  | "processing"
  | "confirmed"
  | "received"
  | "expired"
  | "canceled";

export type NewOrder = {
  deliveryType: DeliveryType;
  address?: string;
  paymentType: PaymentType;
  products: CartItem[];
};

export type Order = {
  id: string;
  createdAt: string;
  deliveryType: DeliveryType;
  deliveryAddress?: string;
  payType: PaymentType;
  paymentTime?: string;
  stripeUrl?: string;
  status: OrderStatus;
  takeoutExpirationTime?: string;
  total: number;
  itemsCount: number;
};

export type OrdersResponse = {
  orders: Order[];
  hasMore: boolean;
  totalPages: number;
};

export const ordersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    checkout: builder.mutation<{ url: string }, NewOrder>({
      query: (body) => ({ url: "order", method: "POST", body }),
    }),

    getOrders: builder.query<OrdersResponse, { page: number }>({
      query: (args) => ({ url: `order?page=${args.page}` }),
      providesTags: (result) =>
        result
          ? [
              ...result.orders.map((o) => ({
                type: "Orders" as const,
                id: o.id,
              })),
              { type: "Orders", id: "LIST" },
            ]
          : [{ type: "Orders", id: "LIST" }],
    }),

    cancelOrder: builder.mutation<void, string>({
      query: (id) => ({ url: `order/${id}/cancel`, method: "PATCH" }),
      invalidatesTags: (_result, _error, id) => [{ type: "Orders", id }],
    }),
  }),
});

export const {
  useCheckoutMutation,
  useGetOrdersQuery,
  useCancelOrderMutation,
} = ordersApi;
