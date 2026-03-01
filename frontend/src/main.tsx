import React from "react";
import ReactDOM from "react-dom/client";
import './index.css';

import App from "../App"; // App.tsx is in ROOT (not inside src)

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
