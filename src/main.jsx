import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import AppProviders from "./app.jsx";
import { Provider } from "react-redux";
import { store } from "@/store";
import { initPromise } from "@/i18n";

const root = createRoot(document.getElementById("root"));

/**
 * Wait for i18n to be fully initialised before mounting React.
 */
initPromise.finally(() => {
  root.render(
    <StrictMode>
      <Provider store={store}>
        <AppProviders />
      </Provider>
    </StrictMode>,
  );
});
