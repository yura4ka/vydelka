import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export type ConfirmDialogState = {
  open: boolean;
  title: string;
  description: string;
  onSuccess?: () => void;
  onCancel?: null | (() => void);
};

const initialState: ConfirmDialogState = {
  open: false,
  title: "",
  description: "",
};

const confirmDialogSlice = createSlice({
  name: "confirmModal",
  initialState,
  reducers: {
    setDialog: (_, action: PayloadAction<ConfirmDialogState>) => {
      return action.payload;
    },
  },
});

export const { setDialog } = confirmDialogSlice.actions;
export default confirmDialogSlice.reducer;
