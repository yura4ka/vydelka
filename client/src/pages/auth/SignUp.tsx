import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { useAuth } from "@/features/auth/useAuth";
import { Navigate, useNavigate } from "react-router-dom";

export const SignUp = () => {
  const { isAuth, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isAuth && !isLoading) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="container flex items-center justify-center">
      <RegisterForm
        onSuccess={() => navigate("/")}
        onError={() => navigate("/auth/sign-in")}
      />
    </main>
  );
};
