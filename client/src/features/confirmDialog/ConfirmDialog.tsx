import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useConfirmDialog } from "./useConfirmDialog";
import { useTranslation } from "react-i18next";

export const ConfirmDialog = () => {
  const { t } = useTranslation();
  const [dialog, setDialog] = useConfirmDialog();
  return (
    <AlertDialog
      open={dialog.open}
      onOpenChange={(open) => setDialog({ ...dialog, open })}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dialog.title}</AlertDialogTitle>
          <AlertDialogDescription>{dialog.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {dialog.onCancel !== undefined && (
            <AlertDialogCancel onClick={dialog.onCancel ?? undefined}>
              {t("cancel")}
            </AlertDialogCancel>
          )}
          <AlertDialogAction onClick={dialog.onSuccess}>
            {t("ok")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
