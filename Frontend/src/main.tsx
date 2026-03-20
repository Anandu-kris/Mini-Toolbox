import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/store/store";
import AppProviders from "@/AppProviders";
import AppRealtimeBootstrap from "@/realtime/AppRealtimeBootstrap";

import "./index.css";
import App from "./App";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <AppProviders>
              <AppRealtimeBootstrap />
              <App />
            </AppProviders>
          </QueryClientProvider>
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </StrictMode>
);