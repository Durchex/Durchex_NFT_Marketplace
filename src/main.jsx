import "./index.css";
import App from "./App.jsx";
import { Index } from "./Context/index.jsx";
import { Toaster } from "react-hot-toast";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { FilterProvider } from "./Context/FilterContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Index>
      {/* <App /> */}
      <FilterProvider>
        <App />
      </FilterProvider>
      <Toaster />
    </Index>
  </StrictMode>
);
