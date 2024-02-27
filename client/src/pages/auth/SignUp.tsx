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
    <main className="flex items-center justify-center py-4">
      <RegisterForm
        className="border-0 shadow-none sm:border sm:shadow"
        onSuccess={() => navigate("/")}
        onError={() => navigate("/auth/sign-in")}
      />
    </main>
  );
};
