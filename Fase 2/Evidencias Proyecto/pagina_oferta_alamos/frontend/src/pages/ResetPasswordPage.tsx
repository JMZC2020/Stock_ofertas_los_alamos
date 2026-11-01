import { useState } from "react";

const API_BASE = "http://localhost:8000";

interface Props {
  onBack: () => void;
  initialToken?: string | null;
}

export default function ResetPasswordPage({ onBack, initialToken }: Props) {
  const [step, setStep] = useState<1 | 2>(initialToken ? 2 : 1);
  const [email, setEmail] = useState("");
  const [emailEnviado, setEmailEnviado] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [resetToken, setResetToken] = useState<string | null>(initialToken ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSolicitar = async () => {
    if (!email) {
      setError("Ingresa tu correo electrónico.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/usuarios/reset-password/solicitar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("No se pudo procesar la solicitud");

      setEmailEnviado(true);
    } catch (err: any) {
      setError(err.message ?? "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleActualizar = async () => {
    if (!newPass || !confirmPass) {
      setError("Completa ambos campos de contraseña.");
      return;
    }
    if (newPass !== confirmPass) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (newPass.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (!resetToken) {
      setError("No se encontró un token de recuperación válido. Solicita un nuevo enlace.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/usuarios/reset-password/confirmar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, nueva_password: newPass }),
      });
      if (!res.ok) {
        const detalle = await res.json().catch(() => null);
        throw new Error(detalle?.detail ?? "No se pudo actualizar la contraseña");
      }
      setSuccess(true);
      setTimeout(() => onBack(), 1800);
    } catch (err: any) {
      setError(err.message ?? "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4fc]">
      <div className="w-full max-w-md px-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-lg flex items-center justify-center border border-[#dde2ef] bg-white text-[#4a5580] hover:text-[#1e2d5a] hover:border-[#1e2d5a] transition"
            title="Volver"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M11 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="font-700 text-[#0d1530]" style={{ fontWeight: 700 }}>Restablecer Contraseña</span>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-[#dde2ef] p-8">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-700 ${
                step === 1 && !emailEnviado ? "bg-[#1e2d5a] text-white" : "bg-[#27ae60] text-white"
              }`}
              style={{ fontWeight: 700 }}
            >
              {step === 1 && !emailEnviado ? "1" : "✓"}
            </div>
            <div className={`h-0.5 flex-1 ${step === 2 || emailEnviado ? "bg-[#1e2d5a]" : "bg-[#dde2ef]"}`} />
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-700 ${
                step === 2 ? "bg-[#1e2d5a] text-white" : "bg-[#eef1f8] text-[#8891b0]"
              }`}
              style={{ fontWeight: 700 }}
            >
              2
            </div>
          </div>

          {error && (
            <div className="mb-4 text-sm text-[#c0392b] bg-[#fde8e6] rounded-lg px-4 py-2.5">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 text-sm text-[#1a7a4a] bg-[#e8f8ef] rounded-lg px-4 py-2.5">
              Contraseña actualizada correctamente. Volviendo al inicio de sesión...
            </div>
          )}

          {step === 1 ? (
            emailEnviado ? (
              <div className="text-center py-2">
                <div className="w-14 h-14 rounded-2xl bg-[#3554a5]/10 text-[#1e2d5a] flex items-center justify-center mx-auto mb-4">
                  <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2 className="text-lg font-700 text-[#0d1530] mb-2" style={{ fontWeight: 700 }}>
                  Revisa tu correo
                </h2>
                <p className="text-sm text-[#4a5580] mb-2">
                  Hemos enviado un enlace de recuperación a:
                </p>
                <div className="inline-block px-3 py-1.5 rounded-lg bg-[#f0f4fc] border border-[#dde2ef] text-sm font-600 text-[#0d1530] mb-4" style={{ fontWeight: 600 }}>
                  {email}
                </div>
                <p className="text-xs text-[#8891b0] leading-relaxed mb-6">
                  Haz clic en el enlace del correo para restablecer tu contraseña. Si no lo encuentras en unos minutos, revisa tu carpeta de spam o correo no deseado.
                </p>

                <button
                  onClick={onBack}
                  className="w-full py-3.5 rounded-xl bg-[#1e2d5a] hover:bg-[#152045] text-white font-700 text-sm tracking-wide transition-all shadow-md mb-3"
                  style={{ fontWeight: 700 }}
                >
                  Volver al inicio de sesión
                </button>

                <button
                  type="button"
                  onClick={() => { setEmailEnviado(false); setError(null); }}
                  className="text-xs font-600 text-[#3554a5] hover:text-[#1e2d5a] transition"
                  style={{ fontWeight: 600 }}
                >
                  ¿No recibiste el correo? Probar con otro correo
                </button>
              </div>
            ) : (
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
                  Al presionar "Restablecer Contraseña" le enviaremos un correo con un enlace seguro para restablecer su contraseña.
                </p>

                <button
                  onClick={handleSolicitar}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-[#1e2d5a] hover:bg-[#152045] text-white font-700 text-sm tracking-wide transition-all shadow-md disabled:opacity-50"
                  style={{ fontWeight: 700 }}
                >
                  {loading ? "Enviando enlace..." : "Restablecer Contraseña"}
                </button>
              </>
            )
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
                onClick={handleActualizar}
                disabled={loading || success}
                className="w-full py-3.5 rounded-xl bg-[#1e2d5a] hover:bg-[#152045] text-white font-700 text-sm tracking-wide transition-all shadow-md disabled:opacity-50"
                style={{ fontWeight: 700 }}
              >
                {loading ? "Actualizando..." : "Actualizar Contraseña"}
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
