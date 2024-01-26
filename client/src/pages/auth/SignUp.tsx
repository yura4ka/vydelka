import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { useAuth } from "@/features/auth/useAuth";
import { useNavigate } from "react-router-dom";

export const SignUp = () => {
  const { isAuth, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isAuth && !isLoading) {
    navigate("/");
    return null;
  }
  return (
    <main className="container flex items-center justify-center">
      <RegisterForm />
    </main>
  );
};
