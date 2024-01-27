import { createAction } from "@reduxjs/toolkit";
import { AuthState } from "./authSlice";

function withPayloadType<T>() {
  return (t: T) => ({ payload: t });
}

export const setCredentials = createAction(
  "auth/setCredentials",
  withPayloadType<AuthState>(),
);
