import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import * as LR from "@uploadcare/blocks";
import App from "@/App.tsx";
import "@/index.css";
import "@/lib/i18n";
import { ThemeProvider } from "@/components/theme/ThemeProvider.tsx";
import { store } from "@/app/store.ts";
import HeadlessModal from "@/lib/uploadcare/HeadlessModel.ts";

LR.registerBlocks({ ...LR, HeadlessModal });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <App />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>,
);
