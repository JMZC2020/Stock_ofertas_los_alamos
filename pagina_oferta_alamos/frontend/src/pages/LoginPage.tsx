import { useState } from "react";

interface Props {
  onLogin: () => void;
  onForgotPassword: () => void;
}

export default function LoginPage({ onLogin, onForgotPassword }: Props) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4fc]">
      <div className="w-full max-w-md px-6">
        {/* Brand */}
        <div className="flex items-center justify-center mb-10">
          <div className="text-center">
            <h1 className="text-2xl font-800 text-[#0d1530] leading-tight" style={{ fontWeight: 800 }}>
              Oferta de los
            </h1>
            <h1 className="text-2xl font-800 text-[#1e2d5a] leading-tight" style={{ fontWeight: 800 }}>
              Alamos
            </h1>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#dde2ef] p-8">
          <p className="text-sm font-600 text-[#4a5580] uppercase tracking-widest mb-6 text-center" style={{ fontWeight: 600 }}>
            Iniciar sesión
          </p>

          {/* Username */}
          <div className="mb-4">
            <label className="block text-sm font-500 text-[#4a5580] mb-1.5" style={{ fontWeight: 500 }}>
              Usuario
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8891b0]">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </span>
              <input
                type="text"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#dde2ef] bg-[#f5f7fc] text-[#0d1530] text-sm font-500 focus:outline-none focus:ring-2 focus:ring-[#3554a5]/30 focus:border-[#3554a5] transition"
                style={{ fontWeight: 500 }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="block text-sm font-500 text-[#4a5580] mb-1.5" style={{ fontWeight: 500 }}>
              Contraseña
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8891b0]">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
              </span>
              <input
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#dde2ef] bg-[#f5f7fc] text-[#0d1530] text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-[#3554a5]/30 focus:border-[#3554a5] transition"
              />
            </div>
          </div>

          {/* Login Button */}
          <button
            onClick={onLogin}
            className="w-full py-3.5 rounded-xl bg-[#1e2d5a] hover:bg-[#152045] active:bg-[#0d1530] text-white font-700 text-sm tracking-wide transition-all shadow-md hover:shadow-lg"
            style={{ fontWeight: 700 }}
          >
            Iniciar sesión
          </button>

          {/* Forgot password */}
          <div className="mt-5 text-center">
            <button
              onClick={onForgotPassword}
              className="text-sm text-[#3554a5] hover:text-[#1e2d5a] font-500 transition-colors"
              style={{ fontWeight: 500 }}
            >
              ¿Olvidó su contraseña?
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-[#8891b0] mt-6">
          © 2024 Oferta de los Alamos · Sistema de gestión
        </p>
      </div>
    </div>
  );
}
