import { useAuth } from "@/features/auth/useAuth";
import { Loader2 } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

type Props = {
  requireAdmin?: boolean;
};

export const AuthLayout: React.FC<Props> = ({ requireAdmin }) => {
  const { isAuth, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <main className="grid place-content-center">
        <Loader2 className="animate-spin" />
      </main>
    );
  }

  if (!isAuth) {
    return <Navigate to="/" replace />;
  }

  if (requireAdmin && !user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet key={location.key} />;
};
