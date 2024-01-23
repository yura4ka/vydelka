import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Home } from "./pages/home";
import { SignIn, SignUp } from "./pages/auth";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      {
        path: "auth",
        children: [
          { path: "sign-in", element: <SignIn /> },
          { path: "sign-up", element: <SignUp /> },
        ],
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
