import { useState } from "react";
import PasswordInput from "../components/PasswordInput";

const API_BASE = "/api";

interface Props {
  onLogin: () => void;
  onForgotPassword: () => void;
}

export default function LoginPage({ onLogin, onForgotPassword }: Props) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !pass) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/usuarios/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });

      if (!res.ok) {
        const detalle = await res.json().catch(() => null);
        throw new Error(detalle?.detail ?? "No se pudo iniciar sesión");
      }

      const data = await res.json();
      localStorage.setItem("access_token", data.access_token);
      onLogin();
    } catch (err: any) {
      setError(err.message ?? "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EAF8F3] py-8">
      <div className="w-full max-w-md px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center justify-center mb-8 sm:mb-10">
          <div className="text-center">
            <h1 className="text-2xl font-800 text-[#0F2B26] leading-tight" style={{ fontWeight: 800 }}>
              Oferta de los
            </h1>
            <h1 className="text-2xl font-800 text-[#0B6B55] leading-tight" style={{ fontWeight: 800 }}>
              Alamos
            </h1>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#D3EBE4] p-6 sm:p-8">
          <p className="text-sm font-600 text-[#3E5F57] uppercase tracking-widest mb-6 text-center" style={{ fontWeight: 600 }}>
            Iniciar sesión
          </p>

          {error && (
            <div className="mb-4 text-sm text-[#c0392b] bg-[#fde8e6] rounded-lg px-4 py-2.5">
              {error}
            </div>
          )}

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-500 text-[#3E5F57] mb-1.5" style={{ fontWeight: 500 }}>
              Correo electrónico
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5F7F77]">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#D3EBE4] bg-[#F1FAF7] text-[#0F2B26] text-sm font-500 focus:outline-none focus:ring-2 focus:ring-[#12A582]/30 focus:border-[#12A582] transition"
                style={{ fontWeight: 500 }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="block text-sm font-500 text-[#3E5F57] mb-1.5" style={{ fontWeight: 500 }}>
              Contraseña
            </label>
            <PasswordInput
              value={pass}
              onChange={setPass}
              onKeyDown={handleKeyDown}
              autoComplete="current-password"
              hasLeftIcon
            />
          </div>

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#7FF1D2] hover:bg-[#5EE3BE] active:bg-[#5EE3BE] text-[#0F2B26] font-700 text-sm tracking-wide transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            style={{ fontWeight: 700 }}
          >
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>

          {/* Forgot password */}
          <div className="mt-5 text-center">
            <button
              onClick={onForgotPassword}
              className="text-sm text-[#0B6B55] hover:text-[#0B6B55] font-500 transition-colors"
              style={{ fontWeight: 500 }}
            >
              ¿Olvidó su contraseña?
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-[#5F7F77] mt-6">
          © 2024 Oferta de los Alamos · Sistema de gestión
        </p>
      </div>
    </div>
  );
}
