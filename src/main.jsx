import "./index.css";
import App from "./App.jsx";
import { Index } from "./Context/index.jsx";
import { Toaster } from "react-hot-toast";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { FilterProvider } from "./Context/FilterContext";
import { UserProvider } from "./Context/UserContext";
import { CartProvider } from "./Context/CartContext";
import { AdminProvider } from "./Context/AdminContext";
import { NetworkProvider } from "./Context/NetworkContext";
import { AppKitProvider } from "./Context/AppKitProvider.jsx";


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Index>
      <UserProvider>
        <CartProvider>
          <AdminProvider>
            <NetworkProvider>
              <FilterProvider>
                <App />
              </FilterProvider>
            </NetworkProvider>
          </AdminProvider>
        </CartProvider>
      </UserProvider>
      <Toaster />
    </Index>
  </StrictMode>
);
