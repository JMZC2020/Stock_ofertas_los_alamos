import { useState } from "react";

interface Props {
  onBack: () => void;
}

export default function ResetPasswordPage({ onBack }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4fc]">
      <div className="w-full max-w-md px-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-lg flex items-center justify-center border border-[#dde2ef] bg-white text-[#4a5580] hover:text-[#1e2d5a] hover:border-[#1e2d5a] transition"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M11 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="font-700 text-[#0d1530]" style={{ fontWeight: 700 }}>Restablecer Contraseña</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-[#dde2ef] p-8">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-700 ${step === 1 ? "bg-[#1e2d5a] text-white" : "bg-[#27ae60] text-white"}`} style={{ fontWeight: 700 }}>
              {step === 1 ? "1" : "✓"}
            </div>
            <div className={`h-0.5 flex-1 ${step === 2 ? "bg-[#1e2d5a]" : "bg-[#dde2ef]"}`} />
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-700 ${step === 2 ? "bg-[#1e2d5a] text-white" : "bg-[#eef1f8] text-[#8891b0]"}`} style={{ fontWeight: 700 }}>
              2
            </div>
          </div>

          {step === 1 ? (
            <>
              <h2 className="text-lg font-700 text-[#0d1530] mb-1" style={{ fontWeight: 700 }}>Verificar identidad</h2>
              <p className="text-sm text-[#8891b0] mb-6">Ingrese su correo electrónico para recibir un enlace de restablecimiento.</p>

              <div className="mb-4">
                <label className="block text-sm font-500 text-[#4a5580] mb-1.5" style={{ fontWeight: 500 }}>
                  Correo electrónico
                </label>
                <input
                  type="email"
                  placeholder="ejemplo123@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#dde2ef] bg-[#f5f7fc] text-[#0d1530] text-sm focus:outline-none focus:ring-2 focus:ring-[#3554a5]/30 focus:border-[#3554a5] transition"
                />
              </div>

              <p className="text-xs text-[#8891b0] bg-[#f5f7fc] rounded-lg px-4 py-3 mb-6 leading-relaxed">
                Al presionar "Restablecer Contraseña" le enviaremos un correo con un link para restablecer su contraseña.
              </p>

              <button
                onClick={() => setStep(2)}
                className="w-full py-3.5 rounded-xl bg-[#1e2d5a] hover:bg-[#152045] text-white font-700 text-sm tracking-wide transition-all shadow-md"
                style={{ fontWeight: 700 }}
              >
                Restablecer Contraseña
              </button>
            </>
          ) : (
            <>
              <h2 className="text-lg font-700 text-[#0d1530] mb-1" style={{ fontWeight: 700 }}>Nueva contraseña</h2>
              <p className="text-sm text-[#8891b0] mb-6">Ingrese y confirme su nueva contraseña.</p>

              <div className="mb-4">
                <label className="block text-sm font-500 text-[#4a5580] mb-1.5" style={{ fontWeight: 500 }}>
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••••"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#dde2ef] bg-[#f5f7fc] text-[#0d1530] text-sm focus:outline-none focus:ring-2 focus:ring-[#3554a5]/30 focus:border-[#3554a5] transition"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-500 text-[#4a5580] mb-1.5" style={{ fontWeight: 500 }}>
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••••"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#dde2ef] bg-[#f5f7fc] text-[#0d1530] text-sm focus:outline-none focus:ring-2 focus:ring-[#3554a5]/30 focus:border-[#3554a5] transition"
                />
              </div>

              <button
                onClick={onBack}
                className="w-full py-3.5 rounded-xl bg-[#1e2d5a] hover:bg-[#152045] text-white font-700 text-sm tracking-wide transition-all shadow-md"
                style={{ fontWeight: 700 }}
              >
                Actualizar Contraseña
              </button>
            </>
          )}
        </div>

        <p className="text-center text-xs text-[#8891b0] mt-6">
          © 2024 Oferta de los Alamos · Sistema de gestión
        </p>
      </div>
    </div>
  );
}
