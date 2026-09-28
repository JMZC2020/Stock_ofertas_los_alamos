import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardLayout from "./pages/DashboardLayout";

type Screen = "login" | "reset-password" | "app";

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");

  if (screen === "login") {
    return (
      <LoginPage
        onLogin={() => setScreen("app")}
        onForgotPassword={() => setScreen("reset-password")}
      />
    );
  }

  if (screen === "reset-password") {
    return <ResetPasswordPage onBack={() => setScreen("login")} />;
  }

  return <DashboardLayout onLogout={() => setScreen("login")} />;
}
