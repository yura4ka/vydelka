import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { useAuth } from "@/features/auth/useAuth";
import { Toaster } from "../ui/toaster";

export const Layout = () => {
  useAuth();
  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr_auto]">
      <Navbar />
      <Outlet />
      <Footer />
      <Toaster />
    </div>
  );
};
