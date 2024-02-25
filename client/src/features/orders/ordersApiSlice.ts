import { api } from "@/app/api/apiSlice";
import { CartItem } from "../cart";

export type DeliveryType = "delivery" | "self";
export type PaymentType = "pay_now" | "pay_receive";

export type NewOrder = {
  deliveryType: DeliveryType;
  address?: string;
  paymentType: PaymentType;
  products: CartItem[];
};

export const ordersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    checkout: builder.mutation<{ url: string }, NewOrder>({
      query: (body) => ({ url: "order", method: "POST", body }),
    }),
  }),
});

export const { useCheckoutMutation } = ordersApi;
