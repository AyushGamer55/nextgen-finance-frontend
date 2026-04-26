import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { ThemeProvider } from "next-themes";
import { seedSessionNotifications } from "./utils/notifications";

seedSessionNotifications();

createRoot(document.getElementById("root")).render(
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <App />
  </ThemeProvider>
);