import { RootState } from "@/app/store";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { authApi } from "./authApiSlice";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  isAdmin: boolean;
}

export interface AuthState {
  user?: User | null;
  token?: string;
}

const initialState: AuthState = {};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (_, { payload }: PayloadAction<AuthState>) => payload,
    changeUser: (state, { payload }: PayloadAction<Partial<User>>) => {
      if (state.user) Object.assign(state.user, payload);
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      authApi.endpoints.login.matchFulfilled,
      (_, { payload }) => {
        return payload;
      }
    );
    builder.addMatcher(
      authApi.endpoints.refresh.matchFulfilled,
      (_, { payload }) => {
        return payload;
      }
    );
    builder.addMatcher(authApi.endpoints.refresh.matchRejected, () => {
      return { user: null };
    });
    builder.addMatcher(authApi.endpoints.logout.matchFulfilled, () => {
      return { user: null };
    });
  },
});

export const { setCredentials, changeUser } = authSlice.actions;

export const selectAuth = (state: RootState) => state.auth;

export default authSlice.reducer;
