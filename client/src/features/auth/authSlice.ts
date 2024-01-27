import { RootState } from "@/app/store";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { authApi } from "./authApiSlice";
import { setCredentials } from "./actions";

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
    changeUser: (state, { payload }: PayloadAction<Partial<User>>) => {
      if (state.user) Object.assign(state.user, payload);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(setCredentials, (_, { payload }) => payload);
    builder.addMatcher(
      authApi.endpoints.login.matchFulfilled,
      (_, { payload }) => {
        return payload;
      },
    );
    builder.addMatcher(
      authApi.endpoints.refresh.matchFulfilled,
      (_, { payload }) => {
        return payload;
      },
    );
    builder.addMatcher(authApi.endpoints.refresh.matchRejected, () => {
      return { user: null };
    });
    builder.addMatcher(authApi.endpoints.logout.matchFulfilled, () => {
      return { user: null };
    });
  },
});

export const { changeUser } = authSlice.actions;

export const selectAuth = (state: RootState) => state.auth;

export default authSlice.reducer;
