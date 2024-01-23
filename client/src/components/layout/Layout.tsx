import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export const Layout = () => {
  return (
    <div className="grid grid-rows-[auto_1fr_auto] min-h-screen">
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
};
