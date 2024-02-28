import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { Layout, AuthLayout } from "./components/layout";
import { Home } from "./pages/home";
import { RestorePassword, SignIn, SignUp } from "./pages/auth";
import { AdminCategories } from "./pages/admin";
import { CategoryPage } from "./pages/categories";
import { ProductPage, SearchPage } from "./pages/products/";
import { CheckoutPage } from "./pages/checkout";
import { OrdersPage } from "./pages/orders";
import { ProfilePage } from "./pages/profile";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "/categories", element: <CategoryPage /> },
      { path: "/:slug", element: <CategoryPage /> },
      { path: "/p/:slug", element: <ProductPage /> },
      { path: "/checkout", element: <CheckoutPage /> },
      { path: "/search", element: <SearchPage /> },
      {
        element: <AuthLayout />,
        children: [
          { path: "/orders", element: <OrdersPage /> },
          { path: "/profile", element: <ProfilePage /> },
        ],
      },
      {
        path: "auth",
        children: [
          { path: "sign-in", element: <SignIn /> },
          { path: "sign-up", element: <SignUp /> },
          { path: "restore-password", element: <RestorePassword /> },
        ],
      },
      {
        path: "admin",
        element: <AuthLayout requireAdmin />,
        children: [{ path: "categories/:id?", element: <AdminCategories /> }],
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
