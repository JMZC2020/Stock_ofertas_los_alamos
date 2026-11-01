import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardLayout from "./pages/DashboardLayout";

type Screen = "login" | "reset-password" | "app";

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [resetToken, setResetToken] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("reset_token");
  });

  if (resetToken || screen === "reset-password") {
    return (
      <ResetPasswordPage
        initialToken={resetToken}
        onBack={() => {
          // Limpia el parámetro de la URL sin recargar la página
          if (window.history.replaceState) {
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          }
          setResetToken(null);
          setScreen("login");
        }}
      />
    );
  }

  return <DashboardLayout onLogout={() => setScreen("login")} />;
}
