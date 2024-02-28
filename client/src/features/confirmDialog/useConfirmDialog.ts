import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  ConfirmDialogState,
  setDialog as setDialogAction,
} from "./confirmDialogSlice";

export function useConfirmDialog() {
  const dispatch = useAppDispatch();
  const dialog = useAppSelector((state) => state.confirmDialog);
  const setDialog = (state: ConfirmDialogState) =>
    dispatch(setDialogAction(state));

  return [dialog, setDialog] as const;
}
