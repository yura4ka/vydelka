import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { Layout, AuthLayout } from "./components/layout";
import { Home } from "./pages/home";
import { SignIn, SignUp } from "./pages/auth";
import { AdminCategories } from "./pages/admin";
import { CategoryPage } from "./pages/categories";
import { ProductPage } from "./pages/products";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "/categories", element: <CategoryPage /> },
      { path: "/:slug", element: <CategoryPage /> },
      { path: "/p/:slug", element: <ProductPage /> },
      {
        path: "auth",
        children: [
          { path: "sign-in", element: <SignIn /> },
          { path: "sign-up", element: <SignUp /> },
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
