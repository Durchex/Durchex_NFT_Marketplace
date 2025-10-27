import "./index.css";
import App from "./App.jsx";
import { Index } from "./Context/index.jsx";
import { UserProvider } from "./Context/UserContext.jsx";
import { CartProvider } from "./Context/CartContext.jsx";
import { AdminProvider } from "./Context/AdminContext.jsx";
import { NetworkProvider } from "./Context/NetworkContext.jsx";
import { Toaster } from "react-hot-toast";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { FilterProvider } from "./Context/FilterContext";

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
