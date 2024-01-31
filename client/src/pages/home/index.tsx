import { useAuth } from "@/features/auth/useAuth";

export const Home = () => {
  const { isAuth, user } = useAuth();
  return (
    <div>
      Home <p>Hello, {isAuth ? user.firstName : "guest"}</p>
    </div>
  );
};
