import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { useAuth } from "@/features/auth/useAuth";
import { Toaster } from "../ui/toaster";
import { useEffect } from "react";
import { CartModal } from "@/features/cart";
import { ConfirmDialog } from "@/features/confirmDialog";

export const Layout = () => {
  useAuth();

  const location = useLocation();
  useEffect(() => {
    const hash = location.hash;
    if (!hash) return;

    document
      .getElementById(hash.slice(1))
      ?.scrollIntoView({ behavior: "auto", block: "start" });
  }, [location]);

  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr_auto]">
      <Navbar />
      <Outlet />
      <Footer />
      <Toaster />
      <ScrollRestoration getKey={(location) => location.pathname} />
      <CartModal />
      <ConfirmDialog />
    </div>
  );
};
