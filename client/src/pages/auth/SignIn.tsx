import { LoginForm } from "@/features/auth/components/LoginForm";
import { useAuth } from "@/features/auth/useAuth";
import { Navigate, useNavigate } from "react-router-dom";

export const SignIn = () => {
  const { isAuth, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isAuth && !isLoading) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="container flex items-center justify-center">
      <LoginForm onSuccess={() => navigate("/")} />
    </main>
  );
};
