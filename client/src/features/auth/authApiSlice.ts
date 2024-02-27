import { api } from "@/app/api/apiSlice";
import { AuthState, changeUser } from "./authSlice";

export type RegisterRequest = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
};

export type LoginRequest = {
  emailOrPhone: string;
  password: string;
};

export type ChangeUser = {
  user?: Omit<Partial<RegisterRequest>, "password">;
  password?: {
    oldPassword: string;
    newPassword: string;
  };
};

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<{ id: string }, RegisterRequest>({
      query: (credentials) => ({
        url: "auth/register",
        method: "POST",
        body: credentials,
      }),
    }),

    login: builder.mutation<Required<AuthState>, LoginRequest>({
      query: (credentials) => ({
        url: "auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Orders", "Reviews"],
    }),

    refresh: builder.query<Required<AuthState>, undefined>({
      query: () => ({ url: "auth/refresh" }),
    }),

    checkEmail: builder.query<undefined, string>({
      query: (email) => ({
        url: `auth/availability/email/${email}`,
        responseHandler: (response) => response.text(),
      }),
    }),

    checkPhoneNumber: builder.query<undefined, string>({
      query: (phone) => ({
        url: `auth/availability/phone/${phone}`,
        responseHandler: (response) => response.text(),
      }),
    }),

    logout: builder.mutation<undefined, void>({
      query: () => ({
        url: "auth/logout",
        method: "POST",
        responseHandler: (response) => response.text(),
      }),
      invalidatesTags: ["Orders", "Reviews"],
    }),

    changeUser: builder.mutation<undefined, ChangeUser>({
      query: (body) => ({ url: `auth/user`, method: "PATCH", body }),
      onQueryStarted: async (body, { dispatch, queryFulfilled }) => {
        await queryFulfilled;
        if (body.user) dispatch(changeUser(body.user));
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRefreshQuery,
  useLazyCheckEmailQuery,
  useLazyCheckPhoneNumberQuery,
  useLogoutMutation,
  useChangeUserMutation,
} = authApi;
