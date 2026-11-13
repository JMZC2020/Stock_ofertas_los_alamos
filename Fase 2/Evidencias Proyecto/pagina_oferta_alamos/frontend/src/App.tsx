import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardLayout from "./pages/DashboardLayout";
import { SESSION_EXPIRED_EVENT, cerrarSesion, haySesionValida, instalarAuthFetch } from "./auth";

type Screen = "login" | "reset-password" | "app";


instalarAuthFetch();

/** Lee ?reset_token=... del enlace del correo y lo borra de la barra de direcciones. */
function leerTokenDeReset(): string | null {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("reset_token");
  if (token) {
    window.history.replaceState({}, "", window.location.pathname);
  }
  return token;
}

export default function App() {
  
  const [resetToken] = useState<string | null>(leerTokenDeReset);
  const [screen, setScreen] = useState<Screen>(() => {
    if (resetToken) return "reset-password";
    return haySesionValida() ? "app" : "login";
  });
  const [avisoSesion, setAvisoSesion] = useState<string | null>(null);

  useEffect(() => {
    const alExpirar = () => {
      setAvisoSesion("Tu sesión expiró. Inicia sesión nuevamente.");
      setScreen("login");
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, alExpirar);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, alExpirar);
  }, []);

  const cerrar = () => {
    cerrarSesion();
    setAvisoSesion(null);
    setScreen("login");
  };

  if (screen === "login") {
    return (
      <>
        {avisoSesion && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 text-sm text-[#c0392b] bg-[#fde8e6] border border-[#f5c6c2] rounded-lg px-4 py-2.5 shadow">
            {avisoSesion}
          </div>
        )}
        <LoginPage
          onLogin={() => {
            setAvisoSesion(null);
            setScreen("app");
          }}
          onForgotPassword={() => setScreen("reset-password")}
        />
      </>
    );
  }

  if (screen === "reset-password") {
    return <ResetPasswordPage initialToken={resetToken} onBack={() => setScreen("login")} />;
  }

  return <DashboardLayout onLogout={cerrar} />;
}